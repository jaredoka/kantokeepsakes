# Kanto Keepsakes — Session 8 Handoff

## Project Overview

Pokemon TCG peer-to-peer marketplace for Brunei.
Stack: **Next.js 16.2.7** · **React 19** · **TypeScript** · **Supabase** (Postgres + Auth + Storage + Realtime) · **Tailwind v4** · **CSS Modules**

---

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile (rate-limit on signup) |
| `TURNSTILE_SECRET_KEY` | Turnstile server secret |
| `CRON_SECRET` | Bearer token for `/api/cron/expire-listings` |
| `SITE_PASSWORD` | Site-wide password gate (remove to go public) |
| `POKEMON_TCG_API_KEY` | (Unused) Legacy pokemontcg.io key — codebase uses TCGdex (no key needed) |

Copy from `.env.local.example` → `.env.local` if the file is missing.

**Dev server:** `node node_modules/next/dist/bin/next dev` (configured in `.claude/launch.json`)
**Next.js convention:** `src/proxy.ts` (not `middleware.ts` — deprecated in Next.js 16)

**Test account:** `devtest@kantokp.test` / `devtest123` (username: `devtest`, created via Supabase admin API)

---

## Feature Status (All Sessions)

### Auth
| Feature | Status | Files |
|---|---|---|
| Sign up (+ Turnstile) | Done | `src/app/signup/page.tsx`, `src/app/api/signup/route.ts` |
| Log in | Done | `src/app/login/page.tsx` |
| Log out | Done | `src/components/Header.tsx` |
| Forgot password | Done | `src/app/forgot-password/page.tsx` |
| Reset password | Done | `src/app/reset-password/page.tsx` |
| Auth callback (email confirm / reset) | Done | `src/app/auth/callback/route.ts` |
| Marketplace auth gate (redirect to login) | Done | `src/app/marketplace/layout.tsx` |
| `?next=` redirect after login | Done S4 | `src/proxy.ts`, `src/app/marketplace/layout.tsx`, `src/app/login/page.tsx` |
| `?next=` redirect after signup | Done S5 | `src/app/signup/page.tsx` |
| Login→Signup link preserves `?next=` | Done S5 | `src/app/login/page.tsx` |

### Header
| Feature | Status | Notes |
|---|---|---|
| Logo + text fallback | Done | `src/components/Header.tsx` |
| Desktop nav (Marketplace, Saved, Inbox) | Done | Logged-in only for Saved/Inbox |
| Profile avatar button (left of bell) | Done | Shows initials, links to `/marketplace/user/{username}` |
| Notification bell with **realtime** unread count | Done S5 | Supabase Realtime channel `header-unread` on INSERT/UPDATE of `messages` |
| Mobile drawer | Done | Full nav + auth links |

### Marketplace
| Feature | Status | Files |
|---|---|---|
| Browse WTS listings | Done | `src/app/marketplace/wts/page.tsx` |
| Browse WTB listings | Done | `src/app/marketplace/wtb/page.tsx` |
| Text search | Done | `SearchBar.tsx` + `queries.ts` `.ilike` |
| Category / language / type filters | Done | `BrowsePage.tsx` sidebar |
| Pagination | Done | `Pagination.tsx` + URL param |
| Listing detail page | Done | `src/app/marketplace/[id]/page.tsx` |
| Create listing (+ image upload) | Done | `src/app/marketplace/new/page.tsx` |
| Edit listing | Done | `src/app/marketplace/[id]/edit/page.tsx` |
| Bump listing (24h cooldown) | Done | `BumpButton.tsx` + `/api/listings/[id]/bump` |
| Relist expired listing | Done | `RelistButton.tsx` + `/api/listings/[id]/relist` |
| Image upload + client-side compression | Done | `ImageUploader.tsx`, `ImageGallery.tsx`, `/api/listings/upload` |
| OG metadata on listing pages | Done | `generateMetadata()` in `[id]/page.tsx` |
| My listings page | Done | `src/app/marketplace/my-listings/page.tsx` |
| User profile page (public) | Done | `src/app/marketplace/user/[username]/page.tsx` |
| Profile edit (bio + username) | Done S5 | `ProfileEditForm.tsx` + `PATCH /api/profile` |
| Sold-listing archive on profile | Done | Same page, `getSoldListings()` |
| Saved listings / watchlist | Done | `SaveButton.tsx`, `/marketplace/saved`, `saved_listings` table |

