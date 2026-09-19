"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { database } from "@/lib/db/database";
import { env } from "@/lib/env";
import { getEmailTransport } from "@/lib/email/provider";
import { SubscriptionService } from "@/features/subscriptions/service";

export async function subscribe(formData: FormData) {
  const parsed = z.string().email().safeParse(formData.get("email"));
  if (!parsed.success) redirect("/?state=invalid");
  const service = new SubscriptionService(database.subscribers, getEmailTransport());
  await service.requestSubscription(parsed.data, env.NEXT_PUBLIC_APP_URL);
  redirect("/?state=check-email");
}
