import { Avatar, Badge, Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { requireCtx } from "@/lib/auth";

export default async function People() {
  const { supabase } = await requireCtx();
  const { data } = await supabase.from("v_assignee_workload").select("*").order("open_tasks", { ascending: false });
  const max = Math.max(1, ...(data ?? []).map((r) => r.open_tasks + r.done_tasks));
  return (
    <div>
      <PageHeader title="People" subtitle="Workload by assignee." />
      {data?.length ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.map((r) => {
            const href = `/tasks?status=open&assignee=${r.assignee_id ?? "none"}`;
            return (
              <Card key={r.assignee_id ?? "none"} href={href} className={!r.assignee_id ? "border-[#e8c9b5]" : ""}>
                <div className="flex items-center gap-2">
                  <Avatar name={r.assignee_id ? r.assignee_name : null} />
                  <h2 className="truncate text-sm font-medium">{r.assignee_name}</h2>
                  {r.overdue_tasks > 0 && <span className="ml-auto"><Badge tone="red">{r.overdue_tasks}</Badge></span>}
                </div>
                <div className="mt-3"><ProgressBar value={(r.open_tasks / max) * 100} /></div>
                <p className="mt-2 text-xs text-[var(--muted)]">{r.open_tasks} open · {r.done_tasks} done</p>
              </Card>
            );
          })}
        </div>
      ) : <EmptyState title="No people yet" />}
    </div>
  );
}
