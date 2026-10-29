"use client";

import { useState, useTransition } from "react";
import { syncNow } from "@/app/(app)/actions";

export function SyncNow() {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"quick" | "full">("quick");
  const [result, setResult] = useState<{ ok?: boolean; message?: string } | null>(null);
  const run = (full: boolean) => {
    setMode(full ? "full" : "quick");
    start(async () => setResult(await syncNow(full)));
  };
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button className="btn" disabled={pending} onClick={() => run(true)} title="Re-reads every issue from Linear (slower). Use after fixes or if hierarchy looks wrong.">
          {pending && mode === "full" && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {pending && mode === "full" ? "Resyncing…" : "Full resync"}
        </button>
        <button className="btn btn-primary" disabled={pending} onClick={() => run(false)}>
          {pending && mode === "quick" && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {pending && mode === "quick" ? "Syncing…" : "Sync now"}
        </button>
      </div>
      {result?.message && (
        <p className={`max-w-sm text-right text-[12px] ${result.ok ? "text-[#1d7a33]" : "text-[#c23a3a]"}`}>{result.message}</p>
      )}
    </div>
  );
}
