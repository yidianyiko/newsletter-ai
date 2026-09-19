import { z } from "zod";

const optionalUrl = z.string().url().optional();

export function parseEnv(source: Record<string, string | undefined>) {
  const base = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    ADMIN_EMAIL: z.string().email().default("admin@example.com"),
    OPENAI_API_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM: z.string().default("Letterly <onboarding@resend.dev>"),
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    CRON_SECRET: z.string().optional(),
  }).parse(source);

  if (base.NODE_ENV === "production") {
    for (const key of [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "OPENAI_API_KEY",
      "RESEND_API_KEY",
      "RESEND_WEBHOOK_SECRET",
      "CRON_SECRET",
    ] as const) {
      if (!base[key]) throw new Error(`Missing required production environment variable: ${key}`);
    }
  }

  return { ...base, demoMode: !base.SUPABASE_SERVICE_ROLE_KEY };
}

export const env = parseEnv(process.env);
