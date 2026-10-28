import type { StatusCategory } from "@/lib/linear/map";

const PRIORITY: Record<string, number> = { "no priority": 0, none: 0, urgent: 1, high: 2, medium: 3, low: 4 };

export type ImportedTask = {
  identifier: string;
  title: string;
  parentIdentifier: string | null;
  parentTitle: string | null;
  project: string | null;
  team: string | null;
  assignee: string | null;
  labels: string[];
  priority: number | null;
  status_name: string;
  status_category: StatusCategory;
  closed_at: string | null;
  created_at: string | null;
  due_date: string | null;
  url: string | null;
};

const iso = (v?: string) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** Map one row of the closed-issues CSV export to a task. Returns null if unusable. */
export function mapCsvRow(r: Record<string, string>): ImportedTask | null {
  if (!r.id || !r.title) return null;
  const closedType = (r.closed_type ?? "").toLowerCase();
  const status = (r.status ?? "").toLowerCase();
  const category: StatusCategory =
    closedType === "canceled" || status === "canceled" || status === "cancelled" ? "canceled"
    : closedType === "completed" || status === "done" ? "done"
    : "done"; // the export is a log of closed issues
  const closedAt = iso(r.closed_at);
  return {
    identifier: r.id,
    title: r.title,
    parentIdentifier: r.parent_id || null,
    parentTitle: r.parent_title || null,
    project: r.project || null,
    team: r.team || null,
    assignee: r.assignee || null,
    labels: (r.labels ?? "").split(";").map((s) => s.trim()).filter(Boolean),
    priority: r.priority ? (PRIORITY[r.priority.toLowerCase()] ?? null) : null,
    status_name: r.status || (category === "canceled" ? "Canceled" : "Done"),
    status_category: category,
    closed_at: closedAt,
    created_at: iso(r.created_at),
    due_date: /^\d{4}-\d{2}-\d{2}$/.test(r.due_date ?? "") ? r.due_date : null,
    url: r.url || null,
  };
}
