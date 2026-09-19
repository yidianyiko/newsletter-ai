export type IssueStatus = "draft" | "ready" | "scheduled" | "sending" | "sent";
export type IssueAction = "edit" | "confirm" | "schedule" | "send" | "complete";

export function transitionIssue(status: IssueStatus, action: IssueAction): IssueStatus {
  if (action === "edit") {
    if (status === "sending" || status === "sent") throw new Error("Sent content is locked");
    return "draft";
  }

  const transitions: Partial<Record<IssueStatus, Partial<Record<IssueAction, IssueStatus>>>> = {
    draft: { confirm: "ready" },
    ready: { schedule: "scheduled", send: "sending" },
    scheduled: { send: "sending" },
    sending: { complete: "sent" },
  };
  const next = transitions[status]?.[action];
  if (!next) {
    const hint = action === "schedule" || action === "send" ? ": confirm the issue first" : "";
    throw new Error(`Invalid issue transition${hint}`);
  }
  return next;
}