### Offers
| Feature | Status | Files |
|---|---|---|
| Make offer on WTS (buyer→seller) | Done | `ActionBar.tsx` → `OfferModal.tsx` → `/api/offers` |
| Offer to sell on WTB (seller→buyer) | Done S5 | Same components, `listingType` prop changes labels |
| View offers on listing | Done | `OfferList.tsx` |
| Accept offer (auto-declines others) | Done | `OfferList.tsx` → `PATCH /api/offers/[id]` |
| Decline offer | Done | `OfferList.tsx` → `PATCH /api/offers/[id]` |
| Trade confirmation + reputation | Done | `TradeConfirmation.tsx` + `/api/trade-confirmations` |

### Inbox / Messaging
| Feature | Status | Files |
|---|---|---|
| Inbox conversation list | Done | `src/app/marketplace/inbox/page.tsx` |
| Real-time chat | Done | `src/app/marketplace/inbox/[id]/page.tsx` |
| Contextual message timestamps | Done S5 | `formatMessageTime()` — today/yesterday/date + time |
| Message seller/buyer from listing | Done | `ActionBar.tsx` → `/api/conversations` |
| Realtime unread count in header | Done S5 | `Header.tsx` Supabase Realtime channel |

### Other
| Feature | Status | Files |
|---|---|---|
| Terms of Service | Done | `src/app/terms/page.tsx` |
| Privacy Policy | Done | `src/app/privacy/page.tsx` |
| Safe Trading Guide | Done | `src/app/safe-trading/page.tsx` |
| About page | Done S7 | `src/app/about/page.tsx` |
| Contact page | Done S7 | `src/app/contact/page.tsx` |
| Custom 404 page | Done S7 | `src/app/not-found.tsx` |
| Custom error boundary | Done S7 | `src/app/error.tsx` |
| Report listing/user | Done | `ReportModal.tsx` + `/api/reports` |
| Admin panel (ban users, resolve reports) | Done | `src/app/admin/` |
| Listing skeleton loading | Done | `src/app/marketplace/loading.tsx` |
| Reputation score on listing cards | Done | `ListingCard.tsx` |
| Auto-expire cron (daily) | Done | `vercel.json` → `/api/cron/expire-listings` |
| Security headers (CSP, X-Frame, etc.) | Done S7 | `src/proxy.ts` |
| Dynamic sitemap | Done S7 | `src/app/sitemap.ts` |
| robots.txt | Done S7 | `src/app/robots.ts` |
| OG image + social metadata | Done S7 | `src/app/layout.tsx`, `public/og-image.png` |
| Supabase remote image patterns | Done S7 | `next.config.ts` |
| Site-wide password gate | Done S7 | `src/proxy.ts` (controlled by `SITE_PASSWORD` env var) |
| WTB/WTS pill color matching | Done S8 | `src/app/marketplace/[id]/page.module.css`, `src/components/ListingCard.module.css` |
| Standardized page titles | Done S8 | `src/app/layout.tsx` + all page files |
| Favicon from logo | Done S8 | `src/app/favicon.ico`, `icon.png`, `apple-icon.png` |
| Two-step trade completion | Done S8 | `trade_completions` table, `/api/trade-completions`, `TradeConfirmation.tsx` |
| Pokemon TCG stock images (TCGdex) | Done S8 | `CardSearch.tsx`, `SetSearch.tsx`, `/api/pokemon-tcg/*` |
| Graded slab overlay | Done S8 | `GradedCardImage.tsx`, `GradedCardImage.module.css`, `grading.ts` |

---

## Architecture Quick-Reference

