import type { IssueRepository } from "@/lib/db/repositories";
import { transitionIssue } from "@/lib/domain/issues";
import type { DraftContent } from "@/lib/db/types";

export class IssueService {
  constructor(private issues: IssueRepository) {}

  async updateDraft(id: string, patch: Partial<DraftContent> & { topic?: string; sourceMaterial?: string; writingInstructions?: string }) {
    const issue = await this.mustGet(id);
    const status = issue.status === "ready" || issue.status === "scheduled" ? transitionIssue(issue.status, "edit") : issue.status;
    return this.issues.update(id, { ...patch, status, confirmedAt: status === "draft" ? null : issue.confirmedAt, scheduledAt: status === "draft" ? null : issue.scheduledAt });
  }

  async confirm(id: string) {
    const issue = await this.mustGet(id);
    if (!issue.subject.trim()) throw new Error("A subject is required before confirmation");
    if (!issue.bodyMarkdown.trim()) throw new Error("Newsletter content is required before confirmation");
    return this.issues.update(id, { status: transitionIssue(issue.status, "confirm"), confirmedAt: new Date().toISOString() });
  }

  async schedule(id: string, date: Date, now = new Date()) {
    if (date.getTime() <= now.getTime()) throw new Error("Scheduled time must be in the future");
    const issue = await this.mustGet(id);
    return this.issues.update(id, { status: transitionIssue(issue.status, "schedule"), scheduledAt: date.toISOString() });
  }

  private async mustGet(id: string) {
    const issue = await this.issues.get(id);
    if (!issue) throw new Error("Issue not found");
    return issue;
  }
}
