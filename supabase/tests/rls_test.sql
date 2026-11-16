-- Security & quota tests. Run with: npm run test:db
-- Each check raises an exception on failure; the script stops at the first failure.
\set ON_ERROR_STOP on
set client_min_messages = notice;

create schema if not exists test;

-- Runs SQL and fails the test if it does NOT raise an error.
create or replace function test.expect_fail(label text, stmt text) returns void
language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'ok  (blocked) %', label;
    return;
  end;
  raise exception 'FAIL: expected error but succeeded: %', label;
end $$;

create or replace function test.ok(label text, cond bool) returns void
language plpgsql as $$
begin
  if cond is distinct from true then
    raise exception 'FAIL: %', label;
  end if;
  raise notice 'ok  %', label;
end $$;
create or replace function test.rows(label text, stmt text, expected int) returns void
language plpgsql as $$
declare n int;
begin
  execute stmt;
  get diagnostics n = row_count;
  if n is distinct from expected then
    raise exception 'FAIL: % (expected % rows, got %)', label, expected, n;
  end if;
  raise notice 'ok  %', label;
end $$;
grant usage on schema test to anon, authenticated, service_role;
grant execute on all functions in schema test to anon, authenticated, service_role;

-- Fixed ids
\set alice   '''11111111-1111-1111-1111-111111111111'''
\set bob     '''22222222-2222-2222-2222-222222222222'''
\set sam     '''33333333-3333-3333-3333-333333333333'''
\set sam2    '''44444444-4444-4444-4444-444444444444'''
\set admin   '''55555555-5555-5555-5555-555555555555'''

-- ─── Fixtures (as superuser) ────────────────────────────────────────────
insert into auth.users (id, email, raw_user_meta_data) values
  (:alice, 'alice@example.com', '{"full_name":"Alice"}'),
  (:bob,   'bob@example.com',   '{}'),
  (:sam,   'sam@example.com',   '{"name":"Sam Stylist"}'),
  (:sam2,  'sam2@example.com',  '{}'),
  (:admin, 'admin@example.com', '{}');

select test.ok('signup trigger creates profile with name',
  (select display_name from public.profiles where id = :alice) = 'Alice');
select test.ok('signup trigger creates free entitlement',
  (select tier from public.entitlements where user_id = :bob) = 'free');

update public.profiles set role = 'stylist' where id in (:sam, :sam2);
update public.profiles set role = 'admin' where id = :admin;
insert into public.stylists (id, user_id, name, price_cents, payout_cents) values
  ('aaaaaaaa-0000-0000-0000-000000000001', :sam,  'Sam',  4900, 3200),
  ('aaaaaaaa-0000-0000-0000-000000000002', :sam2, 'Sam2', 4900, 3200);
insert into public.availability (id, stylist_id, starts_at, ends_at, is_booked) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', now() + interval '2 hours', now() + interval '150 minutes', true),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', now() + interval '3 days',  now() + interval '3 days 30 minutes', false),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', now() - interval '1 day',   now() - interval '1 day' + interval '30 minutes', false),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', now() + interval '10 days', now() + interval '10 days 30 minutes', false);
insert into public.bookings (id, user_id, stylist_id, slot_id, status, price_cents, starts_at, ends_at) values
  ('cccccccc-0000-0000-0000-000000000001', :alice, 'aaaaaaaa-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000001', 'confirmed', 4900, now() + interval '2 hours', now() + interval '150 minutes'),
  ('cccccccc-0000-0000-0000-000000000002', :bob, 'aaaaaaaa-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000004', 'confirmed', 4900, now() + interval '10 days', now() + interval '10 days 30 minutes');
insert into public.outfit_reviews (user_id, photo_path, status, score, result) values
  (:alice, 'x/outfit/1.jpg', 'ready', 7, '{"working":["fit"]}'),
  (:bob,   'y/outfit/1.jpg', 'ready', 6, '{}');

-- ─── Anonymous visitors see nothing ─────────────────────────────────────
set role anon;
select test.expect_fail('anon cannot read profiles', 'select 1 from public.profiles');
select test.expect_fail('anon cannot read stylists', 'select 1 from public.stylists');
reset role;

-- ─── Alice (regular user) ───────────────────────────────────────────────
set role authenticated;
select set_config('request.jwt.claim.sub', :alice, false);

select test.ok('alice sees only her own profile',
  (select count(*) from public.profiles) = 1 and (select id from public.profiles) = :alice);
select test.rows('alice can update her quiz answers',
  $$update public.profiles set style_directions = '{womenswear,gender_neutral}', goals = '{work}'
    where id = '11111111-1111-1111-1111-111111111111'$$, 1);
