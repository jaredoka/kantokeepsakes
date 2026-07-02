# Handoff: Create Listing Page

## Overview
The Create Listing page lets users post a Pokémon TCG trade listing on the Kanto Keepsakes marketplace. Users fill in four structured sections — Title, Haves, Wants, and Description — before submitting. The card browser (CardPicker) lets users attach card thumbnail images by browsing live card data from the TCGDex API filtered by Era → Set → Card/Promo type, with cross-language EN/JP search.

## About the Design Files
The files in this bundle are **design references created in HTML/React** — high-fidelity prototypes showing intended look and behaviour, not production code to copy directly. The task is to **recreate these designs in your target codebase** using its existing patterns, component library, and framework conventions.

Reference files included:
- `CreatePage.ref.jsx` — the full Create Listing page component
- `CardPicker.ref.jsx` — the card search/browse panel used inside Haves and Wants
- `SearchFilter.ref.jsx` — the era/set/language taxonomy data and cross-language search utility (`expandQuery`, `ERA_DATA`, `TRANSLATION_MAP`)

## Fidelity
**High-fidelity.** Pixel-perfect mockup with final colours, typography, spacing, icons, and interactions. Recreate the UI precisely using your codebase's existing libraries.

---

## Screens / Views

### 1. Create Listing Page (full page)

**Layout**
- Page background: `#fafafa` (`--color-off-white`)
- Content centred, `max-width: 720px`, `padding: 32px 24px`
- Vertical stack of 4 section cards + submit button, `gap: 12px`
- Back link at top left; page title + subtitle below it

**Back link**
- Left-arrow SVG (16×16, stroke currentColor, strokeWidth 2)
- Text: "Back to Marketplace"
- Font: 13px, weight 600, colour `#374151`
- `display: inline-flex`, `align-items: center`, `gap: 6px`
- `margin-bottom: 16px`

**Page title**
- "Post a listing" — 24px (`--font-size-2xl`), weight 700, `margin: 0 0 4px`
- Subtitle: "Post a trade listing for Pokémon TCG items" — 14px, colour `#6b7280`, `margin: 0 0 20px`

**Section cards** (all four sections share this shell):
- `background: #fff`
- `border: 1px solid #e5e7eb`
- `border-radius: 12px` (`--border-radius-lg`)
- `overflow: hidden`

**Section header** (inside each card):
- `padding: 13px 20px`
- `border-bottom: 1px solid #e5e7eb`
- `display: flex`, `align-items: center`, `gap: 10px`
- Number badge: black rect tag (`background: #1a1a1a`, `color: #fff`, `font-size: 10px`, `font-weight: 800`, `border-radius: 3px`, `padding: 0 6px`, `height: 20px`, monospace font)
- Section title: 14px, weight 700, `color: #111827`, `flex: 1`
- Optional note: 11px, `color: #9ca3af`, `font-style: italic`

**Section body**: `padding: 20px`

---

### Section 1 — Title

**Live preview bar**
- Monospace font, 13px, `color: #374151`
- `background: #f3f4f6`, `border: 1px solid #e5e7eb`, `border-radius: 6px`
- `padding: 8px 12px`, `margin-bottom: 12px`
- **Desktop**: single line, `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`
  - Format: `[H] {havesText} [W] {wantsText}`
- **Mobile** (< 768px): two lines stacked, `word-break: break-all`
  - Line 1: `[H] {havesText}`
  - Line 2: `[W] {wantsText}`

**[H] and [W] inputs** (identical structure):
- Flex row, `border: 1px solid #d1d5db`, `border-radius: 6px`, `overflow: hidden`
- Left badge: `padding: 8px 12px`, `background: #f3f4f6`, `border-right: 1px solid #d1d5db`, `font-size: 13px`, `font-weight: 700`, `color: #374151`, `white-space: nowrap`
  - Text: `[H]` or `[W]`
