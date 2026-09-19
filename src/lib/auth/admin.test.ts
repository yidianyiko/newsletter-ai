import { describe, expect, it } from "vitest";
import { assertAdminEmail } from "./admin";

describe("assertAdminEmail", () => {
  it("rejects a signed-in email that is not the configured administrator", () => {
    expect(() => assertAdminEmail("other@example.com", "owner@example.com")).toThrow("Unauthorized");
  });

  it("compares administrator emails case-insensitively", () => {
    expect(assertAdminEmail("Owner@Example.com", "owner@example.com")).toBeUndefined();
  });
});
