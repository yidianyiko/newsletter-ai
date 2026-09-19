import { describe, expect, it } from "vitest";
import { canReceiveEmail, normalizeEmail } from "./subscribers";

describe("subscriber rules", () => {
  it("normalizes surrounding whitespace and email case", () => {
    expect(normalizeEmail("  Reader@Example.COM ")).toBe("reader@example.com");
  });

  it.each(["pending", "unsubscribed", "bounced", "complained"] as const)(
    "does not send to a %s subscriber",
    (status) => expect(canReceiveEmail(status)).toBe(false),
  );

  it("allows active subscribers to receive email", () => {
    expect(canReceiveEmail("active")).toBe(true);
  });
});
