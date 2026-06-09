# Handoff: Kanto Keepsakes — Session 3+

**Date:** 2026-06-10
**Workspace:** `/home/jaredoka/Desktop/Projects/Kanto Keepsakes/kantokeepsakes`
**Branch:** `main`
**Remote:** `git@github.com:jaredoka/kantokeepsakes.git`
**AI Tool:** Claude Code (Opus 4.6 by Anthropic)

---

## Session 3 Summary

Planning-only session for a major new feature: a **Marketplace** — a community-driven WTB/WTS trade listing board for Pokémon TCG, inspired by CSGOLounge (trading only, no betting). The marketplace will be integrated into the existing Kanto Keepsakes site as a new top-level page.

## Session 4 Summary

Executed the first two phases of the marketplace build:

- **M1 (Project Setup) — COMPLETE:** Migrated the entire site from static HTML/CSS/JS to Next.js 16 with TypeScript, Tailwind CSS 4, and App Router. Set up Supabase (PostgreSQL, auth, storage), created database migrations for all 6 core tables with Row Level Security policies, integrated Cloudflare Turnstile CAPTCHA, and added Marketplace to the nav.
- **M2 (Auth Flow) — COMPLETE:** Built signup and login pages with form validation, Turnstile CAPTCHA verification, Supabase auth integration, logout functionality, automatic profile creation via database trigger, auth-aware navigation, and IP-based server-side rate limiting on signup.

---

## Marketplace — Feature Specification

### Concept

A public trade board where users create WTB (Want to Buy) and WTS (Want to Sell) listings for Pokémon TCG products. The platform is built on community trust — reputation and trade confirmations replace heavy moderation. One-person operation by design.

### Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | **React (Next.js)** | SSR for SEO on public listings, scales better than plain HTML for this feature set |
| Backend / DB / Auth | **Supabase** | PostgreSQL, auth, real-time subscriptions, file storage — all managed, solo-dev friendly |
| Hosting | **Vercel** | Pairs with Next.js, generous free tier |
| Search | **Supabase full-text search** | Good enough to start; Algolia/Meilisearch later if needed |

> **Architecture decision:** The existing Kanto Keepsakes shop is static HTML/CSS/JS. The marketplace is a fundamentally different app (accounts, database, real-time messaging). Two integration paths to decide on in the next session:
>
> - **Option A:** Build the marketplace as a separate Next.js app (e.g. `marketplace.kantokeepsakes.com`) and link between the two sites via navigation.
> - **Option B:** Migrate the entire site to Next.js and make the marketplace a route within it.
>
> Option A is faster to ship. Option B is cleaner long-term. Decide at start of next session.

---

### Navigation Integration

Add a **"Marketplace"** link to the existing hamburger slide-out nav, positioned **to the left of / above** the hamburger menu items (i.e. first item in the nav list). This is the highest-visibility position and signals the marketplace is a primary feature, not an afterthought.

**Current nav order (from Session 2):**
```
Home
Japanese
English
Accessories
Preorder
Cart
```

**New nav order:**
```
Marketplace   ← NEW (first item, links to marketplace app/page)
Home
Japanese
English
Accessories
Preorder
Cart
```

---

### Accounts & Authentication

**Provider:** Supabase Auth

**Signup flow:**
- Email + password only (no OAuth, no Discord, no social login)
- Email is **not verified** — fake/burner emails are explicitly allowed
- This is a deliberate privacy-first decision: no sensitive data collected
- Username is chosen at signup and is the public identity

**Anti-abuse measures (to offset no email verification):**
- **Rate limiting:** IP-based account creation limits (e.g. max 3 accounts per IP per 24h)
- **CAPTCHA:** On signup and listing creation (Supabase supports Cloudflare Turnstile)
- **New trader flag:** Accounts with 0 confirmed trades display a "New Trader" badge — community can self-assess trust
- **Ban enforcement:** Ban by IP + account; not bulletproof but raises friction for bad actors

**Known tradeoff:** Ban evasion is easier without verified identity. The community trust/reputation system is the primary defense — new accounts are visibly new, and the community will treat them with appropriate caution.

---

### Database Schema (Supabase / PostgreSQL)

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References `auth.users.id` |
| username | text (unique) | Public display name |
| avatar_url | text | Optional profile image |
| bio | text | Optional |
| reputation_score | int | Derived from confirmed trades |
| completed_trades | int | Count of confirmed trades |
| created_at | timestamptz | Account age (displayed publicly) |
| is_banned | boolean | Moderation flag |
| last_active_at | timestamptz | For stale account detection |

