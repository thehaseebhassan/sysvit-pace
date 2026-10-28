import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { requireCtx } from "@/lib/auth";
import { archiveSettings } from "@/lib/sync/archive";
import { saveArchiveSettings } from "../actions";

export default async function Settings() {
  const { supabase, member, workspace } = await requireCtx();
  const isAdmin = member.role === "admin";
  const s = archiveSettings(workspace.settings);
  const { data: members } = await supabase.from("members").select("id, display_name, role, created_at").order("created_at");
  const input = "w-24 rounded-md border border-[var(--line)] bg-white px-2 py-1 text-[12px] outline-none focus:border-[var(--accent)]";

  return (
    <div className="space-y-10">
      <PageHeader title="Settings" subtitle={`${workspace.name} · ${workspace.timezone}`} />

      <section>
        <SectionTitle>Archiving in Linear</SectionTitle>
        <Card>
          {isAdmin ? (
            <ActionForm action={saveArchiveSettings} className="space-y-4">
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="enabled" defaultChecked={s.enabled} className="mt-0.5 h-3.5 w-3.5 accent-[var(--accent)]" />
                <span>
                  <span className="font-medium">Enable archiving</span>
                  <span className="block text-zinc-500">Off = dry run only. When on, the daily sync archives eligible issues in Linear (never deletes).</span>
                </span>
              </label>
              <div className="flex flex-wrap gap-6 text-sm">
                <label className="space-y-1"><span className="block text-zinc-500">Archive after (days Done)</span><input name="after_days" type="number" min={1} max={365} defaultValue={s.after_days} className={input} /></label>
                <label className="space-y-1"><span className="block text-zinc-500">Approval needed above (issues)</span><input name="max_batch" type="number" min={1} max={100} defaultValue={s.max_batch} className={input} /></label>
              </div>
              <SubmitButton pendingText="Saving…">Save</SubmitButton>
            </ActionForm>
          ) : (
            <p className="text-sm text-zinc-600">Archiving is {s.enabled ? "ON" : "OFF"}. Only admins can change this.</p>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle>Members</SectionTitle>
        <Card className="divide-y divide-zinc-100 !p-0">
          {members?.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>{m.display_name ?? "—"}</span>
              <Badge tone={m.role === "admin" ? "accent" : "neutral"}>{m.role}</Badge>
            </div>
          ))}
        </Card>
        <p className="mt-2 text-sm text-zinc-500">Add members in the Supabase dashboard (Authentication → Users, then a row in <code>members</code>).</p>
      </section>
    </div>
  );
}
