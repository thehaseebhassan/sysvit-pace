"use client";

import { useState, useTransition } from "react";
import { syncNow } from "@/app/(app)/actions";
import { btnPrimary } from "./ui";

export function SyncNow() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok?: boolean; message?: string } | null>(null);
  return (
    <div className="flex flex-col items-end gap-1.5">
      <button className={btnPrimary} disabled={pending}
        onClick={() => start(async () => setResult(await syncNow()))}>
        {pending && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
        {pending ? "Syncing…" : "Sync now"}
      </button>
      {result?.message && (
        <p className={`max-w-sm text-right text-xs ${result.ok ? "text-emerald-700" : "text-red-600"}`}>{result.message}</p>
      )}
    </div>
  );
}
