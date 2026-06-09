# Handoff: Kanto Keepsakes — Session 3

**Date:** 2026-06-09
**Workspace:** `C:\Users\User\Desktop\Kanto Keepsakes\Website`
**Branch:** `main`
**Remote:** `git@github.com:jaredoka/kantokeepsakes.git`

---

## Session 3 Summary

No code changes were made. This session was planning-only for a major new feature: a **Marketplace** — a community-driven WTB/WTS trade listing board for Pokémon TCG, inspired by CSGOLounge (trading only, no betting). The marketplace will be integrated into the existing Kanto Keepsakes site as a new top-level page.

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

### Phase M1: Project Setup (7 tasks)

| # | Task | Description |
|---|------|-------------|
| M1-1 | Initialize Next.js project | `create-next-app` with TypeScript, App Router, Tailwind CSS. Set up project structure inside the existing repo |
| M1-2 | Migrate existing static site to Next.js | Convert current HTML pages (home, japanese, english, accessories, preorder, cart) into Next.js routes. Port CSS and JS logic |
| M1-3 | Set up Supabase project & environment variables | Create Supabase project, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`, install `@supabase/supabase-js` and `@supabase/ssr` |
| M1-4 | Create Supabase client utilities | Set up server-side and client-side Supabase client helpers (for App Router SSR + client components) |
| M1-5 | Create database migrations — core tables | Write SQL migrations for `profiles`, `listings`, `conversations`, `messages`, `trade_confirmations`, `reports` tables with enums, indexes, and RLS policies |
| M1-6 | Configure Cloudflare Turnstile CAPTCHA | Add Turnstile site key/secret to env, create a reusable `<Turnstile>` component, set up server-side verification utility |
| M1-7 | Add Marketplace link to navigation | Update the shared nav/header component to include "Marketplace" as the first nav item |

### Phase M2: Auth Flow (6 tasks)

| # | Task | Description |
|---|------|-------------|
| M2-1 | Build signup page | Email + password signup form with username field, Turnstile CAPTCHA, client-side validation, Supabase `auth.signUp()` |
| M2-2 | Build login page | Email + password login form, Supabase `auth.signInWithPassword()`, redirect on success |
| M2-3 | Build logout functionality | Logout button in nav (shown when authenticated), Supabase `auth.signOut()`, redirect to home |
| M2-4 | Create profile on signup | Supabase database trigger or post-signup hook to insert a row into `profiles` table with chosen username, default values (0 rep, 0 trades, "New Trader") |
| M2-5 | Add auth state to navigation | Show login/signup links when logged out, show username + logout when logged in, persist session across page loads via Supabase middleware |
| M2-6 | Add rate limiting middleware | IP-based rate limiting on signup and listing creation endpoints (e.g. max 3 signups per IP per 24h) using Next.js middleware or API route guards |

---

## Reference Documents

- **Session 2 handoff:** `C:\Users\User\Desktop\Kanto Keepsakes\Website\handoff-kanto-keepsakes-session2.md`
- **Session 1 handoff:** `C:\Users\User\Desktop\Kanto Keepsakes\Website\handoff-kanto-keepsakes.md`
- **README:** `C:\Users\User\Desktop\Kanto Keepsakes\Website\README.md`

---

## Environment

- **Platform:** Windows 11 Pro, bash shell
- **Git:** SSH to GitHub (`jaredoka/kantokeepsakes`)
- **Node.js:** Available
- **Google Drive MCP:** Connected
- **Paths:** Use forward slashes in code
