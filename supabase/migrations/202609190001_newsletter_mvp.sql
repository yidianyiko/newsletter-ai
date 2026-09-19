create extension if not exists pgcrypto;

create type public.issue_status as enum ('draft', 'ready', 'scheduled', 'sending', 'sent');
create type public.subscriber_status as enum ('pending', 'active', 'unsubscribed', 'bounced', 'complained');
create type public.delivery_status as enum ('queued', 'sent', 'delivered', 'failed', 'bounced', 'complained');

create table public.settings (
  id boolean primary key default true check (id),
  publication_name text not null default 'Letterly',
  description text not null default 'A thoughtful newsletter',
  sender_name text not null,
  sender_email text not null,
  admin_email text not null,
  timezone text not null default 'Asia/Tokyo',
  weekly_day smallint check (weekly_day between 0 and 6),
  weekly_hour smallint check (weekly_hour between 0 and 23),
  last_reminder_week text
);

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  topic text not null default '',
  source_material text not null default '',
  writing_instructions text not null default '',
  subject text not null default '',
  preview_text text not null default '',
  body_markdown text not null default '',
  status public.issue_status not null default 'draft',
  confirmed_at timestamptz,
  scheduled_at timestamptz,
  sent_at timestamptz,
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text generated always as (lower(trim(email))) stored unique,
  status public.subscriber_status not null default 'pending',
  confirmation_token_hash text not null unique,
  unsubscribe_token_hash text not null unique,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  status text not null check (status in ('completed', 'failed')),
  model text,
  output jsonb,
  error text,
  created_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  subscriber_id uuid not null references public.subscribers(id),
  recipient_email text not null,
  status public.delivery_status not null default 'queued',
  provider_message_id text unique,
  attempts integer not null default 0,
  error text,
  unique(issue_id, subscriber_id)
);

create table public.email_events (
  provider_event_id text primary key,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create table public.job_runs (
  job_key text primary key,
  job_type text not null,
  status text not null,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.settings enable row level security;
alter table public.issues enable row level security;
alter table public.subscribers enable row level security;
alter table public.generation_runs enable row level security;
alter table public.deliveries enable row level security;
alter table public.email_events enable row level security;
alter table public.job_runs enable row level security;

create policy "admin reads settings" on public.settings for select to authenticated using ((auth.jwt() ->> 'email') = admin_email);
create policy "admin manages issues" on public.issues for all to authenticated using ((auth.jwt() ->> 'email') = current_setting('app.admin_email', true)) with check ((auth.jwt() ->> 'email') = current_setting('app.admin_email', true));

create index issues_schedule_idx on public.issues(status, scheduled_at);
create index subscribers_status_idx on public.subscribers(status);
create index deliveries_issue_status_idx on public.deliveries(issue_id, status);
