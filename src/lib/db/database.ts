import "server-only";
import { env } from "@/lib/env";
import { createServiceClient } from "./client";
import { memoryDb, type NewsletterDatabase } from "./repositories";
import { SupabaseNewsletterDatabase } from "./supabase-repositories";

export const database: NewsletterDatabase = env.demoMode ? memoryDb : new SupabaseNewsletterDatabase(createServiceClient());