- Text input: `flex: 1`, `padding: 8px 12px`, `font-size: 14px`, no border, no border-radius
- `maxLength: 40`
- Placeholder: `[H]` → "What you have — e.g. Charizard ex PSA 10" / `[W]` → "What you want — e.g. Cash or Mewtwo GX"

**Character counter** (below each input):
- `text-align: right`, `font-size: 11px`, `margin-top: 3px`
- Normal: `color: #9ca3af` — At limit: `color: #dc2626`
- Format: `{count}/40`

---

### Section 2 — Haves

**Desktop layout**: flex row, `gap: 10px`, `align-items: stretch`, `margin-bottom: 14px`
- Left: `CreateThumbContainer` (flex: 1)
- Right: single `CreatePrefCard` for Cash

**Mobile layout**: flex column, `gap: 10px`, `margin-bottom: 14px`
- Top: `CreateThumbContainer` (full width)
- Below: Cash `CreatePrefCard` in a flex row

**Below the row**: `CardPicker` component (always visible, full width)

#### CreateThumbContainer
- `flex: 1`
- `min-height: 100px`
- **Empty state**: `border: 1.5px dashed #d1d5db`, `background: #fff`, centred text "Browse cards below to add images" (11px, `#9ca3af`)
- **Filled state**: `border: 1.5px solid #e5e7eb`, `background: #fff`, `padding: 8px`, `flex-wrap: wrap`, `gap: 6px`, `align-content: flex-start`

**Card thumbnail item** (inside filled container):
- `position: relative`, `width: 72px`, `flex-shrink: 0`
- `<img>`: `width: 100%`, `border-radius: 5px`, `border: 1px solid #e5e7eb`
- Remove button (×): `position: absolute`, `top: -4px`, `right: -4px`, `width: 17px`, `height: 17px`, `border-radius: 9px`, `background: #dc2626`, `color: #fff`, `font-size: 11px`

#### CreatePrefCard
- `width: 72px`, `height: 92px`
- `display: flex`, `flex-direction: column`, `align-items: center`, `justify-content: center`, `gap: 7px`
- `border-radius: 8px`, `padding: 0 6px`, `flex-shrink: 0`
- `transition: all 150ms ease`
- **Inactive**: `border: 2px solid #e5e7eb`, `background: #f3f4f6`
- **Active**: `border: 2px solid #d4a017`, `background: #fde68a`
- Visual: either a text symbol (Cash → `$`, font-size 20px) or an SVG icon (see SVG Icons below)
- Label: 10px, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.05em`, `text-align: center`, `line-height: 1.3`
  - Inactive: `color: #9ca3af` — Active: `color: #92400e`

---

### Section 3 — Wants

Same structure as Haves, with these differences:

**Desktop**: flex row with 4 `CreatePrefCard`s (Cash, Singles, Graded, Sealed) in a `flex-direction: row`, `gap: 6px`, `flex-shrink: 0` group on the right

**Mobile**: 4 `CreatePrefCard`s in a `flex-wrap: wrap`, `gap: 6px` row below the thumb container

**Want preference cards:**

| Label    | Visual       | Type   |
|----------|-------------|--------|
| Cash     | `$`          | symbol |
| Singles  | SVG icon     | svg    |
| Graded   | SVG icon     | svg    |
| Sealed   | SVG icon     | svg    |

---

### Section 4 — Description

- `<textarea>`, `rows: 4`, `maxLength: 300`, `resize: none`
- `padding: 8px 12px`, `font-size: 14px`, `line-height: 1.6`, `border: 1px solid #d1d5db`, `border-radius: 6px`, `width: 100%`
- Placeholder: "Condition details, card language, shipping info..."
- Character counter below: right-aligned, 11px — normal `#9ca3af`, at limit `#dc2626` — format: `{count}/300`

---

### Submit Button
- `width: 100%`, `padding: 13px 24px`, `margin-top: 4px`
- `background: #f5c518`, `color: #1a1a1a`, `font-weight: 700`, `font-size: 16px`
- `border: none`, `border-radius: 6px`, `cursor: pointer`
- Label: "Create Listing"

