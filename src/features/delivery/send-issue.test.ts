import { describe, expect, it } from "vitest";
import { MemoryDatabase } from "@/lib/db/repositories";
import type { EmailMessage, EmailTransport } from "@/lib/email/transport";
import { sendIssue } from "./send-issue";

class RecordingTransport implements EmailTransport {
  messages: Array<{ message: EmailMessage; key?: string }> = [];
  async send(message: EmailMessage, key?: string) {
    this.messages.push({ message, key });
    return { id: `provider-${this.messages.length}` };
  }
}

async function fixture() {
  const db = new MemoryDatabase();
  const issue = await db.issues.create({ topic: "Topic", sourceMaterial: "Notes", writingInstructions: "Clear" });
  await db.issues.update(issue.id, { subject: "Subject", previewText: "Preview", bodyMarkdown: "# Body", status: "ready", confirmedAt: new Date().toISOString() });
  const subscriber = await db.subscribers.upsertPending("reader@example.com", "confirm", "unsubscribe");
  await db.subscribers.update(subscriber.id, { status: "active" });
  return { db, issue, subscriber };
}

describe("sendIssue", () => {
  it("rejects an unconfirmed draft", async () => {
    const db = new MemoryDatabase();
    const issue = await db.issues.create({ topic: "", sourceMaterial: "", writingInstructions: "" });
    await expect(sendIssue(issue.id, db, new RecordingTransport(), "https://letter.test", "secret")).rejects.toThrow("confirmed");
  });

  it("sends once per subscriber even when the job repeats", async () => {
    const { db, issue } = await fixture();
    const mail = new RecordingTransport();
    await sendIssue(issue.id, db, mail, "https://letter.test", "secret");
    await sendIssue(issue.id, db, mail, "https://letter.test", "secret");

    expect(mail.messages).toHaveLength(1);
    expect(mail.messages[0].key).toMatch(/[0-9a-f-]{36}/);
    expect(mail.messages[0].message.html).toContain("/unsubscribe?token=");
  });

  it("skips a subscriber who unsubscribed before the provider call", async () => {
    const { db, issue, subscriber } = await fixture();
    await db.subscribers.update(subscriber.id, { status: "unsubscribed" });
    const mail = new RecordingTransport();
    const result = await sendIssue(issue.id, db, mail, "https://letter.test", "secret");
    expect(result.sent).toBe(0);
    expect(mail.messages).toHaveLength(0);
  });
});
