import { describe, expect, it } from "vitest";
import { MemoryDatabase } from "@/lib/db/repositories";
import type { EmailTransport } from "@/lib/email/transport";
import { runScheduledJobs } from "./run-jobs";

const mail: EmailTransport = { send: async () => ({ id: "sent" }) };

describe("runScheduledJobs", () => {
  it("processes the same scheduled issue only once across repeated cron calls", async () => {
    const db = new MemoryDatabase();
    const issue = await db.issues.create({ topic: "Topic", sourceMaterial: "Notes", writingInstructions: "Clear" });
    await db.issues.update(issue.id, { subject: "Subject", bodyMarkdown: "Body", status: "scheduled", confirmedAt: "2026-01-01T00:00:00Z", scheduledAt: "2026-09-19T09:00:00Z" });

    await runScheduledJobs(new Date("2026-09-19T10:00:00Z"), db, mail, "https://letter.test", "secret");
    await runScheduledJobs(new Date("2026-09-19T10:00:00Z"), db, mail, "https://letter.test", "secret");

    expect(db.jobRuns.size).toBe(1);
    expect((await db.issues.get(issue.id))?.status).toBe("sent");
  });

  it("creates one empty reminder draft for the configured week without sending subscribers", async () => {
    const db = new MemoryDatabase();
    const messages: string[] = [];
    const reminderMail: EmailTransport = { send: async (message) => { messages.push(message.to); return { id: "reminder" }; } };

    await runScheduledJobs(new Date("2026-09-21T00:30:00Z"), db, reminderMail, "https://letter.test", "secret", { day: 1, hour: 0, adminEmail: "owner@example.com" });
    await runScheduledJobs(new Date("2026-09-21T00:45:00Z"), db, reminderMail, "https://letter.test", "secret", { day: 1, hour: 0, adminEmail: "owner@example.com" });

    expect(await db.issues.list()).toHaveLength(1);
    expect((await db.issues.list())[0]).toMatchObject({ status: "draft", topic: "本周 Newsletter" });
    expect(messages).toEqual(["owner@example.com"]);
  });
});
