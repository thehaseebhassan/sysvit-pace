"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingText = "Working…", variant = "primary" }: {
  children: React.ReactNode; pendingText?: string; variant?: "primary" | "default" | "dark";
}) {
  const { pending } = useFormStatus();
  const cls = variant === "primary" ? "btn btn-primary" : variant === "dark" ? "btn btn-dark" : "btn";
  return (
    <button type="submit" disabled={pending} className={cls}>
      {pending && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {pending ? pendingText : children}
    </button>
  );
}
