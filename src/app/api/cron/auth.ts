export function isCronAuthorized(header: string | null, secret: string): boolean {
  return Boolean(secret) && header === `Bearer ${secret}`;
}
