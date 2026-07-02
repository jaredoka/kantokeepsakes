# Kanto Keepsakes — Session 24 Handoff

## Project Overview

**Goal:** an online peer-to-peer marketplace for **Pokemon TCG hobbyists around the world** — a have/want trade listing board in the spirit of the golden days of CSGOLounge, without the gambling. The platform provides discovery (listings, filters, search), negotiation (offers, real-time chat), and trust (reputation, two-step trade completion, moderation) — and stays out of the money: payment is negotiated between traders in chat.

Started as a Brunei-focused retail site; per owner decision (D1) the shop is **retired** and Kanto Keepsakes is now a pure peer-to-peer trading platform. The platform also stays out of shipping entirely (D3) — traders arrange the exchange themselves.

Stack: **Next.js 16.2.7** · **React 19** · **TypeScript** · **Supabase** (Postgres + Auth + Storage + Realtime) · **Tailwind v4** · **CSS Modules**

**Current status (S21):** Website Phase 5 is complete — G1 email notifications, G2 have/want matching, G3 counteroffers, G4 listing comments, G5 shop retired, G6 country UX. G7 (public launch — remove `SITE_PASSWORD`) is gated until the mobile app is ready (D5). **Next milestone: the mobile app (React Native/Expo, both stores — see Mobile App Roadmap, decisions D6–D9).** Phase M0 backend prep is done (S22); migrations applied through 00021 — **00022 (push_tokens) and 00023 (blocks) still need running**.

### Product decision log (Session 14 — resolved by owner)

| # | Decision | Answer |
|---|---|---|
| D1 | Shop's fate | **Retire the shop entirely** — marketplace-only from here on (owner decision) |
| D2 | Money model | **Trade-first**: no price field, cash negotiated in chat, platform never touches payments (recommended default, accepted) |
| D3 | Shipping / cross-border trust | **No shipping features at all** — users handle trades themselves. No tracking, no shipping-proof step, no ships-to fields. Trust = reputation + two-step completion + moderation, global from day one (owner decision) |
| D4 | CSGOLounge-era features | **All four**: have/want matching, counteroffers, listing comments, email notifications (recommended default, accepted) |
| D5 | Public launch gating | **Password gate stays until both the website (Phase 5) and the mobile app are ready** to launch together (owner decision) |

Known code-level implications: ~~retiring the shop~~ (**done S19**); `currency` is hardcoded to `"BND"` in the create flow and is meaningless under D2; existing listings were backfilled to `country = 'Brunei'` and the browse default should not assume Brunei; UI is English-only (JA localization is a candidate later phase).

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
| `POKEMON_TCG_API_KEY` | pokemontcg.io key — used by `scripts/update-card-data.ts` (image-fallback set matching) |
| `RESEND_API_KEY` | Resend API key for email notifications (G1). Unset = sends are logged and skipped |
| `EMAIL_FROM` | From address for notification emails (default `Kanto Keepsakes <notifications@kantokeepsakes.com>`) |
| `MOBILE_CLIENT_KEY` | Shared key embedded in the mobile app; signup requests carrying it skip Turnstile (B2). Unset = mobile signup path disabled |

Copy from `.env.local.example` → `.env.local` if the file is missing.

**Dev server:** `node node_modules/next/dist/bin/next dev` (configured in `.claude/launch.json`)
**Next.js convention:** `src/proxy.ts` (not `middleware.ts` — deprecated in Next.js 16)

**Test account:** `devtest@kantokp.test` / `devtest123` (username: `devtest`, created via Supabase admin API)

---

## Git Workflow

This project uses **GitHub Flow**. `main` is always production (auto-deployed to kantokeepsakes.com via Vercel).

### Rules for all future work
- **Never commit directly to `main`.**
- Every task (feature, fix, chore) starts on its own branch.
- Changes merge into `main` via a Pull Request on GitHub.
- Vercel auto-creates a preview deployment URL for every PR.

### Branch naming

| Prefix | Use for |
|--------|---------|
| `feature/` | New functionality (e.g. `feature/email-notifications`) |
| `fix/` | Bug fixes (e.g. `fix/listing-image-not-loading`) |
| `chore/` | Deps, config, docs, cleanup |

### Starting any new task

```bash
git checkout main && git pull origin main
git checkout -b feature/<task-name>
# ... make changes, commit ...
git push -u origin feature/<task-name>
# Open PR on GitHub → Vercel posts preview URL → merge → delete branch
```

### Infrastructure added (Session 9)
- `.github/PULL_REQUEST_TEMPLATE.md` — auto-populates PR description on GitHub
- `README.md` → Development Workflow section — full workflow docs including branch protection setup

### Branch protection
Branch protection on `main` has been configured in GitHub UI (require PR before merging, no bypass).

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
| Country filter (pill + dropdown) | Done S11 | `CountryPill.tsx`, `BrowsePage.tsx`, `queries.ts` |
| State filter (sidebar dropdown) | Done S11 | `FilterBar.tsx` (only when country has states) |
| Pagination | Done | `Pagination.tsx` + URL param |
| Listing detail page | Done | `src/app/marketplace/[id]/page.tsx` |
| Create listing (5-section card UI + state dropdown) | Done S10/10b/11 | `src/app/marketplace/new/page.tsx`, `CardPicker.tsx`, `cardData.ts` |
| CardPicker search (era-wide/global/JP/promos) | Done S12 | `CardPicker.tsx`, `cardData.ts` — TCGdex `?name=like:` search, `JA_SET_MAP`, promo sets |
| Card data generator + image fallback | Done S13 | `scripts/update-card-data.ts` → `cardData.generated.json`; pokemontcg.io fallback images |
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
| Have/Want matching (Matches page) | Done S16 | `/marketplace/matches`, `matching.ts` — card identity from image URLs, two-way badges |
| Listing comments (community vetting) | Done S18 | `ListingComments.tsx`, `/api/listings/[id]/comments`, migration 00020 |
| Country display (flags on cards + detail) | Done S20 | `ListingCard.tsx`, detail status row, `countryFlag()` |
| Marketplace landing home page | Done S19 | `src/app/page.tsx` — hero, feature cards, principles strip |

### Offers
| Feature | Status | Files |
|---|---|---|
| Make offer on WTS (buyer→seller) | Done | `ActionBar.tsx` → `OfferModal.tsx` → `/api/offers` |
| Offer to sell on WTB (seller→buyer) | Done S5 | Same components, `listingType` prop changes labels |
| View offers on listing | Done | `OfferList.tsx` |
| Accept offer (auto-declines others) | Done | `OfferList.tsx` → `PATCH /api/offers/[id]` |
| Decline offer | Done | `OfferList.tsx` → `PATCH /api/offers/[id]` |
| Counteroffers (negotiation threads) | Done S17 | Same route, `parent_offer_id`/`author_id`, migration 00019 |
| Email notifications (offers/messages/trades + prefs) | Done S15 | `src/lib/email.ts` (Resend), migration 00018, `ProfileEditForm` toggles |
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
      new/                <- create listing (5-section card UI, S10)
      [id]/               <- listing detail + edit
      inbox/              <- conversations
      user/[username]/    <- public profile + edit (own only)
      saved/              <- watchlist
      matches/            <- have/want matching page (S16)
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
    CardSearch.tsx        <- TCGdex card search for singles/graded (edit page)
    CardPicker.tsx        <- TCGdex card browser with ERA_DATA (create page, S10)
    SetSearch.tsx         <- TCGdex set search for sealed
    GradedCardImage.tsx   <- CSS slab overlay for graded cards
  lib/
    supabase/
      client.ts           <- browser client (createBrowserClient)
      server.ts           <- server component client (createServerClient + cookies)
      middleware.ts       <- updateSession (called by proxy.ts)
    marketplace/
      queries.ts          <- fetchListings() with filters, sort, pagination
      matching.ts         <- card-key derivation from image URLs + matchListing() (S16)
      types.ts            <- all TypeScript types + enums
      dates.ts            <- expiry helpers
      validation.ts       <- field validators for listings, offers, images
      grading.ts          <- parseGradingTag() utility
      cardData.ts         <- ERA_DATA (from generated JSON), JA_SET_MAP, PTCGIO_SET_MAP, TRANSLATION_MAP, expandQuery, COUNTRIES, STATES_BY_COUNTRY
      cardData.generated.json <- era/set taxonomy + pokemontcg.io map; rebuild with `npm run update-cards` (S13)
    email.ts              <- Resend sendEmail() + notifyUser() with pref gating (S15)
    turnstile.ts          <- Cloudflare Turnstile server-side verify
    rate-limit.ts         <- in-memory rate limiter (Map-based, 60s cleanup)
  proxy.ts                <- Next.js 16 proxy (replaces middleware.ts)
