# PRD: AI Personal Stylist App (working name: "Stylist")

**Status:** Draft v1 · **Date:** 2026-11-15 · **Target:** MVP in ~3 months with 1–2 developers

---

## Part 1: Product Brief

### 1.1 Problem
Many people aged 18–35 want to dress better but don't know what suits them: which colors, cuts or proportions work, or how to fix an outfit that feels "off". Human stylists cost $100–300+ per session and are hard to reach. Generic content (Pinterest, TikTok) isn't personal and can't tell *you* what works on *your* body and coloring.

### 1.2 Solution
A mobile-first web app (installable as a PWA) that works as an on-demand personal stylist:
1. **Style Profile.** The user uploads a few photos and answers a short quiz. The AI produces a personal analysis covering color palette, body proportions and flattering silhouettes, plus a short style identity.
2. **Outfit Feedback.** The user snaps a photo of what they're wearing. The AI gives a score, what's working, and 2–3 specific changes, all grounded in their profile.
3. **Stylist Chat.** The user asks any style question ("what shoes with wide-leg jeans?", "what do I wear to a summer wedding?") and gets answers personalized to their profile.
4. **Human Stylist Upsell.** For deeper help, users book a 30-minute video session with a vetted stylist from a small in-house roster. The stylist sees the user's profile and history before the call.

### 1.3 Target Users
- **Primary:** All genders, ages 18–35, in the US, English-speaking, phone-first, interested in style but without a stylist.
- **Personas:**
  - *Maya, 26, early-career professional.* Wants to look polished at work on a budget and isn't sure which colors suit her.
  - *Jordan, 22, college student.* Building a personal style from scratch and looking for quick, judgment-free feedback.
  - *Alex, 31, non-binary designer.* Wants gender-neutral advice that doesn't push them into gendered defaults.
- **Design implication:** advice, examples and the stylist roster must cover womenswear, menswear and gender-neutral style. Users choose their style direction(s) and are never assigned one by inferred gender.

### 1.4 Value Proposition
"A stylist in your pocket that actually knows you." Instant, personal and affordable, with a real human one tap away when you need one.

### 1.5 Business Model: Freemium Subscription
| Tier | Price (assumption, to be validated) | Includes |
|---|---|---|
| Free | $0 | Full Style Profile (once) · 3 outfit feedbacks / month · 20 chat messages / month |
| Plus | $9.99/mo or $59.99/yr · 7-day free trial | Unlimited outfit feedback & chat (fair-use cap) · profile re-analysis · saved looks history · 10% off human sessions |
| Human session | ~$49 per 30-min video call (à la carte) | Live session with a vetted stylist plus a written recap |

- The Style Profile is free because it is the "aha" moment and drives conversion.
- Stylists are contractors paid a fixed amount per session (e.g. 60–70% of the session price).

### 1.6 Goals & Success Metrics (first 90 days post-launch)
| Goal | Metric | Target |
|---|---|---|
| Activation | % of signups who complete a Style Profile | ≥ 60% |
| Engagement | Outfit feedbacks per active user per week | ≥ 1.5 |
| Retention | Week-4 retention | ≥ 20% |
| Monetization | Free → Plus conversion (within 30 days) | ≥ 4% |
| Human upsell | % of Plus users booking ≥ 1 human session | ≥ 5% |
| Quality | 👍 rate on AI responses | ≥ 80% |
| Unit economics | AI cost per Plus user per month | ≤ $1.50 |

### 1.7 MVP Scope

#### ✅ IN the MVP
**Onboarding & account**
- Sign up with Google or email (magic link); Sign in with Apple is optional on web
- 18+ age gate
- Style quiz: style direction(s) (womenswear, menswear, neutral, any mix), lifestyle, budget range, style goals, 3–5 inspiration picks from a curated set

**Style Profile (AI)**
- Upload 1 face selfie (natural light) + 1–2 full-body photos, with guided capture tips
- AI output: color season/palette (best colors, colors to avoid), body proportion notes framed neutrally, flattering silhouettes and fits, a 2–3 word style identity, and a short "starter rules" list
- A shareable profile card image (growth loop)
- Re-run analysis (Plus)

**Outfit Feedback (AI)**
- Take or upload one outfit photo, with an optional occasion tag (work, date, casual, event…)
- Output: score (1–10), what's working, 2–3 specific suggestions, how it fits the user's profile
- Saved history of past feedback

