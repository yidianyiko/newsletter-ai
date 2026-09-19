# Newsletter AI MVP Design

## Goal

Build a single-admin newsletter application for a creator starting with zero subscribers. Visitors can subscribe through a public page. The administrator supplies source notes and links for each issue, asks AI to produce a draft, edits and previews it, then explicitly sends it immediately or schedules it.

AI must never send a newsletter without administrator confirmation.

## MVP Scope

### Public experience

- Landing page with newsletter description and email subscription form.
- Double opt-in: a new address remains pending until its confirmation link is used.
- Confirmation, already-subscribed, invalid-token, and unsubscribe result states.
- Every production email includes an unsubscribe link.

### Administrator experience

- Passwordless email login restricted to a configured administrator address.
- Dashboard listing drafts, scheduled issues, and sent issues.
- Create an issue with a per-issue topic, source notes or URLs, and writing instructions.
- Generate a structured draft with AI, while retaining earlier generated versions.
- Edit subject, preview text, and Markdown body.
- Preview the rendered email and send a test message.
- Explicitly confirm and send now, or confirm and schedule for later.
- Configure a weekly reminder schedule. A due schedule creates an empty draft and emails the administrator; it never sends to subscribers.
- View subscribers and basic delivery totals.

### Explicitly deferred

- Teams, roles, multiple publications, billing, audience segmentation, A/B testing, rich block editing, automated web research, and custom template builders.

## Architecture

- Next.js with TypeScript provides public pages, the admin UI, and server route handlers.
- Supabase PostgreSQL stores application data; Supabase Auth handles the single administrator session.
- OpenAI generates issue drafts from administrator-provided material and returns structured fields.
- Resend sends transactional and broadcast email and reports delivery events through signed webhooks.
- Vercel hosts the app. A secured daily cron endpoint creates weekly reminder drafts and drains due sends.

All privileged operations execute on the server. Browser clients never receive service-role, OpenAI, Resend, webhook, or cron secrets.

## Components and Boundaries

- `domain`: issue/subscriber state machines and validation, independent of vendors.
- `repositories`: typed persistence interfaces with Supabase implementations.
- `ai`: prompt construction and structured draft generation.
- `email`: templates and a Resend transport behind an interface.
- `jobs`: idempotent weekly-reminder and scheduled-delivery workflows.
- `app`: pages and route handlers which authenticate, validate, and call these services.

Provider-facing code remains isolated so tests can use in-memory repositories and fake transports.

## Data Model

- `settings`: singleton publication name, description, sender identity, administrator address, timezone, weekly schedule, and default writing guidance.
- `issues`: topic, source material, writing instructions, subject, preview text, Markdown body, lifecycle state, confirmed timestamp, schedule timestamp, sent timestamp, and immutable content snapshot hash.
- `generation_runs`: issue, sanitized prompt/input summary, generated output, model metadata, status, and error.
- `subscribers`: normalized email, state (`pending`, `active`, `unsubscribed`, `bounced`, `complained`), confirmation token hash, unsubscribe token hash, and lifecycle timestamps.
- `deliveries`: unique issue/subscriber pair, recipient snapshot, provider message ID, status, attempt count, and timestamps.
- `email_events`: deduplicated provider event ID, type, payload, and processing timestamp.
- `job_runs`: unique logical job key, job type, status, timing, and error details.

The database enforces unique normalized subscriber email, unique issue/subscriber delivery, and unique provider event ID.

## State and Data Flow

Issue state transitions are `draft -> ready -> scheduled|sending -> sent`. Editing after confirmation returns the issue to `draft` and clears confirmation. Starting a send freezes the subject, preview, body, and audience snapshot.

Subscription is `pending -> active -> unsubscribed`. Re-subscription creates fresh confirmation credentials. Unsubscribe takes effect immediately. Before each provider call, the worker checks that the subscriber is still active.

AI generation creates a separate run, and only replaces the editable draft after a valid structured response. A failed generation leaves the existing draft unchanged.

## Sending Reliability

- Administrator confirmation is mandatory for immediate and scheduled sends.
- A transaction creates delivery rows before sending.
- Each send uses the delivery ID as its idempotency key.
- Cron endpoints require `CRON_SECRET`; jobs use unique logical keys to tolerate duplicate triggers.
- Failed deliveries retain attempts and error details and can be retried without resending successful rows.
- Webhook signatures are verified before processing, and event IDs are deduplicated.
- Bounce and complaint events suppress future delivery.
- The system does not report an issue as sent until all delivery rows reach a terminal state.

## Security and Privacy

- Admin routes verify the authenticated email against the configured administrator.
- Public endpoints have schema validation, generic responses that do not reveal whether an address exists, and rate-limit hooks.
- Confirmation and unsubscribe tokens are random, single-purpose values; only hashes are stored.
- Logs avoid raw tokens, prompts containing private notes, and full subscriber lists.
- HTML output is rendered from sanitized Markdown. User-supplied HTML is not accepted in the MVP.
- Secrets are environment variables, with startup validation and an `.env.example` containing names only.

## Error Handling

- Forms show actionable validation errors without losing entered content.
- AI, email, and database failures are recorded and shown to the administrator with a retry action.
- Test-send failure cannot advance an issue state.
- Scheduling rejects past timestamps and missing confirmation.
- Empty audiences complete safely without calling the provider and display a clear result.
- Webhooks acknowledge known duplicate events and reject invalid signatures.

## Testing

- Unit tests cover state transitions, token hashing, recipient eligibility, schedule evaluation, and idempotency.
- Integration tests cover subscribe/confirm/unsubscribe, draft generation with a fake AI provider, confirmation/scheduling, send retries, and webhook updates.
- UI smoke tests cover the public subscription path and the administrator issue workflow.
- Production readiness checks include database migrations, environment validation, sender-domain verification, cron authentication, and a real test email before enabling subscriber sends.

## Acceptance Criteria

1. A visitor can subscribe, confirm their address, and unsubscribe using emailed links.
2. The administrator can create an issue from arbitrary notes and instructions and generate an editable AI draft.
3. The administrator can preview and test-send the rendered issue.
4. No subscriber email can be sent without explicit administrator confirmation.
5. A confirmed issue can be sent immediately or scheduled, without duplicates if a job repeats.
6. Weekly automation creates a draft/reminder only.
7. Delivery, bounce, complaint, and unsubscribe outcomes update subscriber and issue statistics.
8. Core workflows run locally with fake providers, and the project documents the credentials needed for hosted deployment.
