# Claude Code Prompt — Overhaul Create Listing Page (Production)

## Goal
Completely replace the existing Create Listing page with the design described here. Every measurement, colour, interaction, and behaviour should match exactly. The reference file `CreatePage.ref.jsx` contains the full working prototype — use it as the source of truth alongside this document.

Read `CreatePage.ref.jsx`, `CardPicker.ref.jsx`, and `SearchFilter.ref.jsx` before starting.

---

## Page Overview

A full-page form (`max-width: 720px`, centred, `padding: 32px 24px`, `background: #fafafa`) with **5 numbered sections** stacked vertically (`gap: 12px`) and a full-width submit button at the bottom.

Each section is a white card:
```
background: #fff
border: 1px solid #e5e7eb
border-radius: 12px
overflow: hidden
```

Each card has a **section header** and a **body** (`padding: 20px`).

### Section Header
```
padding: 13px 20px
border-bottom: 1px solid #e5e7eb
display: flex
align-items: center
gap: 10px
```
Children (in order):
1. **Number badge** — black rect tag: `background: #1a1a1a`, `color: #fff`, `font-size: 10px`, `font-weight: 800`, `border-radius: 3px`, `padding: 0 6px`, `height: 20px`, `min-width: 24px`, monospace font
2. **Title** — `font-size: 14px`, `font-weight: 700`, `color: #111827`, `flex: 1`
3. **Flag** (Section 1 only, optional) — shown when a country is selected: `font-size: 22px`, `line-height: 1`
4. **Note** (optional) — `font-size: 11px`, `color: #9ca3af`, `font-style: italic`

---

## Section 1 — Country

**Purpose**: User selects their country. Required field. Flag emoji appears in the section header once selected.

### State
```
country: { name: string, flag: string } | null
countryQuery: string   // text input value
countryOpen: boolean   // controls dropdown visibility
```

### Flag generation
Generate flag emojis at runtime from ISO 3166-1 alpha-2 codes:
```js
const flagFromCode = (code) =>
  code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
```

### Full country list (195 entries)
See `CreatePage.ref.jsx` → `COUNTRIES` array. Each entry: `{ name: string, flag: string }`.

### UI

**Search input** (full width):
- `placeholder`: "Search country..."
- `value`: `countryQuery`
- `onFocus`: `setCountryOpen(true)`
- `onChange(e)`: `setCountryQuery(e.target.value)`, `setCountryOpen(true)`, `setCountry(null)`
- When country is selected AND dropdown is closed:
  - Flag emoji absolutely positioned inside input: `left: 10px`, `font-size: 18px`, vertically centred
  - Input `padding-left: 36px` to avoid overlap

**Dropdown** (visible only when `countryOpen === true`):
```
border: 1px solid #e5e7eb
border-radius: 6px
background: #fff
max-height: 114px    ← 3 rows visible, scrollable
overflow-y: auto
box-shadow: 0 4px 12px rgba(0,0,0,0.08)
margin-top: 8px (below input)
```

**Filter logic**: query empty → show all 195 countries; otherwise filter by `name.toLowerCase().includes(query.toLowerCase())`

**Each row**:
```
padding: 9px 14px
display: flex
align-items: center
gap: 10px
border: none
border-bottom: 1px solid #f3f4f6  (omit on last row)
background: transparent
cursor: pointer
font-size: 13px
color: #111827
text-align: left
width: 100%
```
- Flag emoji: `font-size: 20px`, `flex-shrink: 0`
- Selected row: `background: #fde68a`, `font-weight: 700`

**On row click**:
```js
setCountry(selectedCountry);
setCountryQuery(selectedCountry.name);
setCountryOpen(false);
```

**"Required" hint**: `font-size: 11px`, `color: #9ca3af`, right-aligned, shown only when `!country && !countryOpen`

---

## Section 2 — Title

**Purpose**: Defines the listing title in the format `[H] {havesText} [W] {wantsText}`.

### State
```
havesText: string   // max 40 chars
wantsText: string   // max 40 chars
```

