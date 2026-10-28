import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireCtx } from "@/lib/auth";
import { addDays, formatWeekRange, weekStart } from "@/lib/weeks";

const WEEKS = 12;

type Done = { id: string; identifier: string | null; title: string; completed_at: string; external_url: string | null; project: { name: string } | null; assignee: { display_name: string } | null };

export default async function Weekly() {
  const { supabase, workspace } = await requireCtx();
  const tz = workspace.timezone;
  const current = weekStart(new Date(), tz);
  const first = addDays(current, -7 * (WEEKS - 1));
  const weeks = Array.from({ length: WEEKS }, (_, i) => addDays(first, i * 7));

  const [counts, done] = await Promise.all([
    supabase.from("v_weekly_done").select("week_start, done_count").gte("week_start", first),
    supabase.from("tasks").select("id, identifier, title, completed_at, external_url, project:projects(name), assignee:people(display_name)")
      .eq("status_category", "done").gte("completed_at", new Date(addDays(first, -1) + "T00:00:00Z").toISOString())
      .order("completed_at", { ascending: false }).limit(1000),
  ]);

  const totals = new Map<string, number>();
  (counts.data ?? []).forEach((r) => totals.set(r.week_start, (totals.get(r.week_start) ?? 0) + r.done_count));
  const byWeek = new Map<string, Done[]>();
  ((done.data ?? []) as unknown as Done[]).forEach((t) => {
    const w = weekStart(t.completed_at, tz);
    byWeek.set(w, [...(byWeek.get(w) ?? []), t]);
  });
  const max = Math.max(1, ...weeks.map((w) => totals.get(w) ?? 0));
  const any = weeks.some((w) => totals.get(w));

  return (
    <div>
      <PageHeader title="Weekly report" subtitle={`What got done each week (Mon–Sun, ${tz}).`} />
      {!any ? <EmptyState title="Nothing completed in the last 12 weeks" hint="Import your history or run a sync." /> : (
        <>
          <Card className="mb-8">
            <div className="flex h-40 items-end gap-2" role="img" aria-label="Tasks completed per week">
              {weeks.map((w) => {
                const n = totals.get(w) ?? 0;
                return (
                  <div key={w} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${formatWeekRange(w)}: ${n} done`}>
                    <span className="text-xs text-zinc-400 opacity-0 transition group-hover:opacity-100">{n}</span>
                    <div className="w-full rounded-t-md bg-indigo-200 transition group-hover:bg-indigo-500" style={{ height: `${Math.max(2, (n / max) * 100)}%` }} />
                    <span className="text-[10px] text-zinc-400">{w.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          <div className="space-y-3">
            {[...weeks].reverse().map((w, i) => {
              const items = byWeek.get(w) ?? [];
              if (!items.length && !totals.get(w)) return null;
              return (
                <details key={w} open={i === 0} className="group rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 transition hover:bg-zinc-50">
                    <span className="font-medium">{w === current ? "This week" : formatWeekRange(w)}</span>
                    <span className="flex items-center gap-2 text-sm text-zinc-500">
                      {totals.get(w) ?? items.length} done
                      <span className="text-zinc-300 transition group-open:rotate-90">›</span>
                    </span>
                  </summary>
                  <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
                    {items.map((t) => (
                      <li key={t.id} className="flex items-center gap-3 px-5 py-2 text-sm">
                        <StatusBadge category="done" name="Done" />
                        <a href={t.external_url ?? "#"} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:text-indigo-600">{t.title}</a>
                        <span className="hidden text-xs text-zinc-400 sm:block">{t.project?.name}</span>
                        <span className="text-xs text-zinc-500">{t.assignee?.display_name ?? "Unassigned"}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
