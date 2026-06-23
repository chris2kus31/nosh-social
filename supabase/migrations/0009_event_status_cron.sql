-- 0009_event_status_cron.sql
-- Make events.status authoritative by advancing it on a schedule.
--
-- The status column (upcoming | live | completed) was never auto-advanced, so
-- the app derived "past"/"live" from date math everywhere. This adds a single
-- source of truth: a function that transitions events based on start time +
-- duration, run every 5 minutes by pg_cron.
--
-- The client keeps its own date-math fast-path (hasEventEnded) so the UI never
-- waits up to 5 minutes for the cron to catch up; this just keeps the stored
-- column correct for server-side use (live state, future analytics, etc.).
--
-- Non-destructive: create-or-replace only; no rows are deleted.

-- ---------------------------------------------------------------------------
-- Advance every event to the status implied by the current time.
--   upcoming        -> live       once now is within [start, end)
--   upcoming | live -> completed  once now >= end (start + duration, def. 2h)
-- ---------------------------------------------------------------------------
create or replace function public.advance_event_statuses()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Close out anything whose dining window has fully elapsed.
  update public.events
  set status = 'completed'
  where status <> 'completed'
    and date_time is not null
    and now() >= date_time + (coalesce(duration_minutes, 120) || ' minutes')::interval;

  -- Promote anything currently in progress to live.
  update public.events
  set status = 'live'
  where status = 'upcoming'
    and date_time is not null
    and now() >= date_time
    and now() <  date_time + (coalesce(duration_minutes, 120) || ' minutes')::interval;
end;
$$;

-- Only the scheduler (job owner) should run this; lock it down from clients.
revoke all on function public.advance_event_statuses() from public, anon, authenticated;

-- Backfill existing rows immediately so the column is correct right now.
select public.advance_event_statuses();

-- ---------------------------------------------------------------------------
-- Schedule the job. If pg_cron isn't enabled yet, the migration still succeeds
-- and prints how to finish: enable the extension (Dashboard > Database >
-- Extensions > pg_cron), then re-run this block.
-- cron.schedule(name, schedule, command) upserts by job name, so re-running is
-- safe and won't create duplicate jobs.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'advance-event-statuses',
      '*/5 * * * *',
      $cmd$ select public.advance_event_statuses(); $cmd$
    );
    raise notice 'Scheduled cron job "advance-event-statuses" (every 5 minutes).';
  else
    raise notice 'pg_cron not enabled - skipping schedule. Enable it (Database > Extensions > pg_cron), then run: select cron.schedule(''advance-event-statuses'', ''*/5 * * * *'', ''select public.advance_event_statuses();'');';
  end if;
end;
$$;
