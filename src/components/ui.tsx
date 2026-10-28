import Link from "next/link";
import { initials } from "@/lib/format";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "", href }: { children: React.ReactNode; className?: string; href?: string }) {
  const base = `rounded-xl border border-[var(--line)] bg-[var(--surface)] ${className}`;
  if (href) return <Link href={href} className={`${base} block p-4 transition hover:border-[#d7d2c8]`}>{children}</Link>;
  return <div className={`${base} p-4`}>{children}</div>;
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-medium text-[var(--muted)]">{children}</h2>
      {aside}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "accent" | "green" | "amber" | "red"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-[#f0eeea] text-[var(--muted)]",
    accent: "bg-[#f4e6de] text-[var(--accent)]",
    green: "bg-[#e7f1eb] text-[var(--ok)]",
    amber: "bg-[#f8efd9] text-[var(--warn)]",
    red: "bg-[#f8e6e4] text-[var(--bad)]",
  };
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

const DOT: Record<string, string> = {
  backlog: "#b0aba3",
  todo: "#c47b22",
  in_progress: "#c47b22",
  done: "#3d7a5a",
  canceled: "#b0aba3",
};

export function StatusDot({ category, name, showLabel = false }: { category: string; name?: string | null; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)]" title={name ?? category}>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: DOT[category] ?? DOT.backlog }} />
      {showLabel && <span>{name ?? category.replace("_", " ")}</span>}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Avatar({ name }: { name: string | null | undefined }) {
  return (
    <span title={name ?? "Unassigned"} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ebe8e2] text-[10px] font-medium text-[var(--fg)]">
      {name ? initials(name) : "?"}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

export const btn = "inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm hover:bg-[#f8f7f4] disabled:opacity-50";
export const btnPrimary = "inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50";
