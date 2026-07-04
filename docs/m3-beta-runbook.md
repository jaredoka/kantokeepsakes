# M3 Beta Runbook — TestFlight + Play Internal

Everything needed to take the app from this repo to beta testers' phones.
Repo-side work is **done** (see PR `feature/m3-beta-prep`); the steps below
need owner credentials (Expo, Apple, Google, Vercel, Upstash) and are ordered
so each unblocks the next. G7 (public launch — removing `SITE_PASSWORD` and
public store release) stays gated per D5 and is **not** part of this runbook.

## Already done (verified S28)

- ✅ Migrations **00022–00026 applied** to the live DB (probed directly:
  `saved_listings` + `push_tokens` exist; a sold fixture listing was visible
  to anon, confirming 00026's RLS policy — fixture deleted after the check).
- ✅ **B7 Redis rate limiting** — `src/lib/rate-limit.ts` uses Upstash REST
  when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set, falls back
  to in-memory otherwise (step 2 activates it).
- ✅ **Legal/compliance pages created**: `/terms`, `/privacy`, `/safe-trading`,
  `/delete-account` (they had never existed despite the feature table), footer
  links added, and the password gate now exempts them plus `/contact` and
  `/reset-password` — store reviewers can reach the policy URLs and beta
  users' password-recovery links work while the site stays gated.
- ✅ **Mobile build config**: `mobile/eas.json` (development/preview/production
  profiles), `app.json` gained the `expo-notifications` plugin (white 96×96
  notification icon generated, brand-gold `#c49010` tint, `default` channel —
  matching the channel `lib/push.ts` creates) and iOS
  `ITSAppUsesNonExemptEncryption=false` (skips the export-compliance question
  on every TestFlight upload). `mobile/.env.example` created.

## 1. Supabase dashboard (5 min)

1. Auth → URL Configuration → Redirect URLs: add
   `https://kantokeepsakes.com/reset-password` (plus any Vercel preview URLs
   you test resets from). Without this, recovery links fall back to the Site
   URL and mobile password reset breaks.

## 2. Upstash Redis for rate limiting (10 min)

1. Create a free database at [upstash.com](https://upstash.com) (choose a
   region near Vercel's deployment region, e.g. `us-east-1` / whatever the
   Vercel project uses).
2. Copy the **REST URL** and **REST token** from the database page.
3. `vercel env add UPSTASH_REDIS_REST_URL production` (and `preview`), same
   for `UPSTASH_REDIS_REST_TOKEN`, then redeploy.
4. Also confirm `MOBILE_CLIENT_KEY` is set in Vercel **production** env — the
   shipped app's signups need it (S22 note said "set when the app ships";
   that's now).

No Redis = automatic fallback to the old per-instance in-memory limiter, so
this can't break anything; it just makes limits real across serverless
instances.

## 3. EAS project (15 min)

```bash
npm install -g eas-cli
eas login                 # Expo account (create one at expo.dev if needed)
cd mobile
eas init                  # creates the EAS project and writes extra.eas.projectId into app.json
git add app.json && git commit -m "Add EAS projectId"
```

`extra.eas.projectId` is what turns push notifications on — `lib/push.ts`
no-ops without it.

Then set the app's env vars for EAS builds (they are NOT read from
`mobile/.env`). The build profiles in `eas.json` reference EAS environments;
create each var for `development`, `preview`, and `production`:

```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://<project>.supabase.co --environment development --environment preview --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon-key> --environment development --environment preview --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_API_URL --value https://kantokeepsakes.com --environment preview --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_API_URL --value http://<your-lan-ip>:3001 --environment development --visibility plaintext
eas env:create --name EXPO_PUBLIC_MOBILE_CLIENT_KEY --value <same value as Vercel MOBILE_CLIENT_KEY> --environment development --environment preview --environment production --visibility plaintext
```

(All four are `EXPO_PUBLIC_*` and end up in the app bundle anyway, so
plaintext visibility is fine.)

