# Kanto Keepsakes

A full-stack web application for **Kanto Keepsakes**, a Pokemon TCG retailer based in Brunei. The site combines an e-commerce product catalog with a community-driven **Marketplace** — a peer-to-peer WTB/WTS trade listing board for Pokemon TCG products, inspired by platforms like CSGOLounge.

Built as a solo developer project using **Claude Code (Opus 4.6 by Anthropic)** as an AI-assisted development tool.

**Live site:** [kantokeepsakes.com](https://kantokeepsakes.com) — hosted on Vercel with Cloudflare DNS

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 16** (App Router) | Server-side rendering, routing, API routes |
| Language | **TypeScript** | Type safety across the full stack |
| Styling | **Tailwind CSS 4** + CSS Modules | Utility-first styling with component-scoped overrides |
| Database | **Supabase (PostgreSQL)** | Managed database with Row Level Security (RLS) |
| Auth | **Supabase Auth** | Email/password authentication with session management |
| File Storage | **Supabase Storage** | Image uploads for listings with public bucket URLs |
| Realtime | **Supabase Realtime** | Live chat messages, unread notification counts |
| Anti-abuse | **Cloudflare Turnstile** | CAPTCHA on signup and listing creation |
| Rate Limiting | **Custom in-memory** | IP-based request throttling on API routes |
| Hosting | **Vercel** | Serverless deployment with cron jobs |
| Card Data | **pokemontcg.io API** | Pokemon TCG card images and set data (planned) |
| UI Library | **React 19** | Component-based UI with server and client components |

---

## Features

### Product Catalog (Shop)
- Browse Pokemon TCG products by category: Japanese, English, Accessories, Preorder
- Sub-category filtering: Sealed, Singles, Graded
- Product cards with image placeholders, pricing, and stock status
- Shopping cart with localStorage persistence and WhatsApp checkout
- Mobile-first responsive design

### Marketplace
- **User accounts** — email/password signup with Cloudflare Turnstile CAPTCHA, login, forgot/reset password
- **WTB / WTS listings** — create, edit, bump (24h cooldown), relist expired, auto-expire after 30 days (Vercel cron)
- **Pokemon TCG stock images** — card search via pokemontcg.io API for singles/graded, set logos for sealed products, manual upload for accessories (planned)
- **Graded slab overlay** — CSS-rendered PSA/CGC/BGS slab frames on graded card images (planned)
- **Browse & search** — text search, category/language/type filters, sort options, pagination
- **Offers** — make offers on WTS listings, offer to sell on WTB listings, accept/decline with auto-decline of other pending offers
- **Real-time messaging** — instant chat between traders using Supabase Realtime, contextual timestamps (today/yesterday/date)
- **Live notifications** — unread message count in header badge updates in real-time via Supabase Realtime channel
- **Trade confirmations** — two-step flow: both parties confirm trade completion, then rate each other (1-5 stars), reputation system with trader badges (planned)
- **User profiles** — public profile with listing history, sold archive, inline bio/username editing
- **Saved listings** — bookmark/watchlist functionality
- **Moderation** — report users/listings, admin panel for banning users and resolving reports
- **Auth gate** — marketplace pages redirect unauthenticated users to login with `?next=` parameter to return them to the original page after login/signup
- **SEO** — OpenGraph metadata on listing detail pages, dynamic sitemap, robots.txt, OG image for social media previews
- **Security headers** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Password gate** — site-wide password protection for pre-launch staging (controlled via environment variable)
- **Custom error pages** — branded 404 and error boundary pages
- **Info pages** — About page, Contact page (email + Instagram)

---

## Project Structure

```
src/
  app/
    page.tsx                        # Home page
    layout.tsx                      # Root layout (+ OG/Twitter metadata)
    globals.css                     # Global styles + Tailwind
    not-found.tsx                   # Custom 404 page
    error.tsx                       # Custom error boundary
    sitemap.ts                      # Dynamic sitemap (static pages + listings)
    robots.ts                       # robots.txt
    about/page.tsx                  # About page
    contact/page.tsx                # Contact page (email + Instagram)
    marketplace/
      layout.tsx                    # Auth gate (redirects to /login?next=...)
      wts/page.tsx                  # Browse WTS listings
      wtb/page.tsx                  # Browse WTB listings
      new/page.tsx                  # Create listing
      [id]/page.tsx                 # Listing detail
      [id]/edit/page.tsx            # Edit listing
      inbox/page.tsx                # Conversation list
      inbox/[id]/page.tsx           # Chat with realtime
      user/[username]/page.tsx      # Public profile + edit (own)
      saved/page.tsx                # Watchlist
      my-listings/page.tsx          # Own listings
    login/                          # Login + ?next= redirect
    signup/                         # Signup + Turnstile + ?next= redirect
    forgot-password/                # Password recovery
    reset-password/                 # Password reset
    auth/callback/                  # Supabase auth redirect handler
    terms/ privacy/ safe-trading/   # Legal + guide pages
    admin/                          # Admin panel (ban, reports)
    api/
      signup/route.ts               # Registration with Turnstile + rate limit
      profile/route.ts              # PATCH bio/username
      listings/                     # CRUD + upload + bump + relist
      offers/                       # Create + accept/decline
      conversations/                # Create + messages (with rate limit)
      reports/route.ts              # Submit report
      trade-completions/            # Both-parties-complete step (planned)
      trade-confirmations/          # Create + read (gated behind completions)
      pokemon-tcg/                  # Card search + sets proxy (planned)
      admin/                        # Ban + report resolution
      cron/expire-listings/         # Daily auto-expire (Vercel cron)
  components/
    Header.tsx                      # Avatar, bell with realtime unread, mobile drawer
    ListingCard.tsx                 # Card with WTS/WTB badge, star rating
    ActionBar.tsx                   # Offer/message/share/report (WTS/WTB-aware)
    OfferModal.tsx                  # Offer form (WTS/WTB-aware labels)
    OfferList.tsx                   # Accept/decline offers (listing owner)
    ProfileEditForm.tsx             # Inline bio + username edit
    ImageUploader.tsx               # Drag-drop + canvas compression (accessories only)
    CardSearch.tsx                  # Pokemon TCG card search (planned)
    SetSearch.tsx                   # Pokemon TCG set search (planned)
    GradedCardImage.tsx             # CSS slab overlay for graded cards (planned)
    ImageGallery.tsx                # Lightbox image viewer
    SaveButton.tsx                  # Bookmark toggle
    BumpButton.tsx                  # 24h cooldown bump
    RelistButton.tsx                # Relist expired listing
    TradeConfirmation.tsx           # Star rating + completion
    ReportModal.tsx                 # Report user/listing
    SearchBar.tsx                   # Text search
    Pagination.tsx                  # Page navigation
    Turnstile.tsx                   # CAPTCHA widget
  lib/
    supabase/
      client.ts                     # Browser Supabase client
      server.ts                     # Server component Supabase client
      middleware.ts                 # Session refresh (called by proxy.ts)
    marketplace/
      queries.ts                    # fetchListings() with filters, sort, pagination
      types.ts                      # TypeScript types + enums + constants
      dates.ts                      # Expiry date helpers
      validation.ts                 # Field validators (listings, offers, images)
      grading.ts                    # Grading tag parser (planned)
    turnstile.ts                    # Server-side CAPTCHA verification
    rate-limit.ts                   # IP-based rate limiter (Map, 60s cleanup)
  proxy.ts                          # Next.js 16 proxy (session, security headers, password gate)
public/
  og-image.png                      # OpenGraph image (1200×630)
  images/                           # Logo PNGs + WebP (optimized)
supabase/migrations/                # SQL migrations for all tables
data/products.json                  # Product catalog data
```

---

## Database Schema

All tables have Row Level Security (RLS) enabled.

| Table | Purpose |
|-------|---------|
| `profiles` | Users — username, bio, avatar_url, reputation_score, completed_trades, is_banned, is_admin |
| `listings` | WTS/WTB listings — type, title, description, price, currency, images, category, language, status, expiry |
| `offers` | Offers on listings — message, front/back card images, status (pending/accepted/declined) |
| `conversations` | DMs — participant_1 (listing owner), participant_2 (other user), linked listing |
| `messages` | Chat messages — body, is_read, sender_id, conversation_id |
| `trade_completions` | Both-parties-complete step — listing_id, user_id (planned) |
| `trade_confirmations` | Ratings — 1-5 stars, comment, confirmer_id, confirmed_id (gated behind completions) |
| `reports` | User/listing reports — reason, description, status (pending/resolved/dismissed) |
| `saved_listings` | Bookmarks — user_id + listing_id |
| `listing-images` (bucket) | Storage — `{user_id}/{timestamp}-{random}.ext` |

---

## Setup

1. **Clone the repository:**
   ```bash
   git clone git@github.com:jaredoka/kantokeepsakes.git
   cd kantokeepsakes
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:** Copy `.env.local.example` to `.env.local` and fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
   TURNSTILE_SECRET_KEY=your_turnstile_secret_key
   CRON_SECRET=your_cron_secret
   SITE_PASSWORD=your_staging_password   # Remove to make the site public
   POKEMON_TCG_API_KEY=your_api_key     # Optional — higher rate limits on pokemontcg.io
   ```

4. **Run database migrations:** Apply the SQL files in `supabase/migrations/` to your Supabase project.

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

---

## Deployment

| Component | Service | Notes |
|-----------|---------|-------|
| Hosting | **Vercel** (Hobby plan) | Serverless deployment with daily cron |
| Domain | **kantokeepsakes.com** | Custom domain via Cloudflare DNS (DNS only mode) |
| DNS | **Cloudflare** | A record → Vercel, CNAME www → Vercel |
| SSL | **Vercel** (auto-provisioned) | Managed TLS certificates |
| Password gate | **Proxy-level** | Set `SITE_PASSWORD` env var to enable; remove to go public |

---

## What I Learned

This project started as a static HTML/CSS/JS site and evolved into a full-stack Next.js application with a real-time marketplace. As a beginner full-stack web developer building this project with the help of **Claude Code (Opus 4.6 by Anthropic)**, here is what I learned:

### Frontend Fundamentals
- **HTML5 semantic markup** — structuring pages with `<header>`, `<nav>`, `<main>`, `<section>` for accessibility and SEO
- **CSS layout techniques** — CSS Grid for product grids, Flexbox for navigation and card layouts, CSS custom properties for theming
- **Mobile-first responsive design** — designing for small screens first and scaling up with media queries
- **Vanilla JavaScript** — DOM manipulation, event handling, `fetch()` for loading JSON data, `localStorage` for cart persistence

### React & Next.js
- **React component architecture** — breaking UI into reusable components (`ListingCard`, `ActionBar`, `OfferModal`, `Header`)
- **Server components vs. client components** — understanding when to use `"use client"` (interactive UI, browser APIs, state) vs. server components (data fetching, auth checks, SEO)
- **Next.js App Router** — file-based routing, dynamic routes (`[id]`, `[username]`), layouts, loading states, metadata generation
- **API routes** — building RESTful backend endpoints within Next.js (`src/app/api/`) with proper HTTP methods and status codes
- **TypeScript** — interfaces for props and database entities, union types for listing/offer statuses, type narrowing, generic types
- **CSS Modules** — component-scoped styling alongside Tailwind utility classes to avoid global style conflicts

### Backend & Database
- **PostgreSQL database design** — tables with foreign keys, enums (`listing_type`, `listing_status`), indexes for query performance, cascading deletes
- **Row Level Security (RLS)** — writing Postgres policies that restrict data access at the database level (e.g., only the listing owner can edit their listing, only conversation participants can read messages)
- **Database migrations** — version-controlling schema changes with SQL migration files
- **Supabase Auth** — email/password authentication, session management with cookies, auth state listeners (`onAuthStateChange`)
- **Database triggers** — auto-creating a `profiles` row when a new user signs up via a Postgres trigger function
- **Server-side vs. client-side Supabase clients** — using `createServerClient` (with cookies) for server components/API routes and `createBrowserClient` for client components
- **Supabase Realtime** — subscribing to Postgres changes for live chat messages and unread notification counts

### Security & Anti-Abuse
- **CAPTCHA integration** — Cloudflare Turnstile with client-side widget rendering and server-side token verification
- **Rate limiting** — IP-based request throttling (e.g., 3 signups per IP per 24h, 30 image uploads per hour) using an in-memory Map with periodic cleanup
- **Input validation** — validating on both client (immediate feedback) and server (security) with shared validation functions
- **Environment variables** — separating secrets (`SUPABASE_SERVICE_ROLE_KEY`) from public keys (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), never exposing server-only values to the browser
- **Auth gating** — redirecting unauthenticated users with `?next=` parameter to return them to their original page after login

### Real-Time Features
- **Supabase Realtime channels** — subscribing to INSERT and UPDATE events on the `messages` table for live chat
- **Optimistic UI updates** — displaying sent messages immediately while the server processes them
- **Live notification badges** — header bell icon shows real-time unread count by listening to message changes across all conversations

### API Design
- **RESTful conventions** — using appropriate HTTP methods (GET for reads, POST for creates, PATCH for updates, DELETE for removes)
- **Auth middleware pattern** — checking authentication in every API route, returning 401 for unauthenticated requests
- **Business logic in API routes** — ban checks, ownership verification, duplicate prevention, auto-decline of competing offers on accept
- **Error handling** — returning meaningful error messages with appropriate HTTP status codes

### Developer Workflow
- **AI-assisted development** — using Claude Code (Opus 4.6 by Anthropic) as a pair programming tool to plan architecture, write code, debug issues, and learn best practices in real time
- **Session handoff documentation** — writing detailed handoff documents to maintain context across development sessions
- **Incremental migration** — converting a static site to a full-stack app without losing existing functionality
- **Git version control** — committing logical changes, writing descriptive commit messages, pushing to GitHub

---

## Build Progress

### Shop (Complete)
| # | Task | Status |
|---|------|--------|
| 1 | README (living document) | Done |
| 2 | Project scaffolding & base structure | Done |
| 3 | Navigation & header | Done |
| 4 | Home page layout | Done |
| 5 | Product data & rendering engine | Done |
| 6 | Category pages (Japanese & English) | Done |
| 7 | Sub-category pages (Sealed, Singles, Graded) | Done |
| 8 | TCG Accessories page | Done |
| 9 | Preorder page | Done |
| 10 | Shopping cart (localStorage + WhatsApp checkout) | Done |

### Marketplace (Complete)
| Phase | Description | Status |
|-------|-------------|--------|
| M1 | Project setup — Next.js migration, Supabase, Turnstile, DB migrations | Done |
| M2 | Auth flow — signup, login, logout, profiles, rate limiting | Done |
| M3 | Listing CRUD — create, edit, delete listings with image upload | Done |
| M4 | Marketplace browse — listing feed with filters, sort, search | Done |
| M5 | Listing detail page — full view, seller card, offer/messaging buttons | Done |
| M6 | Messaging & inbox — real-time chat, contextual timestamps, unread counts | Done |
| M7 | Trade confirmations & reputation — star ratings, reputation badges | Done |
| M8 | Reports & moderation — report system, admin dashboard, ban management | Done |
| M9 | Listing lifecycle — auto-expiry cron, bumps, relist, status transitions | Done |
| M10 | Profile features — public profiles, inline edit, sold archive, saved listings | Done |

### Website Pre-Launch (Complete)
| Phase | Description | Status |
|-------|-------------|--------|
| W1–W6 | Pre-launch blockers — custom 404/error pages, about/contact pages, env docs, image optimization | Done |
| W7–W11 | Pre-launch recommended — security headers, sitemap, robots.txt, OG image, remote image config | Done |
| — | Password gate for pre-launch staging | Done |
| — | Vercel deployment + Cloudflare DNS setup | Done |

### Website Polish & Features (Planned)
| Phase | Description | Status |
|-------|-------------|--------|
| W13 | Match WTB/WTS pill colors on listing detail page | Planned |
| W14 | Standardize page titles (single-word + template pattern) | Planned |
| W15 | Favicon from logo (favicon.ico, icon.png, apple-icon.png) | Planned |
| W16 | Two-step trade completion — both parties confirm before rating | Planned |
| W17 | Pokemon TCG stock images via pokemontcg.io API (replace user uploads) | Planned |
| W18 | Graded slab overlay (CSS-only PSA/CGC/BGS frames on card images) | Planned |

---

## License

This project is proprietary. All rights reserved.
