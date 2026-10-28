"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const field = "w-full rounded-md border border-[var(--line)] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--accent)]";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="email" className="text-[12px] text-[var(--muted)]">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-[12px] text-[var(--muted)]">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={field} />
      </div>
      {state.error && <p role="alert" className="text-[12px] text-[#a33b2b]">{state.error}</p>}
      <button type="submit" disabled={pending}
        className="w-full rounded-md bg-[var(--accent)] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
