import { sendMagicLink } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const sent = (await searchParams).sent;
  return <main className="grid min-h-screen place-items-center px-5"><section className="w-full max-w-md rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-9 shadow-xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">Letterly Admin</p><h1 className="serif mt-3 text-4xl font-bold">欢迎回来</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">输入管理员邮箱，我们会发送一个安全登录链接。</p>{sent ? <p className="mt-6 rounded-xl bg-[#294d3d12] p-4 text-sm text-[var(--moss)]">登录链接已发送，请检查邮箱。</p> : <form action={sendMagicLink} className="mt-7 space-y-4"><label className="block text-sm font-bold" htmlFor="email">管理员邮箱</label><input id="email" name="email" type="email" required className="min-h-13 w-full rounded-xl border border-[var(--line)] bg-white px-4 outline-none focus:border-[var(--moss)]"/><button className="min-h-13 w-full rounded-xl bg-[var(--ink)] font-bold text-white">发送登录链接</button></form>}</section></main>;
}
