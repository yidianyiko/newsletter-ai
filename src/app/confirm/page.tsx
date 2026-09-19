import Link from "next/link";
import { memoryDb } from "@/lib/db/repositories";
import { ConsoleEmailTransport } from "@/lib/email/transport";
import { SubscriptionService } from "@/features/subscriptions/service";

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const result = token ? await new SubscriptionService(memoryDb.subscribers, new ConsoleEmailTransport()).confirmSubscription(token) : "invalid";
  return <ResultCard title={result === "confirmed" ? "订阅成功" : "链接无效或已过期"} body={result === "confirmed" ? "下一期 Newsletter 会准时出现在你的收件箱。" : "请重新提交订阅申请，获取新的确认邮件。"} />;
}

function ResultCard({ title, body }: { title: string; body: string }) {
  return <main className="grid min-h-screen place-items-center px-5"><section className="max-w-lg rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-10 text-center shadow-xl"><div className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-[#294d3d15] text-2xl">✓</div><h1 className="serif text-4xl font-bold">{title}</h1><p className="mt-4 leading-7 text-[var(--muted)]">{body}</p><Link href="/" className="mt-7 inline-block font-bold text-[var(--accent)]">返回首页 →</Link></section></main>;
}