### Key directories
```
src/
  app/
    marketplace/
      layout.tsx          <- auth gate (redirects to /login?next=...)
      wts/                <- browse WTS
      wtb/                <- browse WTB
      new/                <- create listing
      [id]/               <- listing detail + edit
      inbox/              <- conversations
      user/[username]/    <- public profile + edit (own only)
      saved/              <- watchlist
      my-listings/        <- own listings
    login/                <- login + ?next= redirect
    signup/               <- signup + ?next= redirect
    forgot-password/
    reset-password/
    auth/callback/        <- Supabase auth redirect handler
    about/                <- about page
    contact/              <- contact page (email, Instagram)
    not-found.tsx         <- custom 404 page
    error.tsx             <- custom error boundary
    sitemap.ts            <- dynamic sitemap (static pages + active listings)
    robots.ts             <- robots.txt
    terms/ privacy/ safe-trading/
    api/
      profile/            <- PATCH bio/username
      listings/           <- CRUD + upload + bump + relist
      offers/             <- create + accept/decline
      conversations/      <- create + messages
      reports/            <- submit
      trade-completions/  <- both-parties-complete step
      trade-confirmations/
      pokemon-tcg/        <- search + sets + series proxy to TCGdex API
      admin/              <- ban + report resolution
      cron/               <- expire-listings
      signup/             <- registration
  components/
    Header.tsx            <- avatar, bell (realtime), mobile drawer
    ListingCard.tsx       <- card with WTS/WTB, haves/wants, star rating
    ActionBar.tsx         <- offer/message (WTS/WTB-aware labels), share, report
    OfferModal.tsx        <- offer form (WTS/WTB-aware heading + placeholder)
    OfferList.tsx         <- accept / decline for owner
    ProfileEditForm.tsx   <- inline edit bio + username (own profile only)
    SaveButton.tsx        <- bookmark toggle
    ImageUploader.tsx     <- drag-drop + canvas compression (accessories only)
    CardSearch.tsx        <- TCGdex card search for singles/graded
    SetSearch.tsx         <- TCGdex set search for sealed
    GradedCardImage.tsx   <- CSS slab overlay for graded cards
  lib/
    supabase/
      client.ts           <- browser client (createBrowserClient)
      server.ts           <- server component client (createServerClient + cookies)
      middleware.ts       <- updateSession (called by proxy.ts)
    marketplace/
      queries.ts          <- fetchListings() with filters, sort, pagination
      types.ts            <- all TypeScript types + enums
      dates.ts            <- expiry helpers
      validation.ts       <- field validators for listings, offers, images
      grading.ts          <- parseGradingTag() utility
    turnstile.ts          <- Cloudflare Turnstile server-side verify
    rate-limit.ts         <- in-memory rate limiter (Map-based, 60s cleanup)
  proxy.ts                <- Next.js 16 proxy (replaces middleware.ts)
```

### Database tables
| Table | RLS | Purpose |
|---|---|---|
| `profiles` | Yes | Users — username, bio, avatar_url, reputation, is_banned, is_admin |
| `listings` | Yes | WTS/WTB listings — type, title, price, images, status, expiry, wants_cash/wants_singles/wants_graded/wants_sealed flags |
| `offers` | Yes | Offers on listings — message, card images, status |
| `conversations` | Yes | DMs — participant_1 (owner), participant_2 (other), listing |
| `messages` | Yes | Chat messages — body, is_read, sender_id |
| `trade_completions` | Yes | Both-parties-complete step — listing_id, user_id |
| `trade_confirmations` | Yes | Ratings — 1-5 stars, comment, confirmer/confirmed (gated behind completions in S8) |
| `reports` | Yes | User/listing reports — reason, description, status |
| `saved_listings` | Yes | Bookmarks — user_id + listing_id |
| `listing-images` (bucket) | Yes | Storage — `{user_id}/{timestamp}-{random}.ext` |

### Auth flow
1. User visits `/marketplace/*` unauthenticated
2. `src/proxy.ts` sets `x-current-path` header on every request
3. `src/app/marketplace/layout.tsx` calls `getUser()`; if null -> `redirect('/login?next=<path>')`
4. User logs in at `/login`; on success -> `router.push(next)` (back to original page)
5. Signup page also reads `?next=`; login "Sign up" link forwards the param