## 4. Dev build → real push test (1–2 h, needs a physical Android phone)

Expo Go on Android can't receive remote push (SDK 53+), so this needs a dev
build:

```bash
cd mobile
eas build --profile development --platform android
```

Install the APK from the build page on a phone, run
`npx expo start --dev-client`, log in, accept the notification permission,
then verify end-to-end:

1. Phone user A logged in, app **closed**.
2. From the website (or a second phone), user B makes an offer on A's
   listing / sends a message.
3. A push notification arrives on A's phone (server-side send via
   `notifyUser()` was already verified in S22; this test closes the loop
   through token registration).
4. Check the `push_tokens` table has A's token; log out and confirm the row
   is deleted (unregister path).

iOS push needs an Apple Developer membership (step 5) — EAS handles the APNs
key automatically during the first iOS build (`eas credentials`).

## 5. TestFlight (Apple) — M3-1

Prereq: Apple Developer Program membership ($99/yr) at
[developer.apple.com](https://developer.apple.com).

```bash
cd mobile
eas build --platform ios --profile production   # EAS creates certs/profiles/APNs key interactively
eas submit --platform ios --latest              # uploads to App Store Connect
```

In App Store Connect:

1. My Apps → the auto-created app record → TestFlight tab.
2. Fill in Test Information (what to test, feedback email
   `kantokeepsakes@gmail.com`, privacy policy URL
   `https://kantokeepsakes.com/privacy`).
3. **Internal Testing**: add up to 100 users by Apple ID email — builds are
   available immediately, no review. For the wider Brunei/SEA beta use an
   **external group + public link** (first external build goes through a
   lightweight beta review, usually <24 h). Complete the compliance answers
   using `docs/store-submission.md`.
4. Testers install the TestFlight app, accept the invite, install Kanto
   Keepsakes. (Tester-facing steps are written up in
   `docs/app-user-guide.md`.)

## 6. Play internal testing (Google) — M3-1

Prereq: Play Console developer account ($25 one-time) at
[play.google.com/console](https://play.google.com/console).

```bash
cd mobile
eas build --platform android --profile production   # produces an .aab
```

In Play Console:

1. Create app → fill App details (see `docs/store-submission.md` for copy,
   category, contact details).
2. **The first .aab must be uploaded manually** (Play requires it before API
   uploads work): Testing → Internal testing → Create release → upload the
   .aab from the EAS build page. Google generates the app signing key on
   first upload.
3. Complete the mandatory declarations before rollout: App content → Privacy
   policy (`https://kantokeepsakes.com/privacy`), Data safety form, Content
   rating questionnaire (IARC), Target audience, Account deletion URL
   (`https://kantokeepsakes.com/delete-account`) — all pre-answered in
   `docs/store-submission.md`.
4. Internal testing → Testers: create an email list (up to 100), share the
   opt-in link. Installs are instant, no review.
5. For later builds: `eas submit --platform android --latest` (needs a
   service-account JSON wired via `eas credentials` — Play Console → Setup →
   API access).

Note: personal Play accounts created after Nov 2023 need 12+ testers opted in
for 14 days before **production** release — irrelevant for the internal beta,
but plan for it ahead of G7.

## 7. Run the beta (M3-3)

- Collect feedback via TestFlight feedback + a pinned listing or group chat
  with the Brunei/SEA community; file issues as `fix/*` branches.
- Watch: Vercel logs for `[rate-limit] Redis unavailable` (Upstash health),
  Supabase Auth logs for signup/reset failures, Expo push receipts
  (`push_tokens` pruning handles dead tokens automatically).
- Website and app share the same production DB — beta trades are real data.
  The `SITE_PASSWORD` gate stays up the whole time (D5); beta testers only
  need the app, which talks to `/api/*` (never gated).

## Deliberately NOT in this runbook (G7 — needs owner go decision)

- Removing `SITE_PASSWORD` from Vercel env.
- Promoting store listings from testing tracks to production.
- App Store / Play production review submissions.
