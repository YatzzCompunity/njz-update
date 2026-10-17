# NJZ Update — Everything NewJeans, in one place.

A production-ready full-stack fan community + news platform for NewJeans (Bunnies).
Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma + PostgreSQL,
and NextAuth (Auth.js).

> **Disclaimer:** This is an independent fan-made community and news aggregation
> platform. It is not affiliated with or endorsed by NewJeans, ADOR, HYBE, or any
> related organization. News items are short summaries with attribution to the
> original publisher — always follow the source link for the full story.
> Unverified items are labeled **UNVERIFIED** and must not be treated as fact.

## Features

- **News aggregation pipeline** — RSS/Atom ingestion (Google News RSS, official
  YouTube channel feeds, any admin-added RSS) with normalize → deduplicate →
  classify → member-detect → verify → store. Respects `robots.txt`, uses an
  honest bot User-Agent, never scrapes sites that forbid it, never copies full
  articles (summaries only, with attribution).
- **Duplicate detection** — canonical URL + normalized-title grouping, surfaced
  in the UI as “Covered by N sources”.
- **Vercel Cron** — `POST /api/cron/fetch-updates` every 15 minutes, protected
  by `CRON_SECRET` (Bearer header or `?secret=`; never exposed to the client).
- **Admin-first content** — `AUTO_PUBLISH=false` (default) sends fetched items
  to *Pending Review*; admins approve / edit / verify / publish from `/admin`.
- **Community** — posts (2000 chars), image/link attachments, likes, threaded
  comments, bookmarks, reports, share.
- **Realtime chat** — global room, polling-based live refresh (3s), typing
  indicator, per-user rate limits, delete-own-message, report. A Supabase
  Realtime abstraction (`lib/realtime.ts`) upgrades to true push when
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set —
  no persistent WebSocket server needed, fully Vercel-compatible.
- **Auth** — email/password (bcrypt) + Google OAuth (auto-enabled when
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set). Roles: `USER`,
  `MODERATOR`, `ADMIN` with **server-side** authorization on every endpoint.
- **Follows** — follow members/categories/topics; get notified on new updates.
- **Notifications** — likes, replies, @mentions, new member updates, admin
  announcements; unread counts.
- **Search** — `/search?q=` across updates, members, and community posts.
- **SEO** — per-page metadata, Open Graph/Twitter cards, sitemap, robots.txt,
  canonical URLs, JSON-LD structured data.
- **Design** — dark mode default + light mode, soft-pink/lavender on
  black/white, glassmorphism touches, mobile-first with bottom navigation,
  skeletons, empty/error states, 404 + global error boundary.

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# fill in DATABASE_URL (Postgres), NEXTAUTH_SECRET, CRON_SECRET

# 3. Database
npx prisma migrate dev        # creates tables
npm run db:seed               # members, categories, default sources, chat room
# Optional first admin: ADMIN_EMAIL=you@mail.com ADMIN_PASSWORD=... npm run db:seed

# 4. Run
npm run dev                   # http://localhost:3000
```

Useful scripts:

| Script              | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start dev server                          |
| `npm run lint`      | Next.js ESLint                            |
| `npm run typecheck` | `tsc --noEmit`                            |
| `npm run build`     | `prisma generate && next build`           |
| `npm test`          | Vitest unit tests (ingestion, validation, authz, rate-limit) |
| `npm run db:seed`   | Seed members/categories/sources/chat room |

## Environment variables

See `.env.example`. Summary:

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `DATABASE_URL` | ✅ | Postgres connection string |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ (prod) | e.g. `https://njz-update.vercel.app` |
| `CRON_SECRET` | ✅ | `openssl rand -hex 32`; sent as `Authorization: Bearer …` to the cron route |
| `AUTO_PUBLISH` | — | `true` = fetched updates publish immediately; `false` (default) = pending admin review |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Enables “Continue with Google” |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | Enables Supabase Realtime push (else polling fallback) |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Server-only; storage uploads |
| `NEXT_PUBLIC_SITE_URL` | — | Canonical site URL for SEO/sitemap |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | — | Seed-only: creates the first admin user |

Secrets are only ever read on the server. Nothing starting with anything other
than `NEXT_PUBLIC_` is bundled to the client.

## Deploying to Vercel

1. **Push to GitHub** — `.env` is gitignored; `.env.example` documents every var.
2. **Create a Postgres database** — Vercel Postgres, Supabase, or Neon. Copy the
   connection string.
3. **Import the repo in Vercel** (Framework Preset: Next.js). Build command
   `npm run build` already runs `prisma generate`.
4. **Environment variables** — add all rows from the table above in
   *Project → Settings → Environment Variables*.
5. **Database schema** — from your machine (or Vercel CLI):
   ```bash
   DATABASE_URL="<prod connection string>" npx prisma migrate deploy
   DATABASE_URL="<prod connection string>" ADMIN_EMAIL="you@mail.com" ADMIN_PASSWORD="<strong>" npm run db:seed
   ```
