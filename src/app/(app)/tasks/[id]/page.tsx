import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Avatar, LabelTag, PageHeader, PriorityIcon, PRIORITY_LABEL, ProgressBar, SectionTitle, StatusIcon, STATUS_LABEL } from "@/components/ui";
import { requireCtx } from "@/lib/auth";
import { fmtDate, OPEN } from "@/lib/format";
import { dateInTz } from "@/lib/weeks";

const UUID = /^[0-9a-f-]{36}$/i;

const EVENT_TEXT: Record<string, string> = {
  created: "Created", completed: "Completed", canceled: "Canceled", reopened: "Reopened",
  status_changed: "Status changed", assignee_changed: "Assignee changed", archived: "Archived in Linear", imported: "Imported",
};

const when = (iso: string, tz: string) =>
  new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz });

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[32px] items-center gap-2 text-[13px]">
      <span className="prop-label">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

export default async function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, workspace } = await requireCtx();
  const tz = workspace.timezone;

  const { data: t, error } = await supabase.from("tasks").select(
    "id, identifier, title, description, status_name, status_category, priority, labels, due_date, completed_at, canceled_at, source_created_at, external_url, source, parent_task_id, project_id, assignee_id, team_id, archived_in_source_at",
  ).eq("id", id).maybeSingle();
  if (error) return <p className="card p-4 text-[13px] text-[#c23a3a]">{error.message}</p>;
  if (!t) notFound();

  const [parent, kids, project, assignee, team, events] = await Promise.all([
    t.parent_task_id ? supabase.from("tasks").select("id, identifier, title").eq("id", t.parent_task_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("tasks").select("id, identifier, title, status_category, status_name, priority, assignee_id").eq("parent_task_id", id).order("identifier"),
    t.project_id ? supabase.from("projects").select("id, name").eq("id", t.project_id).maybeSingle() : Promise.resolve({ data: null }),
    t.assignee_id ? supabase.from("people").select("id, display_name").eq("id", t.assignee_id).maybeSingle() : Promise.resolve({ data: null }),
    t.team_id ? supabase.from("teams").select("name, key").eq("id", t.team_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("task_events").select("id, event_type, from_value, to_value, occurred_at").eq("task_id", id).order("occurred_at"),
  ]);

  const children = (kids.data ?? []).sort((a, b) => String(a.identifier).localeCompare(String(b.identifier), undefined, { numeric: true }));
  const done = children.filter((c) => c.status_category === "done").length;
  const labels = Array.isArray(t.labels) ? (t.labels as string[]) : [];
  const today = dateInTz(new Date(), tz);
  const overdue = !!t.due_date && t.due_date < today && (OPEN as readonly string[]).includes(t.status_category);

  return (
    <div>
      <PageHeader
        back={{ href: "/tasks", label: "Issues" }}
        title={t.title}
        subtitle={undefined}
        actions={t.external_url ? <a href={t.external_url} target="_blank" rel="noreferrer" className="btn">Open in Linear ↗</a> : undefined}
      />

      <div className="-mt-3 mb-6 flex flex-wrap items-center gap-2 text-[13px] text-[var(--muted)]">
        <span className="mono text-[12px]">{t.identifier}</span>
        {parent.data && (<>
          <span>·</span>
          <span>Sub-issue of</span>
          <Link href={`/tasks/${parent.data.id}`} className="inline-flex max-w-[360px] items-center gap-1 text-[var(--ink)] hover:underline">
            <span className="mono text-[12px] text-[var(--muted)]">{parent.data.identifier}</span>
            <span className="truncate">{parent.data.title}</span>
          </Link>
        </>)}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-8">
          <section>
            <SectionTitle>Description</SectionTitle>
            {t.description
              ? <p className="whitespace-pre-wrap text-[14px] leading-[1.6] text-[var(--text-2)]">{t.description}</p>
              : <p className="text-[13px] text-[var(--faint)]">No description{t.source === "import" ? " (history imported from CSV, which has no descriptions)." : "."}</p>}
          </section>

          {children.length > 0 && (
            <section>
              <SectionTitle aside={<span className="text-[12px] text-[var(--muted)] tnum">{done}/{children.length} done</span>}>Sub-issues</SectionTitle>
              <div className="mb-3 max-w-xs"><ProgressBar value={(done / children.length) * 100} /></div>
              <ul className="card divide-hair overflow-hidden">
                {children.map((c) => (
                  <li key={c.id}>
                    <Link href={`/tasks/${c.id}`} className="row">
                      <PriorityIcon priority={c.priority} />
                      <span className="mono w-[60px] shrink-0 text-[12px] text-[var(--muted)]">{c.identifier}</span>
                      <StatusIcon category={c.status_category} name={c.status_name} />
                      <span className={`min-w-0 flex-1 truncate ${c.status_category === "canceled" ? "text-[var(--muted)] line-through" : ""}`}>{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <SectionTitle>Activity</SectionTitle>
            {events.data?.length ? (
              <ol className="space-y-3 border-l border-[var(--graphite)] pl-4">
                {events.data.map((e) => (
                  <li key={e.id} className="relative text-[13px]">
                    <span className="absolute -left-[21px] top-[7px] h-2 w-2 rounded-full border border-[var(--smoke)] bg-[var(--canvas)]" />
                    <span className="font-[510]">{EVENT_TEXT[e.event_type] ?? e.event_type}</span>
                    {(e.from_value || e.to_value) && (
                      <span className="text-[var(--muted)]"> {e.from_value ? `${e.from_value} → ` : ""}{e.to_value}</span>
                    )}
                    <span className="block text-[12px] text-[var(--faint)]">{when(e.occurred_at, tz)}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="text-[13px] text-[var(--faint)]">No history recorded yet.</p>}
          </section>
        </div>

        <aside className="h-fit">
          <div className="card p-4">
            <div className="space-y-0.5">
              <Prop label="Status"><StatusIcon category={t.status_category} /><span>{t.status_name ?? STATUS_LABEL[t.status_category]}</span></Prop>
              <Prop label="Priority"><PriorityIcon priority={t.priority} /><span>{PRIORITY_LABEL[t.priority ?? 0]}</span></Prop>
              <Prop label="Assignee"><Avatar name={assignee.data?.display_name} /><span>{assignee.data?.display_name ?? <span className="text-[var(--faint)]">Unassigned</span>}</span></Prop>
              <Prop label="Project">{project.data ? <Link href={`/projects/${project.data.id}`} className="hover:underline">{project.data.name}</Link> : <span className="text-[var(--faint)]">None</span>}</Prop>
              <Prop label="Team">{team.data ? <span>{team.data.name}{team.data.key ? <span className="mono ml-1 text-[12px] text-[var(--muted)]">{team.data.key}</span> : null}</span> : <span className="text-[var(--faint)]">None</span>}</Prop>
              <Prop label="Labels">{labels.length ? labels.map((l) => <LabelTag key={l} name={l} />) : <span className="text-[var(--faint)]">None</span>}</Prop>
              <Prop label="Due"><span className={overdue ? "text-[#c23a3a]" : ""}>{fmtDate(t.due_date)}</span>{overdue && <Badge tone="red">overdue</Badge>}</Prop>
              <Prop label="Created"><span>{fmtDate(t.source_created_at)}</span></Prop>
              {t.completed_at && <Prop label="Completed"><span>{fmtDate(t.completed_at)}</span></Prop>}
              {t.canceled_at && <Prop label="Canceled"><span>{fmtDate(t.canceled_at)}</span></Prop>}
              {t.archived_in_source_at && <Prop label="Archived"><span>{fmtDate(t.archived_in_source_at)}</span></Prop>}
            </div>
          </div>
          <p className="mt-3 px-1 text-[12px] text-[var(--faint)]">Source: {t.source === "import" ? "CSV history" : "Linear"} · read-only in Pace</p>
        </aside>
      </div>
    </div>
  );
}
