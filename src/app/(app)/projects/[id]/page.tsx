import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { TaskTable } from "@/components/task-table";
import { requireCtx } from "@/lib/auth";
import { dateInTz } from "@/lib/weeks";
import { hydrateTasks, TASK_COLUMNS } from "@/lib/tasks/hydrate";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, workspace } = await requireCtx();
  const [p, tasks, projects, people] = await Promise.all([
    supabase.from("v_project_progress").select("*").eq("project_id", id).maybeSingle(),
    supabase.from("tasks").select(TASK_COLUMNS).eq("project_id", id).order("identifier").limit(800),
    supabase.from("projects").select("id, name"),
    supabase.from("people").select("id, display_name"),
  ]);
  if (!p.data) notFound();
  if (tasks.error) {
    return <p className="text-sm text-[var(--bad)]">{tasks.error.message}</p>;
  }
  const rows = hydrateTasks(tasks.data as Parameters<typeof hydrateTasks>[0], projects.data, people.data);
  const today = dateInTz(new Date(), workspace.timezone);

  return (
    <div>
      <Link href="/projects" className="text-sm text-[var(--muted)] hover:text-[var(--fg)]">← Projects</Link>
      <PageHeader title={p.data.project_name} subtitle={`${p.data.done_tasks} of ${p.data.total_tasks} done`} />
      <div className="mb-5 max-w-md"><ProgressBar value={p.data.percent_done} /></div>
      {rows.length ? <TaskTable tasks={rows} today={today} showProject={false} /> : <EmptyState title="No issues in this project" />}
    </div>
  );
}