### Live preview bar
Appears above the inputs:
```
background: #f3f4f6
border: 1px solid #e5e7eb
border-radius: 6px
padding: 8px 12px
margin-bottom: 12px
font-family: monospace
font-size: 13px
color: #374151
```
- **Desktop** (≥768px): single line, `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`
  - Content: `[H] {havesText || '...'} [W] {wantsText || '...'}`
- **Mobile** (<768px): two lines stacked, `word-break: break-all`
  - Line 1: `[H] {havesText || '...'}`
  - Line 2: `[W] {wantsText || '...'}`

### Inputs ([H] and [W])

Each input row:
```
display: flex
border: 1px solid #d1d5db
border-radius: 6px
overflow: hidden
```

Left badge:
```
padding: 8px 12px
background: #f3f4f6
border-right: 1px solid #d1d5db
font-size: 13px
font-weight: 700
color: #374151
white-space: nowrap
flex-shrink: 0
```
Text: `[H]` or `[W]`

Text input:
```
flex: 1
padding: 8px 12px
font-size: 14px
border: none
border-radius: 0
outline: none
```
- `[H]` placeholder: "What you have — e.g. Charizard ex PSA 10"
- `[W]` placeholder: "What you want — e.g. Cash or Mewtwo GX"
- Both: `maxLength: 40`

**Character counter** (below each input):
```
text-align: right
font-size: 11px
margin-top: 3px
color: #9ca3af     (normal)
color: #dc2626     (at/over limit)
```
Format: `{length}/40`

---

## Section 3 — Haves

**Purpose**: User adds card thumbnail images they have, and optionally marks Cash as a payment option.

### State
```
haveImages: CardItem[]   // cards selected from CardPicker
havesCash: boolean
```

### Layout

**Desktop** (≥768px): flex row, `gap: 10px`, `align-items: stretch`, `margin-bottom: 14px`
- Left: `ThumbnailContainer` (`flex: 1`)
- Right: Cash `PrefCard`

**Mobile** (<768px): flex column, `gap: 10px`, `margin-bottom: 14px`
- Top: `ThumbnailContainer` (full width)
- Below: Cash `PrefCard` in a `display: flex` row

**Below the layout**: `CardPicker` component (always visible)

---

## Section 4 — Wants

**Purpose**: User adds card thumbnails they want, and selects trading preferences.

### State
```
wantImages: CardItem[]
wPrefs: {
  cash: boolean
  singles: boolean
  graded: boolean
  sealed: boolean
}
```

### Layout

**Desktop** (≥768px): flex row, `gap: 10px`, `align-items: stretch`, `margin-bottom: 14px`
- Left: `ThumbnailContainer` (`flex: 1`)
- Right: 4 `PrefCard`s in a flex row, `gap: 6px`, `flex-shrink: 0`
  - Cash, Singles, Graded, Sealed

**Mobile** (<768px): flex column, `gap: 10px`, `margin-bottom: 14px`
- Top: `ThumbnailContainer` (full width)
- Below: 4 `PrefCard`s in a `flex-wrap: wrap`, `gap: 6px` row

**Below the layout**: `CardPicker` component (always visible)

---

## Section 5 — Description

**Purpose**: Optional free-text field for condition details, shipping info, etc.

### State
```
description: string   // max 300 chars
```

### UI
Textarea:
```
width: 100%
padding: 8px 12px
font-size: 14px
line-height: 1.6
border: 1px solid #d1d5db
border-radius: 6px
resize: none
rows: 4
maxLength: 300
box-sizing: border-box
```
Placeholder: "Condition details, card language, shipping info..."

Character counter below (right-aligned, 11px):
- Normal: `#9ca3af` — At limit: `#dc2626`
- Format: `{length}/300`

---

## Submit Button

```
width: 100%
padding: 13px 24px
margin-top: 4px
background: #f5c518
color: #1a1a1a
font-weight: 700
font-size: 16px
border: none
border-radius: 6px
cursor: pointer
```
Label: "Create Listing"

