import { Avatar, Badge, Body, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireCtx } from "@/lib/auth";

export default async function People() {
  const { supabase } = await requireCtx();
  const { data } = await supabase.from("v_assignee_workload").select("*").order("open_tasks", { ascending: false });
  return (
    <>
      <PageHeader title="People" subtitle="Open work by assignee" />
      <Body narrow>
        {data?.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.map((r) => (
              <Card key={r.assignee_id ?? "none"} href={`/tasks?status=open&assignee=${r.assignee_id ?? "none"}`} className="!p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.assignee_id ? r.assignee_name : null} size={26} />
                  <h2 className="min-w-0 flex-1 truncate text-[14px] font-[510]">{r.assignee_name}</h2>
                  {r.overdue_tasks > 0 && <Badge tone="red">{r.overdue_tasks} overdue</Badge>}
                </div>
                <p className="mt-3 text-[12px] text-[var(--muted)] tnum"><span className="text-[var(--ink)] font-[510]">{r.open_tasks}</span> open · {r.done_tasks} done</p>
              </Card>
            ))}
          </div>
        ) : <EmptyState title="No people yet" />}
      </Body>
    </>
  );
}
