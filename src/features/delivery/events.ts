import type { NewsletterDatabase } from "@/lib/db/repositories";

export interface NormalizedEmailEvent {
  id: string;
  type: "email.delivered" | "email.bounced" | "email.complained" | "email.failed";
  messageId: string;
}

export async function processEmailEvent(event: NormalizedEmailEvent, db: NewsletterDatabase): Promise<"processed" | "duplicate" | "ignored"> {
  if (db.processedEvents.has(event.id)) return "duplicate";
  db.processedEvents.add(event.id);
  const delivery = await db.deliveries.getByProviderMessageId(event.messageId);
  if (!delivery) return "ignored";
  if (event.type === "email.delivered") await db.deliveries.update(delivery.id, { status: "delivered" });
  if (event.type === "email.failed") await db.deliveries.update(delivery.id, { status: "failed" });
  if (event.type === "email.bounced" || event.type === "email.complained") {
    const status = event.type === "email.bounced" ? "bounced" : "complained";
    await db.deliveries.update(delivery.id, { status });
    await db.subscribers.update(delivery.subscriberId, { status });
  }
  return "processed";
}
