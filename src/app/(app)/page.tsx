import Link from "next/link";
import { Badge, Body, Card, EmptyState, PageHeader, ProgressRing, ProjectIcon, SectionTitle, StatusIcon } from "@/components/ui";
import { uiColors } from "@/lib/colors";
import { requireCtx } from "@/lib/auth";
import { dateInTz, weekStart } from "@/lib/weeks";
import { fmtDate, timeAgo } from "@/lib/format";

export default async function Overview() {
  const { supabase, workspace } = await requireCtx();
  const tz = workspace.timezone;
  const thisWeek = weekStart(new Date(), tz);
  const today = dateInTz(new Date(), tz);

  const [workload, progress, weekly, flagged, lastRun] = await Promise.all([
    supabase.from("v_assignee_workload").select("assignee_id, open_tasks, overdue_tasks"),
    supabase.from("v_project_progress").select("project_id, project_name, total_tasks, done_tasks, open_tasks, overdue_tasks, percent_done").order("open_tasks", { ascending: false }).limit(6),
    supabase.from("v_weekly_done").select("done_count").eq("week_start", thisWeek),
    supabase.from("v_flagged_tasks").select("task_id, identifier, title, due_date, is_overdue, is_unassigned").order("due_date", { nullsFirst: false }).limit(8),
    supabase.from("sync_runs").select("status, finished_at, started_at, error, trigger").eq("status", "success").order("started_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const rows = workload.data ?? [];
  const open = rows.reduce((n, r) => n + r.open_tasks, 0);
  const overdue = rows.reduce((n, r) => n + r.overdue_tasks, 0);
  const unassigned = rows.filter((r) => !r.assignee_id).reduce((n, r) => n + r.open_tasks, 0);
  const doneWeek = (weekly.data ?? []).reduce((n, r) => n + r.done_count, 0);

  const stats = [
    { label: "Open", value: open, href: "/tasks?status=open" },
    { label: "Done this week", value: doneWeek, href: "/reports/weekly" },
    { label: "Overdue", value: overdue, href: "/tasks?flag=overdue", warn: overdue > 0 },
    { label: "Unassigned", value: unassigned, href: "/tasks?status=open&assignee=none" },
  ];

  const colors = uiColors(workspace.settings);

  return (
    <>
      <PageHeader title="Overview" subtitle={`Week of ${fmtDate(thisWeek)} · last sync ${timeAgo(lastRun.data?.finished_at)}`} />
      <Body narrow>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} href={s.href} className="!p-5">
            <p className="text-[13px] text-[var(--muted)]">{s.label}</p>
            <p className={`mt-2 text-[32px] font-normal leading-[1.1] tracking-[-0.022em] tnum ${s.warn ? "text-[#c23a3a]" : ""}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionTitle aside={<Link href="/projects" className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)]">All projects →</Link>}>Projects</SectionTitle>
          {progress.data?.length ? (
            <div className="card divide-hair overflow-hidden">
              {progress.data.map((p) => (
                <Link key={p.project_id} href={`/projects/${p.project_id}`} className="flex items-center gap-3 px-4 py-3 text-[13px] hover:bg-[var(--carbon)]">
                  <ProjectIcon name={p.project_name} colors={colors} />
                  <span className="min-w-0 flex-1 truncate font-[510]">{p.project_name}</span>
                  <span className="text-[var(--muted)] tnum">{p.done_tasks}/{p.total_tasks}</span>
                  <ProgressRing value={p.percent_done} />
                  <span className="w-9 text-right text-[var(--muted)] tnum">{Math.round(p.percent_done)}%</span>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="No projects yet" hint="Import history or run Sync." />}
        </section>

        <section className="lg:col-span-2">
          <SectionTitle>Needs attention</SectionTitle>
          {flagged.data?.length ? (
            <div className="card divide-hair overflow-hidden">
              {flagged.data.map((t) => (
                <Link key={t.task_id} href={`/tasks/${t.task_id}`} className="flex items-start gap-2.5 px-4 py-3 hover:bg-[var(--carbon)]">
                  <span className="mt-[3px]"><StatusIcon category="todo" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px]">{t.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="mono text-[12px] text-[var(--muted)]">{t.identifier}</span>
                      {t.is_overdue && <Badge tone="red">overdue {fmtDate(t.due_date)}</Badge>}
                      {t.is_unassigned && <Badge>unassigned</Badge>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="All clear" />}
        </section>
      </div>
      <p className="mt-8 text-[12px] text-[var(--faint)]">{fmtDate(today)} · {tz}</p>
      </Body>
    </>
  );
}