---

## Session 5 Changes

1. **Signup `?next=` redirect** — reads `window.location.search` like login, no longer hardcoded to `/marketplace`
2. **Login "Sign up" link** — forwards `?next=` param via `useEffect` + `signupHref` state
3. **Chat timestamps** — `formatMessageTime()` in inbox `[id]/page.tsx`: today = time only, yesterday = "Yesterday HH:MM", older = "Mon DD HH:MM"
4. **Profile edit** — `PATCH /api/profile` route (bio max 500, username 3-20 with uniqueness check); `ProfileEditForm` client component, only rendered when `isOwnProfile` is true
5. **Realtime unread count** — `Header.tsx` now subscribes to Supabase Realtime channel `header-unread` on `messages` INSERT/UPDATE; re-fetches unread count when a non-self message arrives
6. **WTB seller offers** — `ActionBar` and `OfferModal` accept `listingType` prop; WTB listings show "Offer to Sell" / "Message Buyer" with seller-specific modal heading and placeholder

---

## Session 7 Changes

1. **Custom 404 page** — `src/app/not-found.tsx` with brand styling, "Go home" and "Browse marketplace" CTAs
2. **Custom error boundary** — `src/app/error.tsx` client component with `reset()` retry, logs error to console
3. **About page** — `src/app/about/page.tsx` with "What we do", "How it works", "Our community", "Get started" sections
4. **Contact page** — `src/app/contact/page.tsx` with clickable cards (email: kantokeepsakes@gmail.com, Instagram: @kantokeepsakes), FAQ section
5. **Image optimization** — Compressed logo PNGs (462KB→150KB, 251KB→57KB), generated WebP variants
6. **Security headers** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy added to `src/proxy.ts`
7. **Dynamic sitemap** — `src/app/sitemap.ts` includes static pages + active listings from Supabase
8. **robots.txt** — `src/app/robots.ts` blocks /api/, /admin/, /marketplace/inbox/, /marketplace/my-listings/
9. **OG image + social metadata** — Generated `public/og-image.png` (1200×630), added OpenGraph + Twitter Card metadata to root layout
10. **Supabase remote image patterns** — `next.config.ts` allows `<Image>` to load from `*.supabase.co/storage/`
11. **Site-wide password gate** — `src/proxy.ts` serves HTML login form when `SITE_PASSWORD` is set; cookie-based (30-day), API routes excluded
12. **Vercel deployment** — Deployed to production at kantokeepsakes.com, Cloudflare DNS (A record + CNAME, DNS only mode)
13. **Cron schedule fix** — Changed from hourly to daily (`0 0 * * *`) to comply with Vercel Hobby plan limits

---

## Session 8 Changes