**Stylist Chat (AI)**
- Text chat with profile-aware context; users can attach a photo to a message
- Suggested starter prompts
- 👍/👎 on each response

**Human Stylist Sessions**
- Browse 3–10 in-house stylists (bio, specialties, photo)
- Book a 30-min slot from stylist availability
- Pay by card (Stripe)
- In-app video call
- The stylist sees the user's profile and their last 5 feedbacks before the call
- The stylist writes a recap note afterwards, visible to the user
- Cancellation / reschedule up to 24h before

**Monetization**
- Free-tier usage meters with a paywall screen
- Plus subscription via Stripe Checkout (monthly/yearly, 7-day trial), with the Stripe Customer Portal for cancel/update card

**Web platform**
- Responsive, mobile-first UI that works in Safari/Chrome on iOS and Android and on desktop
- Installable PWA (manifest, icons, "Add to Home Screen" prompt)
- Photo capture using the phone camera through the browser file input, or upload from the camera roll

**Ops / Admin (minimal)**
- Basic web admin: manage stylists, view bookings, issue refunds, review flagged content
- Stylist portal (web): set availability, see the upcoming session brief, write recaps, join the call

**Trust & Safety**
- Moderation of uploaded images (reject nudity, minors and non-person images)
- Users can delete any photo, or their whole account and data
- Privacy-first copy throughout ("your photos are never used to train models or shown to anyone but your booked stylist")

#### ❌ OUT of the MVP (later)
| Feature | Why deferred |
|---|---|
| Native iOS / Android apps | Web-first to ship faster and avoid app store fees and review; revisit if retention data shows push notifications and the native camera matter |
| Web push notifications | Unreliable on iOS unless the PWA is installed; email covers reminders at MVP |
| Digital wardrobe / closet cataloging | Large scope (item tagging, background removal); the core loop doesn't need it |
| Shopping recommendations & affiliate links | Second revenue stream; needs a product catalog integration |
| Virtual try-on / AR | Technically heavy and expensive |
| Open stylist marketplace (anyone can apply, set prices) | Onboarding, payouts and trust & safety at scale |
| Async stylist messaging / lookbooks from stylists | Adds ops load; live sessions first |
| Social feed, community, following | Not core; moderation burden |
| Outfit planning calendar / weather-based daily suggestions | Nice to have after retention data comes in |
| Video / multi-photo outfit analysis | Single photo is enough for MVP |
| Localization and non-US markets | English/US first |
| Users under 18 | Legal and safety complexity with body photos |
| Group / gift sessions, B2B | Later growth channel |

### 1.8 Key Risks & Mitigations
| Risk | Mitigation |
|---|---|
| AI gives insensitive body comments | Strict system prompt (neutral, proportion-based language, no weight talk, no unsolicited "fixes" to the body); eval set reviewed by stylists; 👎 feedback loop |
| Color analysis is unreliable in bad lighting | Capture guidance, a lighting-quality check, confidence notes, "re-take" prompt |
| Bias across skin tones, genders and body types | Diverse eval set; stylists audit samples before launch |
| Privacy concerns with body photos | Encrypted private storage, signed URLs, no model training, one-tap deletion, clear policy |
| Low human session demand | Small roster on contract (no fixed salaries); measure bookings before scaling |
| Weaker retention without a native app (no reliable push, no home-screen icon) | PWA install prompt after the first "aha" (profile ready); email reminders and weekly style tips; re-evaluate native apps post-MVP |
| Camera/photo quirks across mobile browsers (iPhone HEIC files, huge images, orientation) | Client-side decode → resize → re-encode to JPEG via canvas; test on iOS Safari and Android Chrome from week 1 |
| AI costs blow up | Free-tier caps, fair-use cap on Plus, image downscaling, prompt caching, smaller model for simple tasks |

---

## Part 2: Technical Spec

### 2.1 Architecture Overview
Built for a 1–2 dev team: lean on managed services and keep the custom backend thin.

One single-page web app serves all three audiences (users, stylists, admins), with access decided by role. It is developed in **Bolt** and stored in **GitHub** (Bolt syncs to the repo). Anything that needs a secret key runs in **Supabase Edge Functions**, never in the browser.