---

### Success State
Shown after form submit instead of the page:
- Full page centred vertically
- Large ✓ character (48px), h2 "Listing created!", body text, CTA button "Back to Marketplace" (yellow, same style as submit)

---

## CardPicker Component

Inline card browser embedded in Haves and Wants sections. Always visible (not a toggle).

**Container**:
- `border: 1px solid #f5c518` (brand yellow)
- `border-radius: 12px`, `background: #fffef7`, `overflow: hidden`

**Filter bar** (`background: #fffdf0`, `border-bottom: 1px solid #fde68a`, `padding: 10px 12px`):

Row 1 — Language toggle + Search:
- EN/JP segmented toggle: `background: #f3f4f6`, `border-radius: 6px`, `padding: 2px`, `gap: 2px`
  - Each button: `padding: 4px 10px`, `border-radius: 4px`, `font-size: 11px`, `font-weight: 700`
  - Active: `background: #fff`, `color: #1a1a1a`, `box-shadow: 0 1px 2px rgba(0,0,0,0.1)`
  - Inactive: `background: transparent`, `color: #6b7280`
- Search input: `flex: 1`, 12px, `padding: 6px 8px`, standard border/radius, placeholder "Search card name..."
- Switching language clears the set selection and card list

Row 2 — Era → Set → Card type:
- Era `<select>`: `flex: 1 1 110px`, `min-width: 90px` — options from `ERA_DATA` (see taxonomy)
- Set `<select>`: `flex: 1 1 140px`, `min-width: 110px` — disabled until era chosen (`opacity: 0.5`, `cursor: not-allowed`)
- Card type pills: All / Cards / Promos — active pill: `background: #1a1a1a`, `color: #fff`, `border-color: #1a1a1a`; inactive: transparent

**Card grid** (`padding: 10px`, `max-height: 230px`, `overflow-y: auto`, `flex-wrap: wrap`, `gap: 4px`):
- Empty: "Select an era and set to browse cards" (centred, 12px, `#9ca3af`)
- Loading: "Loading..."
- Error: "Card data unavailable for this set."
- Cards: `width: 54px`, `cursor: pointer`, `border-radius: 4px`, `overflow: hidden`, `border: 2px solid transparent`
  - Hover: `border-color: #f5c518`, `transform: scale(1.08)` (`transition: 100ms`)
  - Clicking a card calls `onSelectCard({ ...card, img, set, lang })`

**API**: `GET https://api.tcgdex.net/v2/{en|ja}/sets/{setId}` → returns `{ serie: { id }, cards: [{ localId, name }] }`

**Image URL**: `https://assets.tcgdex.net/{en|ja}/{serieId}/{setId}/{card.localId}/high.webp`

**Cross-language search**: calls `expandQuery(searchTerm)` which returns an array of equivalent terms using `TRANSLATION_MAP` (bidirectional EN↔JP dictionary of ~30 Pokémon names + ~20 set names)

---

## SVG Icons

All icons use `fill: none`, `stroke: {colour}`, `strokeLinecap: round`, `strokeLinejoin: round`. Inactive colour: `#9ca3af`. Active colour: `#92400e`.

### Singles (20×28 viewBox)
```
// Card outer
<rect x="1.5" y="1.5" width="17" height="25" rx="2.5" strokeWidth="1.5" />
// Inner art box (top half)
<rect x="3.5" y="3.5" width="13" height="11" rx="1.5" strokeWidth="1.25" />
```