On submit: show success state.

---

## Success State

Replaces the full page after form submit:
- Full viewport centred vertically
- `✓` at `font-size: 48px`
- Heading "Listing created!" (`font-weight: 700`)
- Body: "Your listing is now live on the marketplace."
- CTA button "Back to Marketplace" (same yellow style as submit)

---

## ThumbnailContainer Component

A flexible, wrapping container for selected card images.

```
flex: 1
min-height: 100px
border-radius: 8px
background: #fff
display: flex
flex-wrap: wrap
gap: 6px
```

**Empty state**:
```
border: 1.5px dashed #d1d5db
align-items: center
justify-content: center
padding: 12px
```
Text: `font-size: 11px`, `color: #9ca3af`, `text-align: center`, `line-height: 1.5`
- Haves: "Browse cards below to add images"
- Wants: "Browse cards below to add images"

**Filled state**:
```
border: 1.5px solid #e5e7eb
align-content: flex-start
align-items: flex-start
justify-content: flex-start
padding: 8px
```

**Each card thumbnail**:
```
position: relative
width: 72px
flex-shrink: 0
```
- `<img>`: `width: 100%`, `border-radius: 5px`, `border: 1px solid #e5e7eb`, `display: block`
- Remove button (`×`): `position: absolute`, `top: -4px`, `right: -4px`, `width: 17px`, `height: 17px`, `border-radius: 9px`, `background: #dc2626`, `color: #fff`, `font-size: 11px`, `border: none`, `cursor: pointer`

---

## PrefCard Component

Toggle button for trading preferences.

```
width: 72px
height: 92px
display: flex
flex-direction: column
align-items: center
justify-content: center
gap: 7px
border-radius: 8px
padding: 0 6px
flex-shrink: 0
transition: all 150ms ease
cursor: pointer
border: 2px solid
```

**Inactive**: `border-color: #e5e7eb`, `background: #f3f4f6`
**Active**: `border-color: #d4a017`, `background: #fde68a`

**Visual** (centred icon area):
- Cash: `$` symbol, `font-size: 20px`, `color: #9ca3af` (inactive) / `#92400e` (active)
- Singles / Graded / Sealed: SVG icon (see below)

**Label**: `font-size: 10px`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.05em`, `text-align: center`, `line-height: 1.3`
- Inactive: `color: #9ca3af` — Active: `color: #92400e`

---

## SVG Icons for PrefCards

All: `fill: none`, `stroke-linecap: round`, `stroke-linejoin: round`
Inactive stroke: `#9ca3af` — Active stroke: `#92400e`

### Singles — viewBox="0 0 20 28", width=20, height=28
```svg
<!-- Card outer -->
<rect x="1.5" y="1.5" width="17" height="25" rx="2.5" stroke-width="1.5"/>
<!-- Inner art box (top half of card) -->
<rect x="3.5" y="3.5" width="13" height="11" rx="1.5" stroke-width="1.25"/>
```

### Graded — viewBox="0 0 20 28", width=20, height=28, overflow=visible
Slab extends above card. Label fill: `#b45309` (active) / `#d1d5db` (inactive).
```svg
<!-- Slab outer case — taller than card, extends upward -->
<rect x="-2" y="-9.5" width="24" height="39" rx="1.5" stroke-width="1.75"/>
<!-- Label background (amber/gray filled) -->
<rect x="1.5" y="-8.5" width="17" height="8" rx="1" fill="{labelColour}" stroke="none"/>
<!-- White label inner area -->
<rect x="2.75" y="-7.5" width="14.5" height="5.5" rx="0.5" fill="#fff" stroke="none"/>
<!-- Card outer (same as Singles) -->
<rect x="1.5" y="1.5" width="17" height="25" rx="2.5" stroke-width="1.5"/>
<!-- Card inner top-half box (same as Singles) -->
<rect x="3.5" y="3.5" width="13" height="11" rx="1.5" stroke-width="1.25"/>
```

