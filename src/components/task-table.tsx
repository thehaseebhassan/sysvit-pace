"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { nestTasks, type Nested } from "@/lib/tasks/tree";
import { Avatar } from "./ui";
import { fmtDate, OPEN } from "@/lib/format";

export type TaskRow = {
  id: string; identifier: string | null; title: string; status_name: string | null; status_category: string;
  due_date: string | null; completed_at: string | null; external_url: string | null; parent_task_id: string | null;
  priority?: number | null; labels?: string[];
  project: { id: string; name: string } | null; assignee: { id: string; display_name: string } | null;
};

type Node = Nested<TaskRow> & { isLast: boolean; ancestorsLast: boolean[] };

function childStats(n: Nested<TaskRow>): { done: number; total: number } {
  let done = 0, total = 0;
  for (const c of n.children) {
    total += 1;
    if (c.status_category === "done") done += 1;
    const inner = childStats(c);
    done += inner.done;
    total += inner.total;
  }
  return { done, total };
}

function statusStyle(category: string): { border: string; fill: string } {
  switch (category) {
    case "in_progress": return { border: "#f2c94c", fill: "#f2c94c" };
    case "done": return { border: "#4cb782", fill: "#4cb782" };
    case "canceled": return { border: "#95a2b3", fill: "transparent" };
    case "todo": return { border: "#d0cec8", fill: "transparent" };
    default: return { border: "#c8c6bf", fill: "transparent" };
  }
}

function StatusCircle({ category, name }: { category: string; name?: string | null }) {
  const s = statusStyle(category);
  return (
    <span title={name ?? category} className="inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center" aria-hidden>
      <span className="block h-[11px] w-[11px] rounded-full" style={{ border: `1.5px solid ${s.border}`, background: s.fill }} />
    </span>
  );
}

/** Linear-style three rising bars. */
function PriorityBars({ priority }: { priority: number | null | undefined }) {
  const n = priority ?? 0;
  if (!n) return <span className="inline-block w-[10px]" />;
  const color = n <= 1 ? "#eb5757" : n === 2 ? "#f2994a" : n === 3 ? "#f2c94c" : "#b0aea5";
  const h = [4, 7, 10];
  return (
    <span title={`Priority ${n}`} className="inline-flex h-[12px] w-[10px] items-end gap-px" aria-hidden>
      {h.map((hh, i) => (
        <span key={i} className="w-[2.5px] rounded-sm" style={{ height: hh, background: i < (n === 4 ? 1 : n === 3 ? 2 : 3) ? color : "#e8e6dc" }} />
      ))}
    </span>
  );
}

function labelColor(name: string) {
  const hue = [...name].reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue} 45% 48%)`;
}

function Chip({ name, tone }: { name: string; tone?: string }) {
  return (
    <span className="inline-flex max-w-[120px] items-center gap-1 truncate rounded-full bg-[#f4f3ee] px-1.5 py-px text-[11px] text-[#3d3d3a]">
      <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: tone ?? labelColor(name) }} />
      {name}
    </span>
  );
}

function TreeLines({ depth, isLast, ancestorsLast }: { depth: number; isLast: boolean; ancestorsLast: boolean[] }) {
  if (depth === 0) return null;
  return (
    <span className="relative mr-0.5 flex h-[28px] shrink-0" style={{ width: depth * 16 }} aria-hidden>
      {ancestorsLast.map((last, i) =>
        last ? null : (
          <span key={i} className="absolute top-0 bottom-0 w-px bg-[#dddcd6]" style={{ left: i * 16 + 8 }} />
        ),
      )}
      <span className="absolute w-px bg-[#dddcd6]" style={{ left: (depth - 1) * 16 + 8, top: 0, height: isLast ? 14 : 28 }} />
      <span className="absolute h-px bg-[#dddcd6]" style={{ left: (depth - 1) * 16 + 8, top: 14, width: 10 }} />
    </span>
  );
}

export function TaskTable({ tasks, today, showProject = true }: { tasks: TaskRow[]; today: string; showProject?: boolean }) {
  const nested = useMemo(() => nestTasks(tasks), [tasks]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const visible = useMemo(() => {
    const out: Node[] = [];
    const walk = (nodes: Nested<TaskRow>[], ancestorsLast: boolean[]) => {
      nodes.forEach((n, i) => {
        const isLast = i === nodes.length - 1;
        out.push({ ...n, isLast, ancestorsLast });
        if (n.children.length && !collapsed[n.id]) walk(n.children, [...ancestorsLast, isLast]);
      });
    };
    walk(nested, []);
    return out;
  }, [nested, collapsed]);

  if (!tasks.length) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-raised)]">
      <ul>
        {visible.map((t) => {
          const overdue = !!t.due_date && t.due_date < today && (OPEN as readonly string[]).includes(t.status_category);
          const canceled = t.status_category === "canceled";
          const stats = t.children.length ? childStats(t) : null;
          return (
            <li key={t.id} className="group flex h-8 items-center gap-2 border-b border-[var(--line)] pr-2 last:border-b-0 hover:bg-[#f7f6f1]">
              <TreeLines depth={t.depth} isLast={t.isLast} ancestorsLast={t.ancestorsLast} />
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {t.children.length ? (
                  <button type="button" aria-expanded={!collapsed[t.id]}
                    aria-label={collapsed[t.id] ? "Expand sub-issues" : "Collapse sub-issues"}
                    className="flex h-4 w-3 shrink-0 items-center justify-center text-[10px] text-[var(--muted)]"
                    onClick={() => setCollapsed((s) => ({ ...s, [t.id]: !s[t.id] }))}>
                    <span className={`leading-none ${collapsed[t.id] ? "" : "rotate-90"}`}>▸</span>
                  </button>
                ) : <span className="w-3 shrink-0" />}
                <PriorityBars priority={t.priority} />
                <span className="w-[58px] shrink-0 font-mono text-[12px] text-[var(--muted)]">{t.identifier}</span>
                <StatusCircle category={t.status_category} name={t.status_name} />
                {t.external_url ? (
                  <a href={t.external_url} target="_blank" rel="noreferrer"
                    className={`min-w-0 truncate text-[13px] hover:underline ${canceled ? "text-[var(--muted)] line-through" : "font-medium text-[var(--fg)]"}`}>
                    {t.title}
                  </a>
                ) : (
                  <span className={`min-w-0 truncate text-[13px] font-medium ${canceled ? "text-[var(--muted)] line-through" : ""}`}>{t.title}</span>
                )}
                {stats && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f4f3ee] px-1.5 py-px text-[11px] text-[var(--muted)]">
                    <StatusCircle category={stats.done === stats.total && stats.total ? "done" : "todo"} />
                    {stats.done}/{stats.total}
                  </span>
                )}
              </div>
              <div className="hidden items-center gap-1.5 sm:flex">
                {(t.labels ?? []).slice(0, 2).map((l) => <Chip key={l} name={l} />)}
                {showProject && t.project && (
                  <Link href={`/projects/${t.project.id}`}><Chip name={t.project.name} tone="#4cb782" /></Link>
                )}
                {overdue && <span className="text-[11px] text-[#c45c26]">overdue</span>}
                <span className={`w-[52px] text-right text-[12px] ${overdue ? "text-[#c45c26]" : "text-[var(--muted)]"}`}>
                  {t.due_date ? fmtDate(t.due_date).replace(/ \d{4}$/, "") : ""}
                </span>
                <Avatar name={t.assignee?.display_name} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const TASK_SELECT =
  "id, identifier, title, status_name, status_category, due_date, completed_at, external_url, parent_task_id, priority, labels, project:projects(id,name), assignee:people(id,display_name)";
