"use client";

import { useState, useTransition } from "react";
import { rebuildHierarchy, reconcileOpenIssues, syncNow } from "@/app/(app)/actions";

type Mode = "quick" | "full" | "tree" | "open";

const Spin = () => <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />;

export function SyncNow() {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<Mode>("quick");
  const [result, setResult] = useState<{ ok?: boolean; message?: string } | null>(null);
  const run = (m: Mode) => {
    setMode(m);
    setResult(null);
    start(async () => setResult(m === "tree" ? await rebuildHierarchy() : m === "open" ? await reconcileOpenIssues() : await syncNow(m === "full")));
  };
  const busy = (m: Mode) => pending && mode === m;
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button className="btn" disabled={pending} onClick={() => run("open")} title="Compares open issues in Linear with Pace and fixes any that are stale (e.g. showing overdue but already done).">
          {busy("open") && <Spin />}{busy("open") ? "Checking…" : "Fix stale issues"}
        </button>
        <button className="btn" disabled={pending} onClick={() => run("tree")} title="Re-reads only parent/sub-issue links from Linear (fast) and fixes the tree.">
          {busy("tree") && <Spin />}{busy("tree") ? "Rebuilding…" : "Rebuild hierarchy"}
        </button>
        <button className="btn" disabled={pending} onClick={() => run("full")} title="Re-reads every issue from Linear (slower).">
          {busy("full") && <Spin />}{busy("full") ? "Resyncing…" : "Full resync"}
        </button>
        <button className="btn btn-primary" disabled={pending} onClick={() => run("quick")}>
          {busy("quick") && <Spin />}{busy("quick") ? "Syncing…" : "Sync now"}
        </button>
      </div>
      {result?.message && (
        <p className={`max-w-lg text-right text-[12px] ${result.ok ? "text-[#1d7a33]" : "text-[#c23a3a]"}`}>{result.message}</p>
      )}
    </div>
  );
}
