import { describe, expect, it } from "vitest";
import { MemoryDatabase } from "./repositories";

describe("MemoryDatabase", () => {
  it("treats normalized subscriber emails as unique", async () => {
    const db = new MemoryDatabase();
    const first = await db.subscribers.upsertPending("Reader@Example.com", "confirm-a", "unsub-a");
    const second = await db.subscribers.upsertPending(" reader@example.COM ", "confirm-b", "unsub-b");

    expect(second.id).toBe(first.id);
    expect((await db.subscribers.list()).length).toBe(1);
  });

  it("creates only one delivery for an issue and subscriber", async () => {
    const db = new MemoryDatabase();
    const issue = await db.issues.create({ topic: "A", sourceMaterial: "B", writingInstructions: "C" });
    const subscriber = await db.subscribers.upsertPending("reader@example.com", "confirm", "unsub");

    const first = await db.deliveries.create(issue.id, subscriber.id, subscriber.email);
    const second = await db.deliveries.create(issue.id, subscriber.id, subscriber.email);
    expect(second.id).toBe(first.id);
  });
});