```

### Database tables
| Table | RLS | Purpose |
|---|---|---|
| `profiles` | Yes | Users — username, bio, avatar_url, reputation, is_banned, is_admin |
| `listings` | Yes | WTS/WTB listings — type, title, price, images, looking_for_images, status, expiry, wants_cash/wants_singles/wants_graded/wants_sealed flags, country, state |
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

### Key decisions (S8)

| Decision | Choice | Reasoning |
|---|---|---|
| Card image source | **TCGdex API** (`api.tcgdex.net/v2`) | Free, no auth needed, 14-language support (EN + JA), always up-to-date, no storage costs |
| Sealed product images | **Set logos from TCGdex** | API provides set logos/symbols; no booster box product photos exist in any free API |
| Graded overlay style | **CSS slab frame + PSA template image** | PSA uses real slab template for realism; CGC/BGS use CSS-only frames |
| Card search UX | **Search with filters** | Name search + series/era + set + promo-only filters; dual-language search |
| Trade flow | **Two-step: complete then rate** | Prevents premature ratings; both parties must agree trade happened |

---

## Session 10 Changes — Create Listing Page Overhaul

Complete replacement of the Create Listing page (`/marketplace/new`) with a new 5-section card-based design. The old form (WTB/WTS toggle, category/language dropdowns, single-card search, top-level grading section) was replaced with a streamlined layout matching the reference files in `design_ref_temp/design_handoff_create_listing/`.

### Files created

**1. `src/lib/marketplace/cardData.ts`** — Static data module for the new Create page.
- `ERA_DATA` — 10 eras with ~120 sets, each `{ id, en, ja, sets: [{ id, en, ja }] }`. Eras: Scarlet & Violet, Sword & Shield, Sun & Moon, XY, Black & White, HeartGold SoulSilver, Diamond & Pearl, EX, Classic, Pocket.
- `TRANSLATION_MAP` — Bidirectional EN↔JA lookup for ~50 Pokemon names, set names, and common terms (e.g. "Pikachu" ↔ "ピカチュウ").
- `expandQuery(q: string): string[]` — Returns equivalent search terms in both languages using `TRANSLATION_MAP`. Used by CardPicker for cross-language name search.
- `COUNTRIES` — 195 entries with `{ name, flag }` for the country selector.
- Exported interfaces: `CardItem { localId, name, img, set, lang }`, `Country`, `Era`, `EraSet`.

**2. `src/components/CardPicker.tsx`** + **`src/components/CardPicker.module.css`** — New card browser component (separate from existing `CardSearch.tsx`).
- Fetches directly from `https://api.tcgdex.net/v2/{lang}/sets/{setId}` — no internal API proxy.
- Uses static `ERA_DATA` for era/set dropdowns (no fetch to `/api/pokemon-tcg/series`).
- UI: yellow-bordered container (`#fffef7` bg), filter bar with EN/JP language toggle, era select, set select, All/Cards/Promos type pills, name search input.
- Card grid: 54px tiles, max-height 230px scrollable area, yellow border on hover.
- Props: `{ onSelectCard: (card: CardItem) => void }`.

### Files rewritten

**3. `src/app/marketplace/new/page.tsx`** — Complete replacement with 5-section card-based form.

Page structure (5 numbered sections):
- **Section 1 — Country**: Search input + scrollable dropdown (195 countries, max-height 114px), flag emoji in section header when selected. Country + state now sent to the API and stored in the database (added in S11).
- **Section 2 — Title**: Live monospace preview bar (single-line desktop, two-line mobile at <768px), two `[H]`/`[W]` prefixed inputs with 40 char max, character counters.
- **Section 3 — Haves**: ThumbContainer (72px card thumbnails with red × remove) + Cash PrefCard (72×92px toggle) + CardPicker. Desktop = side-by-side; mobile = stacked.
- **Section 4 — Wants**: ThumbContainer + 4 PrefCards (Cash, Singles, Graded, Sealed with custom SVG icons) + CardPicker. Desktop = side-by-side; mobile = stacked.
- **Section 5 — Description**: Optional textarea, 300 char max, character counter.

Sub-components defined in-file: `SectionHead`, `CharCount`, `ThumbContainer`, `PrefCard`, `IconSingles`, `IconGraded`, `IconSealed`.

State shape:
```
country, countryQuery, countryOpen         (UI only, not sent to API)
havesText, wantsText                       (max 40 each)
haveImages: CardItem[]                     (from CardPicker)
havesCash: boolean                         (PrefCard toggle)
wantImages: CardItem[]                     (from CardPicker)
wPrefs: { cash, singles, graded, sealed }  (PrefCard toggles)
description: string                        (max 300)
isMobile: boolean                          (window.innerWidth < 768)
```

On submit, state transforms to API body shape:
- `haveImages` → `haveImages: [{ url: card.img }]`
- `wantImages` → `wantItems: [{ url: card.img }]`
- `wPrefs.cash` → `wantsCash`, `wPrefs.singles` → `wantsSingles`, etc.
- `price: null`, `currency: "BND"` (no price section in new design)
- `wantsOffers: false` (hardcoded)

Kept from existing page: client-side auth check via `supabase.auth.getUser()`, Turnstile CAPTCHA, loading/error states, `fetch('/api/listings', ...)` submission.

**4. `src/app/marketplace/new/page.module.css`** — Complete replacement matching the reference spec.
- White section cards on `#fafafa` background, 720px max-width, 12px gap between sections.
- Section headers: black number badge + title + optional flag/note.
- `[H]`/`[W]` input rows with gray-100 prefix badges.
- 72×92px PrefCard toggles with yellow active state (`var(--color-yellow-dark)` border, `var(--color-yellow-light)` bg).
- ThumbContainer: dashed border when empty, solid when filled.
- Responsive at 767px: stacked layout, no side borders on section cards, `padding: 16px 0`.

### Files modified

**5. `src/lib/marketplace/validation.ts`**
- `validateHavesText()` / `validateWantsText()` — max changed from 100 to **40** characters.
- `validateDescription()` — already optional (empty returns valid), unchanged.
- `validateListing()` — removed "at least one want type required" check, removed "price required when wantsCash" check. Now runs 7 basic validators (havesText, wantsText, description, price, currency, haveImages, wantItems).

**6. `src/app/api/listings/route.ts`**
- Body type widened: `haveImages` accepts `(HaveImage | { url: string })[]`, same for `wantItems`.
- Normalization: converts simple `{ url }` objects to full `HaveImage` (with `grader: "RAW"`, `grade: ""`) and `WantItem` (with `type: "singles"`) before validation.
- `description` null-safety: `(description || "").trim()` instead of `(description as string).trim()`.
- `price` simplified: `price: price ?? null` (no longer conditionally null based on wantsCash).
- Title auto-constructed server-side: `[H] ${havesText} [W] ${wantsText}`.
- `images` column stores have image URLs; `looking_for_images` stores want item URLs.

**7. `src/proxy.ts`**
- Added `https://api.tcgdex.net` to CSP `connect-src` (for CardPicker API calls).
- Added `https://assets.tcgdex.net` to CSP `img-src` (for card images).

### Files NOT modified
- `src/lib/marketplace/types.ts` — Existing `HaveImage`, `WantItem`, grading types unchanged. Used by API, edit page, listing display.
- `src/components/CardSearch.tsx` + `.module.css` — Kept for the **edit page**. Not used by the new create page.
- `src/app/marketplace/[id]/edit/page.tsx` — Edit page unchanged. Separate task.
- `src/app/globals.css` — Design tokens already matched spec.

### Key decisions (S10)

