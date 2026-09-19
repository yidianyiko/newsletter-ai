import type { SubscriberRepository } from "@/lib/db/repositories";
import { createToken, hashToken } from "@/lib/domain/tokens";
import type { EmailTransport } from "@/lib/email/transport";
import { confirmationEmail } from "./email";

export class SubscriptionService {
  constructor(private subscribers: SubscriberRepository, private mail: EmailTransport) {}

  async requestSubscription(email: string, baseUrl: string): Promise<void> {
    const confirmationToken = createToken();
    const unsubscribeToken = createToken();
    const subscriber = await this.subscribers.upsertPending(email, hashToken(confirmationToken), hashToken(unsubscribeToken));
    if (subscriber.status === "active") return;
    const content = confirmationEmail(`${baseUrl}/confirm?token=${encodeURIComponent(confirmationToken)}`);
    await this.mail.send({ to: subscriber.email, ...content });
  }

  async confirmSubscription(token: string): Promise<"confirmed" | "invalid"> {
    const subscriber = await this.subscribers.getByConfirmationHash(hashToken(token));
    if (!subscriber) return "invalid";
    await this.subscribers.update(subscriber.id, { status: "active", confirmedAt: new Date().toISOString() });
    return "confirmed";
  }

  async unsubscribe(token: string): Promise<"unsubscribed" | "invalid"> {
    const subscriber = await this.subscribers.getByUnsubscribeHash(hashToken(token));
    if (!subscriber) return "invalid";
    await this.subscribers.update(subscriber.id, { status: "unsubscribed", unsubscribedAt: new Date().toISOString() });
    return "unsubscribed";
  }
}
