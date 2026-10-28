"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { icons } from "./icons";

const MAIN = [
  { href: "/", label: "Overview", icon: icons.overview },
  { href: "/tasks", label: "Issues", icon: icons.issues },
  { href: "/projects", label: "Projects", icon: icons.projects },
  { href: "/people", label: "People", icon: icons.people },
  { href: "/reports/weekly", label: "Weekly", icon: icons.weekly },
];
const BOTTOM = [
  { href: "/sync", label: "Sync", icon: icons.sync },
  { href: "/settings", label: "Settings", icon: icons.settings },
];

function Item({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className={`flex h-7 items-center gap-2 rounded-md px-2 text-[13px] ${
        active ? "bg-[var(--bg-active)] text-[var(--fg)]" : "text-[#3c4149] hover:bg-[var(--bg-hover)]"
      }`}>
      <span className={active ? "text-[var(--fg)]" : "text-[#8a8f98]"}>{icon}</span>
      {label}
    </Link>
  );
}

export function Sidebar({ workspace }: { workspace: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 items-center gap-2 px-3">
        <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[4px] bg-[var(--accent)] text-[10px] font-medium text-white">S</span>
        <span className="truncate text-[13px] font-medium" style={{ fontVariationSettings: "'wght' 510" }}>{workspace}</span>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-px px-2">
        {MAIN.map((i) => <Item key={i.href} {...i} />)}
        <div className="my-2 h-px bg-[var(--line)]" />
        {BOTTOM.map((i) => <Item key={i.href} {...i} />)}
      </nav>
    </div>
  );
}
