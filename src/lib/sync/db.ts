import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";

export type Admin = SupabaseClient;

export function adminDb(): Admin {
  return createAdminClient() as Admin;
}

export async function getWorkspace(sb: Admin) {
  const { data, error } = await sb
    .from("workspaces").select("id, settings, timezone").eq("slug", serverEnv().PACE_WORKSPACE_SLUG).single();
  if (error || !data) throw new Error(`Workspace "${serverEnv().PACE_WORKSPACE_SLUG}" not found: ${error?.message}`);
  return data as { id: string; settings: Record<string, unknown>; timezone: string };
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return (res.data ?? ([] as unknown)) as T;
}

/**
 * Set (or clear) parent_task_id for many tasks.
 * Uses UPDATE, never upsert: an upsert of {id, parent_task_id} is an INSERT first, and that
 * fails on the NOT NULL columns (workspace_id, title, ...) before conflict handling runs.
 */
export async function setParents(sb: Admin, links: { id: string; parent: string | null }[]) {
  const groups = new Map<string | null, string[]>();
  for (const l of links) {
    if (l.parent === l.id) continue;
    const ids = groups.get(l.parent) ?? [];
    ids.push(l.id);
    groups.set(l.parent, ids);
  }
  for (const [parent, ids] of groups) {
    for (const part of chunk(ids, 80)) {
      check(await sb.from("tasks").update({ parent_task_id: parent }).in("id", part), "set parent");
    }
  }
}

/**
 * Rows created by the CSV import (source = 'import') are "adopted" when the same thing
 * shows up in Linear: we flip them to source = 'linear' and give them the Linear id,
 * so history is kept and nothing is duplicated.
 */
export async function adoptImported(
  sb: Admin,
  table: "teams" | "projects" | "people" | "tasks",
  wsId: string,
  matchCol: "name" | "display_name" | "identifier",
  items: { match: string; externalId: string }[],
) {
  if (!items.length) return;
  const rows = check(
    await sb.from(table).select(`id, ${matchCol}`).eq("workspace_id", wsId).eq("source", "import"),
    `adopt ${table}`,
  ) as unknown as Record<string, string>[];
  if (!rows.length) return;
  const byMatch = new Map(rows.map((r) => [String(r[matchCol]).toLowerCase(), r.id]));
  for (const it of items) {
    const id = byMatch.get(it.match.toLowerCase());
    if (!id) continue;
    // If a Linear row with this external id already exists, leave the import row alone.
    const { data: clash } = await sb.from(table).select("id").eq("workspace_id", wsId).eq("source", "linear").eq("external_id", it.externalId).maybeSingle();
    if (clash) continue;
    check(await sb.from(table).update({ source: "linear", external_id: it.externalId }).eq("id", id), `adopt ${table} update`);
    if (table === "tasks") {
      // import-origin events are replaced by Linear's real history
      await sb.from("task_events").delete().eq("task_id", id).eq("origin", "import");
    }
  }
}
