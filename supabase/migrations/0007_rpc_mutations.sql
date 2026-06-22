-- 0007_rpc_mutations.sql
-- Gatekeeper RPC functions for guest-driven event changes.
--
-- These run as SECURITY DEFINER so they can write to events that the caller
-- does not own, BUT each function validates the caller and only appends/edits
-- the specific JSONB element it is responsible for. This prevents a guest from
-- overwriting an entire event row (which the open web app allowed) and makes the
-- array updates atomic (row is locked with SELECT ... FOR UPDATE), fixing the
-- "two people join at once" race condition.
--
-- Non-destructive: create-or-replace functions only; no data is deleted.

-- ---------------------------------------------------------------------------
-- Recompute a user's reputation_score from their reputation_tags map.
-- ---------------------------------------------------------------------------
create or replace function public.process_reputation(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score numeric;
begin
  select coalesce(sum((t.value)::numeric), 0)
  into v_score
  from public.profiles p,
       lateral jsonb_each_text(coalesce(p.reputation_tags, '{}'::jsonb)) as t(key, value)
  where p.id = p_user_id;

  update public.profiles set reputation_score = coalesce(v_score, 0) where id = p_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Join an event (append caller to attendees if a seat is free).
-- ---------------------------------------------------------------------------
create or replace function public.join_event(p_event_id uuid)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_event   public.events;
  v_profile public.profiles;
  v_traits  jsonb;
  v_attendee jsonb;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;

  if exists (
    select 1 from jsonb_array_elements(v_event.attendees) a
    where a ->> 'user_id' = v_uid::text
  ) then
    raise exception 'Already joined';
  end if;

  if jsonb_array_length(v_event.attendees) >= v_event.max_seats then
    raise exception 'No seats available';
  end if;

  select * into v_profile from public.profiles where id = v_uid;

  -- Top 3 reputation tags as [{tag, count}].
  select coalesce(jsonb_agg(jsonb_build_object('tag', t.key, 'count', t.cnt) order by t.cnt desc), '[]'::jsonb)
  into v_traits
  from (
    select key, (value)::numeric as cnt
    from jsonb_each_text(coalesce(v_profile.reputation_tags, '{}'::jsonb))
    order by (value)::numeric desc
    limit 3
  ) t;

  v_attendee := jsonb_build_object(
    'user_id', v_uid,
    'name', coalesce(v_profile.full_name, v_profile.email, 'Guest'),
    'avatar', v_profile.avatar_url,
    'bio', v_profile.bio,
    'traits', coalesce(v_traits, '[]'::jsonb),
    'arrival_status', 'on_the_way'
  );

  update public.events
  set attendees = attendees || v_attendee,
      seats_taken = jsonb_array_length(attendees) + 1
  where id = p_event_id
  returning * into v_event;

  return v_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Leave an event (remove caller from attendees).
-- ---------------------------------------------------------------------------
create or replace function public.leave_event(p_event_id uuid)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_event public.events;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;

  update public.events
  set attendees = coalesce((
        select jsonb_agg(a)
        from jsonb_array_elements(attendees) a
        where a ->> 'user_id' <> v_uid::text
      ), '[]'::jsonb)
  where id = p_event_id
  returning * into v_event;

  update public.events
  set seats_taken = jsonb_array_length(attendees)
  where id = p_event_id
  returning * into v_event;

  return v_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Send a chat message (host or attendee). Announcements are host-only.
-- ---------------------------------------------------------------------------
create or replace function public.send_chat_message(
  p_event_id uuid,
  p_message text,
  p_is_announcement boolean default false
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_event   public.events;
  v_profile public.profiles;
  v_is_host boolean;
  v_msg     jsonb;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if coalesce(btrim(p_message), '') = '' then raise exception 'Empty message'; end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;

  v_is_host := (v_event.host_id = v_uid);

  if not v_is_host and not exists (
    select 1 from jsonb_array_elements(v_event.attendees) a
    where a ->> 'user_id' = v_uid::text
  ) then
    raise exception 'Not a participant';
  end if;

  if coalesce(p_is_announcement, false) and not v_is_host then
    raise exception 'Only the host can post announcements';
  end if;

  select * into v_profile from public.profiles where id = v_uid;

  v_msg := jsonb_build_object(
    'user_id', v_uid,
    'user_name', coalesce(v_profile.full_name, v_profile.email, 'Guest'),
    'message', p_message,
    'timestamp', now(),
    'is_announcement', coalesce(p_is_announcement, false)
  );

  update public.events
  set chat_messages = chat_messages || v_msg
  where id = p_event_id
  returning * into v_event;

  return v_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Set arrival status. Host can set anyone's; a guest can set only their own.
-- ---------------------------------------------------------------------------
create or replace function public.set_arrival_status(
  p_event_id uuid,
  p_user_id uuid,
  p_status text
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_event public.events;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('on_the_way', 'arrived', 'late') then
    raise exception 'Invalid status';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;

  if v_event.host_id <> v_uid and p_user_id <> v_uid then
    raise exception 'Not allowed';
  end if;

  update public.events
  set attendees = (
    select coalesce(jsonb_agg(
      case when a ->> 'user_id' = p_user_id::text
           then a || jsonb_build_object('arrival_status', p_status)
           else a end
    ), '[]'::jsonb)
    from jsonb_array_elements(attendees) a
  )
  where id = p_event_id
  returning * into v_event;

  return v_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Join the waitlist (append caller).
-- ---------------------------------------------------------------------------
create or replace function public.join_waitlist(p_event_id uuid)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_event   public.events;
  v_profile public.profiles;
  v_entry   jsonb;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;

  if exists (
    select 1 from jsonb_array_elements(v_event.waitlist) w
    where w ->> 'user_id' = v_uid::text
  ) then
    raise exception 'Already on waitlist';
  end if;

  select * into v_profile from public.profiles where id = v_uid;

  v_entry := jsonb_build_object(
    'user_id', v_uid,
    'user_name', coalesce(v_profile.full_name, v_profile.email, 'Guest'),
    'joined_at', now()
  );

  update public.events
  set waitlist = waitlist || v_entry
  where id = p_event_id
  returning * into v_event;

  return v_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Approve a waitlisted user (host only): move from waitlist to attendees.
-- ---------------------------------------------------------------------------
create or replace function public.approve_waitlist(
  p_event_id uuid,
  p_user_id uuid
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_event    public.events;
  v_profile  public.profiles;
  v_waiter   jsonb;
  v_traits   jsonb;
  v_attendee jsonb;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;
  if v_event.host_id <> v_uid then raise exception 'Only the host can approve'; end if;

  select w into v_waiter
  from jsonb_array_elements(v_event.waitlist) w
  where w ->> 'user_id' = p_user_id::text
  limit 1;
  if v_waiter is null then raise exception 'User not on waitlist'; end if;

  if jsonb_array_length(v_event.attendees) >= v_event.max_seats then
    raise exception 'No seats available';
  end if;

  if exists (
    select 1 from jsonb_array_elements(v_event.attendees) a
    where a ->> 'user_id' = p_user_id::text
  ) then
    raise exception 'Already an attendee';
  end if;

  select * into v_profile from public.profiles where id = p_user_id;

  select coalesce(jsonb_agg(jsonb_build_object('tag', t.key, 'count', t.cnt) order by t.cnt desc), '[]'::jsonb)
  into v_traits
  from (
    select key, (value)::numeric as cnt
    from jsonb_each_text(coalesce(v_profile.reputation_tags, '{}'::jsonb))
    order by (value)::numeric desc
    limit 3
  ) t;

  v_attendee := jsonb_build_object(
    'user_id', p_user_id,
    'name', coalesce(v_profile.full_name, v_profile.email, 'Guest'),
    'avatar', v_profile.avatar_url,
    'bio', v_profile.bio,
    'traits', coalesce(v_traits, '[]'::jsonb),
    'arrival_status', 'on_the_way'
  );

  update public.events
  set attendees   = attendees || v_attendee,
      waitlist    = coalesce((
                      select jsonb_agg(w)
                      from jsonb_array_elements(waitlist) w
                      where w ->> 'user_id' <> p_user_id::text
                    ), '[]'::jsonb),
      seats_taken = jsonb_array_length(attendees) + 1
  where id = p_event_id
  returning * into v_event;

  return v_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reject a waitlisted user (host only): remove from waitlist.
-- ---------------------------------------------------------------------------
create or replace function public.reject_waitlist(
  p_event_id uuid,
  p_user_id uuid
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_event public.events;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;
  if v_event.host_id <> v_uid then raise exception 'Only the host can reject'; end if;

  update public.events
  set waitlist = coalesce((
        select jsonb_agg(w)
        from jsonb_array_elements(waitlist) w
        where w ->> 'user_id' <> p_user_id::text
      ), '[]'::jsonb)
  where id = p_event_id
  returning * into v_event;

  return v_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Submit a wrap-up: append the caller's response and apply reputation tags
-- to the people they tagged.
--   p_tags_given : [{ to_user_id, to_user_name, tags: [text] }]
-- ---------------------------------------------------------------------------
create or replace function public.submit_wrap_up(
  p_event_id uuid,
  p_tags_given jsonb,
  p_would_dine_again boolean
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_event    public.events;
  v_profile  public.profiles;
  v_response jsonb;
  v_tagrec   jsonb;
  v_tag      text;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;

  if exists (
    select 1 from jsonb_array_elements(v_event.wrap_up_responses) r
    where r ->> 'user_id' = v_uid::text
  ) then
    raise exception 'Wrap-up already submitted';
  end if;

  select * into v_profile from public.profiles where id = v_uid;

  v_response := jsonb_build_object(
    'user_id', v_uid,
    'user_name', coalesce(v_profile.full_name, v_profile.email, 'Guest'),
    'tags_given', coalesce(p_tags_given, '[]'::jsonb),
    'would_dine_again', p_would_dine_again,
    'completed_at', now()
  );

  update public.events
  set wrap_up_responses = wrap_up_responses || v_response
  where id = p_event_id
  returning * into v_event;

  -- Apply each tag to its recipient's reputation_tags map (increment count).
  for v_tagrec in
    select value from jsonb_array_elements(coalesce(p_tags_given, '[]'::jsonb))
  loop
    if (v_tagrec ->> 'to_user_id') is null then continue; end if;

    for v_tag in
      select value from jsonb_array_elements_text(coalesce(v_tagrec -> 'tags', '[]'::jsonb))
    loop
      update public.profiles
      set reputation_tags = jsonb_set(
            coalesce(reputation_tags, '{}'::jsonb),
            array[v_tag],
            to_jsonb(coalesce((reputation_tags ->> v_tag)::numeric, 0) + 1)
          )
      where id = (v_tagrec ->> 'to_user_id')::uuid;
    end loop;

    perform public.process_reputation((v_tagrec ->> 'to_user_id')::uuid);
  end loop;

  return v_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Manage a connection between the caller and a target user.
--   p_action : 'request' | 'accept' | 'reject' | 'remove'
-- ---------------------------------------------------------------------------
create or replace function public.manage_connection(
  p_target_user_id uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_target_user_id = v_uid then raise exception 'Cannot connect to yourself'; end if;

  if p_action = 'request' then
    -- Record the outgoing request on the caller (unless already connected).
    update public.profiles
    set sent_requests = (
      select coalesce(array_agg(distinct x), '{}')
      from unnest(sent_requests || p_target_user_id) x
    )
    where id = v_uid
      and not (p_target_user_id = any(connections));

    -- Record the incoming request on the target (unless already connected).
    update public.profiles
    set connection_requests = (
      select coalesce(array_agg(distinct x), '{}')
      from unnest(connection_requests || v_uid) x
    )
    where id = p_target_user_id
      and not (v_uid = any(connections));

  elsif p_action = 'accept' then
    -- Caller accepts a request from the target: connect both, clear pending state.
    update public.profiles
    set connections = (select coalesce(array_agg(distinct x), '{}') from unnest(connections || p_target_user_id) x),
        connection_requests = array_remove(connection_requests, p_target_user_id),
        sent_requests = array_remove(sent_requests, p_target_user_id)
    where id = v_uid;

    update public.profiles
    set connections = (select coalesce(array_agg(distinct x), '{}') from unnest(connections || v_uid) x),
        sent_requests = array_remove(sent_requests, v_uid),
        connection_requests = array_remove(connection_requests, v_uid)
    where id = p_target_user_id;

  elsif p_action = 'reject' then
    -- Caller rejects the target's incoming request; clear the target's sent record.
    update public.profiles
    set connection_requests = array_remove(connection_requests, p_target_user_id)
    where id = v_uid;

    update public.profiles
    set sent_requests = array_remove(sent_requests, v_uid)
    where id = p_target_user_id;

  elsif p_action = 'remove' then
    -- Remove an accepted connection (or cancel a pending one) on both sides.
    update public.profiles
    set connections = array_remove(connections, p_target_user_id),
        sent_requests = array_remove(sent_requests, p_target_user_id),
        connection_requests = array_remove(connection_requests, p_target_user_id)
    where id = v_uid;

    update public.profiles
    set connections = array_remove(connections, v_uid),
        sent_requests = array_remove(sent_requests, v_uid),
        connection_requests = array_remove(connection_requests, v_uid)
    where id = p_target_user_id;

  else
    raise exception 'Invalid action: %', p_action;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions: these SECURITY DEFINER functions must be callable only by
-- authenticated users (not anon / public).
-- ---------------------------------------------------------------------------
revoke all on function public.process_reputation(uuid) from public, anon;
revoke all on function public.join_event(uuid) from public, anon;
revoke all on function public.leave_event(uuid) from public, anon;
revoke all on function public.send_chat_message(uuid, text, boolean) from public, anon;
revoke all on function public.set_arrival_status(uuid, uuid, text) from public, anon;
revoke all on function public.join_waitlist(uuid) from public, anon;
revoke all on function public.approve_waitlist(uuid, uuid) from public, anon;
revoke all on function public.reject_waitlist(uuid, uuid) from public, anon;
revoke all on function public.submit_wrap_up(uuid, jsonb, boolean) from public, anon;
revoke all on function public.manage_connection(uuid, text) from public, anon;

grant execute on function public.join_event(uuid) to authenticated;
grant execute on function public.leave_event(uuid) to authenticated;
grant execute on function public.send_chat_message(uuid, text, boolean) to authenticated;
grant execute on function public.set_arrival_status(uuid, uuid, text) to authenticated;
grant execute on function public.join_waitlist(uuid) to authenticated;
grant execute on function public.approve_waitlist(uuid, uuid) to authenticated;
grant execute on function public.reject_waitlist(uuid, uuid) to authenticated;
grant execute on function public.submit_wrap_up(uuid, jsonb, boolean) to authenticated;
grant execute on function public.manage_connection(uuid, text) to authenticated;
-- process_reputation is called internally by submit_wrap_up; no direct client grant.