| Decision | Choice | Reasoning |
|---|---|---|
| CardPicker vs CardSearch | **Separate component** | Avoids breaking the edit page while implementing the new design. CardPicker fetches TCGDex directly; CardSearch uses internal proxy routes. |
| Card data source | **Static ERA_DATA + direct TCGDex fetch** | No internal API proxy needed for browsing. ERA_DATA provides the era/set taxonomy (~120 sets). TCGDex provides the individual cards. |
| Cross-language search | **TRANSLATION_MAP + expandQuery()** | Bidirectional EN↔JA lookup for ~50 common terms. Allows searching "Pikachu" to find ピカチュウ and vice versa. |
| Country field | **Persisted in DB (S11)** | Country selector now stores `country` and `state` in listings table. Backfilled to Brunei for existing listings. |
| Price field | **Removed from form** | New design has no price section. Price is always null. Cash preference is a PrefCard toggle. |
| Grading per card | **Descoped** | The original plan mentioned per-card PSA overlays on thumbnails. Cards are added as simple thumbnails. Grading can be described in the description field. |

### Data flow (S10 Create page)
```
CardPicker (browse cards)
  → onSelectCard(CardItem)
  → page state (haveImages / wantImages)
  → ThumbContainer (display 72px thumbnails)
  → handleSubmit() transforms CardItem[] → {url}[]
  → POST /api/listings (normalize + validate + DB insert)
  → redirect to /marketplace/{id}
```

### Pending work from S10
1. **Visual verification** — Auth redirect on `/marketplace/new` blocks preview. Log in to verify the rendered page.
2. **Edit page alignment** — `/marketplace/[id]/edit/page.tsx` still uses the old form. Consider updating to match.
3. ~~**Country persistence** — If country/state should be stored, add DB columns + API handling.~~ **Done in S11.**
4. **Per-card grading** — Descoped from S10. Could be added as overlays on ThumbContainer thumbnails.

---

## Session 10b Changes — State Dropdown + PSA Slab Fix

Three changes: state/province dropdown on Create Listing, country flag confirmation, and PSA slab overlay restoration.

### 1. State/Province dropdown on Create Listing

**`src/lib/marketplace/cardData.ts`** — Added `STATES_BY_COUNTRY: Record<string, string[]>` with subdivisions for 20 countries: Australia, Brazil, Brunei, Canada, China, Germany, India, Indonesia, Japan, Malaysia, Mexico, Philippines, South Korea, Taiwan, Thailand, United Kingdom, United States, Vietnam. Country names match the `COUNTRIES` array keys exactly.

**`src/app/marketplace/new/page.tsx`** — Added `state` state variable (`string | null`). After country is selected, if `STATES_BY_COUNTRY[country.name]` has entries, a `<select>` dropdown appears below the country input labeled "State / Province / District (optional)" (label updated in S11). Changing the country resets state to null. Country + state now sent to the API (added in S11).

**`src/app/marketplace/new/page.module.css`** — Added `.stateWrap`, `.stateLabel`, `.stateOptional`, `.stateSelect` styles matching the existing country input appearance.

### 2. Country flag display

Already implemented in S10. The flag emoji shows in the section header via `<SectionHead flag={country.flag}>` when a country is selected. No changes needed.

### 3. PSA slab overlay fix on marketplace browse

**Problem:** S10 commit `6ec7a18` accidentally removed grading detection and `GradedCardImage` rendering from `ListingCard.tsx`. All card images rendered as plain `<img>` tags. The CSS classes `.imageCellGraded` and `.imageCellSingles` existed but were unused.

**Fix in `src/components/ListingCard.tsx`:**
- Restored imports: `parseGradingTag` from `grading.ts`, `GradedCardImage` component
- Added grading detection: `const grading = listing.category === "graded" ? parseGradingTag(listing.title) : null`
- Added `cellSizeClass` logic: graded → `.imageCellGraded` (56x94), singles → `.imageCellSingles` (54x75), default → `.imageCellDefault` (56xauto)
- Conditional rendering: graded cards wrapped with `<GradedCardImage size="sm">`, others render plain `<img>`

**Listing detail page (`/marketplace/[id]`):** Already correct — does NOT pass `grading` to `ImageGallery`, so slab overlays do not appear on individual listing pages. No changes needed.

---

## Session 11 Changes — Country Filter, Wants Thumbnails, Label Fix

Four changes: country/state filter on marketplace browse, wants thumbnails in listing cards, Create Listing label fix, and listing detail title format confirmation.

### 1. Country/State Filter on Marketplace Browse

**Database migration — `supabase/migrations/00017_add_country_state.sql`**
- Adds `country` (text, default 'Brunei') and `state` (text) columns to `listings`
- Backfills existing listings to `country = 'Brunei'`
- Creates `idx_listings_country` index

**`src/lib/marketplace/types.ts`** — Added `country: string | null` and `state: string | null` to the `Listing` interface.

**`src/app/api/listings/route.ts`** — Accepts `country` and `state` in the POST body, saves them in the database insert. Country/state are now persisted (was UI-only in S10).

**`src/lib/marketplace/queries.ts`** — Added `country` and `state` to `ListingFilters` interface. When provided, applies `.eq("country", country)` and `.eq("state", state)` filters.

**`src/app/marketplace/_components/CountryPill.tsx`** (NEW) — Client component for country selection. Shows a pill with flag + country name (or "All Countries") next to the "Marketplace" heading. Clicking opens a searchable dropdown of 195 countries from `cardData.ts`. Selecting a country updates URL params (`?country=Name`); "All Countries" clears the filter. Uses `useRouter`/`useSearchParams`/`usePathname` for URL management.

**`src/app/marketplace/_components/CountryPill.module.css`** (NEW) — Pill styling (inline-flex, border, flag + text, hover), dropdown (absolute positioning, 260px wide, 240px max-height scrollable list, search input, country option buttons).

**`src/app/marketplace/_components/BrowsePage.tsx`** — Reads `country` and `state` from searchParams, passes to `fetchListings`. Renders `CountryPill` next to h1 in a new `.titleRow` wrapper. Passes `country` to FilterBar and MobileFilterSection. Updated `hasActiveFilters` and `countActiveFilters` to include country/state.

**`src/app/marketplace/_components/BrowsePage.module.css`** — Added `.titleRow` class for heading + pill layout.

**`src/app/marketplace/_components/MobileFilterSection.tsx`** — Added `country?: string` prop, passed through to FilterBar.

**`src/components/FilterBar.tsx`** — Added `country?: string` prop. When country is set and `STATES_BY_COUNTRY[country]` has entries, renders a State `<select>` dropdown between Search and Sort.

### 2. Wants Thumbnails in Marketplace ListingCard

**`src/components/ListingCard.tsx`** — Changed `MAX_VISIBLE_IMAGES` from `4` to `10`. Added wants image support: reads `listing.looking_for_images`, shows up to 10 thumbnails as an image grid above the want pills in the Wants panel. Uses same `.imageCell` + `.imageCellSingles` styling as Haves. Includes overflow count (+N) when > 10 images.

**`src/components/ListingCard.module.css`** — Added `.wantPillsWithImages` class (`margin-top: 6px`) for spacing between want thumbnails and pills when both are present.

### 3. Create Listing Label Fix

**`src/app/marketplace/new/page.tsx`** — Changed "State / Province" label to "State / Province / District".

### 4. Listing Detail Title Format

No changes needed. The API route already constructs titles as `[H] ... [W] ...` (line 135 of `route.ts`). The detail page renders `listing.title` as raw text. User confirmed this is the desired behavior.

### Key decisions (S11)

| Decision | Choice | Reasoning |
|---|---|---|
| Existing listings without country | **Backfill to Brunei** | User chose "Default to Brunei" since most users are in Brunei |
| Country persistence | **Now stored in DB** | Was UI-only in S10; now `country` and `state` columns in `listings` table |
| Country pill placement | **Next to heading** | Shows flag + country name, toggle-able via dropdown |
| Title styling on detail page | **Raw text as-is** | No styled badges; keep `[H] ... [W] ...` format |

### Migration note

The migration `00017_add_country_state.sql` must be run on the Supabase database before the country filter will work. Until then, "All Countries" (no filter) works correctly; selecting a specific country triggers a "column listings.country does not exist" error from Supabase.

---

## Session 24 Changes — M1 continuation: listing detail + offer threads

