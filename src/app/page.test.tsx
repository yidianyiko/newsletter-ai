// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeContent } from "./home-content";

describe("HomePage", () => {
  it("shows a clear email subscription form", () => {
    render(<HomeContent subscribeAction={async () => {}} />);
    expect(screen.getByRole("heading", { name: /值得打开的 newsletter/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /邮箱/i })).toHaveAttribute("type", "email");
    expect(screen.getByRole("button", { name: /免费订阅/i })).toBeInTheDocument();
  });
});
