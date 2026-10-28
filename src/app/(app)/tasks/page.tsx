import { Suspense } from "react";
import { FilterBar } from "@/components/filter-bar";
import { TaskTable } from "@/components/task-table";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireCtx } from "@/lib/auth";
import { OPEN } from "@/lib/format";
import { dateInTz } from "@/lib/weeks";
import { hydrateTasks, TASK_COLUMNS } from "@/lib/tasks/hydrate";

const UUID = /^[0-9a-f-]{36}$/i;
const LIMIT = 800;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Tasks({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const sp = { status: first(raw.status), project: first(raw.project), assignee: first(raw.assignee), flag: first(raw.flag), q: first(raw.q) };
  const { supabase, workspace } = await requireCtx();
  const today = dateInTz(new Date(), workspace.timezone);

  let q = supabase.from("tasks").select(TASK_COLUMNS).order("identifier").limit(LIMIT);
  if (sp.status === "open") q = q.in("status_category", [...OPEN]);
  else if (sp.status) q = q.eq("status_category", sp.status);
  if (sp.project && UUID.test(sp.project)) q = q.eq("project_id", sp.project);
  if (sp.assignee === "none") q = q.is("assignee_id", null);
  else if (sp.assignee && UUID.test(sp.assignee)) q = q.eq("assignee_id", sp.assignee);
  if (sp.flag === "overdue") q = q.lt("due_date", today).in("status_category", [...OPEN]);
  if (sp.q) {
    const term = sp.q.replace(/[%,()*\\]/g, " ").trim();
    if (term) q = q.or(`title.ilike.%${term}%,identifier.ilike.%${term}%`);
  }

  const [tasks, projects, people] = await Promise.all([
    q,
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("people").select("id, display_name").order("display_name"),
  ]);

  if (tasks.error) {
    return (
      <div>
        <PageHeader title="Issues" />
        <p className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--bad)]">{tasks.error.message}</p>
      </div>
    );
  }

  const rows = hydrateTasks(tasks.data as Parameters<typeof hydrateTasks>[0], projects.data, people.data);

  return (
    <div>
      <PageHeader title="Issues" subtitle={`${rows.length} in view`} />
      <Suspense>
        <FilterBar projects={projects.data ?? []} people={people.data ?? []} />
      </Suspense>
      {rows.length ? <TaskTable tasks={rows} today={today} /> : <EmptyState title="No issues" hint="Import the CSV or run Sync." />}
    </div>
  );
}