- **Fixed PR #16's failing Vercel build** — the root `tsconfig.json` `include: ["**/*.ts(x)"]` swept `mobile/**` into the website's type check, and React Native's global `FormData` type conflicts with lib.dom's (surfaced in `upload/route.ts`). Fix: `"exclude": ["node_modules", "mobile"]` — the Expo app type-checks with its own tsconfig.
- **Mobile listing detail screen** — `mobile/app/listing/[id].tsx` (root-stack route with header, auth-guarded): type badge + time-ago + location, title, seller line (**reputation_score is stored ×10** — divide before display, hide when 0, same as `SellerCard.tsx`), HAVES/WANTS horizontal image rows, want-pref pills, description, Make Offer / Offer to Sell + Message Seller/Buyer (creates conversation via `POST /api/conversations`, jumps to Inbox tab — chat screen still pending), and full **offer threads** ported from the website's `OfferList` (same `buildThreads`/`authoredByOwner` turn logic): accept/decline/counter for the actionable party, waiting hint otherwise. Browse and Matches cards now navigate to it (typed routes, object-form `router.push`). New `mobile/lib/format.ts` (`formatTimeAgo`).
- **Verified E2E** (Expo web + Playwright, misty/ash seed accounts): browse→detail navigation, offer POST via Bearer, duplicate-offer 409 rendered inline, owner sees Accept/Decline/Counter and no Make Offer on own listing, decline PATCH flips badge, deep link works, garbage id → "Listing not found.", card images render from tcgdex. Test offer cleaned from DB.
- **Dev-loop gotchas (this machine):** Metro's file watcher does not reliably pick up edits — restart `expo start` after code changes before re-verifying. Killing a background `expo start`/`next dev` shell leaves the node child alive holding the port — check `netstat -ano | findstr :8081` and kill the PID.

**Next (M1):** create-listing flow (RN CardPicker), realtime chat screen (inbox conversation detail), my-listings, push-notification registration, forgot-password, in-app account deletion + block (M1-8 compliance).

---

## Session 23 Changes — M1 Mobile App Bootstrap

The Expo app lives at **`mobile/`** in this repo (D10): own `package.json` and `node_modules`, no npm workspaces (Metro dislikes hoisted deps). Expo SDK 57 / RN 0.86 / expo-router, TypeScript strict. `mobile/.env` (gitignored, see `.env.example`) carries `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY`, `EXPO_PUBLIC_API_URL` (localhost:3001 in dev), `EXPO_PUBLIC_MOBILE_CLIENT_KEY`.

Built this session: `lib/supabase.ts` (AsyncStorage-backed session — SecureStore's 2 KB limit can't hold Supabase sessions), `lib/api.ts` (`apiFetch` attaching the Bearer token, network-error safe), `lib/theme.ts` (website design tokens), `context/session.tsx` provider, auth screens (login/signup via `/api/signup` with the mobile client key), tab shell (Browse/Matches/Inbox/Profile), RN `ListingCard`, Browse with WTS/WTB toggle over direct SDK reads, Matches over `/api/matches`, Inbox conversation list, Profile with logout.

**Website change:** `proxy.ts` now answers CORS preflight and adds wildcard CORS headers on `/api/*` — safe because browsers never send cookies on wildcard CORS (cookie auth stays same-origin); needed for Bearer clients on web origins, which is also the local dev loop (Expo web) on this Windows machine (no simulators).

**Verified (S23)** by driving the real app via Expo web + Playwright against live Supabase and the local API: login screen → real sign-in as ash → Browse renders 23 live listing cards with card images → WTB toggle → Matches tab calls `/api/matches` through CORS (correct empty state) → Inbox lists real conversations → Profile shows AshK_trainer → logout returns to login.

**Dev loop on this machine:** `cd mobile && npx expo start --web` (plus the website dev server for API routes). Native builds/testing happen via Expo Go on a phone or EAS Build — not possible on this box.

**Next (M1 continuation):** listing detail screen with offer threads, create-listing flow (RN CardPicker), realtime chat, my-listings, push notification registration (expo-notifications is installed), forgot-password, then the M1-8 compliance items in-app (account deletion, block).

---

## Session 22 Changes — M0 Mobile Backend Prep (B1–B6)

All backend work the mobile app needs, in the website repo. Full Bearer-token API access verified end-to-end by driving the API exactly as the app will (raw `Authorization: Bearer` header, no cookies).

- **B1** — `src/lib/supabase/api-auth.ts`: `getAuthUser(request)` tries cookies then Bearer. **Key correctness detail:** for Bearer auth it returns a fresh client with the token bound as the Authorization header, so RLS evaluates as that user (the original handoff snippet reused the cookie client — RLS would have run as anon). Rolled out across all 15 auth-required routes via codemod; public GET handlers keep the plain server client.
- **B2** — Turnstile skipped for Bearer-authenticated listing creation (5/h per-user rate limit instead). Mobile signup (no token exists yet) sends `x-mobile-client: $MOBILE_CLIENT_KEY` to skip CAPTCHA with a 2/24h-per-IP limit — app-extractable secrets only raise the bar; the rate limit does the real work.
- **B3** — `GET /api/matches` mirrors the matches page for mobile.
- **B4** — `push_tokens` table (migration 00022), `/api/push-tokens` register/unregister (admin-client writes so a device switching accounts can re-own its token), and `notifyUser()` now sends Expo Push (`exp.host/--/api/v2/push/send`) alongside email with the same pref gating, pruning tokens Expo reports as DeviceNotRegistered.
- **B5** — `DELETE /api/account` (requires `{ "confirm": "DELETE" }`), cleans the user's storage folder, deletes the auth user (cascades through profiles → everything). Danger-zone button in ProfileEditForm. Required by App Store Guideline 5.1.1(v).
- **B6** — `blocks` table (migration 00023, blocker-only RLS), `/api/blocks` GET/POST/DELETE, `isBlockedEitherWay()` (service-role, fails open pre-migration) enforced in conversations POST, messages POST, offers POST, and comments POST. BlockButton on public profiles.

**Verified (S22):** Bearer GETs (offers/conversations/matches) 200 with correct RLS scoping; no/garbage token → 401; listing created via Bearer with no Turnstile then deleted via Bearer; delete-account confirm guard → 400, real deletion verified gone; push/blocks routes fail gracefully pre-migration; cookie-path regression green (offers/conversations/matches all 200 from a browser session).

**To activate:** run migrations `00022_push_tokens.sql` and `00023_blocks.sql` in the SQL Editor; set `MOBILE_CLIENT_KEY` in Vercel env when the app ships.

---

## Session 20 Changes — G6 Country UX Polish

Roadmap item **G6**: country is now a visible, validated trader-location signal with no Brunei assumptions.

- **Migration `00021_drop_country_default.sql`** — drops the `DEFAULT 'Brunei'` on `listings.country` (a Brunei-era assumption that silently stamped countryless inserts). **Run in Supabase SQL Editor.**
- **Server-side validation** — `POST /api/listings` now requires a country from the COUNTRIES list and validates state against STATES_BY_COUNTRY (the form marked country "Required" but the server never enforced it).
- **Country is now displayed**: flag emoji on every ListingCard header (tooltip shows state + country) and a "🇧🇳 State, Country" tag in the listing detail status row — previously country was stored and filterable but invisible.
- **Create-page prefill** — country/state prefill from the user's most recent listing (skipped if the user already picked one).
- **About page copy** rewritten from "across Brunei" to the worldwide vision ("Started in Brunei, open to everyone"). Contact page's "based in Brunei Darussalam" kept — it's the operator's factual location.
- New `countryFlag(name)` helper in `cardData.ts`.

Verified E2E: 24 flags on browse cards, detail location tag renders, create page prefilled "Brunei" from ash's last listing, About copy updated. Server-side country validation is Turnstile-gated so it was code-reviewed rather than driven; the client requires a country selection and the server is now authoritative.

Still open from the decision log: `currency` remains hardcoded to "BND" in the create flow (meaningless under D2 since price is always null) — cosmetic, cleanup candidate whenever the listings table gets its next migration.

---

## Session 19 Changes — G5 Retire the Shop

Roadmap item **G5** (owner decision D1): Kanto Keepsakes is now marketplace-only.

**Removed:** all shop route dirs (`/japanese`, `/english`, `/accessories`, `/preorder`, `/cart`, plus the six `-sealed/-singles/-graded` subcategory routes), shop components (`CategoryPage`, `ProductCard`, `ProductGrid`, `CartToast` + their CSS), `src/lib/products.ts`, and the entire `legacy/` folder (the original pre-Next.js static site, including `legacy/data/products.json`). All recoverable from git history.

