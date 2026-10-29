import Link from "next/link";
import { initials } from "@/lib/format";
import { labelColor, projectColor, type UiColors } from "@/lib/colors";

export const btn = "btn";
export const btnPrimary = "btn btn-primary";

/** Top bar of the white panel: breadcrumb-style title on the left, actions on the right. */
export function PageHeader({ title, subtitle, actions, back }: {
  title: string; subtitle?: string; actions?: React.ReactNode; back?: { href: string; label: string };
}) {
  return (
    <div className="topbar">
      <div className="flex min-w-0 items-center gap-2 text-[14px]">
        {back && (<>
          <Link href={back.href} className="text-[var(--muted)] hover:text-[var(--ink)]">{back.label}</Link>
          <span className="text-[var(--faint)]">/</span>
        </>)}
        <h1 className="min-w-0 truncate font-[510]">{title}</h1>
        {subtitle && <span className="hidden shrink-0 text-[13px] text-[var(--muted)] sm:inline">{subtitle}</span>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Padded page content under the top bar. `narrow` centres it for dashboards and forms. */
export function Body({ children, narrow = false, className = "" }: { children: React.ReactNode; narrow?: boolean; className?: string }) {
  return <div className={`px-5 py-5 md:px-6 ${narrow ? "mx-auto max-w-[1040px]" : ""} ${className}`}>{children}</div>;
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

/* ---------- labels, projects, people ---------- */

export function LabelTag({ name, colors }: { name: string; colors?: UiColors }) {
  return <span className="pill"><i className="block h-[7px] w-[7px] rounded-full" style={{ background: labelColor(name, colors) }} />{name}</span>;
}

/** Cube in the project's colour (Linear-style project glyph). */
export function ProjectIcon({ name, colors, size = 16 }: { name: string; colors?: UiColors; size?: number }) {
  const c = projectColor(name, colors);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d="m8 1.8 5.5 3.1v6.2L8 14.2l-5.5-3.1V4.9z" />
      <path d="M2.7 5 8 8l5.3-3M8 8v6" />
    </svg>
  );
}

/** Small completion ring: replaces long progress bars. */
export function ProgressRing({ value, size = 18 }: { value: number; size?: number }) {
  const v = Math.min(100, Math.max(0, value));
  const r = size / 2 - 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(v)}% done`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e6e8eb" strokeWidth="2" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={v >= 100 ? "#27a644" : "#08090a"} strokeWidth="2" strokeLinecap="round" strokeDasharray={`${(c * v) / 100} ${c}`} />
    </svg>
  );
}

const AVATAR = ["#0f9ea8", "#4ea7fc", "#bb87fc", "#f76b15", "#e5484d", "#27a644", "#6366f1", "#d6a200"];
export function Avatar({ name, size = 22 }: { name: string | null | undefined; size?: number }) {
  if (!name) {
    return <span title="Unassigned" style={{ width: size, height: size }} className="inline-flex shrink-0 rounded-full border border-dashed border-[var(--smoke)]" />;
  }
  return (
    <span title={name} style={{ width: size, height: size, fontSize: size * 0.4, background: AVATAR[fallbackIndex(name)] }}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-[510] text-white">
      {initials(name)}
    </span>
  );
}
const fallbackIndex = (name: string) => { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return h % AVATAR.length; };

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--smoke)] px-4 py-14 text-center">
      <p className="text-[14px] font-[510]">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-[var(--muted)]">{hint}</p>}
    </div>
  );
}
