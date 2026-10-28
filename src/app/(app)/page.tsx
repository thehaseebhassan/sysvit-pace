import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, ProgressBar, SectionTitle, StatusDot } from "@/components/ui";
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
    supabase.from("v_flagged_tasks").select("task_id, identifier, title, due_date, is_overdue, is_unassigned, external_url").order("due_date", { nullsFirst: false }).limit(8),
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
    { label: "Unassigned", value: unassigned, href: "/tasks?status=open&assignee=none", warn: unassigned > 0 },
  ];

  return (
    <div className="py-2">
      <PageHeader title="Overview" subtitle={`Week of ${fmtDate(thisWeek)} · synced ${timeAgo(lastRun.data?.finished_at)}`} />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} href={s.href} className="!p-3">
            <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
            <p className={`mt-0.5 text-[22px] font-medium tracking-tight ${s.warn ? "text-[var(--accent)]" : ""}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionTitle aside={<Link href="/projects" className="text-[12px] text-[var(--accent)] hover:underline">All</Link>}>Projects</SectionTitle>
          {progress.data?.length ? (
            <Card className="divide-y divide-[var(--line)] !p-0">
              {progress.data.map((p) => (
                <Link key={p.project_id} href={`/projects/${p.project_id}`} className="block px-3 py-2.5 transition hover:bg-[#f7f6f1]">
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
                    <span className="truncate">{p.project_name}</span>
                    <span className="shrink-0 text-[12px] text-[var(--muted)]">{p.done_tasks}/{p.total_tasks}</span>
                  </div>
                  <ProgressBar value={p.percent_done} />
                </Link>
              ))}
            </Card>
          ) : <EmptyState title="No projects yet" hint="Run a sync or import history on the Sync page." />}
        </section>

        <section className="lg:col-span-2">
          <SectionTitle>Needs attention</SectionTitle>
          {flagged.data?.length ? (
            <Card className="divide-y divide-[var(--line)] !p-0">
              {flagged.data.map((t) => (
                <div key={t.task_id} className="flex items-center gap-2 px-3 py-2">
                  <StatusDot category={t.is_overdue ? "todo" : "backlog"} />
                  <div className="min-w-0 flex-1">
                    <a href={t.external_url ?? "#"} target="_blank" rel="noreferrer" className="block truncate text-[13px] hover:underline">{t.title}</a>
                    <div className="flex gap-1.5 text-[11px] text-[var(--muted)]">
                      <span className="font-mono">{t.identifier}</span>
                      {t.is_overdue && <Badge tone="red">overdue {fmtDate(t.due_date)}</Badge>}
                      {t.is_unassigned && <Badge tone="amber">unassigned</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          ) : <EmptyState title="All clear" hint="Nothing overdue or unassigned." />}
        </section>
      </div>
      <p className="mt-6 text-[11px] text-[var(--muted)]">{fmtDate(today)} · {tz}</p>
    </div>
  );
}
