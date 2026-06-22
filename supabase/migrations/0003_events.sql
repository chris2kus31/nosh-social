-- 0003_events.sql
-- Nosh events. Mirrors the Base44 NoshEvent entity.
-- Nested collections (attendees, chat_messages, waitlist, wrap_up_responses) are
-- stored as JSONB arrays to match the web app's whole-array update pattern.
-- Non-destructive: create-if-not-exists only.

create table if not exists public.events (
  id                   uuid primary key default extensions.gen_random_uuid(),

  -- Venue
  venue_type           text not null default 'restaurant',   -- 'restaurant' | 'custom'
  venue_name           text,
  venue_address        text,
  cuisine_type         text,
  price_range          text default '$$',
  map_link             text,
  review_link          text,                                  -- venue review URL (from venue data)
  latitude             double precision,
  longitude            double precision,
  rating               numeric  default 0,
  rating_count         integer  default 0,
  image_url            text,

  -- Details
  title                text not null,
  date_time            timestamptz,
  duration_minutes     integer not null default 120,
  duration_type        text default 'fixed',
  min_seats            integer not null default 2,
  max_seats            integer not null default 4,
  allow_latecomers     boolean not null default true,

  -- Vibe & intent
  vibe                 text[]  not null default '{}',
  host_intent_tags     text[]  not null default '{}',
  topics_to_avoid      text,
  icebreaker           text,
  description          text,
  is_private           boolean not null default false,
  lgbtq_only           boolean not null default false,
  lgbtq_friendly       boolean not null default false,

  -- Host snapshot (denormalized, matches web app)
  host_id              uuid not null references public.profiles (id) on delete cascade,
  host_name            text,
  host_bio             text,
  host_avatar          text,
  host_reputation_tags jsonb not null default '[]'::jsonb,    -- [{ tag, count }]
  host_table_note      text,

  -- State
  status               text not null default 'upcoming',      -- upcoming | live | completed
  seats_taken          integer not null default 0,
  closed_at            timestamptz,

  -- Nested collections (whole-array update pattern)
  attendees            jsonb not null default '[]'::jsonb,
  chat_messages        jsonb not null default '[]'::jsonb,
  waitlist             jsonb not null default '[]'::jsonb,
  wrap_up_responses    jsonb not null default '[]'::jsonb,
  photos               jsonb not null default '[]'::jsonb,    -- live gallery: [{ url, uploaded_by_name }]

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists events_host_id_idx   on public.events (host_id);
create index if not exists events_date_time_idx  on public.events (date_time desc);
create index if not exists events_status_idx     on public.events (status);

comment on table public.events is
  'Nosh events. Attendees/chat/waitlist/wrap-up stored as JSONB arrays (web-app parity).';