#### `listings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| type | enum | `WTB` or `WTS` |
| title | text | e.g. "WTS Charizard VMAX Alt Art NM" |
| description | text | Details, condition notes |
| category | enum | `sealed`, `singles`, `graded`, `accessories` |
| language | enum | `japanese`, `english`, `any` |
| price | decimal | Asking/offering price (nullable for "make offer") |
| currency | text | Default `BND`, allow `USD`, `MYR`, `SGD` |
| images | text[] | Array of image URLs (Supabase Storage) |
| status | enum | `active`, `sold`, `expired`, `removed` |
| created_at | timestamptz | |
| bumped_at | timestamptz | For sort-by-recent; updates on bump |
| expires_at | timestamptz | Auto-expire after N days (e.g. 30) |

#### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| conversation_id | uuid (FK → conversations) | |
| sender_id | uuid (FK → profiles) | |
| body | text | Message content |
| created_at | timestamptz | |
| is_read | boolean | For unread count in inbox |

#### `conversations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| listing_id | uuid (FK → listings) | Tied to a specific listing |
| participant_1 | uuid (FK → profiles) | Listing owner |
| participant_2 | uuid (FK → profiles) | Person who initiated contact |
| created_at | timestamptz | |
| last_message_at | timestamptz | For inbox sorting |

#### `trade_confirmations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| listing_id | uuid (FK → listings) | |
| confirmer_id | uuid (FK → profiles) | User confirming the trade |
| confirmed_user_id | uuid (FK → profiles) | User being vouched for |
| rating | int | 1–5 stars |
| comment | text | Optional feedback |
| created_at | timestamptz | |

#### `reports`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| reporter_id | uuid (FK → profiles) | |
| reported_user_id | uuid (FK → profiles) | |
| listing_id | uuid (FK → listings) | Nullable (can report user or listing) |
| reason | enum | `scam`, `spam`, `harassment`, `inappropriate`, `other` |
| description | text | Details |
| status | enum | `pending`, `reviewed`, `resolved`, `dismissed` |
| created_at | timestamptz | |

---

### Core Features — Build Order

| Phase | Feature | Description |
|-------|---------|-------------|
| **M1** | **Project setup** | Next.js + Supabase init, auth config, Turnstile CAPTCHA, DB migrations |
| **M2** | **Auth flow** | Signup, login, logout, profile creation (username picker) |
| **M3** | **Listing CRUD** | Create, edit, delete listings; image upload to Supabase Storage |
| **M4** | **Marketplace browse** | Public listing feed with filters (WTB/WTS, category, language, price range), sort (newest, price), search |
| **M5** | **Listing detail page** | Full listing view, seller profile card with rep score, "Message Seller" button |
| **M6** | **Messaging & inbox** | Real-time chat per listing, inbox with unread counts, conversation list |
| **M7** | **Trade confirmations & reputation** | Both parties confirm trade completion, rating, rep score calculation |
| **M8** | **Reports & moderation** | Report button, admin dashboard for reviewing reports, ban functionality |
| **M9** | **Listing lifecycle** | Auto-expiry, bump mechanic (e.g. 1 bump per 24h), status transitions |
| **M10** | **Polish & launch** | Responsive design pass, SEO, error handling, loading states, empty states |

---

### Reputation System Design

- **New Trader** badge: 0 confirmed trades
- **Trader** badge: 1–9 confirmed trades
- **Trusted Trader** badge: 10–24 confirmed trades
- **Veteran Trader** badge: 25+ confirmed trades
- Star rating: average of all trade confirmation ratings (1–5)
- Account age displayed on profile
- All of this is publicly visible on every listing and profile

The community sees exactly who they're dealing with. This is the primary moderation mechanism.

---

### Messaging System Design

- Conversations are tied to a specific listing (provides context)
- Either party can initiate from the listing detail page
- Real-time via Supabase Realtime subscriptions
- Inbox shows all conversations, sorted by last message
- Unread count shown in nav (like email)
- Messages are viewable by moderator if a report is filed (disclose this in Terms of Use)

---

### Key Decisions Made This Session

