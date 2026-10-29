import { redirect } from "next/navigation";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { getContext } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { uiColors } from "@/lib/colors";

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

  const { data: projects } = await ctx.supabase.from("projects").select("id, name").order("name").limit(40);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--shell)] md:h-screen md:flex-row md:overflow-hidden">
      <aside className="hidden w-[236px] shrink-0 md:block">
        <Sidebar workspace={ctx.workspace.name} email={user.email} logout={logout} projects={projects ?? []} colors={uiColors(ctx.workspace.settings)} />
      </aside>
      <MobileNav logout={logout} />
      <main className="panel m-0 min-w-0 flex-1 bg-[var(--canvas)] md:m-2 md:ml-0 md:overflow-auto">{children}</main>
    </div>
  );
}
