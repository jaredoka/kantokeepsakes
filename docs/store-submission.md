# Store Submission Pack — M3-2

Paste-ready copy and pre-answered compliance forms for App Store Connect and
Google Play Console. Answers reflect what the app actually does as of S28 —
re-check them if features change before submission.

## App identity

| Field | Value |
|---|---|
| Name | Kanto Keepsakes |
| iOS subtitle (30 chars) | `Pokemon TCG trading board` |
| Android short description (80 chars) | `Trade Pokemon TCG cards with hobbyists worldwide — have/want listings & chat.` |
| Bundle ID / package | `com.kantokeepsakes.app` (already in app.json) |
| Category | iOS: Shopping (secondary: Social Networking) · Play: Shopping |
| Price | Free, no in-app purchases, no ads |
| Support URL | `https://kantokeepsakes.com/contact` |
| Marketing URL | `https://kantokeepsakes.com` |
| Privacy policy URL | `https://kantokeepsakes.com/privacy` |
| Terms of use (EULA) URL | `https://kantokeepsakes.com/terms` |
| Account deletion URL (Play requirement) | `https://kantokeepsakes.com/delete-account` |
| Contact email | `kantokeepsakes@gmail.com` |

## Full description (both stores)

> **Trade Pokemon TCG cards with hobbyists around the world.**
>
> Kanto Keepsakes is a peer-to-peer have/want trading board in the spirit of
> the golden days of trading sites — no gambling, no fees, no middleman.
>
> • **Post have/want listings** — pick your cards from real English and
> Japanese TCG data, including graded slabs and sealed product
> • **Get matched** — the Matches tab finds traders who have what you want
> and want what you have
> • **Negotiate your way** — offers, counteroffers, and real-time chat;
> payment and exchange are agreed directly between traders
> • **Trade with confidence** — two-step trade completion, star ratings, and
> trader reputation built from confirmed trades
> • **Community vetting** — public comments on every listing, plus report
> and block tools backed by active moderation
>
> The platform never touches your money: no payments, no escrow, no shipping
> handling, and absolutely no gambling, raffles, or mystery packs.

Keywords (iOS, 100 chars):
`pokemon,tcg,trading,cards,trade,collect,marketplace,wts,wtb,graded,psa,japanese`

## Screenshots checklist

Take these on device/simulator once the beta build exists (portrait; status
bar clean; logged in as a seed account with good-looking listings):

1. Browse tab (WTS grid with card images + country flags)
2. Listing detail (haves/wants rows + offer thread)
3. Matches tab (two-way match with thumbnails)
4. Chat (realtime conversation)
5. Create listing (CardPicker open with a search result grid)
6. Profile (reputation, menu)

| Store | Requirement |
|---|---|
| App Store | 6.9" iPhone set (1320×2868) required; 6.5" (1284×2778) recommended. No iPad set needed (`supportsTablet: false`). |
| Play | 2–8 phone screenshots (16:9 to 9:16, min 320px); **feature graphic 1024×500** (make from the logo + tagline on brand yellow); hi-res icon 512×512 PNG (export from `mobile/assets/images/icon.png`). |

## Apple privacy nutrition label

All data is collected for **App Functionality** only, **linked to identity**
(it's an account-based marketplace), and **not used for tracking**. Declare:

| Apple category | What it is here |
|---|---|
| Contact Info → Email Address | Account login + notification emails |
| Identifiers → User ID | Supabase account ID tied to your content |
| Identifiers → Device ID | Expo push token (only if the user enables notifications) |
| User Content → Other User Content | Listings, offers, comments, chat messages, profile bio, ratings |

Everything else: **Not collected** (no location, no contacts, no photos —
card images come from public TCG databases, the mobile app has no photo
upload — no purchases, no browsing history, no diagnostics/analytics SDKs,
no advertising).

"Do you or your third-party partners use data for tracking?" → **No.**

## Google Play data safety form

- Collects data: **Yes** · Shares data with third parties: **No** (service
  providers acting on our behalf don't count as sharing under Play's
  definition)
- All collected data: **encrypted in transit**, **deletion available**
  (in-app + `https://kantokeepsakes.com/delete-account`), **required for the
  app to function** (not optional), purpose: **App functionality**
- Declare: Personal info → Email address, User IDs · Messages → Other
  in-app messages · App activity → Other user-generated content · Device or
  other IDs → Device or other IDs (push token)
- Not collected: location, financial info, health, photos/videos, audio,
  files, calendar, contacts, browsing history, installed apps

## Age rating

- **Apple** (questionnaire): no violence/sex/profanity/horror themes, no
  gambling (simulated or real), no unrestricted web access, no contests. YES
  to **user-generated content** and **communication between users** with
  moderation (report + block + review). Expected result: **13+** tier.
- **Play (IARC)**: same answers; declare "users can interact" and "users can
  exchange content". Expected: **Everyone/Teen with an 'Users Interact'
  interactive element label** — accept whatever IARC computes, don't
  hand-adjust.
- Target audience (Play): 16+ or 18+ recommended to skip the Families policy
  overhead; the ToS minimum age is 13.

## UGC compliance (App Store Guideline 1.2 checklist)

Reviewers reject UGC apps missing any of these — all four already exist:

| Requirement | Where it is |
|---|---|
| Filter/moderate objectionable content | Admin panel (ban users, resolve reports, remove listings); zero-tolerance clause in `/terms` §4–5 |
| Mechanism to report offensive content | Report button on listings and profiles (in-app + website) |
| Ability to block abusive users | Block button on profiles + listing detail; Blocked Users screen with unblock |
| Published contact info | `kantokeepsakes@gmail.com` on `/contact`, `/terms`, and the store listing |

Also required and present: users agree to terms at signup (add a "By signing
up you agree to the Terms" line to the app signup screen if reviewers ask —
currently the ToS link lives on the website), and in-app account deletion
(Guideline 5.1.1(v)) via Profile → Danger Zone.

## App Review notes (paste into "Notes" / demo account fields)

> Kanto Keepsakes is a peer-to-peer Pokemon TCG **trade listing board**. It
> never processes payments — users negotiate trades in chat and settle
> between themselves, so there are no in-app purchases and no purchasable
> goods in the app. Card images are licensed-database stock images (TCGdex /
> pokemontcg.io), not user photos.
>
> Demo account: create a fresh reviewer account before each submission
> (Profile → sign up works without email verification) or supply:
> email `<create a dedicated reviewer@... account>` / password `<...>`.
> Note the companion website is behind a staging password during the closed
> beta; the app itself is fully functional against production APIs, and the
> privacy policy / terms / account deletion URLs above are publicly
> reachable.
