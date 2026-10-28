import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, ProgressBar, SectionTitle } from "@/components/ui";
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
    { label: "Open tasks", value: open, href: "/tasks?status=open", tone: "text-zinc-900" },
    { label: "Done this week", value: doneWeek, href: "/reports/weekly", tone: "text-emerald-600" },
    { label: "Overdue", value: overdue, href: "/tasks?flag=overdue", tone: overdue ? "text-red-600" : "text-zinc-900" },
    { label: "Unassigned", value: unassigned, href: "/tasks?status=open&assignee=none", tone: unassigned ? "text-amber-600" : "text-zinc-900" },
  ];

  return (
    <div>
      <PageHeader title="Overview" subtitle={`Week of ${fmtDate(thisWeek)} · last sync ${timeAgo(lastRun.data?.finished_at)}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="fade-up" style={{ animationDelay: `${i * 50}ms` }}>
            <Card href={s.href}>
              <p className="text-sm text-zinc-500">{s.label}</p>
              <p className={`mt-1 text-3xl font-semibold tracking-tight ${s.tone}`}>{s.value}</p>
            </Card>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionTitle aside={<Link href="/projects" className="text-sm text-indigo-600 hover:underline">All projects</Link>}>Project progress</SectionTitle>
          {progress.data?.length ? (
            <Card className="divide-y divide-zinc-100 !p-0">
              {progress.data.map((p) => (
                <Link key={p.project_id} href={`/projects/${p.project_id}`} className="block px-5 py-3.5 transition first:rounded-t-2xl last:rounded-b-2xl hover:bg-zinc-50">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{p.project_name}</span>
                    <span className="shrink-0 text-zinc-500">{p.done_tasks}/{p.total_tasks} · {Math.round(p.percent_done)}%</span>
                  </div>
                  <ProgressBar value={p.percent_done} tone="emerald" />
                </Link>
              ))}
            </Card>
          ) : <EmptyState title="No projects yet" hint="Run a sync or import your history from the Sync page." />}
        </section>

        <section className="lg:col-span-2">
          <SectionTitle>Needs attention</SectionTitle>
          {flagged.data?.length ? (
            <Card className="divide-y divide-zinc-100 !p-0">
              {flagged.data.map((t) => (
                <div key={t.task_id} className="px-4 py-3">
                  <a href={t.external_url ?? "#"} target="_blank" rel="noreferrer" className="block truncate text-sm hover:text-indigo-600">{t.title}</a>
                  <div className="mt-1 flex gap-1.5">
                    <span className="text-xs text-zinc-400">{t.identifier}</span>
                    {t.is_overdue && <Badge tone="red">overdue {fmtDate(t.due_date)}</Badge>}
                    {t.is_unassigned && <Badge tone="amber">unassigned</Badge>}
                  </div>
                </div>
              ))}
            </Card>
          ) : <EmptyState title="All clear" hint="Nothing overdue or unassigned." />}
        </section>
      </div>
      <p className="mt-8 text-xs text-zinc-400">Today is {fmtDate(today)} ({tz}).</p>
    </div>
  );
}
