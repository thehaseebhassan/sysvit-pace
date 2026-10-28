import Link from "next/link";
import { initials } from "@/lib/format";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="fade-up mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "", href }: { children: React.ReactNode; className?: string; href?: string }) {
  const base = `rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.03)] ${className}`;
  if (href) {
    return (
      <Link href={href} className={`${base} block transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md`}>
        {children}
      </Link>
    );
  }
  return <div className={base}>{children}</div>;
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-medium text-zinc-500">{children}</h2>
      {aside}
    </div>
  );
}

const TONES = {
  neutral: "bg-zinc-100 text-zinc-600",
  indigo: "bg-indigo-50 text-indigo-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  sky: "bg-sky-50 text-sky-700",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}

const STATUS: Record<string, { tone: keyof typeof TONES; dot: string }> = {
  backlog: { tone: "neutral", dot: "bg-zinc-400" },
  todo: { tone: "sky", dot: "bg-sky-500" },
  in_progress: { tone: "amber", dot: "bg-amber-500" },
  done: { tone: "emerald", dot: "bg-emerald-500" },
  canceled: { tone: "neutral", dot: "bg-zinc-300" },
};

export function StatusBadge({ category, name }: { category: string; name?: string | null }) {
  const s = STATUS[category] ?? STATUS.backlog;
  return (
    <Badge tone={s.tone}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {name ?? category.replace("_", " ")}
    </Badge>
  );
}

export function ProgressBar({ value, tone = "indigo" }: { value: number; tone?: "indigo" | "emerald" }) {
  const color = tone === "emerald" ? "bg-emerald-500" : "bg-indigo-500";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`grow-x h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Avatar({ name }: { name: string | null | undefined }) {
  return (
    <span title={name ?? "Unassigned"}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${name ? "bg-indigo-100 text-indigo-700" : "border border-dashed border-amber-400 text-amber-600"}`}>
      {name ? initials(name) : "–"}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-zinc-500">{hint}</p>}
    </div>
  );
}

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[.98] disabled:opacity-50";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 active:scale-[.98] disabled:opacity-50";