```
 Browser (phone or desktop, PWA)
        │
        ▼
┌───────────────────────────────────────┐        ┌────────────────────────────────────┐
│  Vite + React app (TypeScript)         │──────▶│  Supabase                           │
│  hosted by Bolt (or Netlify)           │       │  • Auth (Google/email)              │
│  • /app      user experience           │       │  • Postgres (+ RLS)                 │
│  • /stylist  stylist portal            │       │  • Storage (private bucket)         │
│  • /admin    admin tool                │       │  • pg_cron (reminders, holds)       │
└───────────────────────────────────────┘        │  • Edge Functions (Deno/TS):        │
                                                  │    AI calls, booking, webhooks      │
                                                  └──────────────┬─────────────────────┘
                                                                 ├──▶ Claude API (vision + chat, streamed)
                                                                 ├──▶ Image moderation API
                                                                 ├──▶ Stripe (subscriptions, session payments, webhooks)
                                                                 ├──▶ Daily.co (video rooms, embedded in the page)
                                                                 └──▶ Resend (email confirmations and reminders)
```

### 2.2 Tech Stack
| Layer | Choice | Rationale |
|---|---|---|
| Web app | **Vite + React + TypeScript**, React Router, Tailwind CSS, React Query, zod | Bolt's best-supported stack; one codebase for user app, stylist portal and admin |
| Build & hosting | **Bolt** for development and publishing (Netlify as an alternative); **GitHub** for source control and history | No local tooling required; instant deploys with no app store review |
| PWA | Web app manifest + a minimal service worker (app shell caching, offline fallback page) | Home-screen install on iOS and Android |
| Photo capture | `<input type="file" accept="image/*" capture>` + canvas resize/re-encode (e.g. `browser-image-compression`) | Opens the native camera on phones; strips EXIF/GPS; normalizes HEIC and orientation |
| Backend | **Supabase**: Postgres, Auth, Storage, pg_cron, Edge Functions for all server logic | Auth, DB and files in one; RLS for per-user data isolation |
| AI | **Anthropic Claude API**: a Sonnet-class model for vision analysis and chat, a Haiku-class model for cheap tasks (lighting check, chat titles, intent routing) | Strong multimodal reasoning; structured JSON output via tool use; prompt caching for the system prompt and profile context |
| Image moderation | AWS Rekognition moderation, or an equivalent hosted API | Block nudity and unsafe content before it reaches the AI or stylists |
| Payments | **Stripe**: Checkout + Customer Portal for Plus subscriptions; Checkout (one-time) for human sessions; manual stylist payouts at MVP scale (Connect Express later) | One provider for everything; no app store fee on web |
| Video | **Daily.co** prebuilt call embedded in the page | Works in mobile and desktop browsers; hosted rooms, simple token auth |
| Notifications | Resend (email) | Booking confirmations, reminders 24h/15min before |
| Analytics | PostHog | Funnels, retention, feature flags, paywall A/B tests |
| Errors | Sentry (browser + server) | |

### 2.3 Data Model (Postgres)
```sql
users            -- managed by Supabase Auth (auth.users)
profiles         (id PK=auth.uid, display_name, birth_year, style_directions text[],
                  lifestyle jsonb, budget_range, goals text[], inspiration_ids text[],
                  role enum('user','stylist','admin') default 'user', created_at)

style_profiles   (id, user_id FK, version int, status enum('pending','ready','failed'),
                  input_photo_paths text[], result jsonb, model text,
                  created_at)              -- latest version = active profile

outfit_reviews   (id, user_id FK, photo_path, occasion, score int,
                  result jsonb, feedback enum('up','down') null, created_at)

chat_threads     (id, user_id FK, title, created_at, updated_at)
chat_messages    (id, thread_id FK, role enum('user','assistant'),
                  content text, image_path null, feedback null, tokens_in, tokens_out, created_at)

usage_counters   (user_id, period_start date, outfit_reviews int, chat_messages int,
                  PRIMARY KEY (user_id, period_start))

entitlements     (user_id PK, tier enum('free','plus'), status, current_period_end,
                  stripe_customer_id, stripe_subscription_id, updated_at)

stylists         (id, user_id FK→profiles, bio, specialties text[], photo_url,
                  price_cents, payout_cents, active bool)
availability     (id, stylist_id FK, starts_at timestamptz, ends_at timestamptz, is_booked bool)
bookings         (id, user_id, stylist_id, slot_id FK→availability, status enum('pending_payment',
                  'confirmed','completed','cancelled','refunded','no_show'),
                  stripe_payment_intent_id, daily_room_name, starts_at, recap text, created_at)

moderation_flags (id, user_id, object_path, reason, status, created_at)
```
**RLS:** users can read/write only their own rows. Stylists can read a user's `profiles`, the active `style_profiles` row and the last 5 `outfit_reviews`, **only** for users with a confirmed booking with them, from 24h before the session to 7 days after. Admins have full access through a service role in the admin app only.

