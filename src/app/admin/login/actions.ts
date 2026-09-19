"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { assertAdminEmail } from "@/lib/auth/admin";

export async function sendMagicLink(formData: FormData) {
  const email = z.string().email().parse(formData.get("email"));
  assertAdminEmail(email, env.ADMIN_EMAIL);
  if (env.demoMode) redirect("/admin");
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/admin` } });
  if (error) throw error;
  redirect("/admin/login?sent=1");
}