**Home page rewritten** as a marketplace landing: hero ("Trade Pokémon cards with hobbyists around the world") with Browse/Post CTAs, three feature cards (Have/Want listings; Matches & offers; Community trust), and a principles strip (no fees, no gambling, no middleman) linking to the safe trading guide. Root layout metadata updated from "retailer based in Brunei" to the worldwide marketplace description; `CartToast` removed from the layout.

Old shop routes now 404 (the branded not-found page). Sitemap never included them; header/footer had no shop links.

---

## Session 18 Changes — G4 Listing Comments (+ RLS recursion fix)

Roadmap item **G4**: public comment threads on listings, CSGOLounge-style.

- **Migration `00020_listing_comments.sql`** — `listing_comments` table (500-char check, cascade deletes) with RLS: everyone reads, authenticated users post, **authors delete their own, admins delete any — deliberately not the listing owner** (owners must not be able to silence scam warnings; moderation via reports/admin).
- **API**: `GET/POST /api/listings/[id]/comments` (10/min rate limit, ban check, listing must exist and not be removed; returns 503 until the migration is applied) and `DELETE /api/comments/[id]` (RLS-enforced, 404 on silent denial).
- **UI**: `ListingComments` on the listing detail page (left column) — author profile links with trade-count pills, relative timestamps, × on own comments only, textarea with 0/500 counter. Hides itself entirely pre-migration. No emails for comments by design.

### The is_admin / RLS recursion saga (important history)

Applying 00020 exposed **two latent schema bugs**, both fixed this session:
1. **`profiles.is_admin` never existed.** Migration 00011 assumed it ("already exists per schema") but nothing ever created it — meaning 00011's admin policies never applied and the admin panel's `requireAdmin()` was broken in production since S8. Both 00011 and 00020 now create the column idempotently.
2. **00011's original policies were recursively self-referential** — a SELECT policy on `profiles` whose USING clause queries `profiles` → PostgreSQL error 42P17 ("infinite recursion detected in policy") the moment it finally applied, which **broke every user-scoped profiles join** (browse, offers, comments). Fixed with the standard Supabase pattern: a `SECURITY DEFINER public.is_admin()` function used by all admin policies. Also dropped the redundant admin-select policy on profiles (00002 already makes profiles public) and added the missing **"Admins can update any listing"** policy (the ban flow's listing-removal step had silently matched 0 rows forever).

**Admin account created:** username `kantokeepsakes` (kantokeepsakes@gmail.com), `is_admin = true`, sign-in verified.

Verified E2E post-migration: post/list as two users, no delete button on others' comments, cross-user API delete → 404, delete-own works, empty body → 400, and the profiles joins confirmed restored after the recursion fix.

**Schema drift note:** the live DB and the migrations folder diverged three times before this was caught (00013–00017 unapplied; phantom `is_admin`; latent recursive policies). All migrations 00011+ are idempotent — re-running the folder in order is safe and recommended after any doubt. 00001–00010 predate the convention and error harmlessly on re-run ("already exists").

---

## Session 17 Changes — G3 Counteroffers

Roadmap item **G3**: negotiation threads on offers. Either party can now respond to a pending offer turn with accept, decline, or a **counter** — countering marks the turn `countered` and appends a new turn to the thread. Turns alternate; only the party who didn't author the latest turn can act.

### Data model (migration `00019_counteroffers.sql` — idempotent)

- `offers.parent_offer_id` — chains turns into a thread
- `offers.author_id` — who wrote the turn (`null` = the offerer, back-compat)
- **`offerer_id` stays the non-owner party on every turn** — this keeps trade-completions (counterparty = `acceptedOffer.offerer_id`), the pending-offer duplicate check, offer queries, and existing RLS working unchanged
- `offer_status` enum gains `'countered'`
- Two new RLS policies: listing owners may **insert** counter turns on their own listings; offerers may **update** owner-authored turns (accept/decline a counter) but never their own turns

### API — `PATCH /api/offers/[id]` rewritten

- Accepts `{ status: "accepted" | "declined" | "countered", message? }`
- Turn guard: responder must be a trade party and must NOT be the author of the turn (403 "Waiting for the other party..." otherwise)
- Counter: inserts the child turn first, then marks the parent `countered` (child rolled back via admin client if the mark fails)
- Accept: auto-decline of other pending offers now runs through the **admin client** — when the offerer accepts an owner's counter, RLS would block them from touching other buyers' offers
- Reads use `select("*")` so accept/decline keeps working before migration 00019 is applied (counter fails gracefully with an error message pre-migration)
- Emails: new `offer_countered` kind (gated by `notify_offers`); accepted/declined emails go to the author of the responded turn

### UI — `OfferList.tsx` rewritten as threads

Offer rows group into threads via `parent_offer_id`. Each thread card shows the offerer's profile, the latest-turn status badge, all turns chronologically (labeled "Offer" / "Counter · author", owner turns get a yellow left border), and for the actionable party: **Accept / Decline / Counter** buttons with an inline counter textarea. The non-actionable party sees "Waiting for … to respond."

### Verification (S17, pre-migration)

Playwright two-account run: misty (offerer) sees the waiting hint and no action buttons; her API self-accept attempt returned 403 with the turn-guard message; ash (owner) sees Accept/Decline/Counter; the counter form renders and pre-migration submission fails gracefully ("Failed to create counteroffer."); decline works through the rewritten route (regression) and fired the declined email. **Full counter flow needs migration 00019 run in Supabase SQL Editor first.** Test offer cleaned up.

---

## Session 16 Changes — G2 Have/Want Matching

Roadmap item **G2**: the "find trades for me" page. New **Matches** nav link (header + mobile drawer) → `/marketplace/matches` shows, per active listing you own, other traders' listings where **they have a card you want** and/or **they want a card you have**, with the matched cards' thumbnails shown per direction and a "Two-way match" badge (ranked first, then by matched-card count).

**Design: no migration needed.** Card identity is derived from the stored image URLs — both CDNs encode it in the path (`assets.tcgdex.net/{lang}/{serie}/{set}/{num}/high.webp`, `images.pokemontcg.io/{set}/{num}.png`), and pokemontcg.io set IDs normalize back to TCGdex IDs via `PTCGIO_SET_MAP`. Card key = `{lang}:{set}:{number}` (e.g. `en:svp:85`). Matching is exact-card, same-language. Every existing listing is matchable today.

- `src/lib/marketplace/matching.ts` — `cardKeyFromUrl()`, `matchListing()` (pure functions)
- `src/app/marketplace/matches/page.tsx` — server component; fetches your active listings + up to 500 active candidates, matches in-process; empty states for no-listings / no-matches
- Future options (documented, not built): explicit card-identity columns for name-level fuzzy matching ("any Pikachu") or SQL-side array matching at scale; cash/type-flag matching (note: the create form's "haves cash" toggle isn't persisted today)

Verified E2E with two complementary listings referencing the same card via **different CDNs** (cross-CDN normalization proven), two-way badge + direction chips correct, empty state for a user with no listings. Test listings cleaned up.

---

## Session 15 Changes — G1 Email Notifications

Roadmap item **G1** implemented: transactional notification emails via the **Resend** REST API (no SDK dependency), with per-user preferences. Everything fails soft — without `RESEND_API_KEY`, sends are logged and skipped, so dev and pre-configuration production behave normally.

### New files

- **`src/lib/email.ts`** — `sendEmail()` (Resend REST call) + `notifyUser(userId, kind, data)`. `notifyUser` uses the service-role admin client to read the recipient's profile prefs and resolve their email via `auth.admin.getUserById`, renders a simple branded HTML template, and never throws. Missing pref columns (pre-migration) default to enabled. Banned users are skipped.
- **`supabase/migrations/00018_notification_prefs.sql`** — adds `notify_offers`, `notify_messages`, `notify_trades` booleans (default true) to `profiles`. Idempotent. **Must be run in Supabase SQL Editor before pref toggles persist** (emails work pre-migration; toggling prefs off does not).

### Notification triggers (all fire-and-forget via `after()` from next/server)