### Sealed — viewBox="0 0 28 22", width=28, height=22
3D booster box.
```svg
<!-- Front face -->
<rect x="1.5" y="5.5" width="18" height="15" rx="1.5" stroke-width="1.5"/>
<!-- Top lid -->
<path d="M1.5 5.5 L5.5 1.5 L25 1.5 L25 6.5 L19.5 6.5 L19.5 5.5 Z"/>
<!-- Right side -->
<path d="M19.5 5.5 L25 1.5 L25 16.5 L19.5 20.5 Z"/>
<!-- Lid flap line -->
<line x1="1.5" y1="10" x2="19.5" y2="10" stroke-width="1"/>
<!-- Pokéball ring -->
<circle cx="10.5" cy="15" r="2.8" stroke-width="1.25"/>
<!-- Pokéball divider -->
<line x1="7.7" y1="15" x2="13.3" y2="15" stroke-width="1"/>
<!-- Pokéball centre dot (filled) -->
<circle cx="10.5" cy="15" r="1" fill="{stroke colour}" stroke="none"/>
```

---

## CardPicker Component

Embedded inside Haves and Wants sections. Always visible (never toggled). Two independent instances — one for Haves, one for Wants — with separate state.

### Container
```
border: 1px solid #f5c518
border-radius: 12px
background: #fffef7
overflow: hidden
```

### Filter bar
```
background: #fffdf0
border-bottom: 1px solid #fde68a
padding: 10px 12px
display: flex
flex-direction: column
gap: 8px
```

**Row 1** — Language toggle + Search:

EN/JP toggle (`background: #f3f4f6`, `border-radius: 6px`, `padding: 2px`, `gap: 2px`, `flex-shrink: 0`):
- Each button: `padding: 4px 10px`, `border-radius: 4px`, `font-size: 11px`, `font-weight: 700`, `border: none`
- Active: `background: #fff`, `color: #1a1a1a`, `box-shadow: 0 1px 2px rgba(0,0,0,0.1)`
- Inactive: `background: transparent`, `color: #6b7280`
- Switching language: resets set selection and clears card list

Search input (`flex: 1`): standard input, `font-size: 12px`, `padding: 6px 8px`, placeholder "Search card name..."

**Row 2** — Era → Set → Card type:

Era `<select>` (`flex: 1 1 110px`, `min-width: 90px`): options from ERA_DATA (below)

Set `<select>` (`flex: 1 1 140px`, `min-width: 110px`):
- Disabled until era is chosen
- Disabled state: `opacity: 0.5`, `cursor: not-allowed`
- Options populated from selected era's sets

Card type pills — All / Cards / Promos:
```
padding: 5px 10px
border-radius: 999px
font-size: 11px
font-weight: 600
```
- Active: `background: #1a1a1a`, `color: #fff`, `border: 1px solid #1a1a1a`
- Inactive: `background: transparent`, `color: #374151`, `border: 1px solid #d1d5db`

### Card grid
```
padding: 10px
max-height: 230px
overflow-y: auto
display: flex
gap: 4px
flex-wrap: wrap
align-content: flex-start
min-height: 80px
```

States:
- No set selected: centred text "Select an era and set to browse cards" (12px, `#9ca3af`)
- Loading: "Loading..."
- Error: "Card data unavailable for this set."
- Empty results: "No cards found"

Each card tile:
```
width: 54px
cursor: pointer
border-radius: 4px
overflow: hidden
flex-shrink: 0
border: 2px solid transparent
transition: border-color 100ms, transform 100ms
```
Hover: `border-color: #f5c518`, `transform: scale(1.08)`

On click: call `onSelectCard({ ...card, img: imageUrl, set: setId, lang })`

### API
```
GET https://api.tcgdex.net/v2/{en|ja}/sets/{setId}
→ { serie: { id: string }, cards: [{ localId: string, name: string }] }

Image URL: https://assets.tcgdex.net/{en|ja}/{serieId}/{setId}/{localId}/high.webp
```
No auth required.

