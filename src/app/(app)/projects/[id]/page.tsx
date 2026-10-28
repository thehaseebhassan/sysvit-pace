import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { TASK_SELECT, TaskTable, type TaskRow } from "@/components/task-table";
import { requireCtx } from "@/lib/auth";
import { dateInTz } from "@/lib/weeks";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, workspace } = await requireCtx();
  const [p, tasks] = await Promise.all([
    supabase.from("v_project_progress").select("*").eq("project_id", id).maybeSingle(),
    supabase.from("tasks").select(TASK_SELECT).eq("project_id", id).order("external_updated_at", { ascending: false, nullsFirst: false }).limit(500),
  ]);
  if (!p.data) notFound();
  const rows = (tasks.data ?? []) as unknown as TaskRow[];
  const open = rows.filter((t) => ["backlog", "todo", "in_progress"].includes(t.status_category));
  const closed = rows.filter((t) => !open.includes(t));
  const today = dateInTz(new Date(), workspace.timezone);

  return (
    <div>
      <Link href="/projects" className="text-sm text-zinc-500 hover:text-zinc-800">← Projects</Link>
      <PageHeader title={p.data.project_name} subtitle={`${p.data.done_tasks} of ${p.data.total_tasks} tasks done`} />
      <Card className="mb-8"><ProgressBar value={p.data.percent_done} tone="emerald" /></Card>
      <h2 className="mb-3 text-sm font-medium text-zinc-500">Open ({open.length})</h2>
      {open.length ? <TaskTable tasks={open} today={today} showProject={false} /> : <EmptyState title="Nothing open" />}
      <h2 className="mb-3 mt-8 text-sm font-medium text-zinc-500">Closed ({closed.length})</h2>
      {closed.length ? <TaskTable tasks={closed} today={today} showProject={false} /> : <EmptyState title="Nothing closed yet" />}
    </div>
  );
}
