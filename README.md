# Kanto Keepsakes

A full-stack web application for **Kanto Keepsakes**, a Pokemon TCG retailer based in Brunei. The site combines an e-commerce product catalog with a community-driven **Marketplace** — a WTB/WTS trade listing board for Pokemon TCG products, inspired by platforms like CSGOLounge.

Built as a solo developer project using **Claude Code (Opus 4.6 by Anthropic)** as an AI-assisted development tool.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 16** (App Router) | Server-side rendering, routing, API routes |
| Language | **TypeScript** | Type safety across the full stack |
| Styling | **Tailwind CSS 4** + CSS Modules | Utility-first styling with component-scoped overrides |
| Database | **Supabase (PostgreSQL)** | Managed database with Row Level Security |
| Auth | **Supabase Auth** | Email/password authentication, session management |
| Storage | **Supabase Storage** | Image uploads for listings |
| Anti-abuse | **Cloudflare Turnstile** | CAPTCHA on signup and listing creation |
| Hosting | **Vercel** | Serverless deployment paired with Next.js |
| UI Library | **React 19** | Component-based UI |

---

## Features

### Product Catalog (Shop)
- Browse Pokemon TCG products by category: Japanese, English, Accessories, Preorder
- Sub-category filtering: Sealed, Singles, Graded
- Product cards with image placeholders, pricing, and stock status
- Shopping cart with localStorage persistence and WhatsApp checkout
- Mobile-first responsive design

### Marketplace (In Progress)
- User accounts with email/password signup (privacy-first, no email verification required)
- Community reputation system: New Trader, Trader, Trusted Trader, Veteran Trader badges
- WTB (Want to Buy) and WTS (Want to Sell) trade listings
- Real-time messaging between traders
- Trade confirmations with star ratings
- Report and moderation system
- CAPTCHA and rate limiting for anti-abuse

---

## Project Structure

```
kantokeepsakes/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── page.tsx                # Home page
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Global styles
│   │   ├── marketplace/            # Marketplace page
│   │   ├── signup/                 # Signup page + styles
│   │   ├── login/                  # Login page + styles
│   │   ├── cart/                   # Shopping cart
│   │   ├── japanese/               # Japanese products
│   │   ├── english/                # English products
│   │   ├── accessories/            # Accessories
│   │   ├── preorder/               # Preorder products
│   │   └── api/
│   │       └── signup/route.ts     # Signup API with rate limiting
│   ├── components/
│   │   ├── Header.tsx              # Auth-aware navigation
│   │   ├── Footer.tsx              # Site footer
│   │   ├── ProductCard.tsx         # Product display card
│   │   ├── ProductGrid.tsx         # Product grid layout
│   │   ├── CategoryPage.tsx        # Reusable category page
│   │   ├── CartToast.tsx           # Add-to-cart notification
│   │   └── Turnstile.tsx           # CAPTCHA component
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser Supabase client
│   │   │   ├── server.ts           # Server Supabase client
│   │   │   └── middleware.ts       # Auth session middleware
│   │   ├── products.ts             # Product data utilities
│   │   ├── cart.ts                 # Cart logic (localStorage)
│   │   ├── turnstile.ts            # Server-side CAPTCHA verification
│   │   └── rate-limit.ts           # IP-based rate limiting
│   └── middleware.ts               # Next.js middleware (auth sessions)
├── supabase/
│   └── migrations/                 # SQL migrations for all tables
├── data/
│   └── products.json               # Product catalog data
├── public/                         # Static assets (images, logo)
└── tools/
    └── csv-to-json.js              # Spreadsheet-to-JSON converter
```

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

3. **Set up environment variables:** Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
   TURNSTILE_SECRET_KEY=your_turnstile_secret_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

---

## What I Learned

This project started as a simple static HTML/CSS/JS website and evolved into a full-stack Next.js application. As a beginner web developer building this project with the help of **Claude Code (Opus 4.6 by Anthropic)**, here is what I learned along the way:

### Fundamentals (Static Site Phase)
- **HTML5 semantic markup** — structuring pages with meaningful elements (`<header>`, `<nav>`, `<main>`, `<section>`)
- **CSS3 layout** — CSS Grid and Flexbox for responsive layouts, CSS custom properties (variables) for consistent theming
- **Mobile-first responsive design** — designing for mobile screens first and scaling up with media queries
- **Vanilla JavaScript** — DOM manipulation, event handling, `fetch()` for loading JSON data
- **localStorage** — client-side data persistence for the shopping cart
- **JSON data modeling** — designing a product schema and working with structured data
- **Git version control** — committing changes, branching, pushing to GitHub

### Framework Migration (Next.js Phase)
- **React component architecture** — breaking UI into reusable components (`ProductCard`, `CategoryPage`, `Header`)
- **Next.js App Router** — file-based routing, layouts, server components vs. client components (`"use client"`)
- **TypeScript** — type annotations, interfaces, type safety for props, API responses, and database entities
- **Tailwind CSS** — utility-first CSS approach alongside CSS Modules for component-scoped styles
- **Server-side rendering (SSR)** — understanding the difference between server and client rendering and when to use each
- **API routes** — building backend endpoints within Next.js (`src/app/api/`)
- **Middleware** — intercepting requests for auth session management

### Backend & Database (Supabase Phase)
- **PostgreSQL** — relational database design with foreign keys, enums, indexes, and constraints
- **Row Level Security (RLS)** — database-level access control policies that restrict who can read/write data
- **Database migrations** — writing SQL migration files to version-control schema changes
- **Supabase Auth** — implementing email/password authentication, session management, and auth state
- **Database triggers** — automatically creating a profile row when a new user signs up
- **Server-side vs. client-side Supabase clients** — understanding when to use each for security

### Security & Anti-Abuse
- **CAPTCHA integration (Cloudflare Turnstile)** — adding bot protection to forms with both client-side widget and server-side token verification
- **Rate limiting** — implementing IP-based request throttling to prevent abuse (e.g., max 3 signups per IP per 24h)
- **Environment variables** — keeping API keys and secrets out of source code using `.env.local`
- **Input validation** — validating user input on both client and server sides

### Developer Workflow
- **AI-assisted development** — using Claude Code (Opus 4.6 by Anthropic) as a pair programming tool to plan architecture, write code, debug issues, and learn best practices in real time
- **Project planning** — breaking a large feature (Marketplace) into phased milestones with clear task breakdowns
- **Incremental migration** — converting a static site to a full-stack app without losing functionality
- **Handoff documentation** — writing detailed session handoff docs to maintain context across development sessions

---

## Build Progress

### Shop (Complete)
| Task | Description | Status |
|------|-------------|--------|
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

### Marketplace
| Phase | Description | Status |
|-------|-------------|--------|
| M1 | Project setup — Next.js migration, Supabase, Turnstile, DB migrations | Done |
| M2 | Auth flow — signup, login, logout, profiles, rate limiting | Done |
| M3 | Listing CRUD — create, edit, delete listings with image upload | Upcoming |
| M4 | Marketplace browse — listing feed with filters, sort, search | Upcoming |
| M5 | Listing detail page — full view, seller card, messaging button | Upcoming |
| M6 | Messaging & inbox — real-time chat, unread counts | Upcoming |
| M7 | Trade confirmations & reputation — ratings, rep badges | Upcoming |
| M8 | Reports & moderation — report system, admin dashboard, bans | Upcoming |
| M9 | Listing lifecycle — auto-expiry, bumps, status transitions | Upcoming |
| M10 | Polish & launch — responsive pass, SEO, error handling | Upcoming |

---

## License

This project is proprietary. All rights reserved.
