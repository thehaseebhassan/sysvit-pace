import { Avatar, Badge, Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { requireCtx } from "@/lib/auth";

export default async function People() {
  const { supabase } = await requireCtx();
  const { data } = await supabase.from("v_assignee_workload").select("*").order("open_tasks", { ascending: false });
  const max = Math.max(1, ...(data ?? []).map((r) => r.open_tasks + r.done_tasks));
  return (
    <div>
      <PageHeader title="People" subtitle="Workload by assignee. Unassigned work is highlighted." />
      {data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((r, i) => {
            const href = `/tasks?status=open&assignee=${r.assignee_id ?? "none"}`;
            return (
              <div key={r.assignee_id ?? "none"} className="fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <Card href={href} className={!r.assignee_id ? "!border-amber-300 !bg-amber-50/40" : ""}>
                  <div className="flex items-center gap-3">
                    <Avatar name={r.assignee_id ? r.assignee_name : null} />
                    <h2 className="truncate font-medium">{r.assignee_name}</h2>
                    {r.overdue_tasks > 0 && <span className="ml-auto"><Badge tone="red">{r.overdue_tasks} overdue</Badge></span>}
                  </div>
                  <div className="mt-4"><ProgressBar value={(r.open_tasks / max) * 100} /></div>
                  <p className="mt-2 text-xs text-zinc-500">{r.open_tasks} open · {r.done_tasks} done</p>
                </Card>
              </div>
            );
          })}
        </div>
      ) : <EmptyState title="No people yet" />}
    </div>
  );
}
