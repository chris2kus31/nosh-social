# Nosh Social — Mobile App

Single repository for the Nosh Social mobile app (Expo / React Native) and its
Supabase backend. Built backend-first: the database schema and security policies
live here now; the Expo app code is added in later phases.

> Ownership: transfers to Robert Orcutt (Thread & Ledger LLC) at handoff.
> All operator credentials are rotated before handoff.

## Structure

```
supabase/
  config.toml          Supabase project config
  migrations/          Version-controlled SQL (schema, RLS, functions, storage)
app/        (later)    React Native screens (Expo Router)
components/ (later)    UI components
lib/        (later)    Supabase client + helpers
```

## Backend: applying migrations

The migrations target the hosted Supabase project (no local database is used).

**Option A — Supabase CLI**

```bash
supabase link --project-ref iavekjcrywtmdfdofwwa
supabase db push
```

**Option B — Dashboard SQL Editor**

Paste each file in `supabase/migrations/` in numeric order into the SQL Editor
at https://supabase.com/dashboard and run them.

## Phase 1 scope

Lean schema for the 11-screen Phase 1 build. Deferred to Phase 2 (not in these
migrations): subscriptions/Stripe, push notifications, automated email,
background location, PostGIS distance queries.

## Data model

The schema is reverse-engineered from the original Base44 web app. Two core
tables: `profiles` (1:1 with `auth.users`) and `events` (with attendees, chat,
waitlist, wrap-up responses, and photos stored as JSONB arrays).

Guest actions (join, chat, waitlist, wrap-up) go through `security definer` RPC
functions so guests cannot overwrite an entire event row; only the host can edit
the event directly.

Full data dictionary, JSONB shapes, RLS rules, and RPC reference:
[`docs/DATABASE.md`](docs/DATABASE.md).