6. **Cron** — `vercel.json` already schedules `/api/cron/fetch-updates` every
   15 minutes. Add `CRON_SECRET` to Vercel env vars; Vercel Cron calls the
   route, which checks the secret (plus Vercel's own cron header).
7. **Auth** — set `NEXTAUTH_URL` to your production URL. For Google OAuth,
   register the OAuth client with redirect URI
   `https://<your-domain>/api/auth/callback/google`.
8. **Make yourself admin** — sign in, then in the DB set your user's `role` to
   `ADMIN` (or seed with `ADMIN_EMAIL`/`ADMIN_PASSWORD`).

### Production checklist

- [ ] `npm run lint`, `npm run typecheck`, `npm run build` all pass
- [ ] `npx prisma migrate deploy` ran against prod DB
- [ ] All env vars set (especially `CRON_SECRET`, `NEXTAUTH_SECRET`)
- [ ] Test: register → login → post → like → chat
- [ ] Test: `/api/cron/fetch-updates` with the secret (expect `{"ok":true,…}`)
- [ ] Admin: approve a pending update, add/disable a source, review a report

## News pipeline details

```
SOURCE → FETCH → PARSE → NORMALIZE → DEDUPLICATE → CLASSIFY → VERIFY → DATABASE
```

- **Sources** are rows in `NewsSource` (managed at `/admin` → Sources): any
  RSS/Atom feed, YouTube channel feed (`https://www.youtube.com/feeds/videos.xml?channel_id=…`),
  or Google News RSS search feeds. Each has a label: `OFFICIAL` / `NEWS` /
  `COMMUNITY` / `UNVERIFIED`.
- **Verification:** `OFFICIAL` → `VERIFIED`; `NEWS` → `PENDING` (editor review);
  everything else → `UNVERIFIED`. The UI always shows the badge.
- **What is stored:** title, short summary (≤ ~320 chars, HTML stripped),
  source name + canonical URL, published/fetched timestamps, category, member
  tags, verification status. **Full article text is never copied.**
- **AI policy:** if you add an AI step later, use it only for summarization /
  classification / member detection / dedup / translation, with a prompt that
  says *“Use only information contained in the source. Do not infer facts that
  are not explicitly supported.”* Always keep the source URL.

## API reference (selected)

| Method | Route | Auth |
| ------ | ----- | ---- |
| GET | `/api/updates` `?page&limit&category&member&q&sort` | public |
| GET | `/api/updates/:id` | public |
| GET | `/api/members` | public |
| GET/POST | `/api/community/posts` | POST: user |
| PATCH/DELETE | `/api/community/posts/:id` | author / mod |
| GET/POST | `/api/community/posts/:id/comments` | POST: user |
| DELETE | `/api/community/comments/:id` | author / mod |
| POST | `/api/reactions` | user |
| GET/POST | `/api/bookmarks` | user |
| GET/POST | `/api/chat/messages` | POST: user (rate-limited) |
| DELETE | `/api/chat/messages/:id` | author / mod |
| GET/POST/DELETE | `/api/chat/typing` | user |
| GET/PATCH | `/api/notifications` | user |
| GET/POST | `/api/follows` | user |
| POST | `/api/reports` | user |
| GET | `/api/search?q=&tab=` | public |
| GET | `/api/activity` | public |
| GET/POST | `/api/cron/fetch-updates` | `CRON_SECRET` |
| GET | `/api/admin/stats` | admin |
| GET/POST | `/api/admin/updates`, `/api/admin/sources` | mod-read / admin-write |
| PATCH/DELETE | `/api/admin/updates/:id` | admin |
| GET/PATCH | `/api/admin/users` | admin |
| POST | `/api/admin/announce` | admin |

All list endpoints are paginated (`page`, `limit`, max 50/page). All
mutation endpoints validate with Zod, rate-limit abuse-prone routes, and
enforce roles server-side (the frontend never decides permissions).

## Tests

```bash
npm test
```

Covers: URL canonicalization, title normalization, HTML cleaning, summary
truncation, category classification, member detection, verification mapping,
Zod schemas (auth/community/chat/admin), token-bucket rate limiting, and role
helpers.

## Project structure

```
app/                    # App Router pages + route handlers
  api/…                 # REST API (updates, community, chat, admin, cron…)
  updates/[slug]/       # SEO'd article pages
  members/[slug]/       # member profiles
  admin/                # admin dashboard (middleware-gated)
components/             # UI primitives + domain components
lib/
  ingestion/            # fetch → normalize → classify → pipeline
  auth.ts               # NextAuth config
  auth-helpers.ts       # server-side session + authorization guards
  rate-limit.ts         # token-bucket limiter
  notifications.ts      # notification fan-out helpers
  realtime.ts           # Supabase-or-polling realtime abstraction
  storage.ts            # upload validation + storage seam
  validation.ts         # Zod schemas
prisma/                 # schema.prisma, seed.ts, migrations/
tests/                  # vitest suites
```

## Limitations & next steps (honest notes)

- **Realtime** is polling-based unless Supabase env vars are provided; the
  Supabase channel wiring is a documented seam in `lib/realtime.ts`.
- **Image uploads** validate type/size and otherwise expect a Supabase Storage
  bucket (see `lib/storage.ts`); the community composer accepts image URLs today.
- **Password reset email** needs an email provider (Resend/SMTP) — the
  `/forgot-password` page documents this; wire it before promising resets.
- **Rate limiting** is per-instance in memory; for strict global limits across
  serverless instances, use Upstash Redis.
- **YouTube feeds** only expose public video metadata via RSS — no API key
  needed, but no view counts either. Note: `youtube.com/robots.txt` currently
  disallows `/feeds/videos.xml` for generic crawlers, so the seeded YouTube
  source ships **disabled** (the pipeline refuses to fetch it, correctly).
  Use the official YouTube Data API v3 (`YOUTUBE_API_KEY`) if you need
  YouTube coverage.
