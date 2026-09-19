import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function assertAdminEmail(actual: string | undefined, configured: string): void {
  if (!actual || actual.trim().toLowerCase() !== configured.trim().toLowerCase()) throw new Error("Unauthorized administrator");
}

export async function getAdminEmail(): Promise<string | null> {
  if (env.demoMode) return env.ADMIN_EMAIL;
  const store = await cookies();
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  });
  const { data } = await supabase.auth.getUser();
  try {
    assertAdminEmail(data.user?.email, env.ADMIN_EMAIL);
    return data.user!.email!;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) redirect("/admin/login");
  return email;
}
