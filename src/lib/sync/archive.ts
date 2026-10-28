import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { archiveIssue } from "@/lib/linear/client";
import { adminDb, check, getWorkspace } from "./db";

export type ArchiveSettings = { enabled: boolean; after_days: number; max_batch: number };

export function archiveSettings(settings: Record<string, unknown> | null): ArchiveSettings {
  const a = ((settings?.archive as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
  return { enabled: a.enabled === true, after_days: Number(a.after_days ?? 14), max_batch: Number(a.max_batch ?? 5) };
}

export type Candidate = { id: string; identifier: string | null; title: string; completed_at: string; external_id: string; external_url: string | null };

/**
 * Tasks that are safe to archive in Linear: synced from Linear (so stored in Pace), Done longer than N days,
 * not already archived/deleted, and not already waiting in a pending batch. Works with any client (RLS or admin).
 */
export async function findCandidates(sb: SupabaseClient, wsId: string, afterDays: number): Promise<Candidate[]> {
  const cutoff = new Date(Date.now() - afterDays * 86_400_000).toISOString();
  const rows = check(
    await sb.from("tasks").select("id, identifier, title, completed_at, external_id, external_url")
      .eq("workspace_id", wsId).eq("source", "linear").eq("status_category", "done")
      .is("archived_in_source_at", null).is("deleted_in_source_at", null)
      .not("completed_at", "is", null).lt("completed_at", cutoff)
      .order("completed_at").limit(500),
    "find candidates",
  ) as Candidate[];
  const { data: pending } = await sb.from("archive_candidates").select("task_id, archive_batches!inner(status)")
    .eq("workspace_id", wsId).eq("archive_batches.status", "pending");
  const blocked = new Set((pending ?? []).map((p) => (p as { task_id: string }).task_id));
  return rows.filter((r) => !blocked.has(r.id));
}

/** Archive the given tasks in Linear (never deletes). Returns per-task results. */
async function archiveTasks(sb: SupabaseClient, wsId: string, batchId: string, tasks: Candidate[]) {
  let archived = 0, failed = 0;
  for (const t of tasks) {
    try {
      const ok = await archiveIssue(t.external_id);
      if (!ok) throw new Error("Linear returned success=false");
      const now = new Date().toISOString();
      await sb.from("tasks").update({ archived_in_source_at: now }).eq("id", t.id);
      await sb.from("task_events").upsert(
        { workspace_id: wsId, task_id: t.id, event_type: "archived", occurred_at: now, origin: "linear_diff", source_event_key: "archived-by-pace" },
        { onConflict: "task_id,source_event_key", ignoreDuplicates: true },
      );
      await sb.from("archive_candidates").update({ status: "archived" }).eq("batch_id", batchId).eq("task_id", t.id);
      archived++;
    } catch (e) {
      failed++;
      await sb.from("archive_candidates").update({ status: "failed", error: e instanceof Error ? e.message : String(e) }).eq("batch_id", batchId).eq("task_id", t.id);
    }
  }
  return { archived, failed };
}

async function createBatch(sb: SupabaseClient, wsId: string, status: string, reason: string, tasks: Candidate[]) {
  const batch = check(await sb.from("archive_batches").insert({ workspace_id: wsId, status, reason }).select("id").single(), "create batch") as { id: string };
  if (tasks.length) {
    check(await sb.from("archive_candidates").insert(tasks.map((t) => ({ workspace_id: wsId, batch_id: batch.id, task_id: t.id }))), "batch candidates");
  }
  return batch.id;
}

/** Called after each sync. OFF by default; when off it only reports what it WOULD archive. */
export async function runArchiveStep() {
  const sb = adminDb();
  const ws = await getWorkspace(sb);
  const s = archiveSettings(ws.settings);
  const candidates = await findCandidates(sb, ws.id, s.after_days);

  if (!s.enabled) return { mode: "dry_run" as const, wouldArchive: candidates.length };
  if (!candidates.length) return { mode: "enabled" as const, archived: 0 };

  if (candidates.length > s.max_batch) {
    // too many at once: list them and wait for an admin to approve in the UI
    const { count } = await sb.from("archive_batches").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id).eq("status", "pending");
    if (count) return { mode: "enabled" as const, waitingForApproval: candidates.length };
    await createBatch(sb, ws.id, "pending", `${candidates.length} issues exceed the batch limit of ${s.max_batch}`, candidates);
    return { mode: "enabled" as const, waitingForApproval: candidates.length };
  }

  const batchId = await createBatch(sb, ws.id, "approved", "auto: within batch limit", candidates);
  const r = await archiveTasks(sb, ws.id, batchId, candidates);
  await sb.from("archive_batches").update({ status: "done", executed_at: new Date().toISOString() }).eq("id", batchId);
  return { mode: "enabled" as const, ...r };
}

/** Execute an admin-approved pending batch. */
export async function executeApprovedBatch(batchId: string, userId: string) {
  const sb = adminDb();
  const batch = check(await sb.from("archive_batches").select("id, workspace_id, status").eq("id", batchId).single(), "load batch") as { id: string; workspace_id: string; status: string };
  if (batch.status !== "pending") throw new Error("Batch is not pending");
  await sb.from("archive_batches").update({ status: "approved", decided_by: userId, decided_at: new Date().toISOString() }).eq("id", batchId);

  const rows = check(
    await sb.from("archive_candidates").select("task_id, tasks(id, identifier, title, completed_at, external_id, external_url, archived_in_source_at, deleted_in_source_at)")
      .eq("batch_id", batchId).eq("status", "pending"),
    "load batch tasks",
  ) as unknown as { tasks: (Candidate & { archived_in_source_at: string | null; deleted_in_source_at: string | null }) | null }[];
  const tasks: Candidate[] = rows.flatMap((r) => (r.tasks && !r.tasks.archived_in_source_at && !r.tasks.deleted_in_source_at ? [r.tasks] : []));
  const r = await archiveTasks(sb, batch.workspace_id, batchId, tasks);
  await sb.from("archive_batches").update({ status: "done", executed_at: new Date().toISOString() }).eq("id", batchId);
  return r;
}
