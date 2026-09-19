import { describe, expect, it } from "vitest";
import { MemoryDatabase } from "@/lib/db/repositories";
import { hashToken } from "@/lib/domain/tokens";
import { SubscriptionService } from "./service";
import type { EmailMessage, EmailTransport } from "@/lib/email/transport";

class RecordingTransport implements EmailTransport {
  messages: EmailMessage[] = [];
  async send(message: EmailMessage) {
    this.messages.push(message);
    return { id: `message-${this.messages.length}` };
  }
}

describe("SubscriptionService", () => {
  it("keeps a new subscriber pending and sends a confirmation link", async () => {
    const db = new MemoryDatabase();
    const mail = new RecordingTransport();
    const service = new SubscriptionService(db.subscribers, mail);

    await service.requestSubscription("Reader@example.com", "https://letter.test");

    expect((await db.subscribers.list())[0]).toMatchObject({ email: "reader@example.com", status: "pending" });
    expect(mail.messages[0].html).toContain("https://letter.test/confirm?token=");
  });

  it("activates a subscriber with the matching raw token", async () => {
    const db = new MemoryDatabase();
    const mail = new RecordingTransport();
    const rawToken = "raw-confirm-token";
    await db.subscribers.upsertPending("reader@example.com", hashToken(rawToken), hashToken("unsubscribe"));

    const result = await new SubscriptionService(db.subscribers, mail).confirmSubscription(rawToken);

    expect(result).toBe("confirmed");
    expect((await db.subscribers.list())[0].status).toBe("active");
  });

  it("immediately suppresses a subscriber with a valid unsubscribe token", async () => {
    const db = new MemoryDatabase();
    const rawToken = "raw-unsubscribe-token";
    const row = await db.subscribers.upsertPending("reader@example.com", hashToken("confirm"), hashToken(rawToken));
    await db.subscribers.update(row.id, { status: "active" });

    const result = await new SubscriptionService(db.subscribers, new RecordingTransport()).unsubscribe(rawToken);

    expect(result).toBe("unsubscribed");
    expect((await db.subscribers.list())[0].status).toBe("unsubscribed");
  });
});
