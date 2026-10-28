"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/(app)/actions";

/** Form wrapper that shows the server action's result message under the fields. */
export function ActionForm({ action, children, className = "" }: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode; className?: string;
}) {
  const [state, formAction] = useActionState(action, {} as ActionState);
  return (
    <form action={formAction} className={className}>
      {children}
      {state.message && (
        <p role="status" className={`mt-3 text-[12px] ${state.ok ? "text-[#4e6438]" : "text-[#a33b2b]"}`}>{state.message}</p>
      )}
    </form>
  );
}
