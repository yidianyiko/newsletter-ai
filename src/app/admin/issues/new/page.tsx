import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createIssue } from "@/features/issues/actions";

export default async function NewIssuePage() {
  await requireAdmin();
  return <main className="min-h-screen px-5 py-10"><section className="mx-auto max-w-3xl"><Link href="/admin" className="text-sm font-bold text-[var(--muted)]">← 返回</Link><h1 className="serif mt-8 text-5xl font-bold">新建一期</h1><p className="mt-3 text-[var(--muted)]">每一期都可以有不同主题。先放入素材，再让 AI 帮你整理。</p><form action={createIssue} className="mt-10 space-y-6 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7"><Field label="本期主题" name="topic" placeholder="例如：最近让我重新思考效率的三件事"/><Area label="素材与链接" name="sourceMaterial" placeholder="粘贴笔记、链接、摘录……"/><Area label="写作要求" name="writingInstructions" placeholder="例如：语气真诚，控制在 1200 字以内，保留个人判断。"/><button className="rounded-full bg-[var(--ink)] px-7 py-3 font-bold text-white">创建草稿 →</button></form></section></main>;
}

function Field({ label, name, placeholder }: { label: string; name: string; placeholder: string }) { return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><input name={name} placeholder={placeholder} className="min-h-13 w-full rounded-xl border border-[var(--line)] bg-white px-4 outline-none focus:border-[var(--moss)]"/></label>; }
function Area({ label, name, placeholder }: { label: string; name: string; placeholder: string }) { return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><textarea name={name} placeholder={placeholder} rows={7} className="w-full rounded-xl border border-[var(--line)] bg-white p-4 outline-none focus:border-[var(--moss)]"/></label>; }
