import { describe, expect, it } from "vitest";
import { transitionIssue } from "./issues";

describe("transitionIssue", () => {
  it("requires explicit confirmation before scheduling", () => {
    expect(() => transitionIssue("draft", "schedule")).toThrow("confirm");
  });

  it("returns a confirmed issue to draft when content is edited", () => {
    expect(transitionIssue("ready", "edit")).toBe("draft");
  });

  it("does not permit editing an issue after sending starts", () => {
    expect(() => transitionIssue("sending", "edit")).toThrow("locked");
  });
});
