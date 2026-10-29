import "server-only";
import { missingParentIds } from "@/lib/tasks/tree";
import { csvToObjects } from "./csv";
import { mapCsvRow, type ImportedTask } from "./import-map";
import { adminDb, check, chunk, getWorkspace, setParents, type Admin } from "./db";

/** find-or-create a project/team/person by (case-insensitive) name. Imported ones get source 'import'. */
async function ensureNamed(
  sb: Admin, wsId: string, table: "projects" | "teams" | "people", col: "name" | "display_name", names: string[],
): Promise<Map<string, string>> {
  const wanted = [...new Set(names.filter(Boolean))];
  const existing = check(await sb.from(table).select(`id, ${col}`).eq("workspace_id", wsId), `load ${table}`) as unknown as Record<string, string>[];
  const map = new Map(existing.map((r) => [r[col].toLowerCase(), r.id]));
  const toCreate = wanted.filter((n) => !map.has(n.toLowerCase()));
  if (toCreate.length) {
    const rows = check(
      await sb.from(table).insert(toCreate.map((n) => ({ workspace_id: wsId, source: "import", external_id: n, [col]: n }))).select(`id, ${col}`),
      `create ${table}`,
    ) as unknown as Record<string, string>[];
    rows.forEach((r) => map.set(r[col].toLowerCase(), r.id));
  }
  return map;
}

export async function importClosedIssuesCsv(text: string) {
  const sb = adminDb();
  const ws = await getWorkspace(sb);
  const parsed = csvToObjects(text).map(mapCsvRow).filter((t): t is ImportedTask => !!t);
  const tasks = [...new Map(parsed.map((t) => [t.identifier, t])).values()]; // one row per identifier
  const result = { rows: tasks.length, created: 0, updated: 0, skippedExistingFromLinear: 0, events: 0, parentsLinked: 0, parentStubs: 0 };
  if (!tasks.length) return result;

  const projects = await ensureNamed(sb, ws.id, "projects", "name", tasks.map((t) => t.project ?? ""));
  const teams = await ensureNamed(sb, ws.id, "teams", "name", tasks.map((t) => t.team ?? ""));
  const people = await ensureNamed(sb, ws.id, "people", "display_name", tasks.map((t) => t.assignee ?? ""));

  // Parents that children mention but that aren't their own CSV row (still-open parents, etc.)
  const stubs = missingParentIds(tasks);
  for (const s of stubs) {
    if (tasks.some((t) => t.identifier === s.identifier)) continue;
    tasks.push({
      identifier: s.identifier, title: s.title, parentIdentifier: null, parentTitle: null,
      project: null, team: null, assignee: null, labels: [], priority: null,
      status_name: "Parent (not in export)", status_category: "done",
      closed_at: null, created_at: null, due_date: null, url: null,
    });
    result.parentStubs++;
  }

  // existing tasks by identifier: skip ones already synced from Linear, update earlier imports
  const existing: { id: string; identifier: string; source: string }[] = [];
  for (const part of chunk(tasks.map((t) => t.identifier), 120)) {
    existing.push(...(check(
      await sb.from("tasks").select("id, identifier, source").eq("workspace_id", ws.id).in("identifier", part),
      "existing tasks",
    ) as { id: string; identifier: string; source: string }[]));
  }
  const bySource = new Map(existing.map((e) => [e.identifier, e]));

  const rows = tasks.filter((t) => {
    const e = bySource.get(t.identifier);
    if (e && e.source !== "import") { result.skippedExistingFromLinear++; return false; }
    if (e) result.updated++; else result.created++;
    return true;
  });

  const saved: { id: string; external_id: string }[] = [];
  for (const part of chunk(rows, 150)) saved.push(...(check(
    await sb.from("tasks").upsert(part.map((t) => ({
      workspace_id: ws.id, source: "import", external_id: t.identifier, external_url: t.url, identifier: t.identifier,
      title: t.title, status_name: t.status_name, status_category: t.status_category, priority: t.priority, labels: t.labels,
      due_date: t.due_date, completed_at: t.status_category === "done" ? t.closed_at : null,
      canceled_at: t.status_category === "canceled" ? t.closed_at : null, source_created_at: t.created_at,
      project_id: t.project ? projects.get(t.project.toLowerCase()) ?? null : null,
      team_id: t.team ? teams.get(t.team.toLowerCase()) ?? null : null,
      assignee_id: t.assignee ? people.get(t.assignee.toLowerCase()) ?? null : null,
    })), { onConflict: "workspace_id,source,external_id" }).select("id, external_id"),
    "import tasks",
  ) as { id: string; external_id: string }[]));
  const idByIdentifier = new Map(saved.map((r) => [r.external_id, r.id]));

  // Link sub-issues. Parents are looked up by identifier across all sources (import + Linear).
  const parentKeys = [...new Set(rows.map((t) => t.parentIdentifier).filter(Boolean) as string[])];
  const parentId = new Map<string, string>();
  for (const part of chunk(parentKeys, 120)) {
    const found = check(
      await sb.from("tasks").select("id, identifier").eq("workspace_id", ws.id).in("identifier", part),
      "parents",
    ) as { id: string; identifier: string }[];
    found.forEach((p) => parentId.set(p.identifier, p.id));
  }
  const links = rows.flatMap((t) => {
    const id = idByIdentifier.get(t.identifier);
    const pid = t.parentIdentifier ? parentId.get(t.parentIdentifier) : undefined;
    return id && pid && id !== pid ? [{ id, parent: pid }] : [];
  });
  await setParents(sb, links);
  result.parentsLinked = links.length;

  const events = rows.flatMap((t) => {
    const task_id = idByIdentifier.get(t.identifier);
    if (!task_id) return [];
    const base = { workspace_id: ws.id, task_id, origin: "import" as const };
    const out = [];
    if (t.created_at) out.push({ ...base, event_type: "created", from_value: null, to_value: null, occurred_at: t.created_at, source_event_key: "import:created" });
    if (t.closed_at) out.push({
      ...base, event_type: t.status_category === "canceled" ? "canceled" : "completed",
      from_value: null, to_value: t.status_name, occurred_at: t.closed_at, source_event_key: "import:closed",
    });
    return out;
  });
  for (const part of chunk(events, 500)) {
    check(await sb.from("task_events").upsert(part, { onConflict: "task_id,source_event_key", ignoreDuplicates: true }), "import events");
  }
  result.events = events.length;

  await sb.from("sync_runs").insert({
    workspace_id: ws.id, trigger: "import", status: "success", counts: result, finished_at: new Date().toISOString(),
  });
  return result;
}
