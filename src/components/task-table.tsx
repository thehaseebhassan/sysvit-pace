import Link from "next/link";
import { Avatar, StatusBadge } from "./ui";
import { fmtDate, OPEN } from "@/lib/format";

export type TaskRow = {
  id: string; identifier: string | null; title: string; status_name: string | null; status_category: string;
  due_date: string | null; completed_at: string | null; external_url: string | null;
  project: { id: string; name: string } | null; assignee: { id: string; display_name: string } | null;
};

export function TaskTable({ tasks, today, showProject = true }: { tasks: TaskRow[]; today: string; showProject?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)]">
      <ul className="divide-y divide-zinc-100">
        {tasks.map((t) => {
          const overdue = !!t.due_date && t.due_date < today && (OPEN as readonly string[]).includes(t.status_category);
          return (
            <li key={t.id} className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-zinc-50">
              <Avatar name={t.assignee?.display_name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {t.external_url ? (
                    <a href={t.external_url} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline">{t.title}</a>
                  ) : t.title}
                </p>
                <p className="truncate text-xs text-zinc-400">
                  {t.identifier}
                  {showProject && t.project && <> · <Link href={`/projects/${t.project.id}`} className="hover:text-zinc-700">{t.project.name}</Link></>}
                  {!t.assignee && (OPEN as readonly string[]).includes(t.status_category) && <span className="ml-1 text-amber-600">· unassigned</span>}
                </p>
              </div>
              {overdue && <span className="text-xs font-medium text-red-600">overdue</span>}
              <span className={`hidden text-xs sm:block ${overdue ? "text-red-600" : "text-zinc-400"}`}>{fmtDate(t.due_date)}</span>
              <StatusBadge category={t.status_category} name={t.status_name} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const TASK_SELECT =
  "id, identifier, title, status_name, status_category, due_date, completed_at, external_url, project:projects(id,name), assignee:people(id,display_name)";