**Storage:** private bucket `user-photos/{user_id}/...`, accessed only through short-lived signed URLs. Photos are downscaled in the browser (max 1568px long edge, JPEG ~80%, re-encoded via canvas so EXIF/GPS metadata is stripped) before upload.

**Server logic:** lives in Supabase Edge Functions (`/functions/v1/*`), the only place the service-role key and third-party secrets exist.

### 2.4 Key Flows

**A. Style Profile generation**
1. Client uploads photos to Storage, then calls the Edge Function `style-profile`.
2. The function checks auth, runs moderation on each image, and runs a Haiku-class lighting/quality check on the selfie (returns `ok | too_dark | filtered | face_not_visible`).
3. It calls the Sonnet-class model with the system prompt, the quiz answers and the images, and forces a tool call `submit_style_profile` with a JSON schema:
   ```json
   { "color_season": "...", "palette": {"best": ["#hex", ...], "avoid": [...]},
     "proportions_notes": "...", "silhouettes": ["..."], "style_identity": "...",
     "starter_rules": ["..."], "confidence": "high|medium|low", "caveats": "..." }
   ```
4. It saves the result to `style_profiles` with status `ready`, and the client polls or subscribes via Realtime. Target p95 is under 25s, with a progress UI.

**B. Outfit Feedback**
1. The client checks quota (server-enforced too), uploads the photo and calls the Edge Function `outfit-review` with the occasion.
2. The function moderates the photo, increments `usage_counters` atomically (in the same transaction as a quota check), and calls the model with the cached system prompt, the profile summary and the image, using the tool `submit_outfit_review` → `{score, working[], suggestions[], profile_fit}`.
3. It stores and returns the result. Target p95 is under 15s.

**C. Stylist Chat**
- The Edge Function `chat` streams responses to the browser.
- Context = system prompt (cached) + compact profile summary (cached per user) + the last N messages (sliding window, ~8k tokens) + an optional image.
- Guardrails: stay on style/fashion/grooming topics, decline medical or body-modification advice, and use no body-shaming language.

**D. Booking a human stylist**
1. The user picks a slot. The Edge Function `create-booking` locks the slot (`is_booked` flag set in a transaction, with a 10-minute hold) and creates a Stripe Checkout session, then the user is redirected to pay.
2. The Stripe webhook (Edge Function `stripe-webhook`, event `checkout.session.completed`) sets the booking to `confirmed`, creates a Daily room (expiring) and sends confirmation emails.
3. Reminder emails go out at 24h and 15 min before: pg_cron calls the Edge Function `send-reminders`.
4. Join: the session page requests a Daily meeting token from the Edge Function `join-session`, which is valid only for the booking participants from 10 min before start to 45 min after, and embeds the call in the page.
5. After the call the stylist submits a recap in the portal, the booking becomes `completed`, and the user gets an email.
6. Cancellation more than 24h out triggers a full Stripe refund; cancellation inside 24h is not refunded (admin can override).

**E. Subscription**
- The paywall calls the Edge Function `billing-checkout`, which creates a Stripe Checkout session (subscription mode, 7-day trial) and redirects the user.
- Stripe webhooks (`customer.subscription.created/updated/deleted`) go to the Edge Function `stripe-webhook`, which upserts `entitlements`.
- "Manage subscription" in settings opens the Stripe Customer Portal via the Edge Function `billing-portal`.
- The server is the source of truth for quota checks; the client just mirrors it for UI.

