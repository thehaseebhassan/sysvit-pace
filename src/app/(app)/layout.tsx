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
          {user.email} is signed in but isn&apos;t a member of a workspace.
        </p>
        <form action={logout}><button className="text-[13px] text-[var(--muted)]">Sign out</button></form>
      </main>
    );
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-[232px] shrink-0 border-r border-[var(--line)] bg-[var(--bg-sidebar)] md:block">
        <Sidebar workspace={ctx.workspace.name} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex h-11 items-center justify-between border-b border-[var(--line)] px-4 md:hidden">
          <span className="text-[13px] font-medium">{ctx.workspace.name}</span>
          <form action={logout}><button className="text-[12px] text-[var(--muted)]">Sign out</button></form>
        </header>
        <div className="flex h-11 items-center justify-end gap-3 border-b border-[var(--line)] px-4 max-md:hidden">
          <span className="text-[12px] text-[var(--muted)]">{ctx.member.display_name ?? user.email}</span>
          <form action={logout}>
            <button className="text-[12px] text-[var(--muted)] hover:text-[var(--fg)]">Sign out</button>
          </form>
        </div>
        <div className="md:hidden border-b border-[var(--line)] px-2 py-1"><Sidebar workspace={ctx.workspace.name} /></div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
