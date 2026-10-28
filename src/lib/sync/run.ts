import "server-only";
import { fetchIssueById, fetchIssuePage, linearGql, type LinearIssue } from "@/lib/linear/client";
import { categoryFromStateType, deriveEvents, projectCategory } from "@/lib/linear/map";
import { adminDb, adoptImported, check, chunk, getWorkspace, type Admin } from "./db";

type IdMap = Map<string, string>; // linear external_id -> pace uuid
type Maps = { teams: IdMap; people: IdMap; projects: IdMap };

const OVERLAP_MS = 10 * 60 * 1000; // re-read the last 10 minutes to be safe against late writes

// ---------- reference data: teams, users, projects ----------
export async function syncReference(sb: Admin, wsId: string): Promise<Maps> {
  const data = await linearGql<{
    teams: { nodes: { id: string; key: string; name: string }[] };
    users: { nodes: { id: string; name: string; displayName: string | null; email: string | null; active: boolean }[] };
    projects: { nodes: { id: string; name: string; url: string; targetDate: string | null; status: { name: string; type: string } | null; teams: { nodes: { id: string }[] } }[] };
  }>(`query{
    teams(first:50){ nodes{ id key name } }
    users(first:100, includeDisabled:true){ nodes{ id name displayName email active } }
    projects(first:100, includeArchived:true){ nodes{ id name url targetDate status{ name type } teams(first:1){ nodes{ id } } } }
  }`);

  await adoptImported(sb, "teams", wsId, "name", data.teams.nodes.map((t) => ({ match: t.name, externalId: t.id })));
  await adoptImported(sb, "people", wsId, "display_name", data.users.nodes.map((u) => ({ match: u.name, externalId: u.id })));
  await adoptImported(sb, "projects", wsId, "name", data.projects.nodes.map((p) => ({ match: p.name, externalId: p.id })));

  const teams = check(
    await sb.from("teams").upsert(
      data.teams.nodes.map((t) => ({ workspace_id: wsId, source: "linear", external_id: t.id, name: t.name, key: t.key })),
      { onConflict: "workspace_id,source,external_id" },
    ).select("id, external_id"), "upsert teams") as { id: string; external_id: string }[];
  const teamMap: IdMap = new Map(teams.map((r) => [r.external_id, r.id]));

  const people = check(
    await sb.from("people").upsert(
      data.users.nodes.map((u) => ({ workspace_id: wsId, source: "linear", external_id: u.id, display_name: u.name, email: u.email, active: u.active })),
      { onConflict: "workspace_id,source,external_id" },
    ).select("id, external_id"), "upsert people") as { id: string; external_id: string }[];
  const peopleMap: IdMap = new Map(people.map((r) => [r.external_id, r.id]));

  const projects = check(
    await sb.from("projects").upsert(
      data.projects.nodes.map((p) => ({
        workspace_id: wsId, source: "linear", external_id: p.id, name: p.name, external_url: p.url,
        team_id: teamMap.get(p.teams.nodes[0]?.id ?? "") ?? null,
        status: p.status?.name ?? null, status_category: projectCategory(p.status?.type), target_date: p.targetDate,
      })),
      { onConflict: "workspace_id,source,external_id" },
    ).select("id, external_id"), "upsert projects") as { id: string; external_id: string }[];
  const projectMap: IdMap = new Map(projects.map((r) => [r.external_id, r.id]));

  return { teams: teamMap, people: peopleMap, projects: projectMap };
}

