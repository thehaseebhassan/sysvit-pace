import { Badge, Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { requireCtx } from "@/lib/auth";
import { fmtDate } from "@/lib/format";

export default async function Projects() {
  const { supabase } = await requireCtx();
  const { data } = await supabase.from("v_project_progress").select("*").order("project_name");
  return (
    <div>
      <PageHeader title="Projects" subtitle="Progress across every project, including finished work." />
      {data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((p, i) => (
            <div key={p.project_id} className="fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <Card href={`/projects/${p.project_id}`}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="truncate font-medium">{p.project_name}</h2>
                  <span className="text-sm font-semibold text-emerald-600">{Math.round(p.percent_done)}%</span>
                </div>
                <div className="mt-3"><ProgressBar value={p.percent_done} tone="emerald" /></div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span>{p.done_tasks} done</span><span>·</span><span>{p.open_tasks} open</span>
                  {p.overdue_tasks > 0 && <Badge tone="red">{p.overdue_tasks} overdue</Badge>}
                  {p.unassigned_tasks > 0 && <Badge tone="amber">{p.unassigned_tasks} unassigned</Badge>}
                  {p.target_date && <span className="ml-auto">Target {fmtDate(p.target_date)}</span>}
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : <EmptyState title="No projects yet" hint="They appear after the first sync or CSV import." />}
    </div>
  );
}