| Decision | Rationale |
|----------|-----------|
| Supabase for backend | Managed PostgreSQL + auth + realtime + storage; solo-dev friendly; data is portable |
| No email verification | Privacy-first; fake emails allowed; anti-abuse handled by rate limiting + CAPTCHA + reputation |
| Community trust model | Reputation badges + trade confirmations replace heavy moderation; scales for one-person operation |
| Built-in messaging | Keeps communication on-platform for trust and moderation surface; no external dependencies |
| Pokémon TCG only | Scoped to one community to start; can expand later |
| No Discord integration | Website-only experience; no external platform dependencies |
| Rate limiting + Turnstile CAPTCHA | Primary anti-spam/bot defense to offset relaxed email policy |
| Marketplace as first nav item | Signals it's a primary feature of the site |

---

## Existing Site — Pending Tasks (Unchanged)

These carry forward from Session 2:

| Task | Description |
|------|-------------|
| 11 | Polish & final QA — deferred until site has real content |
| — | Add real products to `products.json` via spreadsheet workflow |
| — | Add product images to `images/products/` |
| — | Deploy to Cloudflare Pages |

---

## Architecture Decision — RESOLVED (Session 4)

**Option B selected:** Full Next.js migration. The entire site (shop + marketplace) will live in one Next.js app. Cleaner long-term, single codebase, shared auth/nav/styling.

---

## Session 4 — Task Breakdown

### Phase M1: Project Setup (7 tasks) — COMPLETE

| # | Task | Description | Status |
|---|------|-------------|--------|
| M1-1 | Initialize Next.js project | `create-next-app` with TypeScript, App Router, Tailwind CSS 4 | Done |
| M1-2 | Migrate existing static site to Next.js | Converted all HTML pages to Next.js routes, ported CSS and JS logic | Done |
| M1-3 | Set up Supabase project & environment variables | Supabase project configured, env vars in `.env.local` | Done |
| M1-4 | Create Supabase client utilities | Server-side and client-side Supabase client helpers (`src/lib/supabase/`) | Done |
| M1-5 | Create database migrations — core tables | SQL migrations for all 6 tables with enums, indexes, and RLS policies | Done |
| M1-6 | Configure Cloudflare Turnstile CAPTCHA | Reusable `<Turnstile>` component + server-side verification utility | Done |
| M1-7 | Add Marketplace link to navigation | Marketplace is the first nav item in header | Done |

### Phase M2: Auth Flow (6 tasks) — COMPLETE

| # | Task | Description | Status |
|---|------|-------------|--------|
| M2-1 | Build signup page | Email + password + username form with Turnstile CAPTCHA, validation | Done |
| M2-2 | Build login page | Email + password login form with Supabase auth | Done |
| M2-3 | Build logout functionality | Logout button in nav when authenticated | Done |
| M2-4 | Create profile on signup | Database trigger auto-creates profile row with username | Done |
| M2-5 | Add auth state to navigation | Auth-aware nav: login/signup links vs. username + logout | Done |
| M2-6 | Add rate limiting middleware | IP-based rate limiting on signup API route (3 per IP per 24h) | Done |

### Phase M3: Listing CRUD (6 tasks)

| # | Task | Description |
|---|------|-------------|
| M3-1 | Shared types & validation | `src/lib/marketplace/types.ts` (interfaces for all DB entities, enum constants) and `validation.ts` (shared form validation for client + server) |
| M3-2 | Image upload API | `src/app/api/listings/upload/route.ts` — FormData, auth + file validation, Supabase Storage upload, rate limited |
| M3-3 | Create Listing page | `src/app/marketplace/new/page.tsx` with full form + Turnstile. `ImageUploader.tsx` component for drag-and-drop with previews |
| M3-4 | Create Listing API | `src/app/api/listings/route.ts` — POST validates auth, Turnstile, fields, ban check, inserts listing |
| M3-5 | Edit Listing page + API | `src/app/marketplace/[id]/edit/page.tsx` + `src/app/api/listings/[id]/route.ts` with PATCH, GET, DELETE |
| M3-6 | My Listings + ListingCard | `src/app/marketplace/my-listings/page.tsx` + reusable `ListingCard.tsx` component |

### Phase M4: Marketplace Browse (4 tasks)

| # | Task | Description |
|---|------|-------------|
| M4-1 | Marketplace feed page | Replace placeholder with server component, ListingCard grid, "Create Listing" button |
| M4-2 | Filter & sort controls | `FilterBar.tsx` — type toggle, category pills, language, price range, sort. URL search params |
| M4-3 | Server-side filtered queries | Wire filters to Supabase queries. `src/lib/marketplace/queries.ts` for reusable query builders |
| M4-4 | Pagination + empty states | `Pagination.tsx` + `EmptyState.tsx` components |

