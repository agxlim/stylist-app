-- Photo storage, quota enforcement and the stylist client brief.

-- ─── Storage: private user photos ─────────────────────────────────────────
-- Layout: user-photos/{user_id}/{kind}/{uuid}.jpg
-- The browser re-encodes every image to JPEG (which strips EXIF/GPS) before upload,
-- so only image/jpeg is accepted. Nobody but the owner can read via the API;
-- server code (service role) creates short-lived signed URLs for AI calls and stylists.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-photos', 'user-photos', false, 5 * 1024 * 1024, array['image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy user_photos_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'user-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy user_photos_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy user_photos_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = auth.uid()::text);
-- No update policy: photos are immutable once uploaded (re-upload under a new name instead).

-- ─── Plans & quota ────────────────────────────────────────────────────────
-- Keep these numbers in sync with src/lib/constants.ts (PLAN_LIMITS).
create or replace function public.plan_limit(p_tier public.tier, p_kind text) returns int
language sql immutable as $$
  select case
    when p_kind = 'daily_ai_calls'                     then 50
    when p_tier = 'plus'                               then null   -- unlimited monthly (daily cap still applies)
    when p_kind = 'outfit_review'                      then 3
    when p_kind = 'chat_message'                       then 20
    else null
  end;
$$;

create or replace function public.effective_tier(p_user_id uuid) returns public.tier
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select 'plus'::public.tier from public.entitlements e
    where e.user_id = p_user_id
      and e.tier = 'plus'
      and e.status in ('active', 'trialing')
      and (e.current_period_end is null or e.current_period_end > now())
  ), 'free'::public.tier);
$$;

