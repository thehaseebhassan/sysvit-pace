import Link from "next/link";
import { AttentionPanel, type AttentionItem } from "@/components/attention-panel";
import { Avatar, Badge, Body, Card, EmptyState, PageHeader, ProgressRing, ProjectTile, SectionTitle, StatusIcon } from "@/components/ui";
import { requireCtx } from "@/lib/auth";
import { projectColor, tint, uiColors } from "@/lib/colors";
import { fmtDate, timeAgo } from "@/lib/format";
import { addDays, dateInTz, weekStart } from "@/lib/weeks";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function greeting(tz: string) {
  const h = Number(new Intl.DateTimeFormat("en-AU", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date())) % 24;
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const Glyph = ({ kind, color }: { kind: "open" | "done" | "late" | "none"; color: string }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {kind === "open" && <><circle cx="8" cy="8" r="6" /><path d="M8 4.8V8l2.2 1.4" /></>}
    {kind === "done" && <><circle cx="8" cy="8" r="6" /><path d="m5.4 8.2 1.8 1.8 3.4-3.8" /></>}
    {kind === "late" && <><rect x="2.2" y="3" width="11.6" height="10.4" rx="2.6" /><path d="M2.2 6.4h11.6M5.4 1.8v2.4M10.6 1.8v2.4M8 8.6v1.9M8 12v.01" /></>}
    {kind === "none" && <><circle cx="8" cy="8" r="6" strokeDasharray="2.4 2.2" /></>}
  </svg>
);

export default async function Overview() {
  const { supabase, workspace, member } = await requireCtx();
  const tz = workspace.timezone;
  const colors = uiColors(workspace.settings);
  const thisWeek = weekStart(new Date(), tz);
  const lastWeek = addDays(thisWeek, -7);
  const today = dateInTz(new Date(), tz);
  const soon = addDays(today, 7);

  const [workload, progress, lastWeekRows, doneThisWeek, flagged, dueSoon, recent, people, lastRun] = await Promise.all([
    supabase.from("v_assignee_workload").select("assignee_id, assignee_name, open_tasks, done_tasks, overdue_tasks"),
    supabase.from("v_project_progress").select("project_id, project_name, total_tasks, done_tasks, open_tasks, overdue_tasks, percent_done").order("open_tasks", { ascending: false }).limit(9),
    supabase.from("v_weekly_done").select("done_count").eq("week_start", lastWeek),
    supabase.from("tasks").select("id, completed_at").is("deleted_in_source_at", null).eq("status_category", "done").gte("completed_at", new Date(addDays(thisWeek, -1) + "T00:00:00Z").toISOString()).limit(1000),
    supabase.from("v_flagged_tasks").select("task_id, identifier, title, due_date, is_overdue, is_unassigned, assignee_id, status_name").order("due_date", { nullsFirst: false }).limit(60),
    supabase.from("tasks").select("id, identifier, title, due_date, assignee_id, status_name").is("deleted_in_source_at", null).is("archived_in_source_at", null).in("status_category", ["backlog", "todo", "in_progress"]).gte("due_date", today).lte("due_date", soon).order("due_date").limit(40),
    supabase.from("tasks").select("id, identifier, title, completed_at, assignee_id, project_id").is("deleted_in_source_at", null).eq("status_category", "done").not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(8),
    supabase.from("people").select("id, display_name"),
    supabase.from("sync_runs").select("finished_at").eq("status", "success").neq("trigger", "import").order("started_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const who = new Map((people.data ?? []).map((p) => [p.id, p.display_name]));
  const proj = new Map((progress.data ?? []).map((p) => [p.project_id, p.project_name]));

  const rows = workload.data ?? [];
  const open = rows.reduce((n, r) => n + r.open_tasks, 0);
  const overdue = rows.reduce((n, r) => n + r.overdue_tasks, 0);
  const unassigned = rows.filter((r) => !r.assignee_id).reduce((n, r) => n + r.open_tasks, 0);

  // completions per weekday this week (Mon..Sun, workspace timezone)
  const perDay = Array(7).fill(0) as number[];
  for (const t of doneThisWeek.data ?? []) {
    if (!t.completed_at) continue;
    const day = dateInTz(t.completed_at, tz);
    if (day < thisWeek || day > addDays(thisWeek, 6)) continue;
    perDay[Math.round((new Date(day + "T00:00:00Z").getTime() - new Date(thisWeek + "T00:00:00Z").getTime()) / 86_400_000)]++;
  }
  const doneWeek = perDay.reduce((a, b) => a + b, 0);
  const prevWeek = (lastWeekRows.data ?? []).reduce((n, r) => n + r.done_count, 0);
  const delta = doneWeek - prevWeek;
  const maxDay = Math.max(1, ...perDay);
  const todayIdx = Math.round((new Date(today + "T00:00:00Z").getTime() - new Date(thisWeek + "T00:00:00Z").getTime()) / 86_400_000);

  const stats = [
    { label: "Open", value: open, href: "/tasks?status=open", kind: "open" as const, color: "#6366f1", note: `${rows.filter((r) => r.assignee_id && r.open_tasks).length} people` },
    { label: "Done this week", value: doneWeek, href: "/reports/weekly", kind: "done" as const, color: "#27a644", note: `${delta >= 0 ? "+" : "−"}${Math.abs(delta)} vs last week` },
    { label: "Overdue", value: overdue, href: "/tasks?flag=overdue", kind: "late" as const, color: "#e5484d", note: overdue ? "needs a look" : "all on time" },
    { label: "Unassigned", value: unassigned, href: "/tasks?status=open&assignee=none", kind: "none" as const, color: "#62666d", note: unassigned ? "open, no owner" : "everything owned" },
  ];

  const item = (r: { id?: string; task_id?: string; identifier: string | null; title: string; assignee_id: string | null; status_name: string | null }, note: string, tone: AttentionItem["tone"]): AttentionItem => ({
    id: (r.id ?? r.task_id) as string, identifier: r.identifier, title: r.title, note: r.status_name ? `${r.status_name} · ${note}` : note, tone, assignee: r.assignee_id ? who.get(r.assignee_id) ?? null : null,
  });
  const overdueItems = (flagged.data ?? []).filter((t) => t.is_overdue).map((t) => item(t, `due ${fmtDate(t.due_date)}`, "red"));
  const unassignedItems = (flagged.data ?? []).filter((t) => t.is_unassigned).map((t) => item(t, "no owner", "orange"));
  const soonItems = (dueSoon.data ?? []).map((t) => item(t, t.due_date === today ? "today" : fmtDate(t.due_date), t.due_date === today ? "red" : "muted"));

  const topPeople = [...rows].filter((r) => r.open_tasks > 0).sort((a, b) => b.open_tasks - a.open_tasks).slice(0, 6);
  const maxOpen = Math.max(1, ...topPeople.map((r) => r.open_tasks));
  const name = member.display_name?.split(" ")[0];

  return (
    <>
      <PageHeader title="Overview" subtitle={`Week of ${fmtDate(thisWeek)} · synced ${timeAgo(lastRun.data?.finished_at)}`} />
      <Body narrow className="!max-w-[1120px] space-y-8">
        <div>
          <h2 className="text-[20px] font-[590] tracking-[-0.012em]">{greeting(tz)}{name ? `, ${name}` : ""}</h2>
          <p className="mt-0.5 text-[13px] text-[var(--muted)]">{fmtDate(today)} · here’s where SYSVIT stands this week.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="card card-link group !p-4 hover:-translate-y-px">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--muted)]">{s.label}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px]" style={{ background: tint(s.color, 12) }}><Glyph kind={s.kind} color={s.color} /></span>
              </div>
              <p className="mt-3 text-[32px] font-normal leading-[1.1] tracking-[-0.022em] tnum">{s.value}</p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">{s.note}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="!p-5 lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] text-[var(--muted)]">Completed this week</p>
                <p className="mt-1 text-[24px] leading-none tracking-[-0.012em] tnum">{doneWeek}</p>
              </div>
              <Link href="/reports/weekly" className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)]">12-week view →</Link>
            </div>
            <div className="mt-5 flex h-28 items-end gap-3" role="img" aria-label="Issues completed per weekday">
              {perDay.map((n, i) => (
                <div key={DAYS[i]} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${DAYS[i]}: ${n} done`}>
                  <span className={`text-[11px] tnum transition-opacity ${n ? "text-[var(--muted)]" : "opacity-0"}`}>{n}</span>
                  <div className="w-full rounded-[5px] transition-colors" style={{
                    height: `${Math.max(4, (n / maxDay) * 100)}%`,
                    background: n ? (i === todayIdx ? "#6366f1" : "#a5a7f3") : "var(--graphite)",
                  }} />
                  <span className={`text-[11px] ${i === todayIdx ? "font-[510] text-[var(--ink)]" : "text-[var(--faint)]"}`}>{DAYS[i]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="!p-5">
            <p className="text-[13px] text-[var(--muted)]">Workload</p>
            {topPeople.length ? (
              <ul className="mt-3 space-y-1">
                {topPeople.map((r) => (
                  <li key={r.assignee_id ?? "none"}>
                    <Link href={`/tasks?status=open&assignee=${r.assignee_id ?? "none"}`} className="-mx-2 flex items-center gap-2.5 rounded-[6px] px-2 py-1.5 text-[13px] hover:bg-[var(--carbon)]">
                      <Avatar name={r.assignee_id ? r.assignee_name : null} size={22} />
                      <span className="min-w-0 flex-1 truncate">{r.assignee_name}</span>
                      {r.overdue_tasks > 0 && <Badge tone="red">{r.overdue_tasks} late</Badge>}
                      <span className="w-6 text-right font-[510] tnum">{r.open_tasks}</span>
                      <ProgressRing value={(r.open_tasks / maxOpen) * 100} size={16} color="#6366f1" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-[13px] text-[var(--muted)]">No open work.</p>}
          </Card>
        </div>

        <section>
          <SectionTitle aside={<Link href="/projects" className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)]">All projects →</Link>}>Projects</SectionTitle>
          {progress.data?.length ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {progress.data.map((p) => {
                const c = projectColor(p.project_name, colors);
                return (
                  <Link key={p.project_id} href={`/projects/${p.project_id}`} className="card card-link group !p-4" style={{ background: tint(c, 4) }}>
                    <div className="flex items-center gap-3">
                      <ProjectTile name={p.project_name} colors={colors} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-[510]">{p.project_name}</p>
                        <p className="text-[12px] text-[var(--muted)] tnum">{p.done_tasks}/{p.total_tasks} done · {p.open_tasks} open</p>
                      </div>
                      <ProgressRing value={p.percent_done} size={26} color={c} />
                    </div>
                    {p.overdue_tasks > 0 && <div className="mt-3"><Badge tone="red">{p.overdue_tasks} overdue</Badge></div>}
                  </Link>
                );
              })}
            </div>
          ) : <EmptyState title="No projects yet" hint="Import history or run Sync." />}
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3">
            <SectionTitle>Needs attention</SectionTitle>
            <AttentionPanel tabs={[
              { key: "overdue", label: "Overdue", items: overdueItems },
              { key: "soon", label: "Due this week", items: soonItems },
              { key: "unassigned", label: "Unassigned", items: unassignedItems },
            ]} />
          </section>
          <section className="lg:col-span-2">
            <SectionTitle>Recently completed</SectionTitle>
            {recent.data?.length ? (
              <div className="card divide-hair overflow-hidden">
                {recent.data.map((t) => (
                  <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-start gap-2.5 px-4 py-3 hover:bg-[var(--carbon)]">
                    <span className="mt-[2px]"><StatusIcon category="done" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px]">{t.title}</p>
                      <p className="mt-0.5 truncate text-[12px] text-[var(--muted)]">
                        <span className="mono">{t.identifier}</span>
                        {t.project_id && proj.get(t.project_id) ? ` · ${proj.get(t.project_id)}` : ""}
                        {t.assignee_id && who.get(t.assignee_id) ? ` · ${who.get(t.assignee_id)}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12px] text-[var(--faint)]">{timeAgo(t.completed_at)}</span>
                  </Link>
                ))}
              </div>
            ) : <EmptyState title="Nothing completed yet" />}
          </section>
        </div>
      </Body>
    </>
  );
}
