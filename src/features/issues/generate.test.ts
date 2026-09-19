import { describe, expect, it } from "vitest";
import { MemoryDatabase } from "@/lib/db/repositories";
import type { DraftGenerator } from "@/lib/ai/provider";
import { generateIssueDraft } from "./generate";

describe("generateIssueDraft", () => {
  it("stores valid structured output and generation history", async () => {
    const db = new MemoryDatabase();
    const issue = await db.issues.create({ topic: "AI", sourceMaterial: "A useful note", writingInstructions: "Be concise" });
    const generator: DraftGenerator = { generate: async () => ({ subject: "This week in AI", previewText: "Three practical ideas", bodyMarkdown: "# Hello\n\nUseful content." }) };

    const result = await generateIssueDraft(issue.id, db, generator);

    expect(result.subject).toBe("This week in AI");
    expect(db.generationRuns).toHaveLength(1);
    expect(db.generationRuns[0].status).toBe("completed");
  });

  it("preserves the current draft and records a failed run", async () => {
    const db = new MemoryDatabase();
    const issue = await db.issues.create({ topic: "AI", sourceMaterial: "Notes", writingInstructions: "Concise" });
    await db.issues.update(issue.id, { subject: "Keep me", bodyMarkdown: "Existing body" });
    const generator: DraftGenerator = { generate: async () => { throw new Error("provider unavailable"); } };

    await expect(generateIssueDraft(issue.id, db, generator)).rejects.toThrow("provider unavailable");

    expect(await db.issues.get(issue.id)).toMatchObject({ subject: "Keep me", bodyMarkdown: "Existing body" });
    expect(db.generationRuns[0]).toMatchObject({ status: "failed", error: "provider unavailable" });
  });
});
