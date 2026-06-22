-- 0006_rls_events.sql
-- Row-level security for events: open read, host-only direct write.
-- Guest actions (join, chat, waitlist, wrap-up) are handled by SECURITY DEFINER
-- RPC functions in 0007 so guests cannot overwrite an entire event row.
-- Non-destructive: enables RLS and (re)creates policies only.

alter table public.events enable row level security;

-- Any authenticated user can read all events (Discover, EventDetails, etc.).
drop policy if exists events_select_authenticated on public.events;
create policy events_select_authenticated
  on public.events for select
  to authenticated
  using (true);

-- A user may create an event only as themselves (host_id must be the caller).
drop policy if exists events_insert_host on public.events;
create policy events_insert_host
  on public.events for insert
  to authenticated
  with check (host_id = auth.uid());

-- Only the host can directly UPDATE their event (edit details, table note,
-- close/cancel). Guest-driven array changes go through RPCs.
drop policy if exists events_update_host on public.events;
create policy events_update_host
  on public.events for update
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

-- Only the host can delete their event.
drop policy if exists events_delete_host on public.events;
create policy events_delete_host
  on public.events for delete
  to authenticated
  using (host_id = auth.uid());
