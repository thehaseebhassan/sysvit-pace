"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { nestTasks, type Nested } from "@/lib/tasks/tree";
import { OPEN } from "@/lib/format";

export type TaskRow = {
  id: string; identifier: string | null; title: string; status_name: string | null; status_category: string;
  due_date: string | null; completed_at: string | null; external_url: string | null; parent_task_id: string | null;
  priority?: number | null; labels?: string[] | null;
  project: { id: string; name: string } | null | { id: string; name: string }[];
  assignee: { id: string; display_name: string } | null | { id: string; display_name: string }[];
};

type Node = Nested<TaskRow> & { isLast: boolean; ancestorsLast: boolean[] };

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

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

function StatusCircle({ category, name }: { category: string; name?: string | null }) {
  const map: Record<string, { b: string; f: string }> = {
    in_progress: { b: "#f2c94c", f: "#f2c94c" },
    done: { b: "#4cb782", f: "#4cb782" },
    canceled: { b: "#95a2b3", f: "transparent" },
    todo: { b: "#c9cdd3", f: "transparent" },
    backlog: { b: "#c9cdd3", f: "transparent" },
  };
  const s = map[category] ?? map.backlog;
  return (
    <span title={name ?? category} className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
      <span className="block h-[11px] w-[11px] rounded-full" style={{ border: `1.5px solid ${s.b}`, background: s.f }} />
    </span>
  );
}

function PriorityBars({ priority }: { priority: number | null | undefined }) {
  const n = Number(priority) || 0;
  if (!n) return <span className="inline-block w-2.5 shrink-0" />;
  const color = n <= 1 ? "#eb5757" : n === 2 ? "#f2994a" : "#f2c94c";
  return (
    <span className="inline-flex h-3 w-2.5 shrink-0 items-end gap-px" title={`Priority ${n}`}>
      {[4, 7, 10].map((h, i) => (
        <span key={i} className="w-[2.5px] rounded-[0.5px]" style={{ height: h, background: i < (n >= 3 ? 3 : n) ? color : "#e6e6e6" }} />
      ))}
    </span>
  );
}

function Chip({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex max-w-[140px] items-center gap-1 truncate rounded-full bg-[#f3f3f3] px-1.5 py-px text-[12px] text-[#3c4149]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      {name}
    </span>
  );
}

function shortDate(ymd: string | null) {
  if (!ymd) return "";
  const d = new Date(ymd.slice(0, 10) + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function TreeLines({ depth, isLast, ancestorsLast }: { depth: number; isLast: boolean; ancestorsLast: boolean[] }) {
  if (depth === 0) return null;
  const col = 14;
  return (
    <span className="relative h-8 shrink-0" style={{ width: depth * col }} aria-hidden>
      {ancestorsLast.map((last, i) =>
        last ? null : <span key={i} className="absolute inset-y-0 w-px bg-[#e2e2e2]" style={{ left: i * col + 8 }} />,
      )}
      <span className="absolute w-px bg-[#e2e2e2]" style={{ left: (depth - 1) * col + 8, top: 0, height: isLast ? 16 : 32 }} />
      <span className="absolute h-px bg-[#e2e2e2]" style={{ left: (depth - 1) * col + 8, top: 16, width: 8 }} />
    </span>
  );
}

export function TaskTable({ tasks, today, showProject = true, title = "Issues" }: {
  tasks: TaskRow[]; today: string; showProject?: boolean; title?: string;
}) {
  const nested = useMemo(() => nestTasks(tasks.filter((t) => t?.id)), [tasks]);
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
    <div>
      <div className="flex h-8 items-center justify-between px-3 text-[13px] text-[var(--muted)]">
        <span>{title} <span className="ml-1">{nested.length}</span></span>
      </div>
      <ul>
        {visible.map((t) => {
          const project = one(t.project);
          const assignee = one(t.assignee);
          const labels = Array.isArray(t.labels) ? t.labels : [];
          const overdue = !!t.due_date && t.due_date < today && (OPEN as readonly string[]).includes(t.status_category);
          const canceled = t.status_category === "canceled";
          const stats = t.children.length ? childStats(t) : null;
          return (
            <li key={t.id} className="flex h-8 items-center pr-3 hover:bg-[#f8f8f8]">
              <TreeLines depth={t.depth} isLast={t.isLast} ancestorsLast={t.ancestorsLast} />
              <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-2">
                {t.children.length ? (
                  <button type="button" className="flex h-4 w-3 items-center justify-center text-[10px] text-[var(--muted)]"
                    aria-label={collapsed[t.id] ? "Expand" : "Collapse"}
                    onClick={() => setCollapsed((s) => ({ ...s, [t.id]: !s[t.id] }))}>
                    <span className={collapsed[t.id] ? "" : "rotate-90"}>▸</span>
                  </button>
                ) : <span className="w-3" />}
                <PriorityBars priority={t.priority} />
                <span className="w-[62px] shrink-0 text-[12px] text-[var(--muted)]">{t.identifier}</span>
                <StatusCircle category={t.status_category} name={t.status_name} />
                {t.external_url ? (
                  <a href={t.external_url} target="_blank" rel="noreferrer" className={`min-w-0 truncate text-[13px] ${canceled ? "text-[var(--muted)] line-through" : "text-[var(--fg)]"}`} style={{ fontVariationSettings: "'wght' 510" }}>
                    {t.title}
                  </a>
                ) : (
                  <span className={`min-w-0 truncate text-[13px] ${canceled ? "text-[var(--muted)] line-through" : ""}`} style={{ fontVariationSettings: "'wght' 510" }}>{t.title}</span>
                )}
                {stats && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f3f3] px-1.5 text-[12px] text-[var(--muted)]">
                    <StatusCircle category={stats.done === stats.total && stats.total ? "done" : "todo"} />
                    {stats.done}/{stats.total}
                  </span>
                )}
              </div>
              <div className="hidden items-center gap-1.5 sm:flex">
                {labels.slice(0, 2).map((l) => <Chip key={l} name={l} color={l.toLowerCase() === "social" ? "#f2c94c" : "#8a8f98"} />)}
                {showProject && project && <Link href={`/projects/${project.id}`}><Chip name={project.name} color="#4cb782" /></Link>}
                <span className={`w-[52px] text-right text-[12px] ${overdue ? "text-[#f2994a]" : "text-[var(--muted)]"}`}>{shortDate(t.due_date)}</span>
                <span title={assignee?.display_name ?? "Unassigned"}
                  className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#e8e8e8] text-[9px] font-medium text-[#3c4149]">
                  {assignee ? initials(assignee.display_name) : "?"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const TASK_SELECT =
  "id, identifier, title, status_name, status_category, due_date, completed_at, external_url, parent_task_id, priority, labels, project:projects!project_id(id,name), assignee:people!assignee_id(id,display_name)";
