import type { IssueStatus } from "@/lib/domain/issues";
import type { SubscriberStatus } from "@/lib/domain/subscribers";

export interface Issue {
  id: string;
  topic: string;
  sourceMaterial: string;
  writingInstructions: string;
  subject: string;
  previewText: string;
  bodyMarkdown: string;
  status: IssueStatus;
  confirmedAt: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  confirmationTokenHash: string;
  unsubscribeTokenHash: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
}

export type DeliveryStatus = "queued" | "sent" | "delivered" | "failed" | "bounced" | "complained";

export interface Delivery {
  id: string;
  issueId: string;
  subscriberId: string;
  recipientEmail: string;
  status: DeliveryStatus;
  providerMessageId: string | null;
  attempts: number;
  error: string | null;
}

export interface IssueInput {
  topic: string;
  sourceMaterial: string;
  writingInstructions: string;
}

export interface DraftContent {
  subject: string;
  previewText: string;
  bodyMarkdown: string;
}