| Event | Route | Recipient | Kind |
|---|---|---|---|
| New offer | `POST /api/offers` | Listing owner | `offer_received` |
| Offer accepted/declined | `PATCH /api/offers/[id]` | Offerer | `offer_accepted` / `offer_declined` |
| New message | `POST /api/conversations/[id]/messages` | Other participant | `new_message` — **only for the first unread message** from that sender (reading the chat re-arms it), so active chats don't email per message |
| One side completed trade | `POST /api/trade-completions` | Other party | `trade_partner_completed` |
| Both sides completed | `POST /api/trade-completions` | Both parties | `trade_ready_to_rate` |
| Rating received | `POST /api/trade-confirmations` | Rated user | `rating_received` |

Pref gating: offer kinds → `notify_offers`, message → `notify_messages`, trade/rating kinds → `notify_trades`.

### Preferences UI

`ProfileEditForm` (own profile → Edit Profile) gained an "Email notifications" fieldset with three checkboxes. `PATCH /api/profile` accepts `notifyOffers`/`notifyMessages`/`notifyTrades`; the form only sends prefs that changed so username/bio saves keep working until migration 00018 is applied. `Profile` type gained the three optional fields.

### Not covered (intentional)

- Offerers whose pending offers get auto-declined when another offer is accepted are not emailed (noise). Disputes don't email the other party (admin handles via reports). Both are easy follow-ups if wanted.

### Activation checklist (production)

1. Run `00018_notification_prefs.sql` in Supabase SQL Editor.
2. Create a Resend account, verify the `kantokeepsakes.com` domain (DNS records at Cloudflare), create an API key.
3. Add `RESEND_API_KEY` (and optionally `EMAIL_FROM`) to Vercel env + redeploy.

### Verification (S15)

Playwright against dev (no API key → log-and-skip mode): seed user ash made an offer on another user's listing → server logged the skipped `offer_received` email to the owner's real address with prefs resolved; first chat message → logged `new_message` email; second message in the same burst → correctly **no** email (throttle); profile Edit form renders the three checkboxes. Typecheck + lint clean. Note: the run left one test offer and two "please ignore" messages on a seed listing in the shared DB.

---

## Session 13 Changes — Card Data Freshness + Image Fallback

Goal: latest eras/sets in the CardPicker, and images for every card that has one anywhere. User was AFK for the clarifying questions, so the recommended options were implemented: generator script, pokemontcg.io fallback, no TCG Pocket, name tiles for vintage JP.

### 1. Era/set taxonomy is now generated

**`scripts/update-card-data.ts`** (new, `npm run update-cards`) regenerates **`src/lib/marketplace/cardData.generated.json`** from the TCGdex API:
- Curated era grouping (ERA_DEFS in the script): 11 eras, newest first, now including **Mega Evolution** (Mega Evolution, Phantasmal Flames, Ascended Heroes, Perfect Order, Chaos Rising, Energy + MEP promos). SV era gained Black Bolt, White Flare, Energies, My First Battle. Other eras gained previously missing sets (Detective Pikachu `det1`, Southern Islands `si1`, Double Crisis `dc1`, Dragon Vault `dv1`, Radiant Collection `rc`, Best of Game `bog`, etc.). Excluded: TCG Pocket (digital-only), McDonald's, Trainer Kits, misc.
- Promo sets auto-detected by name (+ pinned overrides for POP/np).
- **ptcgioSetMap**: TCGdex→pokemontcg.io set IDs, matched by name/date/count *within promo and non-promo partitions* (promos must match promos — date+count alone mis-matched svp→sv1), verified by HEAD-checking a sample image. Manual pins for svp/sve (pokemontcg.io promo sets carry placeholder dates + lagging counts).

`cardData.ts` now imports the JSON: `ERA_DATA`, `PROMO_SETS_BY_ERA`, `PTCGIO_SET_MAP` come from it; `JA_SET_MAP`, `TRANSLATION_MAP`, `COUNTRIES`, `STATES_BY_COUNTRY` stay hand-curated.

**Update procedure when a new set/era releases:** `npm run update-cards` → review the JSON diff → add new JP set IDs to `JA_SET_MAP` (JP sets release ~2 months before EN; match by release date + card count) → commit.

### 2. pokemontcg.io image fallback

`CardPicker` resolves card images as: TCGdex scan → `images.pokemontcg.io/{ptcgioSetId}/{number}.png` (EN only) → name tile + placeholder. The constructed-assets-URL guess was removed (when TCGdex omits `image`, the asset genuinely 404s). CSP `img-src` gained `https://images.pokemontcg.io`. "Pikachu with Grey Felt Hat" now shows its real artwork.

### 3. JA_SET_MAP additions / fixes

