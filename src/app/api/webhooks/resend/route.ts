import { NextResponse } from "next/server";
import { Resend } from "resend";
import { memoryDb } from "@/lib/db/repositories";
import { env } from "@/lib/env";
import { processEmailEvent, type NormalizedEmailEvent } from "@/features/delivery/events";

const supported = new Set<NormalizedEmailEvent["type"]>(["email.delivered", "email.bounced", "email.complained", "email.failed"]);

export async function POST(request: Request) {
  if (!env.RESEND_API_KEY || !env.RESEND_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  const payload = await request.text();
  try {
    const event = new Resend(env.RESEND_API_KEY).webhooks.verify({
      payload,
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
      headers: { id: request.headers.get("svix-id") ?? "", timestamp: request.headers.get("svix-timestamp") ?? "", signature: request.headers.get("svix-signature") ?? "" },
    });
    if (!supported.has(event.type as NormalizedEmailEvent["type"])) return NextResponse.json({ status: "ignored" });
    const messageId = (event.data as { email_id?: string }).email_id;
    if (!messageId) return NextResponse.json({ status: "ignored" });
    const status = await processEmailEvent({ id: request.headers.get("svix-id")!, type: event.type as NormalizedEmailEvent["type"], messageId }, memoryDb);
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }
}
