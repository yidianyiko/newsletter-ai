import { describe, expect, it } from "vitest";
import { isCronAuthorized } from "./auth";

describe("cron authorization", () => {
  it("accepts only the exact bearer secret", () => {
    expect(isCronAuthorized("Bearer expected", "expected")).toBe(true);
    expect(isCronAuthorized("Bearer wrong", "expected")).toBe(false);
    expect(isCronAuthorized(null, "expected")).toBe(false);
  });
});
