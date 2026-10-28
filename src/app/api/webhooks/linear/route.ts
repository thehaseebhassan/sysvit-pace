import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { markIssueRemoved, syncReference, syncSingleIssue } from "@/lib/sync/run";
import { adminDb, getWorkspace } from "@/lib/sync/db";

export const maxDuration = 60;

function validSignature(raw: string, header: string | null, secret: string) {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  let given: Buffer;
  try { given = Buffer.from(header, "hex"); } catch { return false; }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  const secret = serverEnv().LINEAR_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("Webhook not configured", { status: 503 });

  const raw = await request.text(); // raw body is required for the signature
  if (!validSignature(raw, request.headers.get("linear-signature"), secret)) {
    return new NextResponse("Bad signature", { status: 401 });
  }
  const body = JSON.parse(raw) as { action: string; type: string; data?: { id?: string }; webhookTimestamp?: number };
  // reject replays older than 60s (Linear docs)
  if (!body.webhookTimestamp || Math.abs(Date.now() - body.webhookTimestamp) > 60_000) {
    return new NextResponse("Stale", { status: 401 });
  }

  try {
    if (body.type === "Issue" && body.data?.id) {
      if (body.action === "remove") await markIssueRemoved(body.data.id);
      else await syncSingleIssue(body.data.id);
    } else if (body.type === "Project" || body.type === "User") {
      const sb = adminDb();
      await syncReference(sb, (await getWorkspace(sb)).id);
    }
  } catch (e) {
    console.error("linear webhook failed", e);
    return new NextResponse("Error", { status: 500 }); // Linear retries with backoff
  }
  return NextResponse.json({ ok: true });
}
