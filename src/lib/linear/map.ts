import type { LinearIssue } from "./client";

export type StatusCategory = "backlog" | "todo" | "in_progress" | "done" | "canceled";

/** Linear workflow state types: triage, backlog, unstarted, started, completed, canceled. */
export function categoryFromStateType(type?: string | null): StatusCategory {
  switch (type) {
    case "unstarted": return "todo";
    case "started": return "in_progress";
    case "completed": return "done";
    case "canceled": return "canceled";
    default: return "backlog"; // backlog, triage, unknown
  }
}

export type EventRow = {
  event_type: "created" | "status_changed" | "assignee_changed" | "completed" | "reopened" | "canceled" | "archived" | "imported";
  from_value: string | null;
  to_value: string | null;
  occurred_at: string;
  source_event_key: string;
  origin: "linear_history" | "linear_diff" | "webhook" | "import";
};

/**
 * Derive task_events from an issue's history. Keys are deterministic
 * (history node id + kind) so re-running a sync never duplicates events.
 */
export function deriveEvents(issue: Pick<LinearIssue, "createdAt" | "archivedAt" | "history">): EventRow[] {
  const ev: EventRow[] = [
    { event_type: "created", from_value: null, to_value: null, occurred_at: issue.createdAt, source_event_key: "created", origin: "linear_history" },
  ];
  for (const h of issue.history.nodes) {
    const base = { occurred_at: h.createdAt, origin: "linear_history" as const };
    if (h.fromState && h.toState && h.fromState.id !== h.toState.id) {
      ev.push({ ...base, event_type: "status_changed", from_value: h.fromState.name, to_value: h.toState.name, source_event_key: `${h.id}:status` });
      const wasDone = h.fromState.type === "completed";
      if (h.toState.type === "completed") {
        ev.push({ ...base, event_type: "completed", from_value: h.fromState.name, to_value: h.toState.name, source_event_key: `${h.id}:completed` });
      } else if (h.toState.type === "canceled") {
        ev.push({ ...base, event_type: "canceled", from_value: h.fromState.name, to_value: h.toState.name, source_event_key: `${h.id}:canceled` });
      } else if (wasDone) {
        ev.push({ ...base, event_type: "reopened", from_value: h.fromState.name, to_value: h.toState.name, source_event_key: `${h.id}:reopened` });
      }
    }
    const from = h.fromAssignee?.id ?? null;
    const to = h.toAssignee?.id ?? null;
    if (from !== to) {
      ev.push({ ...base, event_type: "assignee_changed", from_value: h.fromAssignee?.name ?? null, to_value: h.toAssignee?.name ?? null, source_event_key: `${h.id}:assignee` });
    }
  }
  if (issue.archivedAt) {
    ev.push({ event_type: "archived", from_value: null, to_value: null, occurred_at: issue.archivedAt, source_event_key: "archived", origin: "linear_history" });
  }
  return ev;
}

export function projectCategory(type?: string | null) {
  return ["backlog", "planned", "started", "paused", "completed", "canceled"].includes(type ?? "") ? type! : null;
}
