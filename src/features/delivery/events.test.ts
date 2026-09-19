import { describe, expect, it } from "vitest";
import { MemoryDatabase } from "@/lib/db/repositories";
import { processEmailEvent } from "./events";

describe("processEmailEvent", () => {
  it("suppresses a subscriber after a bounce and deduplicates the event", async () => {
    const db = new MemoryDatabase();
    const issue = await db.issues.create({ topic: "", sourceMaterial: "", writingInstructions: "" });
    const subscriber = await db.subscribers.upsertPending("reader@example.com", "c", "u");
    await db.subscribers.update(subscriber.id, { status: "active" });
    const delivery = await db.deliveries.create(issue.id, subscriber.id, subscriber.email);
    await db.deliveries.update(delivery.id, { providerMessageId: "msg-1", status: "sent" });

    const event = { id: "evt-1", type: "email.bounced", messageId: "msg-1" } as const;
    expect(await processEmailEvent(event, db)).toBe("processed");
    expect(await processEmailEvent(event, db)).toBe("duplicate");
    expect((await db.subscribers.list())[0].status).toBe("bounced");
  });
});
