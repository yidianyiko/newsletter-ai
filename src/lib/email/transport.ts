export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface EmailTransport {
  send(message: EmailMessage, idempotencyKey?: string): Promise<{ id: string }>;
}

export class ConsoleEmailTransport implements EmailTransport {
  async send(message: EmailMessage): Promise<{ id: string }> {
    console.info(`[demo email] to=${message.to} subject=${message.subject}`);
    return { id: `demo-${crypto.randomUUID()}` };
  }
}
