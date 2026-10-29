import Link from "next/link";
import { Badge, Body, EmptyState, PageHeader, ProgressRing, ProjectTile } from "@/components/ui";
import { projectColor, tint, uiColors } from "@/lib/colors";
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
            {data.map((p) => {
              const c = projectColor(p.project_name, colors);
              return (
                <Link key={p.project_id} href={`/projects/${p.project_id}`} className="card card-link !p-4" style={{ background: tint(c, 4) }}>
                  <div className="flex items-center gap-3">
                    <ProjectTile name={p.project_name} colors={colors} size={32} />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[14px] font-[510]">{p.project_name}</h2>
                      <p className="text-[12px] text-[var(--muted)] tnum">{p.done_tasks} done · {p.open_tasks} open</p>
                    </div>
                    <ProgressRing value={p.percent_done} size={28} color={c} />
                  </div>
                  {(p.overdue_tasks > 0 || p.unassigned_tasks > 0) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.overdue_tasks > 0 && <Badge tone="red">{p.overdue_tasks} overdue</Badge>}
                      {p.unassigned_tasks > 0 && <Badge>{p.unassigned_tasks} unassigned</Badge>}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : <EmptyState title="No projects yet" hint="They appear after the first sync or CSV import." />}
      </Body>
    </>
  );
}
