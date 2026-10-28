"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { icons } from "./icons";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/tasks", label: "Issues" },
  { href: "/projects", label: "Projects" },
  { href: "/people", label: "People" },
  { href: "/reports/weekly", label: "Weekly" },
  { href: "/sync", label: "Sync" },
  { href: "/settings", label: "Settings" },
];

const ICON: Record<string, React.ReactNode> = {
  "/": icons.overview,
  "/tasks": icons.issues,
  "/projects": icons.projects,
  "/people": icons.people,
  "/reports/weekly": icons.weekly,
  "/sync": icons.sync,
  "/settings": icons.settings,
};

export function Sidebar({ workspace, email, logout }: { workspace: string; email?: string; logout: () => Promise<void> }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col px-3 py-4">
      <div className="mb-6 px-2">
        <p className="text-[15px] font-semibold tracking-tight">Pace</p>
        <p className="mt-0.5 text-[12px] text-[var(--muted)]">{workspace}</p>
      </div>
      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
              className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[14px] ${
                active ? "bg-white text-[var(--fg)] shadow-[0_0_0_1px_var(--line)]" : "text-[var(--muted)] hover:bg-white/70 hover:text-[var(--fg)]"
              }`}>
              <span className={active ? "text-[var(--accent)]" : ""}>{ICON[item.href]}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-[var(--line)] px-2 pt-3">
        <p className="truncate text-[12px] text-[var(--muted)]">{email}</p>
        <form action={logout}>
          <button className="mt-1 text-[12px] text-[var(--muted)] hover:text-[var(--fg)]">Sign out</button>
        </form>
      </div>
    </div>
  );
}