### Phase M5: Listing Detail Page (4 tasks)

| # | Task | Description |
|---|------|-------------|
| M5-1 | Detail page layout | `src/app/marketplace/[id]/page.tsx` — server component, two-column layout, dynamic SEO metadata |
| M5-2 | Image gallery | `ImageGallery.tsx` — main image + thumbnails, click to switch |
| M5-3 | Seller card + reputation | `SellerCard.tsx` + `src/lib/marketplace/reputation.ts` for tier logic |
| M5-4 | Action bar | `ActionBar.tsx` — "Message Seller", "Report", "Share" buttons |

### Phase M6: Messaging & Inbox (5 tasks)

| # | Task | Description |
|---|------|-------------|
| M6-1 | Conversation API | `src/app/api/conversations/route.ts` — POST creates/finds, GET returns user's conversations |
| M6-2 | Message API | `src/app/api/conversations/[id]/messages/route.ts` — GET paginated, POST rate limited |
| M6-3 | Inbox page | `src/app/marketplace/inbox/page.tsx` — conversation list with last message preview, unread indicator |
| M6-4 | Chat view + Realtime | `src/app/marketplace/inbox/[id]/page.tsx` — message bubbles, Supabase Realtime, `ChatInput.tsx` |
| M6-5 | Unread count in nav | Modify `Header.tsx` — unread badge + "Inbox" link when authenticated |

### Phase M7: Trade Confirmations & Reputation (4 tasks)

| # | Task | Description |
|---|------|-------------|
| M7-1 | Confirmation API | `src/app/api/trade-confirmations/route.ts` — POST with rating + comment |
| M7-2 | Confirmation UI | `TradeConfirmation.tsx` + `StarRating.tsx` on detail page |
| M7-3 | User profile page | `src/app/marketplace/user/[username]/page.tsx` — reputation, reviews, listings |
| M7-4 | Auto-mark sold trigger | `supabase/migrations/00010_auto_mark_sold.sql` — both parties confirm → listing sold |

### Phase M8: Reports & Moderation (5 tasks)

| # | Task | Description |
|---|------|-------------|
| M8-1 | Report API + modal | `src/app/api/reports/route.ts` + `ReportModal.tsx` |
| M8-2 | Admin role setup | Migration adding `is_admin` to profiles + RLS policies + `admin.ts` helper |
| M8-3 | Admin dashboard | `src/app/admin/page.tsx` — pending reports list, admin-only layout |
| M8-4 | Report actions + ban | API routes for resolve/dismiss/ban + `ReportActions.tsx` |
| M8-5 | Ban enforcement | `ban-check.ts` helper in all mutating routes, banned user page |

### Phase M9: Listing Lifecycle (4 tasks)

| # | Task | Description |
|---|------|-------------|
| M9-1 | Auto-expiry | `pg_cron` migration + Vercel cron API route fallback |
| M9-2 | Bump mechanic | `src/app/api/listings/[id]/bump/route.ts` — 1 per 24h, resets expiry |
| M9-3 | Status transitions | Status badges, detail page banners, relist endpoint for expired listings |
| M9-4 | Expiry warnings | Warning badges for listings expiring within 3 days, `dates.ts` helpers |

### Phase M10: Polish & Launch (5 tasks)

| # | Task | Description |
|---|------|-------------|
| M10-1 | Responsive design pass | Audit all marketplace pages at mobile breakpoints |
| M10-2 | Loading states | `loading.tsx` skeleton files for marketplace, detail, inbox |
| M10-3 | Error handling | `error.tsx` + `not-found.tsx` boundaries, consistent API errors |
| M10-4 | SEO & metadata | Dynamic OG tags, `sitemap.ts`, `robots.ts`, JSON-LD |
| M10-5 | Final QA | Empty states, edge cases, toast notifications, accessibility |

---

## Reference Documents

- **Session 2 handoff:** `handoff-kanto-keepsakes-session2.md`
- **Session 1 handoff:** `handoff-kanto-keepsakes.md`
- **README:** `README.md`

---

## Environment

- **Platform:** Linux (Ubuntu)
- **AI Tool:** Claude Code (Opus 4.6 by Anthropic)
- **Git:** SSH to GitHub (`jaredoka/kantokeepsakes`)
- **Node.js:** Available
- **Paths:** Use forward slashes in code
