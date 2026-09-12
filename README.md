# Kanto Keepsakes

The Kanto Keepsakes shop - static HTML, CSS and vanilla JavaScript, sold in Brunei, priced in BND.
**Checkout is a WhatsApp message to the company number `601136177105`.** Nothing is charged on the
site, and there is no server, database, account or API anywhere in it.

## Running it locally

```bash
npm install      # only for the tests
npm run serve    # http://localhost:8080
```

`npm run serve` uses Python's built-in web server. Opening `index.html` by double-clicking will
**not** work: the scripts are ES modules, which browsers refuse to load over `file://`.

## Adding a product

1. **Photo.** Put the image in `images/products/`. Name it after the product's `id`, lowercase with
   dashes: `pikachu-with-grey-felt-hat-psa10.jpg`.
   - **Resize first.** Phone photos are 3-5 MB each; a page of those is unusable on mobile data.
     Resize to about 1200 px on the long edge and aim for under 400 KB.
   - A missing photo is not an error - the card shows a grey "No image" placeholder.
2. **Catalogue entry.** Add an object to `PRODUCTS` in `data/products.js`. The field list, the
   defaults and a copyable example are documented in the comment at the top of that same file.
3. **Check and ship.**

   ```bash
   npm test
   git add -A && git commit -m "catalog: add <product>" && git push
   ```

## Retiring a product

Set `inStock: false` on its entry - it stays visible with an "Out of Stock" badge and cannot be
added to the cart - or delete the entry entirely. Do it the same day something sells: graded slabs
are one of one, so a stale entry can be ordered twice.

## Photos that are too big

```bash
find images/products -size +400k
```

Anything it prints should be resized.

## Tests

```bash
npm test
```

Two files, nineteen tests, one dependency, no browser environment: the cart maths, the stock caps,
and the exact text of the WhatsApp order message. Nothing else is automated - the pages themselves
are checked by opening them.

## Layout

```
index.html              home
pages/*.html            11 pages: japanese/english x sealed/singles/graded, accessories, preorder, cart
css/styles.css          all styling; CSS custom properties at the top
js/config.js            company WhatsApp number, currency, storage key
js/money.js             BND formatting
js/cart.js              cart state, cart page, WhatsApp checkout
js/products.js          catalogue filtering, product cards, empty-shop state
js/app.js               header menu and cart count
data/products.js        THE CATALOGUE - the only file to edit for products
images/products/        product photos, named after the product id
images/                 the logo
404.html                not-found page
tests/                  Vitest specs
```

## Deliberate limitations

- No payment gateway, no accounts, no database, no order records - orders live in WhatsApp.
- No build step: the files in this repository are the files visitors load.
- No analytics, no cookies, no third-party requests at all (the fonts are a system stack).
- The catalogue ships empty; every grid shows an "ask me on WhatsApp" state until it is stocked.
