export type SubscriberStatus = "pending" | "active" | "unsubscribed" | "bounced" | "complained";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function canReceiveEmail(status: SubscriberStatus): boolean {
  return status === "active";
}
