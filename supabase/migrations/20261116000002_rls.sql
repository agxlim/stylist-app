-- Row-level security. Principles:
--   * Users see and change only their own rows.
--   * Anything that costs money or must not be forged (AI results, usage counters,
--     entitlements, bookings, chat messages) is written only by server code
--     (Edge Functions using the service role, which bypasses RLS).
--   * Users can never change their own `role`.
--   * Stylists never read user tables directly: they get a narrow, time-boxed
--     client brief through get_client_brief() (see next migration).

-- ─── Helpers ──────────────────────────────────────────────────────────────
create or replace function public.is_admin() returns bool
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_stylist_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select s.id from public.stylists s
  join public.profiles p on p.id = s.user_id
  where s.user_id = auth.uid() and p.role = 'stylist';
$$;

revoke execute on function public.is_admin(), public.current_stylist_id() from public;
grant  execute on function public.is_admin(), public.current_stylist_id() to authenticated;

-- ─── Lock everything down, then grant precisely ──────────────────────────
alter table public.profiles         enable row level security;
alter table public.style_profiles   enable row level security;
alter table public.outfit_reviews   enable row level security;
alter table public.chat_threads     enable row level security;
alter table public.chat_messages    enable row level security;
alter table public.usage_counters   enable row level security;
alter table public.daily_usage      enable row level security;
alter table public.entitlements     enable row level security;
alter table public.stylists         enable row level security;
alter table public.availability     enable row level security;
alter table public.bookings         enable row level security;
alter table public.moderation_flags enable row level security;

revoke all on all tables in schema public from anon, authenticated;

-- ─── profiles ─────────────────────────────────────────────────────────────
grant select on public.profiles to authenticated;
-- Column-level grant: role and timestamps-by-server are NOT in this list.
grant update (display_name, birth_year, style_directions, lifestyle, budget_range,
              goals, inspiration_ids, age_confirmed_at, photo_consent_at, quiz_completed_at,
              onboarding_completed_at)
  on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ─── style_profiles / outfit_reviews (server writes; user reads, rates, deletes) ─
grant select, delete on public.style_profiles to authenticated;
create policy style_profiles_select_own on public.style_profiles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy style_profiles_delete_own on public.style_profiles
  for delete to authenticated using (user_id = auth.uid());

grant select, delete on public.outfit_reviews to authenticated;
grant update (feedback) on public.outfit_reviews to authenticated;
create policy outfit_reviews_select_own on public.outfit_reviews
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy outfit_reviews_update_own on public.outfit_reviews
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy outfit_reviews_delete_own on public.outfit_reviews
  for delete to authenticated using (user_id = auth.uid());

-- ─── chat ────────────────────────────────────────────────────────────────
grant select, insert, delete on public.chat_threads to authenticated;
grant update (title) on public.chat_threads to authenticated;
create policy chat_threads_own on public.chat_threads
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Messages are inserted by the server only (so quota can't be bypassed).
grant select on public.chat_messages to authenticated;
grant update (feedback) on public.chat_messages to authenticated;
create policy chat_messages_select_own on public.chat_messages
  for select to authenticated using (user_id = auth.uid());
create policy chat_messages_rate_own on public.chat_messages
  for update to authenticated using (user_id = auth.uid() and role = 'assistant')
  with check (user_id = auth.uid());

-- ─── usage / entitlements (read-only for users) ──────────────────────────
grant select on public.usage_counters, public.daily_usage, public.entitlements to authenticated;
create policy usage_select_own on public.usage_counters
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy daily_usage_select_own on public.daily_usage
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy entitlements_select_own on public.entitlements
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ─── stylists (public directory; admins manage) ──────────────────────────
grant select on public.stylists to authenticated;
grant insert, update, delete on public.stylists to authenticated;  -- narrowed by policies
create policy stylists_select on public.stylists
  for select to authenticated
  using (active or user_id = auth.uid() or public.is_admin());
create policy stylists_admin_write on public.stylists
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── availability ────────────────────────────────────────────────────────
-- Users see open future slots; stylists manage their own unbooked slots; admins everything.
grant select, insert, update, delete on public.availability to authenticated;
create policy availability_select on public.availability
  for select to authenticated using (
    (not is_booked and starts_at > now()
       and exists (select 1 from public.stylists s where s.id = stylist_id and s.active))
    or stylist_id = public.current_stylist_id()
    or public.is_admin()
  );
create policy availability_stylist_insert on public.availability
  for insert to authenticated
  with check (stylist_id = public.current_stylist_id() and not is_booked and held_by is null);
create policy availability_stylist_update on public.availability
  for update to authenticated
  using (stylist_id = public.current_stylist_id() and not is_booked)
  with check (stylist_id = public.current_stylist_id() and not is_booked and held_by is null);
create policy availability_stylist_delete on public.availability
  for delete to authenticated
  using (stylist_id = public.current_stylist_id() and not is_booked
         and (held_until is null or held_until < now()));
create policy availability_admin on public.availability
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── bookings (server creates and transitions; users/stylists read) ──────
grant select on public.bookings to authenticated;
create policy bookings_select on public.bookings
  for select to authenticated using (
    user_id = auth.uid()
    or stylist_id = public.current_stylist_id()
    or public.is_admin()
  );

-- ─── moderation (admins only) ────────────────────────────────────────────
grant select, update on public.moderation_flags to authenticated;
create policy moderation_admin on public.moderation_flags
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Future tables must opt in explicitly.
alter default privileges in schema public revoke all on tables from anon, authenticated;
