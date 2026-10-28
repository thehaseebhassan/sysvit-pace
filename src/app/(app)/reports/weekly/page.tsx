import { Card, EmptyState, PageHeader, StatusDot } from "@/components/ui";
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
      <PageHeader title="Weekly" subtitle={`Mon–Sun, ${tz}`} />
      {!any ? <EmptyState title="Nothing completed in the last 12 weeks" hint="Import history or run a sync." /> : (
        <>
          <Card className="mb-5 !p-3">
            <div className="flex h-28 items-end gap-1.5" role="img" aria-label="Tasks completed per week">
              {weeks.map((w) => {
                const n = totals.get(w) ?? 0;
                return (
                  <div key={w} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${formatWeekRange(w)}: ${n} done`}>
                    <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100">{n}</span>
                    <div className="w-full rounded-sm bg-[var(--accent-soft)] transition group-hover:bg-[var(--accent)]" style={{ height: `${Math.max(2, (n / max) * 100)}%` }} />
                  </div>
                );
              })}
            </div>
          </Card>
          <div className="space-y-2">
            {[...weeks].reverse().map((w, i) => {
              const items = byWeek.get(w) ?? [];
              if (!items.length && !totals.get(w)) return null;
              return (
                <details key={w} open={i === 0} className="group rounded-md border border-[var(--line)] bg-[var(--bg-raised)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 hover:bg-[#f7f6f1]">
                    <span className="text-[13px] font-medium">{w === current ? "This week" : formatWeekRange(w)}</span>
                    <span className="text-[12px] text-[var(--muted)]">{totals.get(w) ?? items.length}</span>
                  </summary>
                  <ul className="border-t border-[var(--line)]">
                    {items.map((t) => (
                      <li key={t.id} className="flex h-8 items-center gap-2 px-3 text-[13px]">
                        <StatusDot category="done" />
                        <span className="w-[58px] font-mono text-[12px] text-[var(--muted)]">{t.identifier}</span>
                        <a href={t.external_url ?? "#"} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:underline">{t.title}</a>
                        <span className="hidden text-[12px] text-[var(--muted)] sm:block">{t.project?.name}</span>
                        <span className="text-[12px] text-[var(--muted)]">{t.assignee?.display_name ?? "—"}</span>
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
