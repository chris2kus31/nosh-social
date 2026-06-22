-- 0005_rls_profiles.sql
-- Row-level security for profiles: open read, self-only write.
-- Non-destructive: enables RLS and (re)creates policies only.

alter table public.profiles enable row level security;

-- Any authenticated user can read all profiles
-- (needed for Discover, attendee lists, UserProfile).
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (true);

-- A user may insert their own profile row (fallback; the signup trigger
-- normally creates it).
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- A user may update only their own row.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Note: no DELETE policy -> profile deletion only cascades from auth.users.
