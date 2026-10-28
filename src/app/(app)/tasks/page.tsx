import { Suspense } from "react";
import { FilterBar } from "@/components/filter-bar";
import { TASK_SELECT, TaskTable, type TaskRow } from "@/components/task-table";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireCtx } from "@/lib/auth";
import { OPEN } from "@/lib/format";
import { dateInTz } from "@/lib/weeks";

const UUID = /^[0-9a-f-]{36}$/i;
const LIMIT = 300;

export default async function Tasks({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, workspace } = await requireCtx();
  const today = dateInTz(new Date(), workspace.timezone);

  let q = supabase.from("tasks").select(TASK_SELECT).order("external_updated_at", { ascending: false, nullsFirst: false }).limit(LIMIT);
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
  const rows = (tasks.data ?? []) as unknown as TaskRow[];

  return (
    <div>
      <PageHeader title="Tasks" subtitle={`${rows.length}${rows.length === LIMIT ? "+" : ""} shown`} />
      <Suspense>
        <FilterBar projects={projects.data ?? []} people={people.data ?? []} />
      </Suspense>
      {rows.length ? <TaskTable tasks={rows} today={today} /> : <EmptyState title="No tasks match" hint="Try clearing a filter." />}
    </div>
  );
}
