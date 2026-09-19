import "server-only";
import { Resend } from "resend";
import type { EmailMessage, EmailTransport } from "./transport";

export class ResendEmailTransport implements EmailTransport {
  private resend: Resend;
  constructor(apiKey: string, private from: string) { this.resend = new Resend(apiKey); }

  async send(message: EmailMessage, idempotencyKey?: string) {
    const result = await this.resend.emails.send({ from: this.from, ...message }, idempotencyKey ? { idempotencyKey } : undefined);
    if (result.error || !result.data) throw new Error(result.error?.message ?? "Resend did not return a message ID");
    return { id: result.data.id };
  }
}
