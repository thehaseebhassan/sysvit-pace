import Link from "next/link";
import { initials } from "@/lib/format";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex h-10 items-center justify-between px-3">
      <div>
        <h1 className="text-[15px] font-medium" style={{ fontVariationSettings: "'wght' 510" }}>{title}</h1>
        {subtitle && <p className="text-[12px] text-[var(--muted)]">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "", href }: { children: React.ReactNode; className?: string; href?: string }) {
  const base = `rounded-md ${className}`;
  if (href) return <Link href={href} className={`${base} block px-3 py-2 hover:bg-[var(--bg-hover)]`}>{children}</Link>;
  return <div className={`${base} px-3 py-2`}>{children}</div>;
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-1 flex h-8 items-center justify-between px-3">
      <h2 className="text-[13px] text-[var(--muted)]">{children}</h2>
      {aside}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "accent" | "green" | "amber" | "red"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-[#f3f3f3] text-[#3c4149]",
    accent: "bg-[#eef0fb] text-[#5e6ad2]",
    green: "bg-[#eef8f3] text-[#2f7d56]",
    amber: "bg-[#fdf6e8] text-[#8a5a22]",
    red: "bg-[#fdeeee] text-[#c0392b]",
  };
  return <span className={`inline-flex items-center rounded px-1.5 text-[11px] ${tones[tone]}`}>{children}</span>;
}

export function StatusDot({ category, name, showLabel = false }: { category: string; name?: string | null; showLabel?: boolean }) {
  const color: Record<string, string> = {
    backlog: "#c9cdd3", todo: "#e2b203", in_progress: "#f2c94c", done: "#4cb782", canceled: "#95a2b3",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--muted)]" title={name ?? category}>
      <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: color[category] ?? color.backlog }} />
      {showLabel && <span>{name ?? category.replace("_", " ")}</span>}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#ececec]" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="grow-x h-full bg-[var(--accent)]" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Avatar({ name }: { name: string | null | undefined }) {
  return (
    <span title={name ?? "Unassigned"} className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#e8e8e8] text-[9px] font-medium text-[#3c4149]">
      {name ? initials(name) : "?"}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-3 py-12 text-center">
      <p className="text-[13px]">{title}</p>
      {hint && <p className="mt-1 text-[12px] text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

export const btn = "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] hover:bg-[var(--bg-hover)] disabled:opacity-50";
export const btnPrimary = "inline-flex h-7 items-center gap-1.5 rounded-md bg-[var(--accent)] px-2.5 text-[13px] text-white hover:opacity-90 disabled:opacity-50";
