import { NextResponse } from "next/server";
import { memoryDb } from "@/lib/db/repositories";
import { env } from "@/lib/env";
import { getEmailTransport } from "@/lib/email/provider";
import { runScheduledJobs } from "@/features/jobs/run-jobs";
import { isCronAuthorized } from "./auth";

export async function GET(request: Request) {
  const secret = env.CRON_SECRET ?? "";
  if (!isCronAuthorized(request.headers.get("authorization"), secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runScheduledJobs(new Date(), memoryDb, getEmailTransport(), env.NEXT_PUBLIC_APP_URL, secret, { day: env.WEEKLY_REMINDER_DAY, hour: env.WEEKLY_REMINDER_HOUR_UTC, adminEmail: env.ADMIN_EMAIL });
  return NextResponse.json(result);
}
