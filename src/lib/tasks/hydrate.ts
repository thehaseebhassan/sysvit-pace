export const TASK_COLUMNS =
  "id, identifier, title, status_name, status_category, due_date, completed_at, external_url, parent_task_id, priority, labels, project_id, assignee_id";

export type TaskRow = {
  id: string;
  identifier: string | null;
  title: string;
  status_name: string | null;
  status_category: string;
  due_date: string | null;
  completed_at: string | null;
  external_url: string | null;
  parent_task_id: string | null;
  priority: number | null;
  labels: string[];
  project: { id: string; name: string } | null;
  assignee: { id: string; display_name: string } | null;
};

type Raw = Omit<TaskRow, "project" | "assignee" | "labels" | "priority"> & {
  project_id: string | null;
  assignee_id: string | null;
  labels: string[] | null;
  priority: number | null;
};

export function hydrateTasks(
  tasks: Raw[] | null,
  projects: { id: string; name: string }[] | null,
  people: { id: string; display_name: string }[] | null,
): TaskRow[] {
  const proj = new Map((projects ?? []).map((p) => [p.id, p]));
  const who = new Map((people ?? []).map((p) => [p.id, p]));
  return (tasks ?? []).filter((t) => t?.id).map((t) => ({
    ...t,
    labels: Array.isArray(t.labels) ? t.labels : [],
    priority: t.priority ?? null,
    project: t.project_id ? proj.get(t.project_id) ?? null : null,
    assignee: t.assignee_id ? who.get(t.assignee_id) ?? null : null,
  }));
}
