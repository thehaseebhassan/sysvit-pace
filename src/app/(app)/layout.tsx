import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getContext } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ctx } = await getContext();
  if (!user) redirect("/login");

  if (!ctx) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-base font-semibold">No access</h1>
        <p className="max-w-sm text-sm text-[var(--muted)]">{user.email} isn’t a member of this workspace.</p>
        <form action={logout}><button className="text-sm">Sign out</button></form>
      </main>
    );
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-[240px] shrink-0 md:block">
        <Sidebar workspace={ctx.workspace.name} email={user.email} logout={logout} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-3 md:hidden">
          <span className="font-semibold">Pace</span>
          <form action={logout}><button className="text-sm text-[var(--muted)]">Sign out</button></form>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
