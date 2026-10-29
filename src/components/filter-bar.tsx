"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STATUSES = [
  { v: "", l: "All" }, { v: "open", l: "Open" }, { v: "in_progress", l: "In progress" },
  { v: "done", l: "Done" }, { v: "canceled", l: "Canceled" },
];
const GROUPS = [{ v: "project", l: "Group: Project" }, { v: "status", l: "Group: Status" }, { v: "none", l: "No grouping" }];

export function FilterBar({ projects, people, labels }: {
  projects: { id: string; name: string }[];
  people: { id: string; display_name: string }[];
  labels: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v); else next.delete(k);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (q === (sp.get("q") ?? "")) return;
    const t = setTimeout(() => set("q", q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const status = sp.get("status") ?? "";
  const active = ["status", "project", "assignee", "label", "flag", "q"].some((k) => sp.get(k));

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Status" className="mr-1 inline-flex rounded-[6px] border border-[var(--graphite)] p-0.5">
          {STATUSES.map((s) => (
            <button key={s.v} type="button" onClick={() => set("status", s.v)} aria-pressed={status === s.v}
              className={`h-7 rounded-[4px] px-2.5 text-[13px] ${status === s.v ? "bg-[var(--ink)] font-[510] text-white" : "text-[var(--muted)] hover:bg-[var(--obsidian)] hover:text-[var(--ink)]"}`}>
              {s.l}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search issues…" aria-label="Search issues" className="input w-52" />
        <select aria-label="Project" className="select" value={sp.get("project") ?? ""} onChange={(e) => set("project", e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select aria-label="Assignee" className="select" value={sp.get("assignee") ?? ""} onChange={(e) => set("assignee", e.target.value)}>
          <option value="">Anyone</option>
          <option value="none">Unassigned</option>
          {people.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </select>
        <select aria-label="Label" className="select" value={sp.get("label") ?? ""} onChange={(e) => set("label", e.target.value)}>
          <option value="">All labels</option>
          {labels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      <label className="flex h-8 items-center gap-2 px-1 text-[13px] text-[var(--muted)]">
        <input type="checkbox" checked={sp.get("flag") === "overdue"} onChange={(e) => set("flag", e.target.checked ? "overdue" : "")} className="h-3.5 w-3.5 accent-[var(--ink)]" />
        Overdue only
      </label>
        <select aria-label="Grouping" className="select ml-auto" value={sp.get("group") ?? "project"} onChange={(e) => set("group", e.target.value === "project" ? "" : e.target.value)}>
          {GROUPS.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
        </select>
        {active && (
          <button type="button" className="btn" onClick={() => { setQ(""); router.replace(`${pathname}${sp.get("group") ? `?group=${sp.get("group")}` : ""}`, { scroll: false }); }}>Clear</button>
        )}
      </div>
    </div>
  );
}
