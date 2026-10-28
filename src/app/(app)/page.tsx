import { createClient } from "@/lib/supabase/server";

export default async function Overview() {
  const supabase = await createClient();
  const [tasks, projects] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
  ]);

  const cards = [
    { label: "Tasks", value: tasks.count ?? 0 },
    { label: "Projects", value: projects.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500">{c.label}</p>
            <p className="text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-zinc-500">Data appears here once the Linear sync and history import are built.</p>
    </div>
  );
}
