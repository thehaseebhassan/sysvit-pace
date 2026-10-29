"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { reconcileOpen, relinkHierarchy, runSync } from "@/lib/sync/run";
import { executeApprovedBatch, runArchiveStep } from "@/lib/sync/archive";
import { importClosedIssuesCsv } from "@/lib/sync/import";

export type ActionState = { ok?: boolean; message?: string };
const refresh = () => revalidatePath("/", "layout");
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function syncNow(full = false): Promise<ActionState> {
  try {
    await requireAdmin();
    const r = await runSync("manual", { full });
    if (!r.ok) return { ok: false, message: `Sync failed: ${r.error}` };
    const a = await runArchiveStep().catch((e) => ({ error: msg(e) }));
    refresh();
    return { ok: true, message: `Synced ${r.counts.tasks} issues, ${r.counts.parents} sub-issue links (${r.counts.mode}). Archive: ${JSON.stringify(a)}` };
  } catch (e) { return { ok: false, message: msg(e) }; }
}

export async function rebuildHierarchy(): Promise<ActionState> {
  try {
    await requireAdmin();
    const r = await relinkHierarchy();
    refresh();
    const extra = [
      r.parentsFetched ? `${r.parentsFetched} missing parents fetched` : "",
      r.notInPace ? `${r.notInPace} Linear issues not in Pace yet (run Sync)` : "",
      r.parentMissing ? `${r.parentMissing} parents still missing` : "",
    ].filter(Boolean).join(", ");
    return { ok: true, message: `Linear has ${r.withParent} sub-issues; ${r.linked} linked in Pace.${extra ? " " + extra + "." : ""}` };
  } catch (e) { return { ok: false, message: msg(e) }; }
}

export async function reconcileOpenIssues(): Promise<ActionState> {
  try {
    await requireAdmin();
    const r = await reconcileOpen();
    refresh();
    return { ok: true, message: `Linear has ${r.openInLinear} open issues, Pace had ${r.openInPace}. Fixed ${r.stale} that were no longer open and ${r.behind} that were out of date${r.gone ? ` (${r.gone} no longer exist in Linear)` : ""}.` };
  } catch (e) { return { ok: false, message: msg(e) }; }
}

export async function importCsv(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a CSV file." };
    if (file.size > 3_000_000) return { ok: false, message: "File too large (3 MB max)." };
    const r = await importClosedIssuesCsv(await file.text());
    refresh();
    return { ok: true, message: `${r.rows} rows: ${r.created} new, ${r.updated} updated, ${r.parentsLinked} parent links, ${r.parentStubs} stub parents, ${r.skippedExistingFromLinear} skipped (already from Linear).` };
  } catch (e) { return { ok: false, message: msg(e) }; }
}

export async function approveBatch(formData: FormData) {
  const ctx = await requireAdmin();
  await executeApprovedBatch(String(formData.get("batchId")), ctx.user.id);
  refresh();
}

export async function rejectBatch(formData: FormData) {
  const ctx = await requireAdmin();
  const { error } = await ctx.supabase.from("archive_batches")
    .update({ status: "rejected", decided_by: ctx.user.id, decided_at: new Date().toISOString() })
    .eq("id", String(formData.get("batchId"))).eq("status", "pending");
  if (error) throw new Error(error.message);
  refresh();
}

export async function saveArchiveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const ctx = await requireAdmin();
    const after_days = Math.max(1, Math.min(365, Number(formData.get("after_days")) || 14));
    const max_batch = Math.max(1, Math.min(100, Number(formData.get("max_batch")) || 5));
    const enabled = formData.get("enabled") === "on";
    const settings = { ...ctx.workspace.settings, archive: { enabled, after_days, max_batch } };
    const { data, error } = await ctx.supabase.from("workspaces").update({ settings }).eq("id", ctx.member.workspace_id).select("id");
    if (error || !data?.length) return { ok: false, message: error?.message ?? "Not allowed." };
    refresh();
    return { ok: true, message: enabled ? "Saved. Archiving is ON." : "Saved. Archiving is OFF (dry run only)." };
  } catch (e) { return { ok: false, message: msg(e) }; }
}
