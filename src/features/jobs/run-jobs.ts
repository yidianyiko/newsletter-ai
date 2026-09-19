import type { NewsletterDatabase } from "@/lib/db/repositories";
import type { EmailTransport } from "@/lib/email/transport";
import { sendIssue } from "@/features/delivery/send-issue";

export interface WeeklyReminderConfig { day: number; hour: number; adminEmail: string }

export async function runScheduledJobs(now: Date, db: NewsletterDatabase, mail: EmailTransport, baseUrl: string, secret: string, reminder?: WeeklyReminderConfig) {
  if (reminder && now.getUTCDay() === reminder.day && now.getUTCHours() === reminder.hour) {
    const dateKey = now.toISOString().slice(0, 10);
    const key = `weekly-reminder:${dateKey}`;
    if (await db.claimJob(key, "weekly-reminder")) {
      const issue = await db.issues.create({ topic: "本周 Newsletter", sourceMaterial: "", writingInstructions: "" });
      await mail.send({ to: reminder.adminEmail, subject: "本周 Newsletter 草稿已准备好", html: `<p>新的空白草稿已经创建。</p><p><a href="${baseUrl}/admin/issues/${issue.id}">添加本周素材</a></p>` }, key);
    }
  }
  const due = (await db.issues.list()).filter((issue) => issue.status === "scheduled" && issue.scheduledAt && new Date(issue.scheduledAt) <= now);
  for (const issue of due) {
    const key = `send:${issue.id}:${issue.scheduledAt}`;
    if (!(await db.claimJob(key, "send-issue"))) continue;
    await sendIssue(issue.id, db, mail, baseUrl, secret);
  }
  return { processed: due.length };
}
