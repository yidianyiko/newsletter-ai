import Link from "next/link";
import { memoryDb } from "@/lib/db/repositories";
import { ConsoleEmailTransport } from "@/lib/email/transport";
import { SubscriptionService } from "@/features/subscriptions/service";
import { env } from "@/lib/env";

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const result = token ? await new SubscriptionService(memoryDb.subscribers, new ConsoleEmailTransport(), env.CRON_SECRET ?? "local-development-secret").unsubscribe(token) : "invalid";
  return <main className="grid min-h-screen place-items-center px-5"><section className="max-w-lg rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-10 text-center shadow-xl"><h1 className="serif text-4xl font-bold">{result === "unsubscribed" ? "已取消订阅" : "退订链接无效"}</h1><p className="mt-4 leading-7 text-[var(--muted)]">{result === "unsubscribed" ? "你不会再收到后续邮件。感谢曾经同行。" : "这个链接无法使用；如仍收到邮件，请联系发件人。"}</p><Link href="/" className="mt-7 inline-block font-bold text-[var(--accent)]">返回首页 →</Link></section></main>;
}
