import { redirect } from "next/navigation";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { getContext } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ctx } = await getContext();
  if (!user) redirect("/login");

  if (!ctx) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-[16px] font-[590]">No access</h1>
        <p className="max-w-sm text-[13px] text-[var(--muted)]">{user.email} isn’t a member of this workspace.</p>
        <form action={logout}><button className="btn">Sign out</button></form>
      </main>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 border-r border-[var(--graphite)] bg-[var(--carbon)] md:block">
        <Sidebar workspace={ctx.workspace.name} email={user.email} logout={logout} />
      </aside>
      <MobileNav logout={logout} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
