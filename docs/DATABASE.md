# Nosh Social — Database Documentation

Backend: hosted **Supabase** (Postgres 17), project ref `iavekjcrywtmdfdofwwa`,
region `us-east-2`. No local database is used.

This schema is reverse-engineered from the original Base44 web app and verified
field-by-field against its page/component usage. It is the **Phase 1 lean schema**:
subscriptions, push/email delivery, background location, and gamification cosmetics
are intentionally deferred (see [Deferred fields](#deferred-fields-phase-2)).

- Source of truth: `supabase/migrations/0001`–`0008`
- Two core tables: [`profiles`](#table-profiles) and [`events`](#table-events)
- Guest writes go through [gatekeeper RPC functions](#rpc-functions), not direct table writes

---

## Table: `profiles`

One row per user, 1:1 with `auth.users`. Created automatically on signup by the
`handle_new_user` trigger.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | — | PK, FK to `auth.users(id)` on delete cascade |
| `email` | text | — | copied from auth on signup |
| `full_name` | text | — | |
| `bio` | text | — | |
| `avatar_url` | text | — | Supabase Storage URL |
| `home_area` | text | — | city / region |
| `favorite_cuisines` | text[] | `{}` | |
| `reputation_tags` | jsonb | `{}` | map of `tag -> count`, e.g. `{"Friendly": 3}` |
| `reputation_score` | numeric | `0` | sum of tag counts (recomputed by `process_reputation`) |
| `connections` | uuid[] | `{}` | accepted connections |
| `connection_requests` | uuid[] | `{}` | incoming pending requests |
| `sent_requests` | uuid[] | `{}` | outgoing pending requests |
| `blocked_users` | uuid[] | `{}` | |
| `muted_users` | uuid[] | `{}` | |
| `notification_preferences` | jsonb | `{}` | stored only, inert in Phase 1 (see below) |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | auto-touched by trigger |

### `notification_preferences` shape (JSONB, inert in Phase 1)
No push/email is delivered in Phase 1; this is stored for the Profile screen only.
```json
{
  "enabled": true,
  "notify_cuisines": ["Italian"],
  "notify_price_ranges": ["$$"],
  "notify_vibes": ["Casual & Relaxed"],
  "within_distance_only": true,
  "connections_events": true,
  "last_minute_openings": false,
  "new_in_area": true,
  "min_seats_available": 1
}
```

---

## Table: `events`

One row per Nosh event. Nested collections are stored as JSONB arrays to match the
web app's whole-array update pattern; they are mutated through RPC functions so a
guest cannot overwrite an entire event.

### Venue
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `venue_type` | text | `'restaurant'` | `restaurant` or `custom` |
| `venue_name` | text | — | |
| `venue_address` | text | — | |
| `cuisine_type` | text | — | |
| `price_range` | text | `'$$'` | `$`–`$$$$` |
| `map_link` | text | — | Google Maps link |
| `review_link` | text | — | venue review URL (from venue data) |
| `latitude` | double precision | — | |
| `longitude` | double precision | — | |
| `rating` | numeric | `0` | venue rating |
| `rating_count` | integer | `0` | |
| `image_url` | text | — | venue / event image |

### Details
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `title` | text | — | required |
| `date_time` | timestamptz | — | event start |
| `duration_minutes` | integer | `120` | |
| `duration_type` | text | `'fixed'` | `fixed` or `open-ended` |
| `min_seats` | integer | `2` | |
| `max_seats` | integer | `4` | |
| `allow_latecomers` | boolean | `true` | |

### Vibe & intent
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `vibe` | text[] | `{}` | |
| `host_intent_tags` | text[] | `{}` | |
| `topics_to_avoid` | text | — | |
| `icebreaker` | text | — | |
| `description` | text | — | |
| `is_private` | boolean | `false` | |
| `lgbtq_only` | boolean | `false` | |
| `lgbtq_friendly` | boolean | `false` | |

### Host snapshot (denormalized, matches web app)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `host_id` | uuid | — | FK to `profiles(id)` on delete cascade |
| `host_name` | text | — | |
| `host_bio` | text | — | |
| `host_avatar` | text | — | |
| `host_reputation_tags` | jsonb | `[]` | top 3 `[{tag, count}]` |
| `host_table_note` | text | — | set live by host |

### State
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `status` | text | `'upcoming'` | `upcoming` / `live` / `completed` — display status is also derived client-side from `date_time` |
| `seats_taken` | integer | `0` | kept in sync by RPCs |
| `closed_at` | timestamptz | — | set when host closes the event |

### Nested collections (JSONB arrays)
| Column | Type | Default | Element shape |
|--------|------|---------|---------------|
| `attendees` | jsonb | `[]` | see [attendee](#attendee) |
| `chat_messages` | jsonb | `[]` | see [chat message](#chat-message) |
| `waitlist` | jsonb | `[]` | see [waitlist entry](#waitlist-entry) |
| `wrap_up_responses` | jsonb | `[]` | see [wrap-up response](#wrap-up-response) |
| `photos` | jsonb | `[]` | see [photo](#photo) |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | auto-touched by trigger |

### Indexes
`events_host_id_idx (host_id)`, `events_date_time_idx (date_time desc)`, `events_status_idx (status)`.

---

## Nested JSONB shapes

### attendee
```json
{
  "user_id": "uuid",
  "name": "Jane D",
  "avatar": "https://…",
  "bio": "…",
  "traits": [{ "tag": "Friendly", "count": 3 }],
  "arrival_status": "on_the_way"   // on_the_way | arrived | late
}
```

### chat message
```json
{
  "user_id": "uuid",
  "user_name": "Jane D",
  "message": "Running 5 min late!",
  "timestamp": "2026-06-19T12:00:00Z",
  "is_announcement": false          // host-only when true
}
```

### waitlist entry
```json
{ "user_id": "uuid", "user_name": "Jane D", "joined_at": "2026-06-19T12:00:00Z" }
```

### wrap-up response
```json
{
  "user_id": "uuid",
  "user_name": "Jane D",
  "tags_given": [
    { "to_user_id": "uuid", "to_user_name": "Bob R", "tags": ["Friendly", "On Time"] }
  ],
  "would_dine_again": true,
  "completed_at": "2026-06-19T15:00:00Z"
}
```

### photo
```json
{ "url": "https://…", "uploaded_by_name": "Jane D" }
```

---

## Security model (RLS)

RLS is enabled on both tables.

### `profiles`
| Action | Policy |
|--------|--------|
| SELECT | any authenticated user (needed for Discover, attendee lists, UserProfile) |
| INSERT | self only (`id = auth.uid()`); normally handled by signup trigger |
| UPDATE | self only |
| DELETE | none (cascades from `auth.users`) |

### `events`
| Action | Policy |
|--------|--------|
| SELECT | any authenticated user |
| INSERT | host only (`host_id = auth.uid()`) |
| UPDATE | host only (direct edits) |
| DELETE | host only |

Guest-driven changes (join, chat, waitlist, wrap-up, arrival status) are **not**
direct UPDATEs — they go through the RPC functions below, which validate the caller
and only modify the specific element they own. This prevents a guest from
overwriting an entire event row and makes array updates atomic (`SELECT … FOR
UPDATE`), fixing "two people join at once" races.

---

## RPC functions

All are `SECURITY DEFINER`, run with `search_path = public`, and are granted to the
`authenticated` role only (revoked from `public`/`anon`). Each one locks the event
row and validates the caller before writing.

| Function | Caller | Effect |
|----------|--------|--------|
| `join_event(event_id)` | any auth user | adds caller to `attendees` if a seat is free; bumps `seats_taken` |
| `leave_event(event_id)` | any auth user | removes caller from `attendees`; updates `seats_taken` |
| `send_chat_message(event_id, message, is_announcement)` | host or attendee | appends to `chat_messages`; announcements host-only |
| `set_arrival_status(event_id, user_id, status)` | host (anyone) / self | sets attendee `arrival_status` (`on_the_way`/`arrived`/`late`) |
| `join_waitlist(event_id)` | any auth user | appends caller to `waitlist` |
| `approve_waitlist(event_id, user_id)` | host | moves a waitlisted user into `attendees` if seats free |
| `reject_waitlist(event_id, user_id)` | host | removes a user from `waitlist` |
| `submit_wrap_up(event_id, tags_given, would_dine_again)` | any auth user | appends to `wrap_up_responses` and applies reputation tags to tagged users |
| `manage_connection(target_user_id, action)` | any auth user | `request` / `accept` / `reject` / `remove`; maintains `connections`, `connection_requests`, `sent_requests` |
| `process_reputation(user_id)` | internal | recomputes `reputation_score`; called by `submit_wrap_up` (no direct client grant) |

### Calling from the app (example)
```ts
// Join an event
const { data, error } = await supabase.rpc('join_event', { p_event_id: eventId });

// Send a chat message
await supabase.rpc('send_chat_message', {
  p_event_id: eventId,
  p_message: text,
  p_is_announcement: false,
});
```

---

## Storage

Two public-read buckets, authenticated upload, owners manage their own objects.

| Bucket | Use |
|--------|-----|
| `avatars` | profile photos |
| `event-photos` | venue/event images and the live gallery |

---

## Deferred fields (Phase 2)

These exist in the Base44 web app but are **intentionally not built** in Phase 1.
They will be added with their feature later.

| Field / area | Reason deferred |
|--------------|-----------------|
| `subscription_status`, `subscription_tier`, `current_period_end`, `cancel_at_period_end` | subscriptions / Stripe |
| `total_donated`, `donor_badge` | donations |
| `selected_badge` | cosmetic / subscription badge |
| `nosher_level` | gamification level (can derive from `reputation_score` later) |
| push notifications, automated email | no delivery engine in Phase 1 |
| background location | host check is foreground-only, matching web |
| PostGIS distance queries | distance filtered client-side in Phase 1 |

---

## Applying migrations

Migrations target the hosted project (no local DB).

```bash
# Option A — Supabase CLI
supabase link --project-ref iavekjcrywtmdfdofwwa
supabase db push

# Option B — direct psql (session pooler, IPv4)
#   host: aws-1-us-east-2.pooler.supabase.com  port: 5432
#   user: postgres.iavekjcrywtmdfdofwwa        db:   postgres
#   (DB password is in the project credentials doc — never commit it)
```

> Migrations are non-destructive: `create … if not exists`, `create or replace`,
> `add column if not exists`, and `insert … on conflict do nothing`. There are no
> `drop table` / `delete` / `truncate` statements.
