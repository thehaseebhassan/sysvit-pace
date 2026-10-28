"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STATUSES = [
  { v: "", l: "All" }, { v: "open", l: "Active" }, { v: "in_progress", l: "In progress" },
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
  const sel = "h-7 rounded-md bg-transparent px-2 text-[13px] text-[var(--fg)] outline-none hover:bg-[var(--bg-hover)]";
  const chip = (on: boolean) => `h-7 rounded-md px-2 text-[13px] ${on ? "bg-[var(--bg-active)]" : "text-[var(--muted)] hover:bg-[var(--bg-hover)]"}`;

  return (
    <div className="mb-1 flex flex-wrap items-center gap-1">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" aria-label="Search issues" className={`${sel} w-40`} />
      <select aria-label="Project" className={sel} value={sp.get("project") ?? ""} onChange={(e) => set("project", e.target.value)}>
        <option value="">Project</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select aria-label="Assignee" className={sel} value={sp.get("assignee") ?? ""} onChange={(e) => set("assignee", e.target.value)}>
        <option value="">Assignee</option>
        <option value="none">Unassigned</option>
        {people.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
      </select>
      {STATUSES.map((s) => (
        <button key={s.v} className={chip(status === s.v && !flag)} onClick={() => { const n = new URLSearchParams(sp.toString()); n.delete("flag"); if (s.v) n.set("status", s.v); else n.delete("status"); router.replace(`${pathname}?${n.toString()}`, { scroll: false }); }}>
          {s.l}
        </button>
      ))}
      <button className={chip(flag === "overdue")} onClick={() => set("flag", flag === "overdue" ? "" : "overdue")}>Overdue</button>
    </div>
  );
}
