import { Badge, Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { requireCtx } from "@/lib/auth";
import { fmtDate } from "@/lib/format";

export default async function Projects() {
  const { supabase } = await requireCtx();
  const { data } = await supabase.from("v_project_progress").select("*").order("project_name");
  return (
    <div>
      <PageHeader title="Projects" subtitle="Progress across every project." />
      {data?.length ? (
        <div className="grid gap-2 md:grid-cols-2">
          {data.map((p) => (
            <Card key={p.project_id} href={`/projects/${p.project_id}`} className="!p-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="truncate text-[13px] font-medium">{p.project_name}</h2>
                <span className="text-[12px] text-[var(--muted)]">{Math.round(p.percent_done)}%</span>
              </div>
              <div className="mt-2"><ProgressBar value={p.percent_done} /></div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <span>{p.done_tasks} done</span>
                <span>· {p.open_tasks} open</span>
                {p.overdue_tasks > 0 && <Badge tone="red">{p.overdue_tasks} overdue</Badge>}
                {p.unassigned_tasks > 0 && <Badge tone="amber">{p.unassigned_tasks} unassigned</Badge>}
                {p.target_date && <span className="ml-auto">{fmtDate(p.target_date)}</span>}
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No projects yet" hint="They appear after the first sync or CSV import." />}
    </div>
  );
}
