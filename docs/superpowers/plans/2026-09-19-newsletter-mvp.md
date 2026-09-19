# Newsletter AI MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a deployable single-admin newsletter application with double opt-in subscriptions, AI-assisted drafting, explicit send approval, scheduling, and reliable provider event tracking.

**Architecture:** A Next.js App Router application owns the UI and authenticated route handlers. Domain rules are pure TypeScript, while Supabase, OpenAI, and Resend are isolated adapters; PostgreSQL constraints and idempotent job records protect scheduled sends.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Supabase/PostgreSQL, OpenAI SDK, Resend SDK, Zod, Vitest, Testing Library, Playwright-compatible smoke structure.

**Spec:** `docs/superpowers/specs/2026-09-19-newsletter-mvp-design.md`

## Global Constraints

- AI must never send a newsletter without administrator confirmation.
- MVP supports one administrator, one sender identity, and one subscriber list.
- Only hashes of confirmation and unsubscribe tokens are stored.
- Editing confirmed content returns the issue to draft state.
- Weekly automation creates a draft and reminder only.
- Provider adapters must be replaceable with fakes in tests.

---

### Task 1: Application shell and domain rules

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`
- Create: `src/lib/domain/issues.ts`, `src/lib/domain/subscribers.ts`, `src/lib/domain/tokens.ts`
- Test: `src/lib/domain/issues.test.ts`, `src/lib/domain/subscribers.test.ts`

**Interfaces:**
- Produces: `IssueStatus`, `transitionIssue(status, action)`, `normalizeEmail(email)`, `canReceiveEmail(status)`, `createToken()`, and `hashToken(token)`.

- [ ] Write failing unit tests proving invalid issue transitions throw, edits invalidate confirmation, email normalization is stable, and only active subscribers are eligible.
- [ ] Run `npm test -- --run` and confirm the new suites fail because the modules do not exist.
- [ ] Add the minimal typed domain modules and secure SHA-256 token utilities.
- [ ] Run `npm test -- --run` and `npm run typecheck`; both must pass.
- [ ] Commit the shell and domain rules.

### Task 2: Database schema and repository contracts

**Files:**
- Create: `supabase/migrations/202609190001_newsletter_mvp.sql`
- Create: `src/lib/db/types.ts`, `src/lib/db/client.ts`, `src/lib/db/repositories.ts`
- Create: `src/lib/env.ts`, `.env.example`
- Test: `src/lib/env.test.ts`, `src/lib/db/repositories.test.ts`

**Interfaces:**
- Consumes: normalized email and issue/subscriber states from Task 1.
- Produces: `IssueRepository`, `SubscriberRepository`, `DeliveryRepository`, and typed application records.

- [ ] Write tests for environment validation and repository behavior using in-memory implementations.
- [ ] Run the focused tests and confirm missing interfaces fail.
- [ ] Add schema tables, indexes, RLS policies, constraints, environment parsing, Supabase clients, contracts, and in-memory test repositories.
- [ ] Run unit tests and type checking.
- [ ] Commit persistence foundations.

### Task 3: Subscription lifecycle and public site

**Files:**
- Create: `src/features/subscriptions/service.ts`, `src/features/subscriptions/email.tsx`
- Create: `src/app/page.tsx`, `src/app/subscribe/actions.ts`, `src/app/confirm/page.tsx`, `src/app/unsubscribe/page.tsx`
- Test: `src/features/subscriptions/service.test.ts`, `src/app/page.test.tsx`

**Interfaces:**
- Consumes: `SubscriberRepository`, token utilities, and `EmailTransport`.
- Produces: `requestSubscription(email, baseUrl)`, `confirmSubscription(token)`, and `unsubscribe(token)`.

- [ ] Write failing service tests for new, repeated, confirmed, and re-subscription flows plus a public-page rendering test.
- [ ] Run focused tests and verify failures.
- [ ] Implement generic public responses, fresh token issuance, confirmation email rendering, token lookup, and the responsive landing page.
- [ ] Run focused tests, all unit tests, and type checking.
- [ ] Commit the public subscription loop.

### Task 4: Admin authentication, dashboard, and issue editor

**Files:**
- Create: `src/lib/auth/admin.ts`, `src/middleware.ts`
- Create: `src/app/admin/login/page.tsx`, `src/app/admin/page.tsx`, `src/app/admin/issues/new/page.tsx`, `src/app/admin/issues/[id]/page.tsx`
- Create: `src/features/issues/actions.ts`, `src/features/issues/editor.tsx`, `src/features/issues/render.ts`
- Test: `src/features/issues/actions.test.ts`, `src/features/issues/render.test.ts`

**Interfaces:**
- Consumes: `IssueRepository` and the admin email configuration.
- Produces: authenticated create/update/confirm/schedule operations and sanitized Markdown email rendering.

- [ ] Write failing tests for admin authorization, draft creation, edit-after-confirm invalidation, past-schedule rejection, and script removal from rendered Markdown.
- [ ] Run focused tests and verify failures.
- [ ] Implement passwordless admin login, protected routes, dashboard cards, issue editor, preview, confirmation, and scheduling actions.
- [ ] Run tests, type checking, and a production build.
- [ ] Commit the admin authoring workflow.

### Task 5: AI draft generation

**Files:**
- Create: `src/lib/ai/provider.ts`, `src/lib/ai/openai.ts`, `src/features/issues/generate.ts`
- Modify: `src/features/issues/editor.tsx`, `src/features/issues/actions.ts`
- Test: `src/features/issues/generate.test.ts`

**Interfaces:**
- Produces: `DraftGenerator.generate(input): Promise<{subject:string; previewText:string; bodyMarkdown:string}>` and `generateIssueDraft(issueId)`.

- [ ] Write failing tests showing valid structured output updates the issue and provider failure preserves the previous draft while recording a failed generation run.
- [ ] Run the focused test and verify failure.
- [ ] Implement a fakeable provider interface, OpenAI structured response adapter, generation history, and editor generate/regenerate controls.
- [ ] Run tests, type checking, and the production build.
- [ ] Commit AI-assisted drafting.

### Task 6: Reliable delivery, scheduling, and provider events

**Files:**
- Create: `src/lib/email/transport.ts`, `src/lib/email/resend.ts`, `src/features/delivery/send-issue.ts`
- Create: `src/features/jobs/run-jobs.ts`, `src/app/api/cron/route.ts`, `src/app/api/webhooks/resend/route.ts`
- Modify: `src/features/issues/actions.ts`, `vercel.json`
- Test: `src/features/delivery/send-issue.test.ts`, `src/features/jobs/run-jobs.test.ts`, `src/app/api/webhooks/resend/route.test.ts`

**Interfaces:**
- Consumes: confirmed issue snapshots, eligible subscribers, delivery repositories, `EmailTransport.send(message, idempotencyKey)`, and signed provider events.
- Produces: `sendIssue(issueId)`, `runScheduledJobs(now)`, and verified webhook state updates.

- [ ] Write failing tests for confirmation enforcement, empty audiences, repeated jobs, partial retries, unsubscribe-before-send, invalid webhook signatures, and bounce suppression.
- [ ] Run focused tests and verify failures.
- [ ] Implement delivery snapshots, per-recipient idempotency, test sending, secured cron processing, weekly draft reminders, webhook verification, and aggregate delivery statistics.
- [ ] Run the full unit suite, type checking, and production build.
- [ ] Commit delivery automation.

### Task 7: Deployment documentation and acceptance verification

**Files:**
- Create: `README.md`
- Create: `docs/deployment.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: all application routes and environment settings.
- Produces: reproducible local setup, Supabase migration, Resend domain/webhook, OpenAI, Vercel deployment, and production smoke instructions.

- [ ] Document exact install, database migration, local-development, provider setup, and deployment commands.
- [ ] Add a production checklist covering sender-domain verification, admin login, subscribe/confirm/unsubscribe, test email, cron secret, and webhook verification.
- [ ] Run `npm test -- --run`, `npm run typecheck`, `npm run lint`, and `npm run build` from a clean dependency install.
- [ ] Inspect `git diff --check` and repository status, then commit documentation and any verification corrections.
