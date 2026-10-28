import Link from "next/link";
import { initials } from "@/lib/format";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h1 className="text-[15px] font-medium tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "", href }: { children: React.ReactNode; className?: string; href?: string }) {
  const base = `rounded-md border border-[var(--line)] bg-[var(--bg-raised)] ${className}`;
  if (href) {
    return (
      <Link href={href} className={`${base} block p-3.5 transition hover:bg-[#f7f6f1]`}>
        {children}
      </Link>
    );
  }
  return <div className={`${base} p-3.5`}>{children}</div>;
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">{children}</h2>
      {aside}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "accent" | "green" | "amber" | "red"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-[#f0eee6] text-[#3d3d3a]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent-hover)]",
    green: "bg-[#eef3e8] text-[#4e6438]",
    amber: "bg-[#f8efe0] text-[#8a5a22]",
    red: "bg-[#f8e8e4] text-[#a33b2b]",
  };
  return <span className={`inline-flex items-center rounded px-1.5 py-px text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}

/** Linear-style status: a 7px coloured dot, optional label. */
export function StatusDot({ category, name, showLabel = false }: { category: string; name?: string | null; showLabel?: boolean }) {
  const color: Record<string, string> = {
    backlog: "#b0aea5",
    todo: "#e2b203",
    in_progress: "#f2c94c",
    done: "#4cb782",
    canceled: "#95a2b3",
  };
  const fill = color[category] ?? color.backlog;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--muted)]" title={name ?? category}>
      <span className="inline-block h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: fill }} />
      {showLabel && <span>{name ?? category.replace("_", " ")}</span>}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--line)]" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="grow-x h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Avatar({ name }: { name: string | null | undefined }) {
  const hue = name ? [...name].reduce((n, c) => n + c.charCodeAt(0), 0) % 360 : 0;
  return (
    <span title={name ?? "Unassigned"}
      className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-semibold leading-none"
      style={name
        ? { background: `hsl(${hue} 32% 88%)`, color: `hsl(${hue} 28% 28%)` }
        : { background: "transparent", color: "#d97757", border: "1px dashed #d97757" }}>
      {name ? initials(name) : "?"}
    </span>
  );
}

export function PriorityMark({ priority }: { priority: number | null | undefined }) {
  if (!priority) return null;
  const fill = ["", "#eb5757", "#f2994a", "#f2c94c", "#b0aea5"][priority] ?? "#b0aea5";
  return (
    <span title={`Priority ${priority}`} className="inline-flex w-2.5 justify-center" aria-hidden>
      <svg width="8" height="10" viewBox="0 0 8 10"><path d="M1 9V2.2C1 1.4 1.7.8 2.5.8h3C6.3.8 7 1.4 7 2.2V9L4 7.2 1 9z" fill={fill} /></svg>
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-md border border-dashed border-[var(--line)] px-4 py-10 text-center">
      <p className="text-[13px]">{title}</p>
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

export const btn =
  "inline-flex h-7 items-center justify-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg-raised)] px-2.5 text-[12px] font-medium transition hover:bg-[#f0eee6] disabled:opacity-50";
export const btnPrimary =
  "inline-flex h-7 items-center justify-center gap-1.5 rounded-md bg-[var(--accent)] px-2.5 text-[12px] font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50";
