import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { reconcileOpen, runSync } from "@/lib/sync/run";
import { runArchiveStep } from "@/lib/sync/archive";

export const maxDuration = 300; // Hobby max with fluid compute (Vercel docs)

export async function GET(request: Request) {
  // Vercel Cron sends "Authorization: Bearer $CRON_SECRET"
  if (request.headers.get("authorization") !== `Bearer ${serverEnv().CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const sync = await runSync("cron");
  const reconcile = sync.ok ? await reconcileOpen().catch((e) => ({ error: String(e) })) : null;
  const archive = sync.ok ? await runArchiveStep().catch((e) => ({ error: String(e) })) : null;
  return NextResponse.json({ sync, reconcile, archive }, { status: sync.ok ? 200 : 500 });
}
