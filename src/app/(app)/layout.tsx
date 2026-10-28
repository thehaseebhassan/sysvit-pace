import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS only returns memberships of this user.
  const { data: member } = await supabase
    .from("members")
    .select("role, display_name, workspaces(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!member) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-lg font-semibold">No access</h1>
        <p className="max-w-sm text-sm text-zinc-500">
          {user.email} is signed in but isn&apos;t a member of a workspace. Ask an admin to add you.
        </p>
        <form action={logout}><button className="rounded-md border px-3 py-1.5 text-sm">Sign out</button></form>
      </main>
    );
  }

  const ws = member.workspaces as unknown as { name: string } | null;

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="space-y-4 border-b border-zinc-200 p-4 md:w-56 md:border-b-0 md:border-r dark:border-zinc-800">
        <div>
          <p className="text-base font-semibold tracking-tight">Pace</p>
          <p className="text-xs text-zinc-500">{ws?.name}</p>
        </div>
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-zinc-200 px-6 py-3 text-sm dark:border-zinc-800">
          <span className="text-zinc-500">
            {member.display_name ?? user.email} · {member.role}
          </span>
          <form action={logout}>
            <button className="rounded-md border border-zinc-300 px-2.5 py-1 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900">
              Sign out
            </button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
