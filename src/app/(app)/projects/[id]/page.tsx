import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { TASK_SELECT, TaskTable, type TaskRow } from "@/components/task-table";
import { requireCtx } from "@/lib/auth";
import { dateInTz } from "@/lib/weeks";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, workspace } = await requireCtx();
  const [p, tasks] = await Promise.all([
    supabase.from("v_project_progress").select("*").eq("project_id", id).maybeSingle(),
    supabase.from("tasks").select(TASK_SELECT).eq("project_id", id).order("identifier").limit(800),
  ]);
  if (!p.data) notFound();
  if (tasks.error) {
    return <p className="p-4 text-[13px] text-[#eb5757]">Couldn’t load issues: {tasks.error.message}</p>;
  }
  const rows = (tasks.data ?? []) as unknown as TaskRow[];
  const today = dateInTz(new Date(), workspace.timezone);

  return (
    <div>
      <Link href="/projects" className="text-[12px] text-[var(--muted)] hover:text-[var(--fg)]">← Projects</Link>
      <PageHeader title={p.data.project_name} subtitle={`${p.data.done_tasks} of ${p.data.total_tasks} done`} />
      <div className="mb-4"><ProgressBar value={p.data.percent_done} /></div>
      {rows.length ? <TaskTable tasks={rows} today={today} showProject={false} /> : <EmptyState title="No tasks in this project" />}
    </div>
  );
}