- Mega era: `me01→[M1L,M1S]`, `me02→[M2]`, `me03→[M3]` (verified by release-date alignment; Ascended Heroes/Chaos Rising have no JP data yet)
- `sv10.5b→[SV11B]`, `sv10.5w→[SV11W]`, `det1→[SMP2]`
- Original era rekeyed to TCGdex canonical IDs: `base2`=Jungle, `base3`=Fossil, `base5`=Team Rocket (old hand-rolled ids `jungle`/`fossil`/`rocket` don't exist on TCGdex)

### Known data gaps (upstream, not fixable client-side)

- TCGdex has **no JA scans yet for the newest JP sets** (SV11B/SV11W, all Mega-era M sets) — they render as name tiles; scans appear automatically once TCGdex adds them (no re-run needed, images resolve at runtime).
- No image source anywhere for: mep/mee (Mega promos/energy), mfb, xya, ex5.5, exu, parts of cel25 Classic Collection, ecard2/3 reverse-holos — name tiles.
- Verified via Playwright: Mega era browsable (130 Phantasmal Flames cards), Grey Felt Hat searchable with real image + selectable thumbnail (naturalWidth>0), EN Black Bolt 172 cards, JP Black Bolt/Mega name tiles, mep promo browse 52 name tiles.

---

## Session 12 Changes — CardPicker Search & Filter Fixes

All four S12 issues fixed in `CardPicker.tsx` + `cardData.ts`. Verified end-to-end with Playwright against the live dev server (login → Create Listing → drive the picker).

### How the new search works

The picker now has three data-loading modes (priority order):
1. **Set browse** — a specific set is selected → fetch `GET /v2/{lang}/sets/{id}` (unchanged for EN; JP now fetches the mapped Japanese set(s)). Full set shown, no cap; search box narrows in-memory.
2. **Name search** — no set selected but search text present → `GET /v2/{lang}/cards?name=like:{term}` (one request per `expandQuery()` term, deduped). Works with an era selected (results filtered to that era's sets + promos) or "All Eras" (everything). Capped at 100 results with a "Showing first 100 of N results" hint. Search input is debounced 350ms.
3. **Promo browse** — era selected + "Promos" pill + no search → fetches the era's promo sets.

Results across sets sort **newest era first** (ERA_DATA order), then by set order within the era, then numeric localId — via the `SET_RANK` map.

### `src/lib/marketplace/cardData.ts` additions

- `JA_SET_MAP: Record<string, string[]>` — EN set ID → Japanese TCGdex set ID(s), verified against the live `/v2/ja/sets` list. One EN set often bundles several JA sets (e.g. `sv04` Paradox Rift → `SV4K` + `SV4M` + `SV3a`). BW/DP eras and a few EN-exclusive sets (Champion's Path, Call of Legends, Base Set 2, Legendary Collection, EX Emerald, EX Power Keepers) have **no JA data on TCGdex** and are unmapped — the UI shows "No Japanese card data for this set yet."
- `PROMO_SETS_BY_ERA` — all TCGdex promo sets per era: `svp`, `swshp`, `smp`, `xyp`, `bwp`, `hgssp`, `dpp`+`pop6-9`, `np`+`pop1-5`, `basep`+`wp`. TCGdex has **no Japanese promo sets**.
- `ALL_PROMO_SET_IDS` — flat Set used by the Cards/Promos type pills.
- `SET_RANK` — set ID → sort rank (era index × 1000 + set index; promos rank after their era's sets; JA IDs inherit their EN parent's rank).

### `src/components/CardPicker.tsx` rewrite

- Era/set dropdowns now **always display English names** (JP toggle no longer switches labels — it switches the card pool).
- JP mode: selecting era/set fetches the mapped JA set(s); card names/tooltips show the **Japanese name** (user decision). English search terms reach Japanese cards via `expandQuery()` (~50-name translation map).
- Cards with no scan on TCGdex (e.g. `svp-085` "Pikachu with Grey Felt Hat") render as **selectable name-text tiles**; selecting one stores `/images/card-placeholder.svg` (new file in `public/images/`) as the image URL.
- State is derived, not duplicated: a `plan` memo (sets/search/notice + fetch key) drives one fetch effect; `loading`/`fetchErr`/`notice` are computed from the key, so type-pill toggles and within-set searches never refetch.
- `loading="lazy"` on grid images (up to 100+ tiles per search).

### Key decisions (S12)

| Decision | Choice | Reasoning |
|---|---|---|
| Multi-set search transport | **TCGdex `?name=like:` filter endpoint** | One request per search term instead of fanning out ~120 per-set fetches; no rate-limit concern |
| Cross-set/era ordering | **Newest era first** | User decision; matches what people trade most |
| Broad-search result limit | **Cap 100 + hint** (search mode only; set browse uncapped) | User decision; keeps grid fast without pagination UI |
| JP card names | **Japanese** | User decision; matches what's printed on the card |
| Promo scope | **All promo sets, all eras** | User decision |
| Imageless cards | **Name-tile + placeholder SVG** | TCGdex has no scan for some promos; hiding them would make e.g. "Pikachu with Grey Felt Hat" unfindable |

### Verification (S12)

Playwright (headless Edge) against `next dev`, logged in as devtest: era-wide search returned 41 Pikachus across 12 SWSH sets; All-Eras search returned 204 matches capped at 100 with hint; "grey felt" returned the imageless promo as a name tile and selecting it stored the placeholder; JP mode showed English set labels, loaded `SV2a` for "Pokémon 151", and found ピカチュウ from an English "pikachu" query; unmapped JP set (Champion's Path) showed the graceful notice; EN set browse (Evolving Skies) still renders all 237 cards uncapped.

---

## Website Roadmap

Website Phase 5 is complete; mobile app development (see Mobile App Roadmap below) is the current milestone.

### Website Phase 1 — Pre-Launch Blockers (Must Fix) ✓

All complete (Sessions 7-8).

| # | Task | Status |
|---|---|---|
| W1 | Custom 404 page | Done S7 |
| W2 | Custom error boundary | Done S7 |
| W3 | About page | Done S7 |
| W4 | Contact page | Done S7 |
| W5 | `CRON_SECRET` in `.env.local.example` | Done S7 |
| W6 | Optimize logo PNGs | Done S7 |

### Website Phase 2 — Pre-Launch Recommended (Should Fix) ✓

All complete (Session 7).

| # | Task | Status |
|---|---|---|
| W7 | Security headers in proxy | Done S7 |
| W8 | Dynamic sitemap | Done S7 |
| W9 | robots.txt | Done S7 |
| W10 | OG image + social metadata | Done S7 |
| W11 | `images.remotePatterns` for Supabase | Done S7 |

### Website Phase 3 — Pre-Launch Polish & Features (Session 8) ✓

All complete.

| # | Task | Status |
|---|---|---|
| W13 | WTB/WTS pill color matching | Done S8 |
| W14 | Standardized page titles | Done S8 |
| W15 | Favicon from logo | Done S8 |
| W16 | Two-step trade completion | Done S8 |
| W17 | Pokemon TCG stock images (TCGdex) | Done S8 |
| W18 | Graded slab overlay | Done S8 |

### Website Phase 3.5 — Create Listing Overhaul (Session 10) ✓

| # | Task | Status |
|---|---|---|
| S10-1 | 5-section card layout (Country, Title, Haves, Wants, Description) | Done S10 |
| S10-2 | CardPicker component (ERA_DATA + direct TCGDex) | Done S10 |
| S10-3 | Cross-language card search (TRANSLATION_MAP) | Done S10 |
| S10-4 | PrefCards with SVG icons (Cash, Singles, Graded, Sealed) | Done S10 |
| S10-5 | Validation updates (40 char title, optional description) | Done S10 |
| S10-6 | API route updates (normalize simple {url} objects) | Done S10 |
| S10-7 | CSP updates for TCGDex (connect-src + img-src) | Done S10 |
| S10b-1 | State/Province dropdown in Country section | Done S10b |
| S10b-2 | Restore PSA slab overlay on marketplace browse thumbnails | Done S10b |

### Website Phase 3.6 — Country Filter + Wants Thumbnails (Session 11) ✓

| # | Task | Status |
|---|---|---|
| S11-1 | Country/state database migration (backfill Brunei) | Done S11 |
| S11-2 | Country filter with CountryPill dropdown on browse page | Done S11 |
| S11-3 | State filter in sidebar (when country has states) | Done S11 |
| S11-4 | Country/state persistence in listings table | Done S11 |
| S11-5 | Wants thumbnails in ListingCard (up to 10 images) | Done S11 |
| S11-6 | Haves thumbnails expanded to 10 max | Done S11 |
| S11-7 | Create Listing label: "State / Province / District" | Done S11 |

### Website Phase 3.7 — CardPicker Search & Filter Improvements (Done, Session 12)

**Target component:** `src/components/CardPicker.tsx` (sections 3 & 4 of the Create Listing page)

Four related issues to fix:

| # | Task | Description |
|---|---|---|
| S12-1 | Cross-set search within an era | **Done S12** — era-wide name search via TCGdex `?name=like:` endpoint, filtered to the era's sets |
| S12-2 | Japanese language support (EN display) | **Done S12** — English era/set labels always; JP card pool via `JA_SET_MAP`; English search reaches JA cards through `expandQuery()` |
| S12-3 | Promos fix | **Done S12** — all promo sets searchable + browsable per era; imageless promos render as name tiles with placeholder image |
| S12-4 | Global search across all eras | **Done S12** — "All Eras" search hits every set, sorted newest era first, capped at 100 with hint |

Implementation details in the "Session 12 Changes" section above.

### Website Phase 3.8 — Card Data Freshness (Done, Session 13)

| # | Task | Status |
|---|---|---|
| S13-1 | Era/set taxonomy generated from TCGdex (`npm run update-cards`) — adds Mega Evolution era, Black Bolt, White Flare, Detective Pikachu, and all other missing sets | Done S13 |
| S13-2 | pokemontcg.io image fallback for cards TCGdex has no scan of (SVP promos etc.) | Done S13 |
| S13-3 | JP mappings for new sets (me01–me03, SV11B/W, det1); Original-era keys fixed to TCGdex canonical IDs | Done S13 |

Implementation details in the "Session 13 Changes" section above. **Update procedure when a new set releases:** `npm run update-cards` → review the diff in `cardData.generated.json` → add new JP set IDs to `JA_SET_MAP` → commit via PR.

**Database note:** Migrations 00013–00015 were made idempotent in Session 12 (PR #4) after a re-run of 00015 failed with "relation already exists". A combined idempotent SQL block covering 00013–00017 was provided in the Session 12 chat for the Supabase Dashboard → SQL Editor. If the live DB is still missing `wants_*`, `country`, or `state` columns (specific-country filtering or listing creation erroring), run that block — every statement is safe to re-run.

### Website Phase 5 — Global Marketplace Readiness (Next Up)

The work that turns the current site into the worldwide trading board described in the Project Overview. Rough priority order; each item is its own branch/PR.

| # | Task | Why it matters globally | Notes |
|---|---|---|---|
| G1 | Email notifications (offers, messages, trade confirmations) | Traders in different timezones can't rely on being online together | **Done S15** — Resend + `src/lib/email.ts` + prefs (migration 00018). Needs RESEND_API_KEY + domain verification to activate |
| G2 | Have/Want matching ("find trades for me") | The killer feature of golden-era trading sites | **Done S16** — /marketplace/matches, card identity derived from image URLs (no migration) |
| G3 | Counteroffers + short negotiation thread | Accept/decline alone kills trades a counter would save | **Done S17** — offer threads via parent_offer_id/author_id; requires migration 00019 |
| G4 | Listing comment threads | Public community vetting, CSGOLounge-style | **Done S18** — listing_comments table (migration 00020), comments on listing detail pages |
| G5 | Retire the shop | Marketplace-only identity (D1) | **Done S19** — catalog/cart/checkout and legacy static site removed; home page is a marketplace landing |
| G6 | Country UX polish | Don't assume Brunei for a worldwide audience | **Done S20** — country displayed on cards/detail, DB default dropped (migration 00021), server-side validation, create-page prefill |
| G7 | Public launch | Site is staging-gated | Remove `SITE_PASSWORD` **only when both the website and the mobile app are ready** (D5); launch together after the closed beta (D9) |

**Deliberately out of scope (per D2/D3):** on-platform payments, escrow, per-listing prices/currencies, any shipping features (tracking, shipping-proof, ships-to — users handle trades themselves), and gambling/raffle mechanics of any kind.

### Website Phase 4 — Post-Launch Improvements

General polish, lower priority than Phase 5.

| # | Task | Benefit | Notes |
|---|---|---|---|
| W19 | ~~Email notifications~~ | Moved to **G1** (Phase 5) | — |
| W20 | Replace in-memory rate limiting with Redis | Current rate limiter resets on every Vercel cold start | Only needed if scaling to multiple instances |
| W21 | E2E tests with Playwright | Automated regression testing | Session 12/13 verification scripts are a starting point |
| W22 | Avatar upload on profile edit | Users can set a profile picture | Needs new storage bucket for avatars |
| W23 | Listing image reordering | Users can drag-and-drop to reorder images | Enhancement to `ImageUploader.tsx` |
| W24 | Edit page alignment with new Create page | Edit page uses old form; should match new 5-section layout | Mirror S10 changes to `[id]/edit/page.tsx` |
| W25 | Per-card grading overlays | Users can tag individual card thumbnails with PSA/CGC/BGS grades | Descoped from S10; overlay on ThumbContainer |
| W26 | UI localization (Japanese first) | JP hobbyists are half the card market | Card data is already dual-language; UI strings are not |

---

## Mobile App Roadmap — React Native / Expo (revised S21)

Goal: **the app everyone uses for trading Pokemon TCG** — which means both stores. Begin after Website Phase 5 (done). Public launch (G7) happens only when the website and the mobile app are ready to launch together (D5); a closed beta runs first (D9).

### Decision Log (S21 — owner decisions)

| # | Decision | Choice | Reasoning |
|---|---|---|---|
| D6 | Platform | **React Native + Expo, one TypeScript codebase → App Store + Play Store** (supersedes the S-era Swift/iOS-only plan) | "Everyone" includes Android's ~70% global share, dominant in SEA/JP/LatAm TCG communities. Reuses TS skills/types; supabase-js works as-is; Expo Push unifies APNs+FCM |
| D7 | V1 scope | **Lean trading core**: auth, browse, listing detail (offers + counteroffers + chat), create listing, my listings, push — then fast-follow parity | Real trader feedback earliest |
| D8 | Push notifications | **Foundational, phase M1** (was parked at old I23) | Retention backbone for cross-timezone trading; Expo Push makes it cheap |
| D9 | Beta path | **Closed beta first** (TestFlight + Play internal track) with the Brunei/SEA community while the password gate stays; then joint public launch = G7 | Real trades + store-review teething solved quietly |
| D10 | App repo location | **`mobile/` folder inside the kantokeepsakes repo** (own package.json/node_modules, no workspaces — Metro dislikes hoisting) | One PR flow, atomic API+app changes, shared code without publishing packages; Expo/EAS support subdirectories natively |

Architecture stays **hybrid** (unchanged in spirit from the original Option A): supabase-js direct reads + Realtime subscriptions on the client, all validated writes through the existing Next.js API routes with `Authorization: Bearer <token>`. Session storage via expo-secure-store; store pipelines via EAS Build/Submit. Shared code (types, validation, cardData) starts as copied modules, graduating to a workspace package if drift hurts.

### Phase M0 — Backend prep (website repo, before app code)

| # | Task | Notes |
|---|---|---|
| B1 | `getAuthUser(request)` cookie→Bearer helper, rolled out to all 15 auth routes | **Done S22** — the returned client is token-bound so RLS applies as the user (the old snippet's cookie-client reuse would have evaluated RLS as anon) |
| B2 | Turnstile optional under Bearer auth + stricter rate limits | **Done S22** — listings POST: bearer skips CAPTCHA, 5/h per user; signup: `x-mobile-client` header vs `MOBILE_CLIENT_KEY` env, 2/24h per IP |
| B3 | `/api/matches` GET endpoint | **Done S22** — mirrors the matches page for mobile clients |
| B4 | Push infra: `push_tokens` table, `/api/push-tokens` POST/DELETE, `notifyUser()` sends Expo Push alongside email with dead-token pruning | **Done S22** — needs migration 00022 |
| B5 | Account deletion: `DELETE /api/account` (confirm-guarded) + danger-zone button in ProfileEditForm; storage cleanup + auth-user delete cascades everything | **Done S22** — verified live with a throwaway user |
| B6 | Block a user: `blocks` table (00023), `/api/blocks`, `isBlockedEitherWay()` enforced in conversations/messages/offers/comments POST (fails open pre-migration), BlockButton on profiles | **Done S22** — needs migration 00023 |
| B7 | (pre-beta, scale) W20 Redis rate limiting | Deferred — do before the beta opens |

### Phase M1 — Lean trading core (first beta build)

| # | Task | Data source |
|---|---|---|
| M1-1 | Expo project setup (TS, expo-router), Supabase client + session persistence | **Done S23** — SDK 57/RN 0.86; AsyncStorage (not SecureStore: sessions exceed its 2 KB limit, per the official Supabase RN guide) |
| M1-2 | Auth: login, signup (`POST /api/signup` + `x-mobile-client`), session provider, logout | **Done S23** (forgot-password screen pending) |
| M1-3 | Browse WTS/WTB with filters + search + country | **Started S23** — WTS/WTB toggle + listing cards live; filters/search/country pending |
| M1-4 | Listing detail: haves/wants, seller card, offer threads (accept/decline/counter), comments read, report | SDK reads + existing APIs |
| M1-5 | Create listing: 5-section form incl. RN CardPicker (era/set/search reusing cardData + TCGdex/pokemontcg.io) | `POST /api/listings` |
| M1-6 | Inbox + realtime chat | SDK + Realtime + messages API |
| M1-7 | My listings (bump, relist, edit basics) | Existing APIs |
| M1-8 | **Push notifications** for offers/counters/messages/trade updates + account deletion + block (compliance set) | B4/B5/B6 |

### Phase M2 — Parity fast-follows

| # | Task |
|---|---|
| M2-1 | Matches screen (`/api/matches`) |
| M2-2 | Post comments + delete own |
| M2-3 | Saved listings, profile view/edit, notification prefs |
| M2-4 | Trade completion + ratings flows |
| M2-5 | Pull-to-refresh, infinite scroll, offline/error states |

### Phase M3 — Beta → joint public launch (G7)

| # | Task |
|---|---|
| M3-1 | TestFlight + Play internal beta with the Brunei/SEA community (password gate stays up) |
| M3-2 | Store submission prep: screenshots, privacy labels/data-safety forms, UGC moderation contact, age rating |
| M3-3 | Iterate on beta feedback; scale prep (B7 if not done) |
| M3-4 | **G7: joint public launch** — remove `SITE_PASSWORD`, both store listings live |
### Screen-to-Website Mapping (still valid; add Matches, Comments, Counteroffers screens)

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

### API routes the app must call (add: /api/matches, comments routes, push register, account deletion)

These routes contain server-side business logic that cannot be replicated via the Supabase SDK alone:

| Route | Reason |
|---|---|
| `POST /api/signup` | Rate limiting, admin user creation (Turnstile skipped on iOS) |
| `POST /api/listings` | Ban check, rate limiting, 30-day expiry calc, title construction (Turnstile skipped on iOS) |
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

### `getAuthUser` helper (to be created in Phase M0/B1)

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
| PATCH | `/api/offers/[id]` | Either trade party (turn-based) | accept / decline / counter; accept auto-declines others |

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

### Comments
| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/api/listings/[id]/comments` | Public | Oldest first, limit 200 |
| POST | `/api/listings/[id]/comments` | User | 10/min rate limit, 500 chars |
| DELETE | `/api/comments/[id]` | Author or admin | RLS-enforced |

### Profile + Reports + Admin
| Method | Route | Auth |
|---|---|---|
| PATCH | `/api/profile` | User |
| POST | `/api/reports` | User |
| POST | `/api/admin/ban` | Admin |
| PATCH | `/api/admin/reports/[id]` | Admin |
| GET | `/api/cron/expire-listings` | CRON_SECRET |