### Graded (20×28 viewBox, overflow: visible)
The slab extends above the card. Active label fill: `#b45309`. Inactive: `#d1d5db`.
```
// Slab outer case (h=39, taller than card)
<rect x="-2" y="-9.5" width="24" height="39" rx="1.5" strokeWidth="1.75" />
// Label fill (amber/gray)
<rect x="1.5" y="-8.5" width="17" height="8" rx="1" fill={labelColour} stroke="none" />
// White label inner
<rect x="2.75" y="-7.5" width="14.5" height="5.5" rx="0.5" fill="#fff" stroke="none" />
// Card outer (same as Singles)
<rect x="1.5" y="1.5" width="17" height="25" rx="2.5" strokeWidth="1.5" />
// Card inner (same as Singles)
<rect x="3.5" y="3.5" width="13" height="11" rx="1.5" strokeWidth="1.25" />
```

### Sealed (28×22 viewBox)
3D booster box. Active/inactive only changes stroke colour.
```
// Front face
<rect x="1.5" y="5.5" width="18" height="15" rx="1.5" />
// Top lid face
<path d="M1.5 5.5 L5.5 1.5 L25 1.5 L25 6.5 L19.5 6.5 L19.5 5.5 Z" />
// Right side face
<path d="M19.5 5.5 L25 1.5 L25 16.5 L19.5 20.5 Z" />
// Lid flap line
<line x1="1.5" y1="10" x2="19.5" y2="10" strokeWidth="1" />
// Pokéball circle
<circle cx="10.5" cy="15" r="2.8" strokeWidth="1.25" />
// Pokéball divider
<line x1="7.7" y1="15" x2="13.3" y2="15" strokeWidth="1" />
// Pokéball dot
<circle cx="10.5" cy="15" r="1" fill={colour} stroke="none" />
```

---

## Interactions & Behaviour

### Title Section
- `[H]` and `[W]` inputs each capped at **40 characters** (`maxLength`)
- Live preview updates on every keystroke
- Desktop: preview is a single monospace line with ellipsis overflow
- Mobile (< 768px): preview splits onto two lines, `word-break: break-all`

### Haves Section
- Thumbnail container starts empty (dashed border, placeholder text)
- Selecting a card from CardPicker appends it to `haveImages` state
- Each thumbnail has an `×` button (top-right) to remove it
- Cash pref card is a standalone toggle (independent from Wants)

### Wants Section
- Same thumbnail behaviour as Haves (separate state: `wantImages`)
- 4 preference toggles: Cash, Singles, Graded, Sealed — each independently togglable
- Desktop: preference cards appear to the right of the thumbnail container (single row)
- Mobile: preference cards appear below the thumbnail container (wrapping row)

### CardPicker
1. User selects language (EN default)
2. User selects Era from dropdown
3. Set dropdown enables; user selects a Set
4. API fetches card list; grid populates
5. Optional: filter by Cards / Promos, or text search
6. Click card → appends to parent's image list
7. Changing language or era resets set + clears card grid

### Form Submit
- On submit: show success state (✓ screen)
- Success CTA "Back to Marketplace" navigates back to the browse listing

### Responsive breakpoint: **768px**
- Below 768px: mobile layout (column stacking in Haves/Wants)
- 768px and above: desktop layout (side-by-side)

---

## State Management

```
havesText: string           // [H] input, max 40 chars
wantsText: string           // [W] input, max 40 chars
haveImages: CardItem[]      // selected card objects from CardPicker (Haves)
havesCash: boolean          // Cash toggle in Haves
wantImages: CardItem[]      // selected card objects from CardPicker (Wants)
wPrefs: {                   // Want preference toggles
  cash: boolean
  singles: boolean
  graded: boolean
  sealed: boolean
}
description: string         // max 300 chars
submitted: boolean          // controls success state display
isMobile: boolean           // derived from window.innerWidth < 768, listens to resize
```

