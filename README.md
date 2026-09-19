# Letterly

一个单管理员的 AI Newsletter 工具：提交当期素材，让 AI 生成草稿，人工编辑确认后立即或预约发送。包含公开订阅页、双重确认、一键退订、每周草稿提醒和投递状态回传。

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。不配置 Supabase、OpenAI 和 Resend 时会进入演示模式：数据保存在当前 Node 进程内，AI 生成示例草稿，邮件输出到服务端日志。演示模式适合体验界面，重启后数据会丢失，不能用于正式发送。

管理后台位于 `/admin`，演示模式会自动使用 `.env.local` 中的 `ADMIN_EMAIL`。

## 常用命令

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
```

完整托管部署步骤见 [docs/deployment.md](docs/deployment.md)，产品设计见 [docs/superpowers/specs/2026-09-19-newsletter-mvp-design.md](docs/superpowers/specs/2026-09-19-newsletter-mvp-design.md)。

## 安全原则

- 正式邮件必须先经过管理员确认。
- 已确认内容发生修改时，系统会撤销确认和预约。
- 每个期刊与订阅者组合只有一条投递记录，重复 Cron 不会重复发送。
- 退订、退信和投诉会立即停止后续投递。
- OpenAI、Resend、Supabase service role、Webhook 和 Cron 密钥只在服务端使用。
