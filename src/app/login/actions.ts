"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Wrong email/password: generic message, don't reveal whether the email exists.
    if (error.code === "invalid_credentials") return { error: "Invalid email or password." };
    // Anything else is a setup problem (bad key, unconfirmed email, ...): show the code.
    console.error("login failed", error.status, error.code, error.message);
    return { error: `Sign-in failed (${error.code ?? error.status ?? "unknown"}). Check the Supabase URL/key settings.` };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
