"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { nestTasks, type Nested } from "@/lib/tasks/tree";
import type { TaskRow } from "@/lib/tasks/hydrate";
import { Avatar, LabelTag, PriorityIcon, ProjectIcon, StatusIcon } from "./ui";
import { OPEN } from "@/lib/format";
import { projectColor, tint, type UiColors } from "@/lib/colors";
import { addDays } from "@/lib/weeks";

export type { TaskRow };

export type TaskGroup = {
  key: string;
  label: string;
  /** status icon before the label */
  category?: string;
  /** project glyph + tint before the label (name used for the colour) */
  project?: string;
  tasks: TaskRow[];
};

const INDENT = 24; // px per sub-issue level
const BASE = 16; // row padding-left at depth 0
const ELBOW = 14;

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
      <circle cx="7" cy="7" r={r} fill="none" stroke={f === 1 ? "#27a644" : "#6366f1"} strokeWidth="2" strokeDasharray={`${c * f} ${c}`} strokeLinecap="round" />
    </svg>
  );
}

const Cal = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="1.5" y="2.2" width="9" height="8.3" rx="1.6" /><path d="M1.5 5h9M4 1.2v2M8 1.2v2" />
  </svg>
);

/** Linear-style due pill for open issues: red when due today or late, orange tomorrow, grey later. */
function DuePill({ ymd, today }: { ymd: string; today: string }) {
  const d = ymd.slice(0, 10);
  const fmt = new Date(d + "T00:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
  let text = fmt, color = "#62666d";
  if (d < today) { color = "#e5484d"; }
  else if (d === today) { text = "Today"; color = "#e5484d"; }
  else if (d === addDays(today, 1)) { text = "Tomorrow"; color = "#f76b15"; }
  return <span className="pill" style={{ color: color === "#62666d" ? undefined : color }}><Cal color={color} />{text}</span>;
}

const short = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" }) : "";

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-90" : ""}`} aria-hidden>
    <path d="m4.5 2.5 3.5 3.5-3.5 3.5" />
  </svg>
);

type Flat = { node: Nested<TaskRow>; last: boolean[] }; // last[k] = is the ancestor-or-self at depth k+1 the last sibling

