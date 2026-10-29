import Link from "next/link";
import { initials } from "@/lib/format";

export const btn = "btn";
export const btnPrimary = "btn btn-primary";

export function PageHeader({ title, subtitle, actions, back }: {
  title: string; subtitle?: string; actions?: React.ReactNode; back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[13px] text-[var(--muted)] hover:text-[var(--ink)]">← {back.label}</Link>}
        <h1 className="text-[22px] font-[590] leading-tight tracking-[-0.012em]">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-[var(--muted)]">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "", href, flush = false }: { children: React.ReactNode; className?: string; href?: string; flush?: boolean }) {
  const pad = flush ? "" : "p-4";
  if (href) return <Link href={href} className={`card card-link ${pad} ${className}`}>{children}</Link>;
  return <div className={`card ${pad} ${className}`}>{children}</div>;
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="section-title">{children}</h2>
      {aside}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "green" | "red" | "iris" | "lime"; children: React.ReactNode }) {
  const cls = tone === "neutral" ? "" : `badge-${tone}`;
  return <span className={`badge ${cls}`}>{children}</span>;
}

/* ---------- status / priority icons (single-colour line art) ---------- */

const STATUS_COLOR: Record<string, string> = {
  backlog: "#8a8f98", todo: "#62666d", in_progress: "#02b8cc", done: "#27a644", canceled: "#8a8f98",
};
export const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog", todo: "Todo", in_progress: "In progress", done: "Done", canceled: "Canceled",
};

export function StatusIcon({ category, name, size = 14 }: { category: string; name?: string | null; size?: number }) {
  const c = STATUS_COLOR[category] ?? STATUS_COLOR.backlog;
  const common = { width: size, height: size, viewBox: "0 0 14 14", fill: "none", "aria-label": name ?? STATUS_LABEL[category] ?? category, role: "img" as const, className: "shrink-0" };
  switch (category) {
    case "done":
      return <svg {...common}><circle cx="7" cy="7" r="6" fill={c} /><path d="m4.3 7.2 1.9 1.9 3.5-3.9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "canceled":
      return <svg {...common}><circle cx="7" cy="7" r="6" stroke={c} strokeWidth="1.5" /><path d="m5 5 4 4M9 5 5 9" stroke={c} strokeWidth="1.4" strokeLinecap="round" /></svg>;
    case "in_progress":
      return <svg {...common}><circle cx="7" cy="7" r="6" stroke={c} strokeWidth="1.5" /><path d="M7 3.5a3.5 3.5 0 0 1 0 7z" fill={c} /></svg>;
    case "todo":
      return <svg {...common}><circle cx="7" cy="7" r="6" stroke={c} strokeWidth="1.5" /></svg>;
    default:
      return <svg {...common}><circle cx="7" cy="7" r="6" stroke={c} strokeWidth="1.5" strokeDasharray="2.2 2" /></svg>;
  }
}

/** Linear scale: 0 none, 1 urgent, 2 high, 3 medium, 4 low. */
export const PRIORITY_LABEL: Record<number, string> = { 0: "No priority", 1: "Urgent", 2: "High", 3: "Medium", 4: "Low" };

export function PriorityIcon({ priority, size = 14 }: { priority: number | null | undefined; size?: number }) {
  const p = priority ?? 0;
  const label = PRIORITY_LABEL[p] ?? "No priority";
  if (p === 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" role="img" aria-label={label} className="shrink-0">
        <rect x="1" y="1" width="12" height="12" rx="3" fill="#eb5757" />
        <path d="M7 4v3.6M7 9.6v.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (p === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" role="img" aria-label={label} className="shrink-0">
        <path d="M2 7h2.5M5.75 7h2.5M9.5 7H12" stroke="#b6bac1" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  const lit = p === 2 ? 3 : p === 3 ? 2 : 1;
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" role="img" aria-label={label} className="shrink-0">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={2 + i * 4} y={9 - i * 3} width="2.4" height={3 + i * 3} rx="0.8" fill={i < lit ? "#3b3f45" : "#d3d6db"} />
      ))}
    </svg>
  );
}

/* ---------- labels ---------- */

const LABEL_COLORS = ["#6366f1", "#8b5cf6", "#02b8cc", "#27a644", "#eb5757"];
export function labelColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return LABEL_COLORS[h % LABEL_COLORS.length];
}

export function LabelTag({ name }: { name: string }) {
  return <span className="tag"><i style={{ background: labelColor(name) }} />{name}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${v}%` }} />
    </div>
  );
}

export function Avatar({ name, size = 22 }: { name: string | null | undefined; size?: number }) {
  return (
    <span
      title={name ?? "Unassigned"}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border text-[var(--text-2)] ${
        name ? "border-[var(--graphite)] bg-[var(--obsidian)] font-[510]" : "border-dashed border-[var(--smoke)] text-[var(--faint)]"
      }`}
    >
      {name ? initials(name) : ""}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--smoke)] px-4 py-14 text-center">
      <p className="text-[14px] font-[510]">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-[var(--muted)]">{hint}</p>}
    </div>
  );
}
