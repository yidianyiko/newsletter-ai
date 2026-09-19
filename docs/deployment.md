# Letterly 托管部署

目标平台：Vercel + Supabase + Resend + OpenAI。

## 1. 创建 Supabase 项目

1. 在 Supabase 创建项目并记录 Project URL、anon key 和 service role key。
2. 用 Supabase SQL Editor 执行 `supabase/migrations/202609190001_newsletter_mvp.sql`。
3. 在 Authentication 的 URL Configuration 中，将站点 URL 设为正式域名，并把 `https://你的域名/auth/callback` 加入允许的 Redirect URLs。
4. 启用 Email OTP / Magic Link。管理员登录只接受 `ADMIN_EMAIL` 指定的地址。

应用浏览器不会拿到 service role key。所有业务数据写入都经过 Next.js 服务端操作。

## 2. 配置 Resend

1. 添加并验证自己的发件域名；不要在正式环境使用 `onboarding@resend.dev`。
2. 创建 API Key。
3. 创建 Webhook，地址为 `https://你的域名/api/webhooks/resend`。
4. 订阅 `email.delivered`、`email.failed`、`email.bounced` 和 `email.complained` 事件。
5. 保存 Webhook Signing Secret。

## 3. 配置 OpenAI

创建服务端 API Key。默认模型为 `gpt-5-mini`，可以通过 `OPENAI_MODEL` 覆盖。生成器使用 Structured Outputs，并只根据管理员提交的素材写作。

## 4. 部署到 Vercel

将仓库导入 Vercel，然后设置以下环境变量：

```text
NEXT_PUBLIC_APP_URL=https://你的域名
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAIL=你的管理员邮箱
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
RESEND_API_KEY=...
RESEND_FROM=你的名称 <newsletter@你的域名>
RESEND_WEBHOOK_SECRET=whsec_...
CRON_SECRET=至少32位随机字符串
WEEKLY_REMINDER_DAY=1
WEEKLY_REMINDER_HOUR_UTC=0
```

`WEEKLY_REMINDER_DAY` 使用 UTC 星期编号（星期日为 0，星期一为 1）；`WEEKLY_REMINDER_HOUR_UTC` 为 UTC 小时。Vercel Cron 每小时调用一次，应用内部只会为同一天创建一份提醒草稿。

部署后，Vercel 会根据 `vercel.json` 注册 `/api/cron`。请求必须携带 `Authorization: Bearer $CRON_SECRET`。

## 5. 上线验收

- [ ] 正式域名启用 HTTPS，`NEXT_PUBLIC_APP_URL` 与其一致。
- [ ] Supabase migration 已执行，表与 RLS 均存在。
- [ ] 管理员能收到 Magic Link，并在 `/auth/callback` 后进入后台。
- [ ] 访客提交邮箱后收到确认信；未确认地址不会进入发送名单。
- [ ] 确认链接生效，重复订阅不会产生两个 subscriber。
- [ ] AI 能根据当期素材生成标题、预览文本和 Markdown 正文。
- [ ] 修改已确认正文后，状态重新变为 `draft`。
- [ ] 测试邮件到达管理员邮箱，排版和链接正常。
- [ ] Resend 发件域名完成 SPF/DKIM 验证。
- [ ] 正式发送前再次确认正文，随后用一个测试订阅者完成立即发送。
- [ ] 同一 Cron 手动调用两次，没有重复邮件。
- [ ] 一键退订后不再收到后续邮件。
- [ ] Resend Webhook 签名有效，送达/退信/投诉事件能更新数据库。
- [ ] 每周配置时间到达时只创建空白草稿并提醒管理员，不会自动群发。

## 6. 发布前命令

```bash
npm ci
npm test -- --run
npm run typecheck
npm run lint
npm run build
git diff --check
```
