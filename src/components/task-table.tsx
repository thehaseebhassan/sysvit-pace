"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { nestTasks, type Nested } from "@/lib/tasks/tree";
import type { TaskRow } from "@/lib/tasks/hydrate";
import { Avatar, LabelTag, PriorityIcon, StatusIcon } from "./ui";
import { OPEN } from "@/lib/format";

export type { TaskRow };

export type TaskGroup = {
  key: string;
  label: string;
  /** shown before the label: a status icon, or nothing */
  category?: string;
  tasks: TaskRow[];
};

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

function Ring({ done, total }: { done: number; total: number }) {
  const r = 5, c = 2 * Math.PI * r, f = total ? done / total : 0;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0 -rotate-90">
      <circle cx="7" cy="7" r={r} fill="none" stroke="#e6e8eb" strokeWidth="2" />
      <circle cx="7" cy="7" r={r} fill="none" stroke={f === 1 ? "#27a644" : "#08090a"} strokeWidth="2" strokeDasharray={`${c * f} ${c}`} strokeLinecap="round" />
    </svg>
  );
}

function due(ymd: string | null, today: string, open: boolean) {
  if (!ymd) return null;
  const text = new Date(ymd.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
  return { text, late: open && ymd < today };
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-90" : ""}`} aria-hidden>
    <path d="m4.5 2.5 3.5 3.5-3.5 3.5" />
  </svg>
);

function Group({ group, today, showProject }: { group: TaskGroup; today: string; showProject: boolean }) {
  const nested = useMemo(() => nestTasks(group.tasks), [group.tasks]);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [groupClosed, setGroupClosed] = useState(false);

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

  return (
    <section>
      {group.label && (
        <button type="button" onClick={() => setGroupClosed((v) => !v)} aria-expanded={!groupClosed}
          className="group-head w-full text-left">
          <span className="text-[var(--faint)]"><Chevron open={!groupClosed} /></span>
          {group.category && <StatusIcon category={group.category} />}
          <span className="truncate">{group.label}</span>
          <span className="tnum text-[12px] font-normal text-[var(--muted)]">{group.tasks.length}</span>
        </button>
      )}
      {!groupClosed && (
        <ul>
          {rows.map((t) => {
            const open = (OPEN as readonly string[]).includes(t.status_category);
            const d = due(t.due_date, today, open);
            const stats = t.children.length ? childStats(t) : null;
            const canceled = t.status_category === "canceled";
            const shown = t.labels.slice(0, 2);
            return (
              <li key={t.id} className="row border-b border-[var(--graphite)] last:border-b-0" style={{ paddingLeft: 16 + t.depth * 24 }}>
                {t.children.length ? (
                  <button type="button" aria-label={closed[t.id] ? "Expand sub-issues" : "Collapse sub-issues"} aria-expanded={!closed[t.id]}
                    onClick={() => setClosed((s) => ({ ...s, [t.id]: !s[t.id] }))}
                    className="-ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--muted)] hover:bg-[var(--obsidian)] hover:text-[var(--ink)]">
                    <Chevron open={!closed[t.id]} />
                  </button>
                ) : <span className="-ml-1 w-5 shrink-0" />}
                <PriorityIcon priority={t.priority} />
                <span className="mono w-[60px] shrink-0 truncate text-[12px] text-[var(--muted)]">{t.identifier}</span>
                <StatusIcon category={t.status_category} name={t.status_name} />
                <Link href={`/tasks/${t.id}`} className={`min-w-0 flex-1 truncate text-[13px] hover:underline ${canceled ? "text-[var(--muted)] line-through" : ""} ${t.depth === 0 && t.children.length ? "font-[510]" : ""}`}>
                  {t.title}
                </Link>
                {stats && (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--muted)] tnum" title={`${stats.done} of ${stats.total} sub-issues done`}>
                    <Ring done={stats.done} total={stats.total} />{stats.done}/{stats.total}
                  </span>
                )}
                {shown.length > 0 && (
                  <span className="hidden shrink-0 items-center gap-1 md:flex">
                    {shown.map((l) => <LabelTag key={l} name={l} />)}
                    {t.labels.length > shown.length && <span className="text-[12px] text-[var(--muted)]">+{t.labels.length - shown.length}</span>}
                  </span>
                )}
                {showProject && (
                  <span className="hidden w-[120px] shrink-0 truncate text-[12px] text-[var(--muted)] xl:block">
                    {t.project ? <Link href={`/projects/${t.project.id}`} className="hover:text-[var(--ink)]">{t.project.name}</Link> : ""}
                  </span>
                )}
                <span className={`hidden w-[48px] shrink-0 text-right text-[12px] tnum sm:block ${d?.late ? "text-[#c23a3a]" : "text-[var(--muted)]"}`}>{d?.text ?? ""}</span>
                <Avatar name={t.assignee?.display_name} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function TaskList({ groups, today, showProject = true }: { groups: TaskGroup[]; today: string; showProject?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--graphite)] bg-[var(--canvas)]">
      {groups.map((g, i) => (
        <div key={g.key} className={i > 0 ? "border-t border-[var(--graphite)]" : ""}>
          <Group group={g} today={today} showProject={showProject} />
        </div>
      ))}
    </div>
  );
}

export function TaskTable({ tasks, today, showProject = true }: { tasks: TaskRow[]; today: string; showProject?: boolean }) {
  if (!tasks.length) return null;
  return <TaskList groups={[{ key: "all", label: "", tasks }]} today={today} showProject={showProject} />;
}
