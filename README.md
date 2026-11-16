# stylist-app
TECH 42 Capstone

**Stylist** is a mobile-first web app that works as an AI personal stylist, with real stylists one tap away. The full product brief and technical spec are in [`PRD.md`](PRD.md).

**Stack:** Vite + React + TypeScript + Tailwind, Supabase (Auth, Postgres with row-level security, Storage, Edge Functions). Built to be developed in [Bolt](https://bolt.new) with this GitHub repo as the source of truth.

## Status

| Milestone | Scope | Status |
|---|---|---|
| 1 | Sign-in, 18+ age gate, style quiz, photo capture & upload, full database schema + security rules | ✅ Done |
| 2 | AI style profile (Claude vision) + result screen + share card | Next |
| 3 | Outfit feedback, stylist chat, usage limits | |
| 4 | Plus subscription (Stripe), paywall, installable PWA | |
| 5 | Human stylist booking, payments, video calls, email reminders, stylist portal | |
| 6 | Admin tool, moderation, account deletion | |
| 7 | AI evals, tests, cross-browser polish, beta | |

## Set up Supabase (once)

1. Create a project at [supabase.com](https://supabase.com) (or connect Supabase from Bolt).
2. Run the migrations **in order**. Either:
   - paste each file from `supabase/migrations/` into the Supabase **SQL Editor** and run it, or
   - with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`.
3. **Auth → URL Configuration:** set the Site URL to your app's URL and add `<your-url>/auth/callback` to the Redirect URLs (also `http://localhost:5173/auth/callback` for local development).
4. **Auth → Providers:** email is on by default. To enable Google, add a Google OAuth client ID and secret.
5. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API). In Bolt, add these as environment variables instead.

> Only the **anon** key goes in the app. It's safe in the browser because every table is protected by row-level security. Never put the **service-role** key, or any Anthropic/Stripe key, in a `VITE_` variable; those go in Supabase Edge Function secrets.

**Making someone a stylist or admin:** roles can't be changed from the app (by design). Run this in the SQL Editor:

```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
```

## Work on it in Bolt

1. In Bolt, import this GitHub repository.
2. Add the two `VITE_SUPABASE_*` environment variables.
3. Ask Bolt for UI changes freely. Be careful with prompts that touch `supabase/migrations/` or the security rules: add a **new** migration file rather than editing old ones, and run `npm run test:db` before shipping changes there.

## Run locally

```bash
npm install
```

```bash
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server at http://localhost:5173 |
| `npm run build` | Typecheck and build for production |
| `npm test` | Unit tests (onboarding rules, image sizing) |
| `npm run test:db` | Runs all migrations on a throwaway local Postgres 16 and checks 58 security and quota rules |
| `npm run lint` | ESLint |

## Project layout

```
src/
  pages/            Landing, SignIn, AuthCallback, onboarding/ (AgeGate, Quiz, Photos), app/ (Home, Settings)
  components/       UI kit, route guards, PhotoCapture
  lib/              supabase client, auth, onboarding rules (zod), image processing, photo storage, constants
supabase/
  migrations/       schema → row-level security → storage, quota and stylist-brief functions
  tests/            local Postgres test harness for the security rules
public/             PWA manifest and icon
PRD.md              product brief and technical spec
```

## Privacy and security notes

- Photos are resized and re-encoded to JPEG **in the browser** before upload, which strips EXIF metadata, including GPS location.
- Photos live in a private bucket under `user-photos/{user_id}/…`; only the owner can read, add or delete them.
- Users can't change their own role, forge AI results, edit their usage counters or upgrade their own plan; all of these are written only by server code.
- Stylists never read user tables directly. They get a narrow client brief through `get_client_brief()`, only for a confirmed booking with them, from 24h before the session until 7 days after.
