-- 0002_profiles.sql
-- User profiles, 1:1 with auth.users.
-- Phase 1 lean schema: NO subscription / Stripe columns (deferred to Phase 2).
-- notification_preferences is stored but inert (no push/email delivery in Phase 1).
-- Non-destructive: create-if-not-exists only.

create table if not exists public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  email                    text,
  full_name                text,
  bio                      text,
  avatar_url               text,
  home_area                text,
  favorite_cuisines        text[]  not null default '{}',
  reputation_tags          jsonb   not null default '{}'::jsonb,   -- { "Friendly": 3, ... }
  reputation_score         numeric not null default 0,
  connections              uuid[]  not null default '{}',   -- accepted connections
  connection_requests      uuid[]  not null default '{}',   -- incoming pending requests
  sent_requests            uuid[]  not null default '{}',   -- outgoing pending requests
  blocked_users            uuid[]  not null default '{}',
  muted_users              uuid[]  not null default '{}',
  notification_preferences jsonb   not null default '{}'::jsonb,   -- stored, inert in Phase 1
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.profiles is
  'User profiles, 1:1 with auth.users. Phase 1 lean schema (no subscription/Stripe fields).';
comment on column public.profiles.notification_preferences is
  'Stored preferences only; no push/email delivery wired in Phase 1.';