// ---------- issues ----------
export async function upsertIssues(sb: Admin, wsId: string, maps: Maps, issues: LinearIssue[]) {
  if (!issues.length) return { tasks: 0, events: 0 };

  // assignees we have not seen in the users list (e.g. since removed)
  const missing = issues.filter((i) => i.assignee && !maps.people.has(i.assignee.id));
  if (missing.length) {
    const rows = check(
      await sb.from("people").upsert(
        [...new Map(missing.map((i) => [i.assignee!.id, i.assignee!])).values()].map((a) => ({
          workspace_id: wsId, source: "linear", external_id: a.id, display_name: a.name, email: a.email,
        })),
        { onConflict: "workspace_id,source,external_id" },
      ).select("id, external_id"), "upsert extra people") as { id: string; external_id: string }[];
    rows.forEach((r) => maps.people.set(r.external_id, r.id));
  }

  // adopt tasks imported from CSV (matched on identifier, e.g. MKT-8)
  await adoptImported(sb, "tasks", wsId, "identifier", issues.map((i) => ({ match: i.identifier, externalId: i.id })));

  const taskRows = issues.map((i) => ({
    workspace_id: wsId, source: "linear", external_id: i.id, external_url: i.url, external_updated_at: i.updatedAt,
    identifier: i.identifier, title: i.title, description: i.description,
    team_id: maps.teams.get(i.team?.id ?? "") ?? null,
    project_id: maps.projects.get(i.project?.id ?? "") ?? null,
    assignee_id: maps.people.get(i.assignee?.id ?? "") ?? null,
    status_name: i.state?.name ?? null,
    status_category: categoryFromStateType(i.state?.type),
    priority: i.priority == null ? null : Math.round(i.priority),
    labels: i.labels.nodes.map((l) => l.name),
    due_date: i.dueDate, completed_at: i.completedAt, canceled_at: i.canceledAt, source_created_at: i.createdAt,
    archived_in_source_at: i.archivedAt,
    deleted_in_source_at: i.trashed ? (i.archivedAt ?? new Date().toISOString()) : null,
  }));
  const saved = check(
    await sb.from("tasks").upsert(taskRows, { onConflict: "workspace_id,source,external_id" }).select("id, external_id"),
    "upsert tasks",
  ) as { id: string; external_id: string }[];
  const taskMap: IdMap = new Map(saved.map((r) => [r.external_id, r.id]));

  // parent links (parents may be older tasks already in Pace)
  const parentIds = [...new Set(issues.map((i) => i.parent?.id).filter(Boolean) as string[])];
  if (parentIds.length) {
    const known = check(
      await sb.from("tasks").select("id, external_id").eq("workspace_id", wsId).eq("source", "linear").in("external_id", parentIds),
      "lookup parents",
    ) as { id: string; external_id: string }[];
    known.forEach((r) => taskMap.set(r.external_id, r.id));
  }
  for (const i of issues) {
    const id = taskMap.get(i.id);
    if (!id) continue;
    check(await sb.from("tasks").update({ parent_task_id: i.parent ? (taskMap.get(i.parent.id) ?? null) : null }).eq("id", id), "set parent");
  }

  // events (idempotent: unique on task_id + source_event_key)
  const events = issues.flatMap((i) => {
    const task_id = taskMap.get(i.id);
    return task_id ? deriveEvents(i).map((e) => ({ ...e, workspace_id: wsId, task_id })) : [];
  });
  for (const part of chunk(events, 500)) {
    check(await sb.from("task_events").upsert(part, { onConflict: "task_id,source_event_key", ignoreDuplicates: true }), "upsert events");
  }
  return { tasks: taskRows.length, events: events.length };
}

// ---------- full / incremental run ----------
export type SyncTrigger = "cron" | "webhook" | "manual";

export async function runSync(trigger: SyncTrigger) {
  const sb = adminDb();
  const ws = await getWorkspace(sb);
  const run = check(
    await sb.from("sync_runs").insert({ workspace_id: ws.id, trigger }).select("id").single(),
    "start run",
  ) as { id: string };

  try {
    const { data: last } = await sb.from("sync_runs").select("cursor")
      .eq("workspace_id", ws.id).eq("status", "success").not("cursor", "is", null)
      .order("started_at", { ascending: false }).limit(1).maybeSingle();
    const since = last?.cursor ? new Date(new Date(last.cursor).getTime() - OVERLAP_MS).toISOString() : null;

    const maps = await syncReference(sb, ws.id);
    let after: string | null = null;
    let maxUpdated: string | null = last?.cursor ?? null;
    const counts = { tasks: 0, events: 0, pages: 0, mode: since ? "incremental" : "backfill" };

    for (;;) {
      const page = await fetchIssuePage({ after, updatedAfter: since });
      const r = await upsertIssues(sb, ws.id, maps, page.nodes);
      counts.tasks += r.tasks; counts.events += r.events; counts.pages++;
      for (const n of page.nodes) if (!maxUpdated || n.updatedAt > maxUpdated) maxUpdated = n.updatedAt;
      if (!page.pageInfo.hasNextPage) break;
      after = page.pageInfo.endCursor;
    }

    check(await sb.from("sync_runs").update({
      status: "success", cursor: maxUpdated, counts, finished_at: new Date().toISOString(),
    }).eq("id", run.id), "finish run");
    return { ok: true as const, runId: run.id, counts };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await sb.from("sync_runs").update({ status: "error", error: message, finished_at: new Date().toISOString() }).eq("id", run.id);
    return { ok: false as const, runId: run.id, error: message };
  }
}

// ---------- webhook helpers ----------
export async function syncSingleIssue(linearId: string) {
  const sb = adminDb();
  const ws = await getWorkspace(sb);
  const issue = await fetchIssueById(linearId);
  if (!issue) return { found: false };
  const maps = await syncReference(sb, ws.id);
  await upsertIssues(sb, ws.id, maps, [issue]);
  return { found: true };
}

export async function markIssueRemoved(linearId: string) {
  const sb = adminDb();
  const ws = await getWorkspace(sb);
  check(
    await sb.from("tasks").update({ deleted_in_source_at: new Date().toISOString() })
      .eq("workspace_id", ws.id).eq("source", "linear").eq("external_id", linearId),
    "mark removed",
  );
}
