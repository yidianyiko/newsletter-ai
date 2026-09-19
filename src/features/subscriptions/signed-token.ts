import { createHmac, timingSafeEqual } from "node:crypto";

export function createSignedUnsubscribeToken(subscriberId: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(subscriberId).digest("base64url");
  return `${subscriberId}.${signature}`;
}

export function verifySignedUnsubscribeToken(token: string, secret: string): string | null {
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;
  const id = token.slice(0, separator);
  const received = Buffer.from(token.slice(separator + 1));
  const expected = Buffer.from(createHmac("sha256", secret).update(id).digest("base64url"));
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  return id;
}