**CardItem shape** (returned by CardPicker's `onSelectCard`):
```
{
  localId: string    // e.g. "4", "SV001"
  name: string       // e.g. "Charizard"
  img: string        // full image URL
  set: string        // set ID, e.g. "sv3pt5"
  lang: "en" | "ja"
}
```

---

## Card Taxonomy (ERA_DATA)

10 eras, each with a list of sets. Each era and set has English and Japanese names. Eras (oldest to newest):
- Original (Wizards) / オリジナル (旧裏) — 8 sets
- Neo / e-Card / ネオ・eシリーズ — 7 sets
- EX Series / e-カード / ADV — 16 sets
- Diamond & Pearl / ダイヤモンド＆パール — 11 sets
- HeartGold & SoulSilver — 5 sets
- Black & White / ブラック＆ホワイト — 11 sets
- XY — 13 sets
- Sun & Moon / サン＆ムーン — 15 sets
- Sword & Shield / ソード＆シールド — 16 sets
- Scarlet & Violet / スカーレット＆バイオレット — 13 sets

Full data is in `SearchFilter.ref.jsx` → `ERA_DATA` array.

---

## Design Tokens

### Colours
| Token | Value | Usage |
|---|---|---|
| `--color-white` | `#ffffff` | Card backgrounds |
| `--color-off-white` | `#fafafa` | Page background |
| `--color-black` | `#1a1a1a` | Section number badge, submit button text |
| `--color-gray-100` | `#f3f4f6` | Input badge bg, inactive pref card bg |
| `--color-gray-200` | `#e5e7eb` | Borders, dividers |
| `--color-gray-300` | `#d1d5db` | Input border, dashed empty state |
| `--color-gray-500` | `#6b7280` | Muted text |
| `--color-gray-700` | `#374151` | Body text, back link |
| `--color-gray-900` | `#111827` | Headings |
| `--color-yellow` | `#f5c518` | Submit button, CardPicker border, active focus |
| `--color-yellow-light` | `#fde68a` | Active pref card background |
| `--color-yellow-dark` | `#d4a017` | Active pref card border |
| `#9ca3af` | — | Char counter, placeholder, empty state text |
| `#92400e` | — | Active icon colour, active label text |
| `#b45309` | — | Active Graded label fill |
| `#dc2626` | — | Remove (×) button, limit-reached char counter |

### Typography
| Property | Value |
|---|---|
| Font family | `'Inter'`, system fallback stack |
| Page heading | 24px / weight 700 |
| Section title | 14px / weight 700 |
| Body / inputs | 14px / weight 400 |
| Small labels | 11–13px |
| Section number | 10px / weight 800 / monospace |
| Char counter / hints | 11px |
| CardPicker text | 11–12px |

### Spacing
| Token | Value |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |

### Border Radius
| Context | Value |
|---|---|
| Section cards | 12px |
| Inputs / CardPicker | 6px |
| Pref cards | 8px |
| Section number badge | 3px |
| Remove button | 9px (circle) |
| Card thumbnail | 5px |
| Pills (CardPicker type filter) | 999px |

---

## External Data

**TCGDex API** (open, no auth required):
- Set detail: `GET https://api.tcgdex.net/v2/{lang}/sets/{setId}`
  - Returns `{ serie: { id: string }, cards: [{ localId: string, name: string }] }`
- Image CDN: `https://assets.tcgdex.net/{lang}/{serieId}/{setId}/{localId}/high.webp`
- Languages: `en` or `ja`

---

## Assets
No local images or fonts required. All card artwork is loaded from the TCGDex CDN at runtime. Font is Inter loaded from Google Fonts or system fallback.

---

## Files in This Bundle
| File | Purpose |
|---|---|
| `CreatePage.ref.jsx` | Full Create Listing page component (reference) |
| `CardPicker.ref.jsx` | Card search panel with TCGDex API integration (reference) |
| `SearchFilter.ref.jsx` | ERA_DATA taxonomy, TRANSLATION_MAP, expandQuery utility (reference) |
| `README.md` | This document |

> **Note**: The `.ref.jsx` files are design references — they use `React.createElement` directly (no JSX transpiler dependency) and expose globals via `window.*`. In your production codebase, convert to standard JSX/TSX and import/export properly.
