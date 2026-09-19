import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("rejects production configuration without provider secrets", () => {
    expect(() => parseEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://letter.test",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    })).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("permits local demo mode without external provider credentials", () => {
    expect(parseEnv({ NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3000" }).demoMode).toBe(true);
  });
});
