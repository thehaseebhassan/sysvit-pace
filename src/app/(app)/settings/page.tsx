import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Body, Card, PageHeader, SectionTitle } from "@/components/ui";
import { requireCtx } from "@/lib/auth";
import { archiveSettings } from "@/lib/sync/archive";
import { saveArchiveSettings } from "../actions";

export default async function Settings() {
  const { supabase, member, workspace } = await requireCtx();
  const isAdmin = member.role === "admin";
  const s = archiveSettings(workspace.settings);
  const { data: members } = await supabase.from("members").select("id, display_name, role, created_at").order("created_at");

  return (
    <>
      <PageHeader title="Settings" subtitle={`${workspace.name} · ${workspace.timezone}`} />
      <Body narrow className="space-y-10 !max-w-[760px]">

      <section>
        <SectionTitle>Archiving in Linear</SectionTitle>
        <Card className="!p-5">
          {isAdmin ? (
            <ActionForm action={saveArchiveSettings} className="space-y-5">
              <label className="flex items-start gap-3 text-[14px]">
                <input type="checkbox" name="enabled" defaultChecked={s.enabled} className="mt-1 h-3.5 w-3.5 accent-[var(--ink)]" />
                <span>
                  <span className="font-[510]">Enable archiving</span>
                  <span className="block text-[13px] text-[var(--muted)]">Off = dry run only. When on, the daily sync archives eligible issues in Linear. Pace never deletes.</span>
                </span>
              </label>
              <div className="flex flex-wrap gap-6 text-[13px]">
                <label className="space-y-1.5"><span className="block text-[var(--muted)]">Archive after (days Done)</span><input name="after_days" type="number" min={1} max={365} defaultValue={s.after_days} className="input w-28" /></label>
                <label className="space-y-1.5"><span className="block text-[var(--muted)]">Approval needed above (issues)</span><input name="max_batch" type="number" min={1} max={100} defaultValue={s.max_batch} className="input w-28" /></label>
              </div>
              <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
            </ActionForm>
          ) : (
            <p className="text-[13px] text-[var(--muted)]">Archiving is {s.enabled ? "ON" : "OFF"}. Only admins can change this.</p>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle>Members</SectionTitle>
        <div className="card divide-hair overflow-hidden">
          {members?.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3 text-[13px]">
              <span>{m.display_name ?? "—"}</span>
              <Badge tone={m.role === "admin" ? "iris" : "neutral"}>{m.role}</Badge>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-[var(--muted)]">Add members in the Supabase dashboard (Authentication → Users, then a row in <code className="mono text-[12px]">members</code>).</p>
      </section>
      </Body>
    </>
  );
}
