import Link from "next/link";
import { Body, Card, EmptyState, LabelTag, PageHeader, StatusIcon } from "@/components/ui";
import { uiColors } from "@/lib/colors";
import { requireCtx } from "@/lib/auth";
import { addDays, formatWeekRange, weekStart } from "@/lib/weeks";
import { hydrateTasks, TASK_COLUMNS } from "@/lib/tasks/hydrate";

const WEEKS = 12;

export default async function Weekly() {
  const { supabase, workspace } = await requireCtx();
  const tz = workspace.timezone;
  const current = weekStart(new Date(), tz);
  const first = addDays(current, -7 * (WEEKS - 1));
  const weeks = Array.from({ length: WEEKS }, (_, i) => addDays(first, i * 7));

  const [counts, done, projects, people] = await Promise.all([
    supabase.from("v_weekly_done").select("week_start, done_count").gte("week_start", first),
    supabase.from("tasks").select(TASK_COLUMNS).is("deleted_in_source_at", null)
      .eq("status_category", "done").gte("completed_at", new Date(addDays(first, -1) + "T00:00:00Z").toISOString())
      .order("completed_at", { ascending: false }).limit(1000),
    supabase.from("projects").select("id, name"),
    supabase.from("people").select("id, display_name"),
  ]);

  const totals = new Map<string, number>();
  (counts.data ?? []).forEach((r) => totals.set(r.week_start, (totals.get(r.week_start) ?? 0) + r.done_count));
  const hydrated = hydrateTasks(done.data as Parameters<typeof hydrateTasks>[0], projects.data, people.data);
  const byWeek = new Map<string, typeof hydrated>();
  hydrated.forEach((t) => {
    if (!t.completed_at) return;
    const w = weekStart(t.completed_at, tz);
    byWeek.set(w, [...(byWeek.get(w) ?? []), t]);
  });
  const max = Math.max(1, ...weeks.map((w) => totals.get(w) ?? 0));
  const any = weeks.some((w) => totals.get(w));

  const colors = uiColors(workspace.settings);

  return (
    <>
      <PageHeader title="Weekly" subtitle={`Completed per week · Monday–Sunday, ${tz}`} />
      <Body narrow>
      {!any ? <EmptyState title="Nothing completed in the last 12 weeks" hint="Import history or run a sync." /> : (
        <>
          <Card className="mb-6 !p-5">
            <div className="flex h-36 items-end gap-2" role="img" aria-label="Issues completed per week">
              {weeks.map((w) => {
                const n = totals.get(w) ?? 0;
                const now = w === current;
                return (
                  <div key={w} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${formatWeekRange(w)}: ${n} done`}>
                    <span className="text-[11px] text-[var(--muted)] tnum">{n || ""}</span>
                    <div className={`w-full rounded-[3px] ${now ? "bg-[#6366f1]" : "bg-[#d6d8f7] group-hover:bg-[#a5a7f3]"}`} style={{ height: `${Math.max(2, (n / max) * 100)}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-[var(--faint)]">
              <span>{formatWeekRange(weeks[0])}</span><span>This week</span>
            </div>
          </Card>

          <div className="space-y-2">
            {[...weeks].reverse().map((w, i) => {
              const items = byWeek.get(w) ?? [];
              if (!items.length && !totals.get(w)) return null;
              return (
                <details key={w} open={i === 0} className="card group overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 hover:bg-[var(--carbon)]">
                    <span className="text-[13px] font-[510]">{w === current ? "This week" : formatWeekRange(w)}</span>
                    <span className="text-[13px] text-[var(--muted)] tnum">{totals.get(w) ?? items.length} done</span>
                  </summary>
                  <ul className="border-t border-[var(--graphite)]">
                    {items.map((t) => (
                      <li key={t.id} className="row border-b border-[var(--graphite)] last:border-b-0">
                        <StatusIcon category="done" />
                        <span className="mono w-[60px] shrink-0 text-[12px] text-[var(--muted)]">{t.identifier}</span>
                        <Link href={`/tasks/${t.id}`} className="min-w-0 flex-1 truncate hover:underline">{t.title}</Link>
                        <span className="hidden shrink-0 md:flex">{t.labels[0] && <LabelTag name={t.labels[0]} colors={colors} />}</span>
                        <span className="hidden w-[140px] shrink-0 truncate text-[12px] text-[var(--muted)] lg:block">{t.project?.name}</span>
                        <span className="w-[110px] shrink-0 truncate text-right text-[12px] text-[var(--muted)]">{t.assignee?.display_name ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </div>
        </>
      )}
      </Body>
    </>
  );
}