### 2.5 AI Design Details
- **Prompts are versioned** in the repo (`/prompts/*.md`). Each AI result stores `model` and `prompt_version`.
- **Tone rules:** warm, specific, encouraging; talk about proportions and lines, not "flaws"; never comment on weight; respect each user's chosen style direction(s); give gender-neutral options when relevant.
- **Structured outputs** use tool calls with JSON schemas, validated server-side (zod), with one retry on schema failure.
- **Cost controls:** prompt caching on the system prompt and profile context; images resized client-side; Haiku-class model for routing and quality checks; per-user daily hard cap (e.g. 50 AI calls/day even on Plus).
- **Evaluation:** before launch, build an eval set of ~100 consented, diverse photos (skin tones, body types, genders, lighting). Stylists rate AI outputs on accuracy, helpfulness and tone, and the AI must beat the bar (≥ 4/5 average) before each prompt or model change ships.
- **Data use:** API data is not used for model training. Photos are retained until the user deletes them, and are hard-deleted from Storage within 30 days of account deletion.

### 2.6 Non-Functional Requirements
| Area | Requirement |
|---|---|
| Performance | Largest Contentful Paint < 2.5s on mid-range phones over 4G; profile p95 < 25s; outfit review p95 < 15s; first chat token < 3s |
| Browser support | Latest 2 versions of iOS Safari, Android Chrome, desktop Chrome/Safari/Edge/Firefox |
| Timeouts | AI calls can take up to ~60s; Edge Functions allow this (check the current wall-clock limit for the plan), otherwise move long jobs to a background queue |
| Availability | Rely on managed-service SLAs; graceful "try again" on AI timeouts, with no quota consumed on failure |
| Security | RLS on all tables; signed URLs (≤ 10 min); secrets only in server env vars (never `NEXT_PUBLIC_*`); Stripe webhooks verified by signature |
| Privacy | GDPR/CCPA-style data export and deletion; EXIF stripping; privacy policy covering biometric-adjacent data (avoid face *recognition*; only appearance analysis); check state laws (e.g. Illinois BIPA) with counsel |
| Accessibility | WCAG 2.1 AA: semantic HTML, keyboard navigation, screen-reader labels, respects browser text zoom; palette swatches with color names (not only color) |
| Age | 18+ self-attested at signup; moderation rejects photos that appear to show minors |
| Security (web) | Only the anon key ships to the browser (all tables behind RLS); Edge Functions verify the user JWT; Content Security Policy; rate limiting on Edge Functions |
| Observability | Sentry errors; PostHog events (`profile_completed`, `review_created`, `paywall_viewed`, `subscribed`, `session_booked`); AI cost per call logged |

### 2.7 Milestones (~12 weeks, 1–2 devs)
| Weeks | Milestone |
|---|---|
| 1–2 | Project setup (Vite + React in Bolt, GitHub, Supabase, CI), auth, onboarding quiz, browser photo capture & upload (tested on real iPhone + Android), prompt prototyping |
| 3–4 | Style Profile end-to-end + result UI + share card; start building the eval set with stylists |
| 5–6 | Outfit Feedback + history; Stylist Chat with streaming; usage counters |
| 7 | Stripe subscriptions (Checkout, Portal, webhooks), paywall, entitlements; PostHog funnels; PWA manifest + install prompt |
| 8–9 | Stylist roster, availability, booking + Stripe Checkout, embedded Daily video, email reminders; stylist portal |
| 10 | Admin tool (refunds, moderation queue); moderation pipeline; account/photo deletion |
| 11 | Eval pass and prompt tuning, bias review, performance (Lighthouse) and cost tuning, cross-browser bug bash |
| 12 | Private beta (50–100 users) on a production URL, then public launch; no app store review needed |

*If there is only one developer:* stylists use the admin area with a limited role instead of a separate portal, and availability is entered manually by an admin for the first month. The move to web already saves roughly 1–2 weeks (no IAP, no app store builds or review).

### 2.8 Open Questions
1. Final pricing for Plus and human sessions: run a paywall A/B test in beta.
2. Stylist contracts: per-session pay rate, background checks, liability/insurance.
3. Should human sessions require Plus, or be open to free users? (Assumed open to all.)
4. Legal review of photo/appearance analysis under US state privacy laws.
5. Brand name and visual identity.
6. Whether to recommend specific products in chat (it pulls toward affiliate revenue, which is out of MVP scope).
