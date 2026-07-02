# Claude Code Prompt — Implement Create Listing Page

## Context
I have a high-fidelity design for a **Create Listing** page for a Pokémon TCG marketplace app called **Kanto Keepsakes**. The design files are in this handoff folder. Please read `README.md` in full before starting — it contains all measurements, colours, interactions, state, and API details.

## Your Task
Implement the Create Listing page as described in `README.md`, using this codebase's existing framework, component library, and conventions. Do not copy the `.ref.jsx` files directly — they are design references written as plain `React.createElement` calls with global window exports. Translate them into proper idiomatic code for this project.

## What to Build

### 1. `CreateListingPage` (or equivalent route/screen)
A form page with four numbered sections and a submit button. Full spec in README → "Screens / Views".

- **Section 1 — Title**: two text inputs `[H]` and `[W]`, each capped at 40 characters, with a live monospace preview above them. Desktop: single-line preview with ellipsis. Mobile (< 768px): two-line preview.
- **Section 2 — Haves**: a thumbnail container (flex, wrapping) + a Cash toggle card on the right (desktop) or below (mobile), followed by the CardPicker.
- **Section 3 — Wants**: same thumbnail container + four toggle cards (Cash, Singles, Graded, Sealed) on the right (desktop) or below (mobile), followed by the CardPicker.
- **Section 4 — Description**: optional textarea, max 300 characters.
- **Submit**: full-width yellow button → shows a success state on submit.

### 2. `CardPicker` component
Embedded in both Haves and Wants. Allows users to browse and select card thumbnails.
- Language toggle: EN / JP
- Dependent dropdowns: Era → Set (data in `SearchFilter.ref.jsx` → `ERA_DATA`)
- Card type filter: All / Cards / Promos
- Text search with cross-language expansion (`expandQuery` in `SearchFilter.ref.jsx`)
- Fetches cards from `https://api.tcgdex.net/v2/{lang}/sets/{setId}` on set selection
- Card image URL pattern: `https://assets.tcgdex.net/{lang}/{serieId}/{setId}/{localId}/high.webp`
- Click a card → appends to parent's image list

### 3. Preference toggle cards (`CreatePrefCard`)
72×92px toggle buttons used in Haves (Cash only) and Wants (Cash, Singles, Graded, Sealed).
- Inactive: `border: 2px solid #e5e7eb`, `background: #f3f4f6`
- Active: `border: 2px solid #d4a017`, `background: #fde68a`
- Each has a visual (symbol or SVG icon) and a label. SVG paths for Singles, Graded (PSA slab), and Sealed (booster box) are in README → "SVG Icons".

### 4. Thumbnail container (`CreateThumbContainer`)
Flexible wrapping container:
- Empty: dashed border `#d1d5db`, centred placeholder text
- Filled: solid border `#e5e7eb`, 8px padding, wrapping grid of card images (72px wide each) with a red `×` remove button per card

## Design Tokens to Use
Refer to README → "Design Tokens" for the full list. Key values:
- Brand yellow: `#f5c518`
- Page background: `#fafafa`
- Card/section background: `#ffffff`
- Primary border: `#e5e7eb`
- Input border: `#d1d5db`
- Active pref card border: `#d4a017`, background: `#fde68a`
- Active icon/label colour: `#92400e`
- Font: Inter (or system sans-serif fallback)

## Responsive Behaviour
- Breakpoint: **768px**
- Below 768px: Haves and Wants sections stack vertically (thumbnail → pref cards → CardPicker)
- Above 768px: thumbnail and pref cards sit side by side (flex row), CardPicker below

## State
```
havesText: string        // max 40 chars
wantsText: string        // max 40 chars
haveImages: CardItem[]   // { localId, name, img, set, lang }
havesCash: boolean
wantImages: CardItem[]
wPrefs: { cash, singles, graded, sealed }  // booleans
description: string      // max 300 chars
submitted: boolean
```

## API
TCGDex — open API, no auth:
- `GET https://api.tcgdex.net/v2/{en|ja}/sets/{setId}`
- Returns `{ serie: { id }, cards: [{ localId, name }] }`
- No API key needed

## ERA_DATA / Cross-language Search
The full ERA_DATA array (10 eras, ~120 sets, EN + JA names) and TRANSLATION_MAP (bidirectional EN↔JP dictionary) are in `SearchFilter.ref.jsx`. Copy or adapt these into your data layer.

## What NOT to Do
- Do not copy the `.ref.jsx` files as-is into production
- Do not use `React.createElement` directly if your codebase uses JSX
- Do not use `window.*` globals — import/export properly
- Do not implement any other marketplace pages (browse, detail, inbox, etc.) — only the Create Listing page

## Files to Read First
1. `README.md` — complete spec
2. `CreatePage.ref.jsx` — page structure and layout reference
3. `CardPicker.ref.jsx` — card browser component reference
4. `SearchFilter.ref.jsx` — ERA_DATA, TRANSLATION_MAP, expandQuery
