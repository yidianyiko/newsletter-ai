"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { memoryDb } from "@/lib/db/repositories";
import { env } from "@/lib/env";
import { ConsoleEmailTransport } from "@/lib/email/transport";
import { SubscriptionService } from "@/features/subscriptions/service";

export async function subscribe(formData: FormData) {
  const parsed = z.string().email().safeParse(formData.get("email"));
  if (!parsed.success) redirect("/?state=invalid");
  const service = new SubscriptionService(memoryDb.subscribers, new ConsoleEmailTransport());
  await service.requestSubscription(parsed.data, env.NEXT_PUBLIC_APP_URL);
  redirect("/?state=check-email");
}
