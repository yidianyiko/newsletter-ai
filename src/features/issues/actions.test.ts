import { describe, expect, it } from "vitest";
import { MemoryDatabase } from "@/lib/db/repositories";
import { IssueService } from "./service";

async function readyIssue() {
  const db = new MemoryDatabase();
  const issue = await db.issues.create({ topic: "AI", sourceMaterial: "Notes", writingInstructions: "Concise" });
  const service = new IssueService(db.issues);
  await service.updateDraft(issue.id, { subject: "Subject", previewText: "Preview", bodyMarkdown: "Body" });
  await service.confirm(issue.id);
  return { db, service, issueId: issue.id };
}

describe("IssueService", () => {
  it("invalidates confirmation when confirmed content changes", async () => {
    const { db, service, issueId } = await readyIssue();
    await service.updateDraft(issueId, { subject: "Changed" });
    expect(await db.issues.get(issueId)).toMatchObject({ status: "draft", confirmedAt: null, subject: "Changed" });
  });

  it("rejects scheduling in the past", async () => {
    const { service, issueId } = await readyIssue();
    await expect(service.schedule(issueId, new Date("2020-01-01"), new Date("2026-01-01"))).rejects.toThrow("future");
  });

  it("requires complete content before confirmation", async () => {
    const db = new MemoryDatabase();
    const issue = await db.issues.create({ topic: "", sourceMaterial: "", writingInstructions: "" });
    await expect(new IssueService(db.issues).confirm(issue.id)).rejects.toThrow("subject");
  });
});
