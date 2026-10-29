"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-[13px] text-[var(--muted)]">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input input-lg w-full" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-[13px] text-[var(--muted)]">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input input-lg w-full" />
      </div>
      {state.error && <p role="alert" className="text-[13px] text-[#c23a3a]">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary h-10 w-full text-[14px]">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