1. **W13 — WTB/WTS pill color matching** — Updated listing detail page pill colors to match browse page: WTS gold (#c49010), WTB blue (#1565a8). Changed in `src/app/marketplace/[id]/page.module.css` and `src/components/ListingCard.module.css`.
2. **W14 — Standardized page titles** — All pages use single-word title + ` | Kanto Keepsakes` via Next.js `title.template` in root layout.
3. **W15 — Favicon from logo** — Generated favicon.ico (32x32), icon.png (32x32), apple-icon.png (180x180) from Kanto Keepsakes logo.
4. **W16 — Two-step trade completion** — Separated "Complete Trade" step from rating. Both parties must click "Complete" before either can rate. New `trade_completions` table + `POST /api/trade-completions` route. Listing marked sold when both complete. Anti-abuse protections included.
5. **W17 — Pokemon TCG stock images** — Replaced user image uploads with TCGdex API card search (singles/graded) and set search (sealed); kept manual upload for accessories. New `CardSearch.tsx`, `SetSearch.tsx` components. New `/api/pokemon-tcg/search`, `/api/pokemon-tcg/sets`, `/api/pokemon-tcg/series` proxy routes. Updated CSP and `next.config.ts` for `assets.tcgdex.net`. EN/JA dual-language support with image fallback.
6. **W18 — Graded slab overlay** — `GradedCardImage` component with CSS slab frame wrapping card images for graded listings. PSA uses real slab template image (`/images/psa-slab-template.webp`); CGC=blue, BGS=black/gold use CSS-only frames. Grade number in label bar. Used on listing cards and detail pages. New `parseGradingTag()` utility in `grading.ts`.
7. **Wants type flags migration** — Added `wants_cash`, `wants_singles`, `wants_graded`, `wants_sealed` boolean columns to `listings` table (`supabase/migrations/00016_wants_type_flags.sql`). Backfill: listings with prices get `wants_cash = true`.
8. **Seed script** — New `scripts/seed.ts` creating 5 test users and 30 test listings with real TCGdex card images, grading tags, and wants flags.
9. **ListingCard redesign** — Two-column body layout: Haves (images) + Wants (pills). Graded card images use `GradedCardImage` component. Want pills show Cash/Singles/Graded/Sealed/Any Offers.
10. **Inbox UI refresh** — Updated inbox conversation list and chat page styling with avatar initials circles, unread badges, and improved layout.

### Key decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Card image source | **TCGdex API** (`api.tcgdex.net/v2`) | Free, no auth needed, 14-language support (EN + JA), always up-to-date, no storage costs |
| Sealed product images | **Set logos from TCGdex** | API provides set logos/symbols; no booster box product photos exist in any free API |
| Graded overlay style | **CSS slab frame + PSA template image** | PSA uses real slab template for realism; CGC/BGS use CSS-only frames |
| Card search UX | **Search with filters** | Name search + series/era + set + promo-only filters; dual-language search |
| Trade flow | **Two-step: complete then rate** | Prevents premature ratings; both parties must agree trade happened |

---

## Website Roadmap

All website work should be completed before beginning iOS app development.

### Website Phase 1 — Pre-Launch Blockers (Must Fix)

These are hard blockers — the website should not go live without them.

| # | Task | Why it's a blocker | Files to create/modify |
|---|---|---|---|
| W1 | Create `src/app/not-found.tsx` | Users see generic Next.js 404 | New: `src/app/not-found.tsx` |
| W2 | Create `src/app/error.tsx` | Unhandled errors show raw stack traces | New: `src/app/error.tsx` |
| W3 | Create `src/app/about/page.tsx` | Header links to `/about` which currently 404s | New: `src/app/about/page.tsx` |
| W4 | Create `src/app/contact/page.tsx` | Header links to `/contact` which currently 404s | New: `src/app/contact/page.tsx` |
| W5 | Add `CRON_SECRET` to `.env.local.example` | Undocumented env var; new deployments will break the cron job | Modify: `.env.local.example` |
| W6 | Optimize logo PNGs | 250-462KB per image; causes slow page loads | Replace or compress PNGs in `public/images/` |

### Website Phase 2 — Pre-Launch Recommended (Should Fix)

Not hard blockers but important for a professional launch.

| # | Task | Benefit | Files to create/modify |
|---|---|---|---|
| W7 | Add security headers in proxy | CSP, X-Frame-Options, Referrer-Policy, X-Content-Type-Options | Modify: `src/proxy.ts` |
| W8 | Add dynamic sitemap | Search engines can discover listing pages | New: `src/app/sitemap.ts` |
| W9 | Add robots.txt | Controls search engine crawling, points to sitemap | New: `src/app/robots.ts` |
| W10 | Add OG image to root layout | Social media link previews show a branded image | Modify: `src/app/layout.tsx`, add image to `public/` |
| W11 | Configure `images.remotePatterns` | Next.js `<Image>` component works with Supabase storage URLs | Modify: `next.config.ts` |

### Website Phase 3 — Pre-Launch Polish & Features (Session 8) ✓

UI consistency, trade flow improvement, and Pokemon TCG stock images. All complete.

| # | Task | Status | Files |
|---|---|---|---|
| W13 | Match WTB/WTS pill colors on detail page | Done | `src/app/marketplace/[id]/page.module.css`, `src/components/ListingCard.module.css` |
| W14 | Standardize page titles (template pattern) | Done | `src/app/layout.tsx` + all page files |
| W15 | Favicon from logo | Done | `src/app/favicon.ico`, `icon.png`, `apple-icon.png` |
| W16 | Two-step trade completion (complete → rate) | Done | `trade_completions` table, `/api/trade-completions`, `TradeConfirmation.tsx` |
| W17 | Pokemon TCG stock images via TCGdex API | Done | `CardSearch.tsx`, `SetSearch.tsx`, `/api/pokemon-tcg/*`, CSP, `next.config.ts` |
| W18 | Graded slab overlay on card images | Done | `GradedCardImage.tsx`, `GradedCardImage.module.css`, `grading.ts`, `ListingCard.tsx` |

### Website Phase 4 — Post-Launch Improvements

To be done after the website is live and working.

| # | Task | Benefit | Notes |
|---|---|---|---|
| W19 | Email notifications | Users get notified of offers, messages, trade confirmations | Resend or SendGrid integration; new API helper |
| W20 | Replace in-memory rate limiting with Redis | Current rate limiter resets on every Vercel cold start | Only needed if scaling to multiple instances |
| W21 | E2E tests with Playwright | Automated regression testing | New test suite; not blocking launch |
| W22 | Avatar upload on profile edit | Users can set a profile picture | Needs new storage bucket for avatars |
| W23 | Listing image reordering | Users can drag-and-drop to reorder images | Enhancement to `ImageUploader.tsx` |

---

## iOS App Roadmap

Begin after the website is fully launched and stable. The iOS app covers **marketplace features only** (no shop/product catalog).

### Decision Log

| Decision | Choice | Reasoning |
|---|---|---|
| Architecture | **Option A — Direct Supabase SDK (hybrid)** | iOS uses Supabase Swift SDK for direct reads + realtime. Server-validated writes (ban checks, rate limiting, Turnstile, auto-decline logic) still call the existing Next.js API routes. Avoids reworking all API routes for cookie-less auth. |
| Turnstile (CAPTCHA) | **Option 2 — Skip Turnstile on iOS** | Cloudflare Turnstile has no native iOS SDK. Instead, make Turnstile optional in the API routes when a valid auth token is present. Rely on stricter server-side rate limiting for iOS requests (lower limits for requests without a Turnstile token). |

### Architecture Diagram

```
                    +-----------+
                    | Supabase  |
                    | (Postgres |
                    |  Auth     |
                    |  Storage  |
                    |  Realtime)|
                    +-----+-----+
                          |
              +-----------+-----------+
              |                       |
    +---------+--------+    +---------+--------+
    | Next.js Website  |    |   iOS App        |
    | (cookie auth)    |    | (token auth)     |
    |                  |    |                  |
    | Browser client   |    | Supabase Swift   |
    | Server client    |    | SDK (direct)     |
    | API routes       |    |                  |
    +------------------+    | Calls /api/*     |
                            | for validated    |
                            | writes           |
                            +------------------+
```

### What the iOS app shares with the website

| Layer | Shared | Notes |
|---|---|---|
| Supabase project | Same | Same URL, anon key, database |
| Auth (users table) | Same | Supabase Auth works cross-platform |
| RLS policies | Same | Identical security on both clients |
| Database schema | Same | All tables, enums, relationships |
| Realtime channels | Same | Messages, unread counts |
| Storage bucket | Same | `listing-images` bucket with public URLs |
| Validation rules | Must replicate | Title 5-120, desc 10-2000, etc. — shared constants needed |
| Server-side logic | API calls | Ban checks, Turnstile, rate limiting, auto-decline on accept |

### iOS Phase 1 — Foundation + Backend Prep

Backend changes (web side) that must happen before the iOS app can call API routes:

| # | Task | Notes |
|---|---|---|
| I1 | Create `src/lib/supabase/api-auth.ts` | Shared `getAuthUser(request)` helper: tries cookies first, then `Authorization: Bearer <token>` header |
| I2 | Update all API routes to use `getAuthUser(request)` | Replace the current `createClient()` + `getUser()` pattern in every route |
| I3 | Make Turnstile optional in `POST /api/signup` and `POST /api/listings` | Skip Turnstile verification when a valid Bearer token is present; apply stricter rate limits instead |
| I4 | Add CORS headers if using a custom API domain | Not needed if iOS calls the same Vercel domain |

iOS app setup:

| # | Task | Notes |
|---|---|---|
| I5 | Xcode project setup | SwiftUI, iOS 17+, Swift Package Manager |
| I6 | Supabase Swift SDK integration | Auth, database, storage, realtime — using the same anon key |
| I7 | Auth flow | Login, signup (calls `POST /api/signup`), forgot password, session persistence in Keychain |
| I8 | Tab bar navigation | Browse, Inbox, Profile tabs |
| I9 | API client helper | Sends `Authorization: Bearer <token>` on all API route calls |

### iOS Phase 2 — Browse + Listings

| # | Task | Data source |
|---|---|---|
| I10 | WTS/WTB browse with filters | Direct SDK query (search, category, language, sort, pagination) |
| I11 | Listing detail screen | Direct SDK query (images, description, seller card, actions) |
| I12 | Create listing form + image upload | `POST /api/listings` + `POST /api/listings/upload` |
| I13 | Edit listing | `PATCH /api/listings/[id]` |
| I14 | Bump + relist actions | `POST /api/listings/[id]/bump` and `/relist` |
| I15 | My Listings tab | Direct SDK query |
| I16 | Saved listings (bookmark toggle) | Direct SDK query + `POST/DELETE` to `saved_listings` via SDK |

### iOS Phase 3 — Messaging + Offers

| # | Task | Data source |
|---|---|---|
| I17 | Inbox conversation list | Direct SDK query (with last message preview + unread count) |
| I18 | Chat view with live messages | Direct SDK query + Supabase Realtime channel |
| I19 | Send messages | `POST /api/conversations/[id]/messages` |
| I20 | Start conversation from listing | `POST /api/conversations` |
| I21 | Make offer modal | `POST /api/offers` (WTS: "Make Offer", WTB: "Offer to Sell") |
| I22 | Offer list on listing detail | Direct SDK query + `PATCH /api/offers/[id]` for accept/decline |
| I23 | Push notifications (APNs) | Requires Supabase Edge Function or webhook to trigger APNs |

### iOS Phase 4 — Profile + Polish

| # | Task | Notes |
|---|---|---|
| I24 | User profile view | Direct SDK query |
| I25 | Profile edit (bio, username) | `PATCH /api/profile` |
| I26 | Trade confirmation + star rating | `POST /api/trade-confirmations` |
| I27 | Report user/listing | `POST /api/reports` |
| I28 | Pull-to-refresh, infinite scroll | Standard iOS UX patterns |
| I29 | Offline handling + error states | Graceful degradation when network is unavailable |
| I30 | App Store submission | Screenshots, metadata, review guidelines compliance |

### iOS Screen-to-Website Mapping

| iOS Screen | Website Page | Data Source |
|---|---|---|
| Login | `/login` | Supabase Auth SDK |
| Sign Up | `/signup` | `POST /api/signup` |
| Forgot Password | `/forgot-password` | Supabase Auth SDK |
| WTS Browse | `/marketplace/wts` | Direct SDK query |
| WTB Browse | `/marketplace/wtb` | Direct SDK query |
| Listing Detail | `/marketplace/[id]` | Direct SDK query |
| Create Listing | `/marketplace/new` | `POST /api/listings` (+ upload) |
| Edit Listing | `/marketplace/[id]/edit` | `PATCH /api/listings/[id]` |
| My Listings | `/marketplace/my-listings` | Direct SDK query |
| User Profile | `/marketplace/user/[username]` | Direct SDK query |
| Edit Profile | Same screen (inline) | `PATCH /api/profile` |
| Inbox | `/marketplace/inbox` | Direct SDK query |
| Chat | `/marketplace/inbox/[id]` | Direct SDK query + Realtime |
| Saved | `/marketplace/saved` | Direct SDK query |
| Make Offer (modal) | `OfferModal` | `POST /api/offers` |
| Offer List | `OfferList` | Direct SDK query |
| Report (modal) | `ReportModal` | `POST /api/reports` |

### API routes the iOS app must call

These routes contain server-side business logic that cannot be replicated via the Supabase SDK alone:

| Route | Reason |
|---|---|
| `POST /api/signup` | Rate limiting, admin user creation (Turnstile skipped on iOS) |
| `POST /api/listings` | Ban check, rate limiting, 30-day expiry calc (Turnstile skipped on iOS) |
| `PATCH /api/listings/[id]` | Ban check, ownership verification |
| `DELETE /api/listings/[id]` | Ban check, ownership verification, soft delete |
| `POST /api/listings/upload` | Server-side file validation, rate limiting, storage path generation |
| `POST /api/listings/[id]/bump` | 24h cooldown enforcement, expiry extension |
| `POST /api/listings/[id]/relist` | Status validation, expiry reset |
| `POST /api/offers` | Ban check, self-offer prevention, duplicate check |
| `PATCH /api/offers/[id]` | Ownership check, auto-decline other pending offers |
| `POST /api/conversations` | Ban check, self-message prevention, deduplication |
| `POST /api/conversations/[id]/messages` | Ban check, participant check, rate limiting |
| `PATCH /api/profile` | Username uniqueness check |
| `POST /api/reports` | Ban check, duplicate report check |
| `POST /api/trade-confirmations` | Accepted offer check, party verification, reputation update, auto-mark-sold |

### `getAuthUser` helper (to be created in iOS Phase 1)

```typescript
// src/lib/supabase/api-auth.ts
export async function getAuthUser(request: NextRequest) {
  // Try cookie-based auth first (web)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { user, supabase };

  // Fall back to Bearer token (iOS/mobile)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user: tokenUser } } = await supabase.auth.getUser(token);
    if (tokenUser) return { user: tokenUser, supabase };
  }

  return { user: null, supabase };
}
```

---

## API Route Reference

### Auth
| Method | Route | Auth | Rate Limit |
|---|---|---|---|
| POST | `/api/signup` | Public | 3/24h per IP |

### Listings
| Method | Route | Auth | Rate Limit |
|---|---|---|---|
| POST | `/api/listings` | User | 10/h per IP |
| GET | `/api/listings/[id]` | Public | — |
| PATCH | `/api/listings/[id]` | Owner | — |
| DELETE | `/api/listings/[id]` | Owner | — |
| POST | `/api/listings/upload` | User | 30/h per IP |
| POST | `/api/listings/[id]/bump` | Owner | 24h cooldown |
| POST | `/api/listings/[id]/relist` | Owner | — |

### Offers
| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/offers` | User | Cannot offer on own listing |
| GET | `/api/offers?listingId=` | User | Owner sees all; others see own |
| PATCH | `/api/offers/[id]` | Listing owner | Accept auto-declines others |

### Conversations
| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/api/conversations` | User | Own conversations only |
| POST | `/api/conversations` | User | Creates or returns existing |
| GET | `/api/conversations/[id]/messages` | Participant | Cursor pagination, marks read |
| POST | `/api/conversations/[id]/messages` | Participant | 30/min rate limit |

### Trade
| Method | Route | Auth | Rate Limit |
|---|---|---|---|
| POST | `/api/trade-completions` | User | — |
| POST | `/api/trade-confirmations` | User | — |
| GET | `/api/trade-confirmations` | Public | — |

### Pokemon TCG (TCGdex proxy)
| Method | Route | Auth | Rate Limit |
|---|---|---|---|
| GET | `/api/pokemon-tcg/search` | Public | 30/min per IP |
| GET | `/api/pokemon-tcg/sets` | Public | 20/min per IP |
| GET | `/api/pokemon-tcg/series` | Public | 20/min per IP |

### Profile + Reports + Admin
| Method | Route | Auth |
|---|---|---|
| PATCH | `/api/profile` | User |
| POST | `/api/reports` | User |
| POST | `/api/admin/ban` | Admin |
| PATCH | `/api/admin/reports/[id]` | Admin |
| GET | `/api/cron/expire-listings` | CRON_SECRET |
