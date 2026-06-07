# Kanto Keepsakes

A product website for **Kanto Keepsakes**, a Pokemon TCG retailer based in Brunei. The site serves as a dedicated e-commerce/product-browsing platform for Pokemon TCG products, including Japanese and English sealed products, singles, graded cards, and accessories.

## Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Vanilla CSS with CSS Grid, mobile-first responsive design
- **JavaScript** — Vanilla JS, no frameworks
- **Font** — [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts
- **Data** — Local JSON (`data/products.json`) loaded via `fetch()`
- **Cart** — `localStorage`-based shopping cart with WhatsApp checkout
- **Hosting** — GitHub + Cloudflare Pages (custom domain)

## Folder Structure

```
Website/
├── index.html                  # Home page
├── css/
│   └── styles.css              # Global styles, variables, reset
├── js/
│   ├── app.js                  # Main entry point
│   ├── products.js             # Product fetching, filtering, rendering
│   └── cart.js                 # Cart logic (localStorage + WhatsApp checkout)
├── data/
│   └── products.json           # Product data
├── images/
│   ├── Kanto-Keepsakes-logo.webp
│   └── products/               # Product images
├── pages/
│   ├── japanese.html           # All Japanese products
│   ├── japanese-sealed.html
│   ├── japanese-singles.html
│   ├── japanese-graded.html
│   ├── english.html            # All English products
│   ├── english-sealed.html
│   ├── english-singles.html
│   ├── english-graded.html
│   ├── accessories.html        # TCG Accessories
│   ├── preorder.html           # Preorder products
│   └── cart.html               # Shopping cart
└── README.md
```

## Site Map

```
Home
├── Japanese Products (all Japanese products)
│   ├── Sealed
│   ├── Singles
│   └── Graded
├── English Products (all English products)
│   ├── Sealed
│   ├── Singles
│   └── Graded
├── TCG Accessories
├── Preorder
└── Cart
```

## Setup

1. Clone the repository:
   ```bash
   git clone git@github.com:<username>/kanto-keepsakes.git
   ```
2. Open `index.html` in a browser, or serve with any static file server:
   ```bash
   npx serve .
   ```
3. No build step required — plain HTML/CSS/JS.

## Design

- **Color palette:** White and yellow
- **Typography:** Inter (sans-serif)
- **Layout:** CSS Grid, mobile-first
- **Breakpoints:** Mobile (default) → Tablet (~768px) → Desktop (~1024px+)

## Progress

| Task | Description | Status |
|------|-------------|--------|
| 1 | README (living document) | Done |
| 2 | Project scaffolding & base structure | Pending |
| 3 | Navigation & header | Pending |
| 4 | Home page layout | Pending |
| 5 | Product data & rendering engine | Pending |
| 6 | Category pages (Japanese & English) | Pending |
| 7 | Sub-category pages (Sealed, Singles, Graded) | Pending |
| 8 | TCG Accessories page | Pending |
| 9 | Preorder page | Pending |
| 10 | Shopping cart (localStorage + WhatsApp checkout) | Pending |
| 11 | Polish & final QA | Pending |
