"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STATUSES = [
  { v: "", l: "All" }, { v: "open", l: "Open" }, { v: "in_progress", l: "In progress" },
  { v: "done", l: "Done" }, { v: "canceled", l: "Canceled" },
];

export function FilterBar({ projects, people }: { projects: { id: string; name: string }[]; people: { id: string; display_name: string }[] }) {
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
  const flag = sp.get("flag") ?? "";
  const sel = "h-7 rounded-md border border-[var(--line)] bg-[var(--bg-raised)] px-2 text-[12px] outline-none focus:border-[var(--accent)]";
  const chip = (on: boolean) =>
    `h-7 rounded-md px-2 text-[12px] transition ${on ? "bg-[#e8e6dc] text-[var(--fg)]" : "text-[var(--muted)] hover:bg-[#f0eee6]"}`;

  return (
    <div className="mb-3 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter issues…" aria-label="Search tasks"
          className={`${sel} w-full sm:w-56`} />
        <select aria-label="Project" className={sel} value={sp.get("project") ?? ""} onChange={(e) => set("project", e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select aria-label="Assignee" className={sel} value={sp.get("assignee") ?? ""} onChange={(e) => set("assignee", e.target.value)}>
          <option value="">Everyone</option>
          <option value="none">Unassigned</option>
          {people.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button key={s.v} className={chip(status === s.v && !flag)} onClick={() => { const n = new URLSearchParams(sp.toString()); n.delete("flag"); if (s.v) n.set("status", s.v); else n.delete("status"); router.replace(`${pathname}?${n.toString()}`, { scroll: false }); }}>
            {s.l}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-zinc-200" />
        <button className={chip(flag === "overdue")} onClick={() => set("flag", flag === "overdue" ? "" : "overdue")}>Overdue</button>
        {(sp.toString() !== "") && (
          <button className="ml-auto text-sm text-zinc-500 hover:text-zinc-800" onClick={() => { setQ(""); router.replace(pathname, { scroll: false }); }}>Clear</button>
        )}
      </div>
    </div>
  );
}
