"use client";

import { useFormStatus } from "react-dom";
import { btn, btnPrimary } from "./ui";

export function SubmitButton({ children, pendingText = "Working…", variant = "primary" }: {
  children: React.ReactNode; pendingText?: string; variant?: "primary" | "default";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={variant === "primary" ? btnPrimary : btn}>
      {pending && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {pending ? pendingText : children}
    </button>
  );
}
