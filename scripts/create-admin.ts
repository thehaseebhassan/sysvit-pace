/**
 * Creates the first admin: auth user (email+password) + workspace member.
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/create-admin.ts you@sysvit.com 'Display Name'
 * Prompts nothing; password is read from PACE_ADMIN_PASSWORD (not argv, so it stays out of shell history).
 */
import { createClient } from "@supabase/supabase-js";

const [email, displayName = "Admin"] = process.argv.slice(2);
const password = process.env.PACE_ADMIN_PASSWORD;
if (!email || !password) throw new Error("Usage: PACE_ADMIN_PASSWORD=... create-admin.ts <email> [name]");

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function main() {
  const slug = process.env.PACE_WORKSPACE_SLUG ?? "sysvit";
  const { data: ws, error: wsErr } = await sb.from("workspaces").select("id").eq("slug", slug).single();
  if (wsErr) throw wsErr;

  const { data: created, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;

  const { error: mErr } = await sb.from("members").insert({
    workspace_id: ws.id, user_id: created.user.id, role: "admin", display_name: displayName,
  });
  if (mErr) throw mErr;
  console.log(`Admin ${email} created in workspace "${slug}".`);
}
main().catch((e) => { console.error(e); process.exit(1); });

export {};
