# Decisions

Why this shop is built the way it is. Each entry is a decision that was contested or expensive to
reverse; anything obvious is left out on purpose.

## 1. Static HTML/CSS/JS - no framework

**Decision:** plain HTML, CSS and ES modules served as files, no build step.
**Why:** the shop has one seller, a handful of products, no accounts and no server state. A
framework would add a build pipeline, a dependency tree and a deploy config to manage for zero
user-visible benefit.
**Rejected:** Next.js (which this project ran on before), because its advantages - server rendering,
API routes, image optimisation - are irrelevant to a page that is the same for every visitor.
**Consequence:** the deployed files are the repository files. Debugging is reading the source.

## 2. No payment gateway - the order is a WhatsApp message

**Decision:** checkout composes an order and opens `wa.me/601136177105` with the text prefilled.
Payment is arranged by bank transfer or cash in that conversation.
**Why:** Stripe does not onboard Brunei-based businesses, and the shop already sells through
WhatsApp - it is the highest-margin channel in the business. Adding a gateway would add a payment
provider, a webhook, PCI questions and abandoned-checkout handling to replace a step that already
works.
**Rejected:** Stripe; PayPal; a "reserve now, pay on collection" form.
**Consequence:** the cart is the only state, there are no order records, and the shop never touches
money. That is a deliberate boundary, not an omission.

## 3. The catalogue is a JavaScript module, not JSON + fetch

**Decision:** products live in `public/data/products.js` as `export const PRODUCTS = [...]`.
**Why:** the page already needs the data at load time. Fetching a JSON file adds an HTTP request, an
async state, a loading state, a cache flag and an error path that no one will ever see.
**Rejected:** `fetch('products.json')`; a headless CMS; a database.
**Consequence:** adding a product is editing one file and pushing. There is no API and no runtime
dependency on anything outside the repository.

## 4. The catalogue is hand-maintained

**Decision:** no admin UI, no spreadsheet import.
**Why:** the stock is small, changes rarely, and is graded slabs - one of one. An admin UI would need
auth, storage, validation and a database to replace a text edit that is already reviewable in a diff.
**Rejected:** a 209-line CSV-to-JSON converter that shipped with the original site (deleted).
**Consequence:** if the catalogue ever passes a few hundred items, this is the decision to revisit
first.

## 5. Tests cover the money path and nothing else

**Decision:** two spec files - price formatting, and the cart (stock caps, totals, corrupt storage,
the order message). Node environment, one dev dependency.
**Why:** those are the only places where a bug costs the shop money or sends the wrong order. UI
rendering is verified by opening the page, which is both faster and more honest than a jsdom
assertion that the markup matches itself.
**Rejected:** jsdom + Testing Library + five spec files (~250 lines) for twelve static pages.
**Consequence:** a rendering regression is caught by eye, not by CI. Accepted.

## 6. Hosting on Cloudflare Pages

**Decision:** the site deploys to **Cloudflare Pages** from this repo, with the build output
directory set to `public` and no build command.
**Why:** DNS is already at Cloudflare, so the host writes its own DNS record rather than requiring
per-project A/CNAME values typed in by hand; `_headers` works; and this is the same setup as the
other two sites the business runs, so there is one dashboard and one way of doing things.
**Rejected:** Vercel (the previous host for the marketplace, and a fine one for a Next.js app, but it
sends you hunting for DNS values), Netlify, GitHub Pages. Also Cloudflare Workers static assets -
evaluated first because the dashboard offers it before Pages, and rejected: it asks for a *deploy
command* rather than an output directory, and with no Wrangler config in the repo that command
uploads the entire repository, `node_modules` included.
**Consequence:** the site lives in `public/` because that is the directory the host uploads. Keeping
the files at the repo root meant the deploy swept up `node_modules` as well.

## 7. Release discipline: preview first, domain later

**Decision:** the shop is published to a `*.pages.dev` URL first. `kantokeepsakes.com` keeps serving
the old, password-gated marketplace until the catalogue has products in it.
**Why:** an empty shop should not be the public face of the domain, and the old marketplace costs
nothing while it waits - nobody can reach it while its gate is on.
**Consequence:** the domain move, the old projects' deletion and the data export are one deferred,
gated release rather than a hurried cutover.

**Update, 2026-09-13:** the domain moved first, with the catalogue still empty. That overrides the
reasoning above deliberately - the domain belongs to the shop, and leaving it pointing at a
password-gated placeholder serves nobody, while every grid on the new site already says stock is
being added. The teardown of the old projects stays deferred until the shop is verified on the
domain.

## 8. Deleting code is part of the work

**Decision:** ~350 lines were removed before anything was added - the CSV converter, JSON+fetch, the
sub-navigation JavaScript, the sort dropdown, the add-to-cart toast, Google Fonts.
**Why:** each duplicated a job something else already did (dedicated category pages instead of tabs;
the cart badge instead of a toast; a system font instead of a webfont). Less code to read is the
feature.
**Rejected:** keeping them "just in case" - the previous versions are in git history if they are
wanted back.
