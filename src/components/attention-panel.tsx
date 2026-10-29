"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, StatusIcon } from "./ui";

export type AttentionItem = { id: string; identifier: string | null; title: string; note: string; tone: "red" | "orange" | "muted"; assignee: string | null };
export type AttentionTab = { key: string; label: string; items: AttentionItem[] };

const TONE = { red: "#e5484d", orange: "#f76b15", muted: "#62666d" };

/** Tabbed list: switch between what's overdue, due soon and unassigned without leaving the page. */
export function AttentionPanel({ tabs }: { tabs: AttentionTab[] }) {
  const firstWithItems = tabs.find((t) => t.items.length)?.key ?? tabs[0].key;
  const [active, setActive] = useState(firstWithItems);
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="card overflow-hidden">
      <div role="tablist" aria-label="Needs attention" className="flex items-center gap-1 border-b border-[var(--graphite)] px-2 py-2">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={t.key === active} onClick={() => setActive(t.key)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[13px] transition-colors ${
              t.key === active ? "bg-[var(--obsidian)] font-[510] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[var(--carbon)] hover:text-[var(--ink)]"
            }`}>
            {t.label}
            <span className={`tnum text-[12px] ${t.key === active ? "text-[var(--text-2)]" : "text-[var(--faint)]"}`}>{t.items.length}</span>
          </button>
        ))}
      </div>
      {tab.items.length ? (
        <ul className="max-h-[360px] overflow-auto py-1">
          {tab.items.map((i) => (
            <li key={i.id}>
              <Link href={`/tasks/${i.id}`} className="row !min-h-[40px]">
                <StatusIcon category="todo" />
                <span className="mono w-[62px] shrink-0 truncate text-[12px] text-[var(--muted)]">{i.identifier}</span>
                <span className="min-w-0 flex-1 truncate">{i.title}</span>
                <span className="shrink-0 text-[12px]" style={{ color: TONE[i.tone] }}>{i.note}</span>
                <Avatar name={i.assignee} size={20} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">Nothing here. Nice.</p>
      )}
    </div>
  );
}
