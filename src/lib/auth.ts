import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Ctx = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string };
  member: { role: "admin" | "member"; display_name: string | null; workspace_id: string };
  workspace: { name: string; timezone: string; settings: Record<string, unknown> };
};

/** Signed-in user + their workspace membership (null if signed out / not a member). Cached per request. */
export const getContext = cache(async (): Promise<{ user: Ctx["user"] | null; ctx: Ctx | null }> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, ctx: null };
  const { data: member } = await supabase
    .from("members").select("role, display_name, workspace_id, workspaces(name, timezone, settings)")
    .eq("user_id", user.id).limit(1).maybeSingle();
  if (!member) return { user: { id: user.id, email: user.email }, ctx: null };
  const ws = member.workspaces as unknown as Ctx["workspace"];
  return {
    user: { id: user.id, email: user.email },
    ctx: { supabase, user: { id: user.id, email: user.email }, member: member as Ctx["member"], workspace: ws },
  };
});

export async function requireCtx(): Promise<Ctx> {
  const { ctx } = await getContext();
  if (!ctx) throw new Error("Not signed in or not a workspace member");
  return ctx;
}

export async function requireAdmin(): Promise<Ctx> {
  const ctx = await requireCtx();
  if (ctx.member.role !== "admin") throw new Error("Admins only");
  return ctx;
}
