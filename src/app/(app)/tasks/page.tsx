import { Suspense } from "react";
import { FilterBar } from "@/components/filter-bar";
import { TaskList, type TaskGroup } from "@/components/task-table";
import { Body, EmptyState, PageHeader, STATUS_LABEL } from "@/components/ui";
import { uiColors } from "@/lib/colors";
import { requireCtx } from "@/lib/auth";
import { OPEN } from "@/lib/format";
import { dateInTz } from "@/lib/weeks";
import { hydrateTasks, TASK_COLUMNS, type TaskRow } from "@/lib/tasks/hydrate";

const UUID = /^[0-9a-f-]{36}$/i;
const LIMIT = 900;
const STATUS_ORDER = ["in_progress", "todo", "backlog", "done", "canceled"];
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function group(rows: TaskRow[], by: string): TaskGroup[] {
  if (by === "none") return [{ key: "all", label: "", tasks: rows }];
  if (by === "status") {
    return STATUS_ORDER
      .map((c) => ({ key: c, label: STATUS_LABEL[c], category: c, tasks: rows.filter((t) => t.status_category === c) }))
      .filter((g) => g.tasks.length);
  }
  // Project groups: a sub-issue stays with its parent (we group by the top-most ancestor's project),
  // so a family never gets split across headers.
  const byId = new Map(rows.map((t) => [t.id, t]));
  const rootOf = (t: TaskRow): TaskRow => {
    const seen = new Set<string>();
    let cur = t;
    while (cur.parent_task_id && byId.has(cur.parent_task_id) && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parent_task_id)!;
    }
    return cur;
  };
  const m = new Map<string, TaskGroup>();
  for (const t of rows) {
    const proj = rootOf(t).project ?? t.project;
    const key = proj?.id ?? "none";
    if (!m.has(key)) m.set(key, { key, label: proj?.name ?? "No project", project: proj?.name, tasks: [] });
    m.get(key)!.tasks.push(t);
  }
  return [...m.values()].sort((a, b) => (a.key === "none" ? 1 : b.key === "none" ? -1 : a.label.localeCompare(b.label)));
}

export default async function Tasks({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const sp = {
    status: first(raw.status), project: first(raw.project), assignee: first(raw.assignee),
    flag: first(raw.flag), q: first(raw.q), label: first(raw.label), group: first(raw.group) || "project",
  };
  const { supabase, workspace } = await requireCtx();
  const today = dateInTz(new Date(), workspace.timezone);

  let q = supabase.from("tasks").select(TASK_COLUMNS).order("identifier").limit(LIMIT);
  if (sp.status === "open") q = q.in("status_category", [...OPEN]);
  else if (sp.status) q = q.eq("status_category", sp.status);
  if (sp.project && UUID.test(sp.project)) q = q.eq("project_id", sp.project);
  if (sp.assignee === "none") q = q.is("assignee_id", null);
  else if (sp.assignee && UUID.test(sp.assignee)) q = q.eq("assignee_id", sp.assignee);
  if (sp.label) q = q.contains("labels", [sp.label]);
  if (sp.flag === "overdue") q = q.lt("due_date", today).in("status_category", [...OPEN]);
  if (sp.q) {
    const term = sp.q.replace(/[%,()*\\]/g, " ").trim();
    if (term) q = q.or(`title.ilike.%${term}%,identifier.ilike.%${term}%`);
  }

  const [tasks, projects, people, labelRows] = await Promise.all([
    q,
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("people").select("id, display_name").order("display_name"),
    supabase.from("tasks").select("labels").limit(3000),
  ]);

  if (tasks.error) {
    return (
      <>
        <PageHeader title="Issues" />
        <Body><p className="card p-4 text-[13px] text-[#c23a3a]">{tasks.error.message}</p></Body>
      </>
    );
  }

  const labels = [...new Set((labelRows.data ?? []).flatMap((r) => (Array.isArray(r.labels) ? (r.labels as string[]) : [])))].sort((a, b) => a.localeCompare(b));
  const matched = hydrateTasks(tasks.data as Parameters<typeof hydrateTasks>[0], projects.data, people.data);

  // Keep hierarchy visible under filters: pull in missing ancestors (greyed out as context).
  const have = new Set(matched.map((t) => t.id));
  let rows = matched;
  for (let pass = 0; pass < 3; pass++) {
    const missing = [...new Set(rows.map((t) => t.parent_task_id).filter((id): id is string => !!id && !have.has(id)))];
    if (!missing.length) break;
    const { data } = await supabase.from("tasks").select(TASK_COLUMNS).in("id", missing.slice(0, 200));
    const extra = hydrateTasks(data as Parameters<typeof hydrateTasks>[0], projects.data, people.data).map((t) => ({ ...t, context: true }));
    if (!extra.length) break;
    extra.forEach((t) => have.add(t.id));
    rows = [...rows, ...extra];
  }
  const parents = rows.filter((t) => rows.some((c) => c.parent_task_id === t.id)).length;

  return (
    <>
      <PageHeader title="Issues" subtitle={`${matched.length}${matched.length === LIMIT ? "+" : ""} issues · ${parents} with sub-issues`} />
      <Body>
        <Suspense>
          <FilterBar projects={projects.data ?? []} people={people.data ?? []} labels={labels} />
        </Suspense>
        {matched.length
          ? <TaskList groups={group(rows, sp.group)} today={today} colors={uiColors(workspace.settings)} />
          : <EmptyState title="No issues match" hint="Clear a filter, import the CSV, or run Sync." />}
      </Body>
    </>
  );
}
