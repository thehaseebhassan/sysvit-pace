import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getContext } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ctx } = await getContext();
  if (!user) redirect("/login");

  if (!ctx) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-[15px] font-medium">No access</h1>
        <p className="max-w-sm text-[13px] text-[var(--muted)]">
          {user.email} is signed in but isn&apos;t a member of a workspace. Ask an admin to add you.
        </p>
        <form action={logout}><button className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-[12px]">Sign out</button></form>
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="space-y-4 border-b border-[var(--line)] bg-[var(--bg-sidebar)] p-3 md:w-[200px] md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-1 pt-0.5">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--accent)] text-[11px] font-semibold text-white">P</span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium leading-tight">Pace</p>
            <p className="truncate text-[11px] text-[var(--muted)]">{ctx.workspace.name}</p>
          </div>
        </div>
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-10 items-center justify-end gap-2 border-b border-[var(--line)] px-4 text-[12px]">
          <span className="text-[var(--muted)]">{ctx.member.display_name ?? user.email}</span>
          <span className="text-[var(--muted)]">{ctx.member.role}</span>
          <form action={logout}>
            <button className="rounded-md px-1.5 py-0.5 text-[var(--muted)] transition hover:bg-[#e8e6dc] hover:text-[var(--fg)]">Sign out</button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-4">{children}</main>
      </div>
    </div>
  );
}
