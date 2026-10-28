"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { icons } from "./icons";

const NAV = [
  { href: "/", label: "Overview", icon: icons.overview },
  { href: "/projects", label: "Projects", icon: icons.projects },
  { href: "/tasks", label: "Tasks", icon: icons.tasks },
  { href: "/people", label: "People", icon: icons.people },
  { href: "/reports/weekly", label: "Weekly", icon: icons.weekly },
  { href: "/sync", label: "Sync", icon: icons.sync },
  { href: "/settings", label: "Settings", icon: icons.settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto md:flex-col">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
              active ? "bg-indigo-50 font-medium text-indigo-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}>
            <span className={active ? "text-indigo-600" : "text-zinc-400 transition group-hover:text-zinc-600"}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