function Group({ group, today, showProject, colors }: { group: TaskGroup; today: string; showProject: boolean; colors?: UiColors }) {
  const nested = useMemo(() => nestTasks(group.tasks), [group.tasks]);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [groupClosed, setGroupClosed] = useState(false);

  const rows = useMemo(() => {
    const out: Flat[] = [];
    const walk = (nodes: Nested<TaskRow>[], last: boolean[]) => {
      nodes.forEach((n, i) => {
        const isLast = i === nodes.length - 1;
        const mine = n.depth === 0 ? [] : [...last, isLast];
        out.push({ node: n, last: mine });
        if (n.children.length && !closed[n.id]) walk(n.children, mine);
      });
    };
    walk(nested, []);
    return out;
  }, [nested, closed]);

  const head = group.project ? projectColor(group.project, colors) : null;

  return (
    <section>
      {group.label && (
        <button type="button" onClick={() => setGroupClosed((v) => !v)} aria-expanded={!groupClosed}
          className="group-head" style={{ background: head ? tint(head, 12) : "var(--carbon)" }}>
          <span className="text-[var(--muted)]"><Chevron open={!groupClosed} /></span>
          {group.project && <ProjectIcon name={group.project} colors={colors} />}
          {group.category && <StatusIcon category={group.category} />}
          <span className="truncate">{group.label}</span>
          <span className="tnum text-[12px] font-normal text-[var(--muted)]">{group.tasks.length}</span>
        </button>
      )}
      {!groupClosed && (
        <ul className="py-1">
          {rows.map(({ node: t, last }) => {
            const open = (OPEN as readonly string[]).includes(t.status_category);
            const stats = t.children.length ? childStats(t) : null;
            const canceled = t.status_category === "canceled";
            const shown = t.labels.slice(0, 3);
            const d = t.depth;
            return (
              <li key={t.id} className={`row rounded-[6px] ${t.context ? "opacity-55" : ""}`} title={t.context ? "Shown for context: this parent doesn't match the current filters" : undefined} style={{ paddingLeft: BASE + d * INDENT }}>
                {/* tree guides: a vertical line per ancestor level and an elbow into this row */}
                {last.map((isLast, k) => {
                  const x = 22 + k * INDENT; // centre of the parent's chevron column
                  const mine = k === last.length - 1;
                  return (
                    <span key={k}>
                      {mine ? (
                        <>
                          <span className="guide" style={{ left: x, top: 0, width: 1, height: isLast ? "50%" : "100%" }} />
                          <span className="guide" style={{ left: x, top: "50%", width: ELBOW, height: 1 }} />
                        </>
                      ) : !isLast ? (
                        <span className="guide" style={{ left: x, top: 0, width: 1, height: "100%" }} />
                      ) : null}
                    </span>
                  );
                })}
                {t.children.length ? (
                  <button type="button" aria-label={closed[t.id] ? "Expand sub-issues" : "Collapse sub-issues"} aria-expanded={!closed[t.id]}
                    onClick={() => setClosed((s) => ({ ...s, [t.id]: !s[t.id] }))}
                    className="-ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--faint)] hover:bg-[var(--obsidian)] hover:text-[var(--ink)]">
                    <Chevron open={!closed[t.id]} />
                  </button>
                ) : <span className="-ml-1 w-5 shrink-0" />}
                <PriorityIcon priority={t.priority} />
                <span className="mono w-[62px] shrink-0 truncate text-[12px] text-[var(--muted)]">{t.identifier}</span>
                <StatusIcon category={t.status_category} name={t.status_name} />
                <Link href={`/tasks/${t.id}`} className={`min-w-0 flex-1 truncate text-[13px] hover:underline ${canceled ? "text-[var(--muted)] line-through" : ""} ${t.children.length ? "font-[510]" : ""}`}>
                  {t.title}
                </Link>
                {stats && (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--muted)] tnum" title={`${stats.done} of ${stats.total} sub-issues done`}>
                    <Ring done={stats.done} total={stats.total} />{stats.done}/{stats.total}
                  </span>
                )}
                <span className="hidden shrink-0 items-center gap-1.5 md:flex">
                  {shown.map((l) => <LabelTag key={l} name={l} colors={colors} />)}
                  {t.labels.length > shown.length && <span className="text-[12px] text-[var(--muted)]">+{t.labels.length - shown.length}</span>}
                </span>
                {showProject && t.project && (
                  <Link href={`/projects/${t.project.id}`} className="hidden shrink-0 items-center gap-1.5 text-[12px] text-[var(--muted)] hover:text-[var(--ink)] 2xl:flex">
                    <ProjectIcon name={t.project.name} colors={colors} size={14} /><span className="max-w-[110px] truncate">{t.project.name}</span>
                  </Link>
                )}
                <span className="hidden w-[86px] shrink-0 justify-end sm:flex">{open && t.due_date ? <DuePill ymd={t.due_date} today={today} /> : null}</span>
                <span className="hidden w-[44px] shrink-0 text-right text-[12px] text-[var(--muted)] tnum lg:block">{short(t.source_created_at)}</span>
                <Avatar name={t.assignee?.display_name} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function TaskList({ groups, today, showProject = true, colors }: { groups: TaskGroup[]; today: string; showProject?: boolean; colors?: UiColors }) {
  return (
    <div className="space-y-2">
      {groups.map((g) => <Group key={g.key} group={g} today={today} showProject={showProject} colors={colors} />)}
    </div>
  );
}

export function TaskTable({ tasks, today, showProject = true, colors }: { tasks: TaskRow[]; today: string; showProject?: boolean; colors?: UiColors }) {
  if (!tasks.length) return null;
  return <TaskList groups={[{ key: "all", label: "", tasks }]} today={today} showProject={showProject} colors={colors} />;
}