### Cross-language search
`expandQuery(term)` returns an array of equivalent terms (EN↔JP) using `TRANSLATION_MAP`. Full map in `SearchFilter.ref.jsx`. Example: "charizard" → also matches "リザードン".

### ERA_DATA
Full taxonomy of 10 eras (~120 sets), each with `id`, `en`, `ja`, and a `sets` array of `{ id, en, ja }`. In `SearchFilter.ref.jsx` → `ERA_DATA`.

### CardItem shape (returned to parent)
```ts
{
  localId: string   // e.g. "4", "SV001"
  name: string      // e.g. "Charizard"
  img: string       // full image URL
  set: string       // set ID, e.g. "sv3pt5"
  lang: "en" | "ja"
}
```

---

## Responsive Breakpoint: 768px

| Context | Desktop (≥768px) | Mobile (<768px) |
|---|---|---|
| Title preview | Single line + ellipsis | Two lines, break-all |
| Haves layout | Thumb + Cash side by side | Thumb → Cash → CardPicker stacked |
| Wants layout | Thumb + 4 PrefCards side by side | Thumb → PrefCards row → CardPicker stacked |

---

## Full State Shape

```ts
country:      { name: string; flag: string } | null
countryQuery: string
countryOpen:  boolean
havesText:    string   // max 40
wantsText:    string   // max 40
haveImages:   CardItem[]
havesCash:    boolean
wantImages:   CardItem[]
wPrefs:       { cash: boolean; singles: boolean; graded: boolean; sealed: boolean }
description:  string   // max 300
submitted:    boolean
isMobile:     boolean  // window.innerWidth < 768, updates on resize
```

---

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| Page background | `#fafafa` | Outer page |
| Card background | `#ffffff` | Section cards |
| Black | `#1a1a1a` | Section badge, submit text |
| Gray 100 | `#f3f4f6` | Input badge bg, inactive pref cards |
| Gray 200 | `#e5e7eb` | Section/card borders |
| Gray 300 | `#d1d5db` | Input borders, dashed empty state |
| Gray 500 | `#6b7280` | Muted text |
| Gray 700 | `#374151` | Body text |
| Gray 900 | `#111827` | Headings |
| Yellow | `#f5c518` | Submit button, CardPicker border |
| Yellow light | `#fde68a` | Active pref card bg, selected country row |
| Yellow dark | `#d4a017` | Active pref card border |
| Muted | `#9ca3af` | Hints, placeholders, char counters |
| Active icon | `#92400e` | Active pref card label + icon colour |
| Active label fill | `#b45309` | Graded slab label (active) |
| Remove red | `#dc2626` | Thumbnail × button, char counter at limit |

---

## Page Header (above the form)

**Back link** (`display: inline-flex`, `align-items: center`, `gap: 6px`, `margin-bottom: 16px`):
- Left-arrow SVG: `width: 16px`, `height: 16px`, `stroke: currentColor`, `stroke-width: 2`
  - Path: `M19 12H5M12 19l-7-7 7-7`
- Text: "Back to Marketplace" — `font-size: 13px`, `font-weight: 600`, `color: #374151`, no underline

**Heading**: "Post a listing" — `font-size: 24px`, `font-weight: 700`, `margin: 0 0 4px`

**Subtitle**: "Post a trade listing for Pokémon TCG items" — `font-size: 14px`, `color: #6b7280`, `margin: 0 0 20px`

---

## Files in This Bundle
| File | Purpose |
|---|---|
| `CreatePage.ref.jsx` | Full updated component (reference) |
| `CardPicker.ref.jsx` | Card browser with TCGDex API (reference) |
| `SearchFilter.ref.jsx` | ERA_DATA, TRANSLATION_MAP, expandQuery (reference) |
| `README.md` | Original full spec |
| `CLAUDE_CODE_PROMPT.md` | Original handoff prompt |
| `CLAUDE_CODE_PROMPT_COUNTRY.md` | Country section delta prompt |

> `.ref.jsx` files use `React.createElement` with `window.*` globals. Translate to JSX/TSX with proper imports for your codebase.
