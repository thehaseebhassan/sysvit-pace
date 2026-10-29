"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { icons } from "./icons";
import { Avatar, ProjectIcon } from "./ui";
import type { UiColors } from "@/lib/colors";

const WORK = [
  { href: "/", label: "Overview", icon: icons.overview },
  { href: "/tasks", label: "Issues", icon: icons.issues },
  { href: "/projects", label: "Projects", icon: icons.projects },
  { href: "/people", label: "People", icon: icons.people },
  { href: "/reports/weekly", label: "Weekly", icon: icons.weekly },
];
const ADMIN = [
  { href: "/sync", label: "Sync", icon: icons.sync },
  { href: "/settings", label: "Settings", icon: icons.settings },
];

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

function Mark() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[var(--ink)] text-[13px] font-[590] text-white" aria-hidden>P</span>
  );
}

export function Sidebar({ workspace, email, logout, projects, colors }: {
  workspace: string; email?: string; logout: () => Promise<void>; projects: { id: string; name: string }[]; colors: UiColors;
}) {
  const pathname = usePathname();
  const link = (item: (typeof WORK)[number]) => (
    <Link key={item.href} href={item.href} className="nav-item" aria-current={isActive(pathname, item.href) ? "page" : undefined}>
      {item.icon}
      {item.label}
    </Link>
  );
  return (
    <div className="flex h-full flex-col px-3 py-3">
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <Mark />
        <div className="min-w-0 leading-tight">
          <p className="text-[14px] font-[590] tracking-[-0.013em]">Pace</p>
          <p className="truncate text-[12px] text-[var(--muted)]">{workspace}</p>
        </div>
      </div>
      <nav aria-label="Main" className="mt-4 flex flex-col gap-0.5">
        {WORK.map(link)}
        <p className="nav-label">Admin</p>
        {ADMIN.map(link)}
      </nav>
      {projects.length > 0 && (
        <nav aria-label="Projects" className="mt-1 min-h-0 flex-1 overflow-y-auto">
          <p className="nav-label">Projects</p>
          <div className="flex flex-col gap-0.5">
            {projects.map((p) => {
              const href = `/projects/${p.id}`;
              return (
                <Link key={p.id} href={href} className="nav-item" aria-current={pathname === href ? "page" : undefined}>
                  <ProjectIcon name={p.name} colors={colors} />
                  <span className="truncate">{p.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      <div className="mt-2 flex items-center gap-2 border-t border-[var(--graphite)] px-2 pt-3">
        <Avatar name={email ?? "?"} size={24} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] text-[var(--text-2)]">{email}</p>
          <form action={logout}>
            <button className="text-[12px] text-[var(--muted)] hover:text-[var(--ink)]">Sign out</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function MobileNav({ logout }: { logout: () => Promise<void> }) {
  const pathname = usePathname();
  return (
    <header className="border-b border-[var(--graphite)] bg-[var(--shell)] md:hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="flex items-center gap-2 text-[14px] font-[590]"><Mark />Pace</span>
        <form action={logout}><button className="text-[13px] text-[var(--muted)]">Sign out</button></form>
      </div>
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-2">
        {[...WORK, ...ADMIN].map((item) => (
          <Link key={item.href} href={item.href} className="nav-item shrink-0" aria-current={isActive(pathname, item.href) ? "page" : undefined}>
            {item.icon}{item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
