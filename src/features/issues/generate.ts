import type { DraftGenerator } from "@/lib/ai/provider";
import type { NewsletterDatabase } from "@/lib/db/repositories";

export async function generateIssueDraft(issueId: string, db: NewsletterDatabase, generator: DraftGenerator) {
  const issue = await db.issues.get(issueId);
  if (!issue) throw new Error("Issue not found");
  try {
    const output = await generator.generate({ topic: issue.topic, sourceMaterial: issue.sourceMaterial, writingInstructions: issue.writingInstructions });
    await db.issues.update(issueId, { ...output, status: "draft", confirmedAt: null, scheduledAt: null });
    db.generationRuns.push({ issueId, status: "completed", output });
    return output;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft generation failed";
    db.generationRuns.push({ issueId, status: "failed", error: message });
    throw error;
  }
}
