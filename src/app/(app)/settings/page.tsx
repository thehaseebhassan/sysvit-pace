import { createClient } from "@/lib/supabase/server";

export default async function Settings() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("members").select("id, display_name, role, created_at").order("created_at");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <h2 className="text-sm font-medium text-zinc-500">Workspace members</h2>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {members?.map((m) => (
          <li key={m.id} className="flex justify-between px-4 py-2 text-sm">
            <span>{m.display_name ?? "—"}</span>
            <span className="text-zinc-500">{m.role}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-zinc-500">Adding members is done in the Supabase dashboard for now.</p>
    </div>
  );
}
