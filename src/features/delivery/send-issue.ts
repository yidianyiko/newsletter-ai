import type { NewsletterDatabase } from "@/lib/db/repositories";
import { canReceiveEmail } from "@/lib/domain/subscribers";
import type { EmailTransport } from "@/lib/email/transport";
import { renderMarkdownEmail } from "@/features/issues/render";
import { createSignedUnsubscribeToken } from "@/features/subscriptions/signed-token";

export async function sendIssue(issueId: string, db: NewsletterDatabase, mail: EmailTransport, baseUrl: string, unsubscribeSecret: string) {
  const issue = await db.issues.get(issueId);
  if (!issue || !issue.confirmedAt || !["ready", "scheduled", "sending", "sent"].includes(issue.status)) throw new Error("A confirmed issue is required before sending");
  if (issue.status === "sent") return { sent: 0, failed: 0 };
  await db.issues.update(issueId, { status: "sending" });

  const subscribers = (await db.subscribers.list()).filter((item) => canReceiveEmail(item.status));
  for (const subscriber of subscribers) await db.deliveries.create(issueId, subscriber.id, subscriber.email);
  const deliveries = await db.deliveries.listForIssue(issueId);
  let sent = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    if (["sent", "delivered", "bounced", "complained"].includes(delivery.status)) continue;
    const currentSubscriber = await db.subscribers.get(delivery.subscriberId);
    if (!currentSubscriber || !canReceiveEmail(currentSubscriber.status)) continue;
    const token = createSignedUnsubscribeToken(currentSubscriber.id, unsubscribeSecret);
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
    const html = `<div style="display:none">${issue.previewText}</div><main style="max-width:640px;margin:auto;font-family:Arial,sans-serif;line-height:1.7">${renderMarkdownEmail(issue.bodyMarkdown)}<hr><p style="font-size:12px;color:#65706a"><a href="${unsubscribeUrl}">取消订阅</a></p></main>`;
    try {
      const result = await mail.send({ to: delivery.recipientEmail, subject: issue.subject, html, headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }, delivery.id);
      await db.deliveries.update(delivery.id, { status: "sent", providerMessageId: result.id, attempts: delivery.attempts + 1, error: null });
      sent++;
    } catch (error) {
      await db.deliveries.update(delivery.id, { status: "failed", attempts: delivery.attempts + 1, error: error instanceof Error ? error.message : "Email send failed" });
      failed++;
    }
  }

  const remaining = (await db.deliveries.listForIssue(issueId)).some((item) => item.status === "queued" || item.status === "failed");
  if (!remaining) await db.issues.update(issueId, { status: "sent", sentAt: new Date().toISOString() });
  return { sent, failed };
}
