import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { memoryDb } from "@/lib/db/repositories";

export default async function AdminPage() {
  await requireAdmin();
  const [issues, subscribers] = await Promise.all([memoryDb.issues.list(), memoryDb.subscribers.list()]);
  const active = subscribers.filter((item) => item.status === "active").length;
  return <main className="min-h-screen px-5 py-6 md:px-10"><header className="mx-auto flex max-w-6xl items-center justify-between border-b border-[var(--line)] pb-5"><Link href="/" className="serif text-2xl font-bold">Letterly<span className="text-[var(--accent)]">.</span></Link><span className="text-sm text-[var(--muted)]">{active} 位有效订阅者</span></header><section className="mx-auto max-w-6xl py-12"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">Workspace</p><h1 className="serif mt-2 text-5xl font-bold">你的期刊</h1></div><Link href="/admin/issues/new" className="rounded-full bg-[var(--ink)] px-6 py-3 text-center font-bold text-white">＋ 新建一期</Link></div><div className="mt-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">{issues.length === 0 ? <div className="p-12 text-center"><p className="serif text-2xl font-bold">还没有草稿</p><p className="mt-2 text-sm text-[var(--muted)]">从本周积累的链接和笔记开始。</p></div> : issues.map((issue) => <Link href={`/admin/issues/${issue.id}`} key={issue.id} className="grid gap-2 border-b border-[var(--line)] p-5 transition last:border-0 hover:bg-white md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-bold">{issue.subject || issue.topic || "未命名期刊"}</p><p className="mt-1 text-sm text-[var(--muted)]">{new Date(issue.updatedAt).toLocaleString("zh-CN")}</p></div><span className="w-fit rounded-full bg-[#294d3d12] px-3 py-1 text-xs font-bold text-[var(--moss)]">{issue.status}</span></Link>)}</div></section></main>;
}
