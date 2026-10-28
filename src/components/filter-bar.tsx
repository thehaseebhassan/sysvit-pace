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
  const sel = "rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition ${on ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`;

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or ID…" aria-label="Search tasks"
          className={`${sel} w-full sm:w-64`} />
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
