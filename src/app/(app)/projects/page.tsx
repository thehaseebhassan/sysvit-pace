import { Badge, Body, Card, EmptyState, PageHeader, ProgressRing, ProjectIcon } from "@/components/ui";
import { uiColors } from "@/lib/colors";
import { requireCtx } from "@/lib/auth";

export default async function Projects() {
  const { supabase, workspace } = await requireCtx();
  const colors = uiColors(workspace.settings);
  const { data } = await supabase.from("v_project_progress").select("*").order("project_name");
  return (
    <>
      <PageHeader title="Projects" subtitle={`${data?.length ?? 0} projects`} />
      <Body narrow>
        {data?.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.map((p) => (
              <Card key={p.project_id} href={`/projects/${p.project_id}`} className="!p-4">
                <div className="flex items-center gap-2.5">
                  <ProjectIcon name={p.project_name} colors={colors} size={18} />
                  <h2 className="min-w-0 flex-1 truncate text-[14px] font-[510]">{p.project_name}</h2>
                  <ProgressRing value={p.percent_done} size={20} />
                  <span className="w-9 text-right text-[13px] text-[var(--muted)] tnum">{Math.round(p.percent_done)}%</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--muted)]">
                  <span className="tnum">{p.done_tasks} done</span>
                  <span className="tnum">· {p.open_tasks} open</span>
                  {p.overdue_tasks > 0 && <Badge tone="red">{p.overdue_tasks} overdue</Badge>}
                  {p.unassigned_tasks > 0 && <Badge>{p.unassigned_tasks} unassigned</Badge>}
                </div>
              </Card>
            ))}
          </div>
        ) : <EmptyState title="No projects yet" hint="They appear after the first sync or CSV import." />}
      </Body>
    </>
  );
}
