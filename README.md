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
├── tools/
│   └── csv-to-json.js          # CSV → products.json converter
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
   git clone git@github.com:jaredoka/kantokeepsakes.git
   ```
2. Open `index.html` in a browser, or serve with any static file server:
   ```bash
   npx serve .
   ```
3. No build step required — plain HTML/CSS/JS.

## Managing Products

Products are stored in `data/products.json`. There are two ways to update them:

### Option 1: Edit JSON Directly

Edit `data/products.json` by hand. Each product follows this schema:

```json
{
  "id": "jp-sealed-001",
  "name": "Pokemon 151 Booster Box",
  "category": "japanese",
  "type": "sealed",
  "price": 65.00,
  "image": "images/products/jp-sealed-001.jpg",
  "description": "Japanese Pokemon 151 booster box, 20 packs.",
  "inStock": true,
  "preorder": false
}
```

### Option 2: Spreadsheet Workflow

1. Open the **[Kanto Keepsakes — Product Inventory](https://docs.google.com/spreadsheets/d/1MxO5JWSZbUlGbgBYGEXe22o2-MlcmRPereQnEQKK2zE)** Google Sheet.
2. Add/edit product rows. Required columns: `name`, `category`, `type`, `price`. The `id` and `image` columns are auto-generated if left blank.
3. Export as CSV: **File → Download → Comma Separated Values (.csv)**.
4. Run the converter:
   ```bash
   node tools/csv-to-json.js path/to/downloaded.csv
   ```
5. This overwrites `data/products.json` with the spreadsheet data.

**Valid values:**
- `category`: `japanese`, `english`, `accessories`
- `type`: `sealed`, `singles`, `graded`, `accessories`
- `inStock`: `TRUE` or `FALSE` (defaults to `TRUE`)
- `preorder`: `TRUE` or `FALSE` (defaults to `FALSE`)

## Product Images

Images go in `images/products/`. The naming convention matches the product `id`:

```
images/products/jp-sealed-001.jpg
images/products/en-singles-002.jpg
images/products/acc-001.jpg
```

**Recommended specs:** 800x800px minimum, square aspect ratio, JPG or WebP.

If an image is missing, a styled placeholder is shown automatically.

### Sourcing Images

1. **Photograph your own inventory** — the safest approach. A smartphone with good lighting and a clean background is sufficient.
2. **Contact your distributor** (Maxsoft for Southeast Asia) — ask for official marketing assets and product images for authorized retailers.
3. Do **not** use images from the Pokemon press site (pokemon.gamespress.com) — those are for editorial use only, not retail.

## Design

- **Color palette:** White and yellow
- **Typography:** Inter (sans-serif)
- **Layout:** CSS Grid, mobile-first
- **Breakpoints:** Mobile (default) → Tablet (~768px) → Desktop (~1024px+)

## Progress

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
| A | WhatsApp number + image placeholders | Done |
| B | Spreadsheet product workflow | Done |
| 11 | Polish & final QA | Pending |