-- Atomically checks and consumes one unit of quota. Called only by server code
-- BEFORE an AI call; if the AI call fails, call refund_quota() with the same kind.
-- p_kind: 'style_profile' | 'outfit_review' | 'chat_message'
-- Returns: {"allowed": bool, "reason": text|null, "tier": text, "used": int|null, "limit": int|null}
create or replace function public.consume_quota(p_user_id uuid, p_kind text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_tier    public.tier := public.effective_tier(p_user_id);
  v_month   date := date_trunc('month', now() at time zone 'utc')::date;
  v_day     date := (now() at time zone 'utc')::date;
  v_daily   int;
  v_used    int;
  v_limit   int;
begin
  if p_kind not in ('style_profile', 'outfit_review', 'chat_message') then
    raise exception 'unknown quota kind %', p_kind using errcode = '22023';
  end if;

  -- Ensure counter rows exist, then lock them for the rest of the transaction.
  insert into public.daily_usage (user_id, day) values (p_user_id, v_day)
    on conflict do nothing;
  insert into public.usage_counters (user_id, period_start) values (p_user_id, v_month)
    on conflict do nothing;

  select ai_calls into v_daily from public.daily_usage
    where user_id = p_user_id and day = v_day for update;

  if v_daily >= public.plan_limit(v_tier, 'daily_ai_calls') then
    return jsonb_build_object('allowed', false, 'reason', 'daily_cap', 'tier', v_tier,
                              'used', v_daily, 'limit', public.plan_limit(v_tier, 'daily_ai_calls'));
  end if;

  if p_kind = 'style_profile' then
    -- Free users get one style profile; re-analysis is a Plus feature.
    if v_tier = 'free' and exists (
      select 1 from public.style_profiles
      where user_id = p_user_id and status in ('pending', 'ready')
    ) then
      return jsonb_build_object('allowed', false, 'reason', 'rerun_requires_plus', 'tier', v_tier,
                                'used', null, 'limit', null);
    end if;
  else
    v_limit := public.plan_limit(v_tier, p_kind);
    select case p_kind when 'outfit_review' then outfit_reviews else chat_messages end
      into v_used
      from public.usage_counters
      where user_id = p_user_id and period_start = v_month for update;

    if v_limit is not null and v_used >= v_limit then
      return jsonb_build_object('allowed', false, 'reason', 'monthly_limit', 'tier', v_tier,
                                'used', v_used, 'limit', v_limit);
    end if;

    update public.usage_counters set
      outfit_reviews = outfit_reviews + (p_kind = 'outfit_review')::int,
      chat_messages  = chat_messages  + (p_kind = 'chat_message')::int
    where user_id = p_user_id and period_start = v_month;
    v_used := v_used + 1;
  end if;

  update public.daily_usage set ai_calls = ai_calls + 1
    where user_id = p_user_id and day = v_day;

  return jsonb_build_object('allowed', true, 'reason', null, 'tier', v_tier,
                            'used', v_used, 'limit', v_limit);
end $$;

-- Gives back one unit after a failed AI call ("no quota consumed on failure").
create or replace function public.refund_quota(p_user_id uuid, p_kind text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_month date := date_trunc('month', now() at time zone 'utc')::date;
  v_day   date := (now() at time zone 'utc')::date;
begin
  update public.daily_usage set ai_calls = greatest(ai_calls - 1, 0)
    where user_id = p_user_id and day = v_day;
  if p_kind in ('outfit_review', 'chat_message') then
    update public.usage_counters set
      outfit_reviews = greatest(outfit_reviews - (p_kind = 'outfit_review')::int, 0),
      chat_messages  = greatest(chat_messages  - (p_kind = 'chat_message')::int, 0)
    where user_id = p_user_id and period_start = v_month;
  end if;
end $$;

-- Read-only usage summary for the signed-in user (drives the quota meter UI).
create or replace function public.my_usage() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'tier', public.effective_tier(auth.uid()),
    'outfit_reviews', coalesce(u.outfit_reviews, 0),
    'chat_messages',  coalesce(u.chat_messages, 0),
    'outfit_review_limit', public.plan_limit(public.effective_tier(auth.uid()), 'outfit_review'),
    'chat_message_limit',  public.plan_limit(public.effective_tier(auth.uid()), 'chat_message')
  )
  from (select 1) one
  left join public.usage_counters u
    on u.user_id = auth.uid()
   and u.period_start = date_trunc('month', now() at time zone 'utc')::date;
$$;

-- ─── Stylist client brief ────────────────────────────────────────────────
-- The only way a stylist can see a user's data: for a confirmed/completed booking
-- with them, from 24h before the session until 7 days after it starts.
-- Photo paths are returned; signed URLs are created server-side.
create or replace function public.get_client_brief(p_booking_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  b public.bookings;
begin
  select * into b from public.bookings where id = p_booking_id;
  if not found
     or b.stylist_id is distinct from public.current_stylist_id()
     or b.status not in ('confirmed', 'completed')
     or now() < b.starts_at - interval '24 hours'
     or now() > b.starts_at + interval '7 days' then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'booking_id', b.id,
    'starts_at',  b.starts_at,
    'client', (
      select jsonb_build_object(
        'display_name', p.display_name, 'style_directions', p.style_directions,
        'lifestyle', p.lifestyle, 'budget_range', p.budget_range, 'goals', p.goals,
        'inspiration_ids', p.inspiration_ids)
      from public.profiles p where p.id = b.user_id),
    'style_profile', (
      select sp.result from public.style_profiles sp
      where sp.user_id = b.user_id and sp.status = 'ready'
      order by sp.version desc limit 1),
    'recent_reviews', coalesce((
      select jsonb_agg(r order by r.created_at desc) from (
        select o.id, o.occasion, o.score, o.result, o.photo_path, o.created_at
        from public.outfit_reviews o
        where o.user_id = b.user_id and o.status = 'ready'
        order by o.created_at desc limit 5) r), '[]'::jsonb)
  );
end $$;

-- ─── Function permissions ────────────────────────────────────────────────
revoke execute on function public.effective_tier(uuid), public.consume_quota(uuid, text),
                           public.refund_quota(uuid, text), public.my_usage(),
                           public.get_client_brief(uuid)
  from public, anon, authenticated;
grant execute on function public.consume_quota(uuid, text), public.refund_quota(uuid, text),
                          public.effective_tier(uuid)
  to service_role;
grant execute on function public.my_usage(), public.get_client_brief(uuid) to authenticated;
