"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { nestTasks, type Nested } from "@/lib/tasks/tree";
import type { TaskRow } from "@/lib/tasks/hydrate";
import { Avatar, StatusDot } from "./ui";
import { OPEN } from "@/lib/format";

export type { TaskRow };
export { TASK_COLUMNS as TASK_SELECT } from "@/lib/tasks/hydrate";

function childStats(n: Nested<TaskRow>) {
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

function dueLabel(ymd: string | null, today: string, open: boolean) {
  if (!ymd) return { text: "—", cls: "text-[var(--muted)]" };
  const text = new Date(ymd.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
  if (open && ymd < today) return { text, cls: "text-[var(--bad)]" };
  return { text, cls: "text-[var(--muted)]" };
}

export function TaskTable({ tasks, today, showProject = true }: { tasks: TaskRow[]; today: string; showProject?: boolean; title?: string }) {
  const nested = useMemo(() => nestTasks(tasks), [tasks]);
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    const out: Nested<TaskRow>[] = [];
    const walk = (nodes: Nested<TaskRow>[]) => {
      for (const n of nodes) {
        out.push(n);
        if (n.children.length && !closed[n.id]) walk(n.children);
      }
    };
    walk(nested);
    return out;
  }, [nested, closed]);

  if (!tasks.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="grid grid-cols-[minmax(0,1fr)_110px_88px_40px] gap-2 border-b border-[var(--line)] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        <span>Issue</span>
        <span>Status</span>
        <span>Due</span>
        <span />
      </div>
      <ul>
        {rows.map((t) => {
          const open = (OPEN as readonly string[]).includes(t.status_category);
          const due = dueLabel(t.due_date, today, open);
          const stats = t.children.length ? childStats(t) : null;
          return (
            <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_110px_88px_40px] items-center gap-2 border-b border-[var(--line)] px-3 py-2.5 last:border-b-0 hover:bg-[#faf9f6]">
              <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: t.depth * 20 }}>
                {t.children.length ? (
                  <button type="button" className="flex h-5 w-5 items-center justify-center rounded text-[var(--muted)] hover:bg-[#eeeae4]"
                    aria-expanded={!closed[t.id]} onClick={() => setClosed((s) => ({ ...s, [t.id]: !s[t.id] }))}>
                    <span className={`text-[10px] ${closed[t.id] ? "" : "rotate-90"}`}>▸</span>
                  </button>
                ) : <span className="w-5 shrink-0" />}
                <StatusDot category={t.status_category} name={t.status_name} />
                <span className="w-14 shrink-0 font-mono text-xs text-[var(--muted)]">{t.identifier}</span>
                {t.external_url ? (
                  <a href={t.external_url} target="_blank" rel="noreferrer" className={`min-w-0 truncate text-sm hover:underline ${t.status_category === "canceled" ? "text-[var(--muted)] line-through" : ""}`}>{t.title}</a>
                ) : (
                  <span className={`min-w-0 truncate text-sm ${t.status_category === "canceled" ? "text-[var(--muted)] line-through" : ""}`}>{t.title}</span>
                )}
                {stats && <span className="shrink-0 text-xs text-[var(--muted)]">{stats.done}/{stats.total}</span>}
                {showProject && t.project && (
                  <Link href={`/projects/${t.project.id}`} className="hidden max-w-[140px] truncate text-xs text-[var(--muted)] hover:text-[var(--fg)] lg:inline">{t.project.name}</Link>
                )}
              </div>
              <StatusDot category={t.status_category} name={t.status_name} showLabel />
              <span className={`text-sm ${due.cls}`}>{due.text}</span>
              <Avatar name={t.assignee?.display_name} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
