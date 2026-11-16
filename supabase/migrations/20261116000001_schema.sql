-- Core schema for the Stylist MVP. See PRD.md §2.3.
-- Access rules live in the next migration; this file only defines structure.

create extension if not exists pgcrypto;

-- ─── Enums ────────────────────────────────────────────────────────────────
create type public.user_role        as enum ('user', 'stylist', 'admin');
create type public.style_direction  as enum ('womenswear', 'menswear', 'gender_neutral');
create type public.budget_range     as enum ('budget', 'mid', 'premium', 'luxury');
create type public.job_status       as enum ('pending', 'ready', 'failed');
create type public.feedback_value   as enum ('up', 'down');
create type public.chat_role        as enum ('user', 'assistant');
create type public.tier             as enum ('free', 'plus');
create type public.booking_status   as enum ('pending_payment', 'confirmed', 'completed',
                                             'cancelled', 'refunded', 'no_show');
create type public.flag_status      as enum ('open', 'actioned', 'dismissed');

-- ─── Profiles (1:1 with auth.users) ───────────────────────────────────────
create table public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  display_name             text check (char_length(display_name) <= 60),
  birth_year               int,
  style_directions         public.style_direction[] not null default '{}',
  lifestyle                jsonb not null default '{}'::jsonb,
  budget_range             public.budget_range,
  goals                    text[] not null default '{}',
  inspiration_ids          text[] not null default '{}',
  role                     public.user_role not null default 'user',
  age_confirmed_at         timestamptz,
  photo_consent_at         timestamptz,            -- consent to AI analysis of uploaded photos
  quiz_completed_at        timestamptz,
  onboarding_completed_at  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint goals_max      check (cardinality(goals) <= 10),
  constraint inspiration_max check (cardinality(inspiration_ids) <= 10)
);

-- ─── Style profiles (AI output, versioned) ────────────────────────────────
create table public.style_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  version           int not null,
  status            public.job_status not null default 'pending',
  input_photo_paths text[] not null,
  result            jsonb,
  model             text,
  prompt_version    text,
  error             text,
  created_at        timestamptz not null default now(),
  unique (user_id, version)
);
create index on public.style_profiles (user_id, version desc);

-- ─── Outfit reviews ──────────────────────────────────────────────────────
create table public.outfit_reviews (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  photo_path     text not null,
  occasion       text,
  status         public.job_status not null default 'pending',
  score          int check (score between 1 and 10),
  result         jsonb,
  model          text,
  prompt_version text,
  feedback       public.feedback_value,
  created_at     timestamptz not null default now()
);
create index on public.outfit_reviews (user_id, created_at desc);

-- ─── Chat ─────────────────────────────────────────────────────────────────
create table public.chat_threads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text check (char_length(title) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.chat_threads (user_id, updated_at desc);

create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.chat_threads (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.chat_role not null,
  content     text not null,
  image_path  text,
  feedback    public.feedback_value,
  tokens_in   int,
  tokens_out  int,
  created_at  timestamptz not null default now()
);
create index on public.chat_messages (thread_id, created_at);

-- ─── Usage & entitlements ─────────────────────────────────────────────────
-- Monthly counters (free-tier limits) and a daily counter (hard cap for everyone).
create table public.usage_counters (
  user_id        uuid not null references public.profiles (id) on delete cascade,
  period_start   date not null,              -- first day of the calendar month (UTC)
  outfit_reviews int not null default 0 check (outfit_reviews >= 0),
  chat_messages  int not null default 0 check (chat_messages >= 0),
  primary key (user_id, period_start)
);

create table public.daily_usage (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  day      date not null,
  ai_calls int not null default 0 check (ai_calls >= 0),
  primary key (user_id, day)
);

create table public.entitlements (
  user_id                uuid primary key references public.profiles (id) on delete cascade,
  tier                   public.tier not null default 'free',
  status                 text,               -- Stripe subscription status, e.g. 'active', 'trialing'
  current_period_end     timestamptz,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  updated_at             timestamptz not null default now()
);

-- ─── Human stylists & bookings ────────────────────────────────────────────
create table public.stylists (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique references public.profiles (id) on delete set null,
  name         text not null,
  bio          text,
  specialties  text[] not null default '{}',
  photo_url    text,
  price_cents  int not null check (price_cents > 0),
  payout_cents int not null check (payout_cents >= 0),
  active       bool not null default true,
  created_at   timestamptz not null default now(),
  constraint payout_le_price check (payout_cents <= price_cents)
);

create table public.availability (
  id          uuid primary key default gen_random_uuid(),
  stylist_id  uuid not null references public.stylists (id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  is_booked   bool not null default false,
  held_by     uuid references public.profiles (id) on delete set null,
  held_until  timestamptz,
  constraint slot_order check (ends_at > starts_at)
);
create index on public.availability (stylist_id, starts_at);

create table public.bookings (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles (id) on delete cascade,
  stylist_id               uuid not null references public.stylists (id),
  slot_id                  uuid not null references public.availability (id),
  status                   public.booking_status not null default 'pending_payment',
  price_cents              int not null,
  stripe_checkout_id       text unique,
  stripe_payment_intent_id text unique,
  daily_room_name          text,
  starts_at                timestamptz not null,
  ends_at                  timestamptz not null,
  recap                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on public.bookings (user_id, starts_at desc);
create index on public.bookings (stylist_id, starts_at);
-- At most one live booking per slot.
create unique index bookings_one_live_per_slot on public.bookings (slot_id)
  where status in ('pending_payment', 'confirmed', 'completed');

-- ─── Moderation ───────────────────────────────────────────────────────────
create table public.moderation_flags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete cascade,
  object_path text not null,
  reason      text not null,
  status      public.flag_status not null default 'open',
  created_at  timestamptz not null default now()
);

-- ─── Triggers ─────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch     before update on public.profiles     for each row execute function public.touch_updated_at();
create trigger chat_threads_touch before update on public.chat_threads for each row execute function public.touch_updated_at();
create trigger bookings_touch     before update on public.bookings     for each row execute function public.touch_updated_at();

-- Age gate: birth_year must make the user at least 18 this calendar year, and be plausible.
-- (Check constraints can't call now(), so this is a trigger.)
create or replace function public.validate_profile() returns trigger
language plpgsql as $$
declare
  this_year int := extract(year from now() at time zone 'utc')::int;
begin
  if new.birth_year is not null
     and (new.birth_year > this_year - 18 or new.birth_year < this_year - 110) then
    raise exception 'You must be 18 or older to use Stylist.' using errcode = '22023';
  end if;
  if new.age_confirmed_at is not null and new.birth_year is null then
    raise exception 'birth_year is required to confirm age' using errcode = '22023';
  end if;
  return new;
end $$;

create trigger profiles_validate before insert or update on public.profiles
  for each row execute function public.validate_profile();

-- Every new auth user gets a profile and a free entitlement row.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name',
                                new.raw_user_meta_data ->> 'name'), 60));
  insert into public.entitlements (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
