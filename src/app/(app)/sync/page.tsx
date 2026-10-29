import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { SyncNow } from "@/components/sync-now";
import { Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { requireCtx } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { archiveSettings, findCandidates } from "@/lib/sync/archive";
import { approveBatch, importCsv, rejectBatch } from "../actions";

export const maxDuration = 300;

export default async function SyncPage() {
  const { supabase, member, workspace } = await requireCtx();
  const isAdmin = member.role === "admin";
  const s = archiveSettings(workspace.settings);

  const [runs, pending, candidates] = await Promise.all([
    supabase.from("sync_runs").select("id, trigger, status, counts, error, started_at, finished_at").order("started_at", { ascending: false }).limit(10),
    supabase.from("archive_batches")
      .select("id, reason, created_at, archive_candidates(task_id, tasks(identifier, title, completed_at, external_url))")
      .eq("status", "pending").order("created_at"),
    findCandidates(supabase, member.workspace_id, s.after_days),
  ]);
  const lastOk = runs.data?.find((r) => r.status === "success" && r.trigger !== "import");

  return (
    <div className="max-w-[860px] space-y-10">
      <PageHeader title="Sync" subtitle={`Linear → Pace. Last successful sync ${timeAgo(lastOk?.finished_at)}.`} actions={isAdmin ? <SyncNow /> : undefined} />

      <section>
        <SectionTitle>Archive in Linear</SectionTitle>
        <Card className="!p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone={s.enabled ? "green" : "neutral"}>{s.enabled ? "ON" : "OFF · dry run"}</Badge>
            <p className="text-[13px] text-[var(--muted)]">
              Issues Done for more than {s.after_days} days and stored in Pace. More than {s.max_batch} at once needs your approval. Pace never deletes.
            </p>
          </div>
          <p className="mt-4 text-[13px]">
            {candidates.length
              ? <>{candidates.length} issue{candidates.length === 1 ? "" : "s"} {s.enabled ? "eligible" : "would be archived"}:</>
              : <span className="text-[var(--muted)]">Nothing eligible right now.</span>}
          </p>
          {candidates.length > 0 && (
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-[13px] text-[var(--muted)]">
              {candidates.slice(0, 25).map((c) => <li key={c.id} className="truncate"><span className="mono text-[12px]">{c.identifier}</span> {c.title}</li>)}
              {candidates.length > 25 && <li>…and {candidates.length - 25} more</li>}
            </ul>
          )}
        </Card>

        {pending.data?.map((b) => {
          const items = (b.archive_candidates ?? []) as unknown as { task_id: string; tasks: { identifier: string; title: string } | null }[];
          return (
            <Card key={b.id} className="mt-4 !p-5 !border-[var(--smoke)]">
              <p className="text-[14px] font-[510]">Waiting for approval · {items.length} issues</p>
              <p className="text-[13px] text-[var(--muted)]">{b.reason}</p>
              <ul className="mt-3 max-h-64 space-y-1 overflow-auto text-[13px]">
                {items.map((i) => <li key={i.task_id} className="truncate"><span className="mono text-[12px] text-[var(--muted)]">{i.tasks?.identifier}</span> {i.tasks?.title}</li>)}
              </ul>
              {isAdmin ? (
                <div className="mt-4 flex gap-2">
                  <form action={approveBatch}><input type="hidden" name="batchId" value={b.id} /><SubmitButton variant="dark" pendingText="Archiving…">Approve and archive {items.length}</SubmitButton></form>
                  <form action={rejectBatch}><input type="hidden" name="batchId" value={b.id} /><SubmitButton variant="default">Reject</SubmitButton></form>
                </div>
              ) : <p className="mt-3 text-[13px] text-[var(--muted)]">An admin needs to approve this.</p>}
            </Card>
          );
        })}
      </section>

      {isAdmin && (
        <section>
          <SectionTitle>Import history (CSV)</SectionTitle>
          <Card className="!p-5">
            <p className="mb-4 text-[13px] text-[var(--muted)]">
              Upload the closed-issues export. Safe to re-run: it rebuilds parent / sub-issue links and labels. Issues already synced from Linear are left alone.
            </p>
            <ActionForm action={importCsv} className="flex flex-wrap items-center gap-3">
              <input type="file" name="file" accept=".csv,text/csv" required className="text-[13px] file:mr-3 file:h-8 file:cursor-pointer file:rounded-[6px] file:border file:border-[var(--graphite)] file:bg-[var(--canvas)] file:px-3 file:text-[13px] file:font-[510] hover:file:bg-[var(--carbon)]" />
              <SubmitButton variant="default" pendingText="Importing…">Import</SubmitButton>
            </ActionForm>
          </Card>
        </section>
      )}

      <section>
        <SectionTitle>Recent runs</SectionTitle>
        {runs.data?.length ? (
          <div className="card divide-hair overflow-hidden">
            {runs.data.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 text-[13px]">
                <Badge tone={r.status === "success" ? "green" : r.status === "error" ? "red" : "neutral"}>{r.status}</Badge>
                <span className="w-16 shrink-0">{r.trigger}</span>
                <span className="mono min-w-0 flex-1 truncate text-[12px] text-[var(--muted)]">
                  {r.error ?? (r.counts && Object.keys(r.counts).length ? JSON.stringify(r.counts) : "")}
                </span>
                <span className="shrink-0 text-[12px] text-[var(--faint)]">{timeAgo(r.started_at)}</span>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No runs yet" hint={isAdmin ? "Press “Sync now”, or wait for the daily job." : "An admin can start the first sync."} />}
      </section>
    </div>
  );
}
