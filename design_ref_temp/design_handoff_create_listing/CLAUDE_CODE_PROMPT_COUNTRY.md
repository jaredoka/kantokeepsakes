# Claude Code Prompt — Add Country Section to Create Listing Page

## Context
The existing Create Listing page has been updated with a new **Country** section. This is now the **first section** on the page (all existing sections have been renumbered: Title → 2, Haves → 3, Wants → 4, Description → 5).

The full updated reference is in `CreatePage.ref.jsx`. This prompt describes only the new Country section and the renumbering change.

---

## Changes to Make

### 1. Add Country data

Add a countries array with all world countries. Each entry needs a `name` (string) and a way to render a flag emoji. The recommended approach is to generate flag emojis at runtime from 2-letter ISO codes using Unicode regional indicator symbols:

```js
const flagFromCode = (code) =>
  code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
```

Full country list with ISO codes (195 countries, A–Z) — see `CreatePage.ref.jsx` → `COUNTRIES` array for the complete list.

---

### 2. Add state

Add these three state variables to the Create Listing component:

```js
const [country,      setCountry]      = useState(null);  // { name, flag } or null
const [countryQuery, setCountryQuery] = useState('');     // search input text
const [countryOpen,  setCountryOpen]  = useState(false);  // dropdown visibility
```

---

### 3. New Section 1 — Country

Insert this section **before** the existing Title section. It sits inside the same form, using the same section card shell as all other sections.

**Section header**: number badge `1`, title "Country", and — once a country is selected — the country's flag emoji displayed to the right of the title (large, ~22px).

**Body layout** (`padding: 20px`):

#### Search input
- Standard text input, full width
- `placeholder`: "Search country..."
- `value`: `countryQuery`
- `onFocus`: open dropdown (`setCountryOpen(true)`)
- `onChange`: update query, open dropdown, clear selected country
- When a country IS selected and dropdown is closed: show the country's flag emoji **inside the input** on the left side (`position: absolute`, `left: 10px`, `font-size: 18px`) and add `padding-left: 36px` to the input so text doesn't overlap

#### Dropdown list
- Only visible when `countryOpen === true`
- Appears directly below the input
- `border: 1px solid {border-default}`, `border-radius: 6px`, `background: #fff`
- `max-height: ~114px` (≈ 3 rows visible), `overflow-y: auto` — scrollable for the rest
- Light `box-shadow`

**Filtering**: filter `COUNTRIES` by `countryQuery.toLowerCase()` against `c.name.toLowerCase()`. If query is empty, show all countries.

**Each row**:
- `padding: 9px 14px`, `display: flex`, `align-items: center`, `gap: 10px`
- Flag emoji: `font-size: 20px`, `flex-shrink: 0`
- Country name: `font-size: 13px`
- Selected row: `background: {yellow-light}`, `font-weight: 700`
- Thin `border-bottom` between rows (omit on last row)
- No border, transparent background otherwise

**On row click**:
```js
setCountry(c);          // { name, flag }
setCountryQuery(c.name); // fill input with country name
setCountryOpen(false);   // close dropdown
```

#### "Required" hint
Show `"Required"` in small muted text (`font-size: 11px`, right-aligned) below the input when no country is selected AND dropdown is closed.

---

### 4. Update section header component to accept a `flag` prop

The shared section header component (numbered badge + title + optional note) needs to accept an optional `flag` prop. When provided, render the flag emoji between the title and the note:

```jsx
<SectionHead n="1" title="Country" flag={country?.flag} />
```

Render order inside the header: `[badge] [title] [flag?] [note?]`

---

### 5. Renumber all existing sections

| Old number | New number | Section      |
|------------|------------|--------------|
| 1          | 2          | Title        |
| 2          | 3          | Haves        |
| 3          | 4          | Wants        |
| 4          | 5          | Description  |

---

## Visual Spec

| Property | Value |
|---|---|
| Dropdown max-height | ~114px (3 rows) |
| Flag in input | `font-size: 18px`, `left: 10px`, vertically centred |
| Flag in section header | `font-size: 22px`, `line-height: 1` |
| Input left padding (flag showing) | `36px` |
| Row padding | `9px 14px` |
| Row flag size | `20px` |
| Row font size | `13px` |
| Selected row bg | `#fde68a` (yellow-light) |
| Row divider | `1px solid #f3f4f6` |

---

## Reference File
`CreatePage.ref.jsx` contains the full updated component. The Country section starts at the `COUNTRIES` array declaration at the top and the section rendering is marked `// ── SECTION 1: COUNTRY`.