select test.expect_fail('alice cannot make herself admin',
  $$update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111'$$);
select test.expect_fail('under-18 birth year rejected',
  format('update public.profiles set birth_year = %s where id = %L',
         extract(year from now())::int - 15, '11111111-1111-1111-1111-111111111111'));
select test.rows('adult birth year accepted',
  $$update public.profiles set birth_year = 1998, age_confirmed_at = now()
    where id = '11111111-1111-1111-1111-111111111111'$$, 1);
select test.rows('alice cannot update bob (0 rows)',
  $$update public.profiles set display_name = 'hacked'
    where id = '22222222-2222-2222-2222-222222222222'$$, 0);

select test.ok('alice sees only her own outfit reviews',
  (select count(*) from public.outfit_reviews) = 1);
select test.expect_fail('alice cannot forge an outfit review',
  $$insert into public.outfit_reviews (user_id, photo_path, status, score)
    values ('11111111-1111-1111-1111-111111111111', 'p', 'ready', 10)$$);
select test.expect_fail('alice cannot change a review score',
  $$update public.outfit_reviews set score = 10$$);
select test.rows('alice can rate her review (only her own row changes)',
  $$update public.outfit_reviews set feedback = 'up'$$, 1);

select test.rows('alice can create a chat thread',
  $$insert into public.chat_threads (user_id, title)
    values ('11111111-1111-1111-1111-111111111111', 'Wedding')$$, 1);
select test.expect_fail('alice cannot create a thread for bob',
  $$insert into public.chat_threads (user_id) values ('22222222-2222-2222-2222-222222222222')$$);
select test.expect_fail('alice cannot insert chat messages directly (quota bypass)',
  $$insert into public.chat_messages (thread_id, user_id, role, content)
    select id, user_id, 'user', 'hi' from public.chat_threads limit 1$$);

select test.expect_fail('alice cannot upgrade herself to plus',
  $$update public.entitlements set tier = 'plus', status = 'active'$$);
select test.expect_fail('alice cannot edit usage counters',
  $$update public.usage_counters set outfit_reviews = 0$$);
select test.expect_fail('alice cannot call consume_quota',
  $$select public.consume_quota('11111111-1111-1111-1111-111111111111', 'outfit_review')$$);
select test.ok('alice can read her usage summary',
  (public.my_usage() ->> 'outfit_review_limit')::int = 3);

select test.ok('alice sees only the 2 open future slots (booked and past hidden)',
  (select count(*) from public.availability) = 2);
select test.ok('...and none of them are booked',
  not exists (select 1 from public.availability where is_booked));
select test.expect_fail('alice cannot add availability',
  $$insert into public.availability (stylist_id, starts_at, ends_at)
    values ('aaaaaaaa-0000-0000-0000-000000000001', now() + interval '1 day', now() + interval '25 hours')$$);
select test.ok('alice sees only her own bookings', (select count(*) from public.bookings) = 1);
select test.expect_fail('alice cannot create a booking directly',
  $$insert into public.bookings (user_id, stylist_id, slot_id, status, price_cents, starts_at, ends_at)
    values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001',
            'bbbbbbbb-0000-0000-0000-000000000002', 'confirmed', 1, now(), now() + interval '1 hour')$$);
select test.expect_fail('alice cannot read a stylist client brief',
  $$select public.get_client_brief('cccccccc-0000-0000-0000-000000000001')$$);

-- Storage
select test.rows('alice can upload into her own folder',
  $$insert into storage.objects (bucket_id, name)
    values ('user-photos', '11111111-1111-1111-1111-111111111111/selfie/a.jpg')$$, 1);
select test.expect_fail('alice cannot upload into bob''s folder',
  $$insert into storage.objects (bucket_id, name)
    values ('user-photos', '22222222-2222-2222-2222-222222222222/selfie/a.jpg')$$);
reset role;
insert into storage.objects (bucket_id, name)
  values ('user-photos', '22222222-2222-2222-2222-222222222222/selfie/b.jpg');
set role authenticated;
select test.ok('alice cannot see bob''s photos',
  (select count(*) from storage.objects) = 1);
select test.rows('alice cannot delete bob''s photos (0 rows)',
  $$delete from storage.objects where name like '2222%'$$, 0);
select test.rows('photos are immutable (update changes 0 rows)',
  $$update storage.objects set name = '11111111-1111-1111-1111-111111111111/selfie/z.jpg'$$, 0);

-- ─── Stylist Sam ────────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', :sam, false);
select test.ok('sam gets a brief for a confirmed booking starting within 24h',
  (public.get_client_brief('cccccccc-0000-0000-0000-000000000001') -> 'client' ->> 'display_name') = 'Alice');
