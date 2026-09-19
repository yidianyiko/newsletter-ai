import { env } from "@/lib/env";
import { ConsoleEmailTransport, type EmailTransport } from "./transport";
import { ResendEmailTransport } from "./resend";

export function getEmailTransport(): EmailTransport {
  return env.RESEND_API_KEY ? new ResendEmailTransport(env.RESEND_API_KEY, env.RESEND_FROM) : new ConsoleEmailTransport();
}
