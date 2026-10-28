import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getContext } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ctx } = await getContext();
  if (!user) redirect("/login");

  if (!ctx) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-lg font-semibold">No access</h1>
        <p className="max-w-sm text-sm text-zinc-500">
          {user.email} is signed in but isn&apos;t a member of a workspace. Ask an admin to add you.
        </p>
        <form action={logout}><button className="rounded-lg border bg-white px-3 py-1.5 text-sm">Sign out</button></form>
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="space-y-5 border-b border-zinc-200/80 bg-white p-4 md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">P</span>
          <div>
            <p className="text-sm font-semibold leading-tight tracking-tight">Pace</p>
            <p className="text-xs text-zinc-500">{ctx.workspace.name}</p>
          </div>
        </div>
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 px-6 py-3 text-sm">
          <span className="text-zinc-500">{ctx.member.display_name ?? user.email}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">{ctx.member.role}</span>
          <form action={logout}>
            <button className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 transition hover:bg-zinc-50">Sign out</button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-12 pt-2">{children}</main>
      </div>
    </div>
  );
}