select test.ok('brief includes the client''s recent reviews',
  jsonb_array_length(public.get_client_brief('cccccccc-0000-0000-0000-000000000001') -> 'recent_reviews') = 1);
select test.expect_fail('sam cannot get a brief 10 days before the session',
  $$select public.get_client_brief('cccccccc-0000-0000-0000-000000000002')$$);
select test.ok('sam cannot read client profiles directly',
  (select count(*) from public.profiles) = 1);  -- only his own
select test.ok('sam cannot read client outfit reviews directly',
  (select count(*) from public.outfit_reviews) = 0);
select test.ok('sam sees his bookings', (select count(*) from public.bookings) = 2);
select test.rows('sam can add his own availability',
  $$insert into public.availability (stylist_id, starts_at, ends_at)
    values ('aaaaaaaa-0000-0000-0000-000000000001', now() + interval '5 days', now() + interval '5 days 30 minutes')$$, 1);
select test.expect_fail('sam cannot add availability for another stylist',
  $$insert into public.availability (stylist_id, starts_at, ends_at)
    values ('aaaaaaaa-0000-0000-0000-000000000002', now() + interval '5 days', now() + interval '5 days 30 minutes')$$);
select test.rows('sam cannot delete a booked slot (0 rows)',
  $$delete from public.availability where id = 'bbbbbbbb-0000-0000-0000-000000000001'$$, 0);

-- ─── Other stylist Sam2 ─────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', :sam2, false);
select test.expect_fail('another stylist cannot read the brief',
  $$select public.get_client_brief('cccccccc-0000-0000-0000-000000000001')$$);
select test.ok('another stylist sees none of sam''s bookings', (select count(*) from public.bookings) = 0);

-- ─── Admin ──────────────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', :admin, false);
select test.ok('admin sees all profiles', (select count(*) from public.profiles) = 5);
select test.ok('admin sees all bookings', (select count(*) from public.bookings) = 2);
select test.expect_fail('admin still cannot grant roles through the API',
  $$update public.profiles set role = 'admin' where id = '22222222-2222-2222-2222-222222222222'$$);
reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ─── Quota (as the server / service role) ───────────────────────────────
set role service_role;
select test.ok('free review 1 allowed', (public.consume_quota(:bob, 'outfit_review') ->> 'allowed')::bool);
select test.ok('free review 2 allowed', (public.consume_quota(:bob, 'outfit_review') ->> 'allowed')::bool);
select test.ok('free review 3 allowed', (public.consume_quota(:bob, 'outfit_review') ->> 'allowed')::bool);
select test.ok('free review 4 blocked with monthly_limit',
  (public.consume_quota(:bob, 'outfit_review') ->> 'reason') = 'monthly_limit');
select public.refund_quota(:bob, 'outfit_review');
select test.ok('refund gives one back', (public.consume_quota(:bob, 'outfit_review') ->> 'allowed')::bool);
select test.ok('chat quota is separate', (public.consume_quota(:bob, 'chat_message') ->> 'used')::int = 1);

select test.ok('first style profile allowed for free user',
  (public.consume_quota(:bob, 'style_profile') ->> 'allowed')::bool);
insert into public.style_profiles (user_id, version, status, input_photo_paths)
  values (:bob, 1, 'ready', '{a}');
select test.ok('free user cannot re-run style profile',
  (public.consume_quota(:bob, 'style_profile') ->> 'reason') = 'rerun_requires_plus');

update public.entitlements set tier = 'plus', status = 'active',
  current_period_end = now() + interval '30 days' where user_id = :bob;
select test.ok('plus user past free limit is allowed',
  (public.consume_quota(:bob, 'outfit_review') ->> 'allowed')::bool);
select test.ok('plus user can re-run style profile',
  (public.consume_quota(:bob, 'style_profile') ->> 'allowed')::bool);

update public.entitlements set current_period_end = now() - interval '1 day' where user_id = :bob;
select test.ok('expired plus falls back to free limits',
  (public.consume_quota(:bob, 'outfit_review') ->> 'reason') = 'monthly_limit');

update public.daily_usage set ai_calls = 50 where user_id = :alice;
insert into public.daily_usage (user_id, day, ai_calls)
  values (:alice, (now() at time zone 'utc')::date, 50)
  on conflict (user_id, day) do update set ai_calls = 50;
select test.ok('daily hard cap blocks after 50 calls',
  (public.consume_quota(:alice, 'chat_message') ->> 'reason') = 'daily_cap');
reset role;

\echo
\echo 'All database security and quota tests passed.'
