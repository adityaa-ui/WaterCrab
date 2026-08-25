# Watercrab — Merged Style Reference
> AutoSend's warm-stone palette and architecture, animated the way Firecrawl moves.

**Theme:** light

This is the AutoSend style system (warm-stone canvas, Cooper serif headlines,
Electric Indigo accent, Geist Mono labels) with two new systems layered in,
both re-themed from a reference video's motion patterns into AutoSend's own
colors rather than copying its palette: an animated hero background (grid,
breathing markers, materializing data clusters, cycling corner tags) and a
navigation/announcement-bar motion system (slide-in banner, flat sticky nav,
dropdown menus). Everything below the two new sections is unchanged from
the source AutoSend reference — same colors, type, spacing, components,
do's/don'ts.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Warm Bone | `#fafaf9` | `--color-warm-bone` | Page canvas, button secondary fills, section backgrounds |
| Paper White | `#ffffff` | `--color-paper-white` | Card surfaces, elevated panels, primary button text, input fills |
| Stone Mist | `#e7e5e4` | `--color-stone-mist` | Hairline borders, dividers, grid lines, button outlines |
| Bark Grey | `#79716b` | `--color-bark-grey` | Muted body text, secondary labels, corner tags, icon strokes |
| Charcoal | `#292524` | `--color-charcoal` | Primary text, headings, active nav, announcement banner fill |
| Obsidian | `#0c0a09` | `--color-obsidian` | Deepest text and edge cases requiring maximum contrast |
| Pebble | `#a6a09b` | `--color-pebble` | Tertiary text, disabled states, pixel-cluster decorations |
| Electric Indigo | `#615fff` | `--color-electric-indigo` | Primary CTA fill, active links, sparkle markers, brand marks |
| Deep Violet | `#4f39f6` | `--color-deep-violet` | Hover/pressed state for Electric Indigo only |
| Terracotta | `#d97757` | `--color-terracotta` | Secondary accent — card borders, decorative icons |
| Lichen Green | `#5ea500` | `--color-lichen-green` | Supporting accent for tags/dividers |
| Tide Teal | `#22b8cd` | `--color-tide-teal` | Supporting accent for icons and marks |
| Alarm Red | `#ff0000` | `--color-alarm-red` | Supporting accent for outlined emphasis |
| Sapphire Link | `#007ebb` | `--color-sapphire-link` | Standard in-body text links |

## Tokens — Typography

Unchanged from source — full detail in the Quick Start block at the bottom.

- **Geist** (`--font-geist`, sub: Inter/Manrope) — nav, buttons, card copy, subheadings. 400/600 weight, 12–40px.
- **Cooper LtBT** (`--font-cooper-ltbt`, sub: Playfair Display/Lora) — display headlines only, italic for one emphasis word. 400 weight, 18–80px.
- **Geist Mono** (`--font-geist-mono`, sub: JetBrains Mono/IBM Plex Mono) — code, API labels, uppercase tags, corner status tags. 400–600 weight, 12–16px, 0.04–0.10em tracking.
- **dataType** (`--font-datatype`, sub: JetBrains Mono) — numeric stat values only, 24px.

## Tokens — Spacing & Shapes

**Base unit:** 8px · **Density:** comfortable

| Radius role | Value |
|---|---|
| buttons / tags / links | 8px |
| inputs | 12px |
| cards | 16px |
| pills | 9999px |

**Page max-width:** 1200px · **Section gap:** 80px · **Card padding:** 24px

---

## Hero Background Animation System
*(new — re-themed from the reference video's grid/particle motion into AutoSend tokens)*

A quiet, mostly-static hairline grid sits behind the hero. Nothing about it
should read as "busy" — motion is slow, low-opacity, and confined to a
handful of small elements. This is a texture, not a spectacle.

### Grid Layer
Full-bleed repeating 1px lines in Stone Mist (`#e7e5e4`) on Warm Bone
(`#fafaf9`), 120px × 120px cells.

```css
background-color: #fafaf9;
background-image:
  repeating-linear-gradient(to right, #e7e5e4 0 1px, transparent 1px 120px),
  repeating-linear-gradient(to bottom, #e7e5e4 0 1px, transparent 1px 120px);
```

### Breathing Sparkle Markers
2 four-pointed star SVGs (~18px) in Electric Indigo (`#615fff`), positioned
at grid intersections roughly 27% and 73% across, 29% down. Each pulses
scale 1 → 1.2 and opacity 0.5 → 1 on a 3s ease-in-out infinite loop; the
second marker offset by a 1.4s delay so they never pulse in sync.

### Materializing Pixel Clusters
3–4 small clusters of tiny squares (Pebble `#a6a09b`, ~10px cells, 4px
gap) sit at fixed grid cells. Each cluster cycles from sparse (2–3 cells
visible) to dense (8–12 cells visible) over ~6s, individual cells fading
in with an 80ms stagger, then resets. Offset each cluster's cycle start
by 2s so they're never all sparse or all dense at once — this is what
reads as "data quietly accumulating" rather than a synchronized blink.

### Roaming Highlight Cell
A single 12px Stone Mist-filled square that fades in at one grid
intersection, holds for ~1.5s, fades out, then reappears at a different
intersection ~3s later. Implement as a small fixed set of 4–5 candidate
positions cycled in sequence with opacity keyframes — it should feel like
an idle cursor scanning the grid, not a repeating loop you can predict
within a few seconds of watching.

### Corner Status Tags
4 corners each carry a monospace bracketed tag — Geist Mono 12px,
uppercase, 0.04em tracking, Bark Grey (`#79716b`). Cycle through
`[ .JSON ]` → `[ SCRAPE ]` → `[ 200 OK ]` → `[ .MD ]`, one visible at a
time per corner, 2.5s each on a 10s loop, offset ~5s between opposite
corners so they don't change in unison.

```css
@keyframes corner-cycle {
  0%   { opacity: 0; }
  2%   { opacity: 1; }
  20%  { opacity: 1; }
  25%  { opacity: 0; }
  100% { opacity: 0; }
}
```

### Search/Query Typewriter
If the hero includes a query input, its placeholder cycles through 3–4
example phrases with a type-in/hold/type-out rhythm (~3s typed, ~1.5s
hold, ~0.5s clear) rather than a static placeholder — this is what sells
the "live tool" feeling more than any background decoration does.

---

## Navigation & Announcement Bar Motion
*(new — re-themed from the reference video's nav behavior)*

### Announcement Banner
Full-width band above the nav, Charcoal (`#292524`) background, Paper
White (`#ffffff`) centered text, one Electric Indigo underlined link
inline (the one place besides the primary CTA where Electric Indigo is
allowed as an exception, since a banner link is functionally a CTA).
Slides down from `height: 0` to its natural height (~44px) over 400ms
ease-out on load; content fades in over the same window rather than
popping in. Optional dismiss (×) on the right, Paper White at 70% opacity.

### Sticky Nav Bar
Stays completely flat when sticky/scrolled — no border, no shadow, no
background change. This matches the existing "floating on canvas" nav
spec exactly; the one addition is that it must *stay* that way through
scroll, since adding elevation on scroll is a common default that would
break the flat language the rest of the system relies on.

### Dropdown Menus (Products, Resources)
Caret rotates 180° on open (150ms ease). Panel fades in + translates up
from `translateY(8px)` to `translateY(0)` over 150ms ease-out. Panel
surface: Paper White, 1px Stone Mist border, 12px radius. This is the
**second permitted shadow** in the system (the first being the Product
Showcase Card) — keep it much lighter: `0 4px 12px rgba(0,0,0,0.08)`.

```css
@keyframes dropdown-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## Components

*(unchanged from source AutoSend reference — Primary Filled Button, Ghost
Outline Button, Top Navigation Bar, Hero Section, Product Showcase Card,
Feature Card, Arrow Link, Stats Bar, Section Label Tag, Logo Strip, Text
Input, Code Block. Full specs preserved below.)*

### Primary Filled Button
Background `#615fff`, text `#ffffff` Geist 14px weight 600 uppercase,
0.04em tracking. Padding 16px horizontal, 10–12px vertical. Radius 8px.
No border. Hover → `#4f39f6`.

### Ghost Outline Button
Transparent background, 1px `#e7e5e4` or `#292524` border, text `#292524`
Geist 14px weight 600 uppercase, 0.04em tracking. Padding 12px vertical,
16–24px horizontal. Radius 8px. Hover: border darkens to `#292524`.

### Top Navigation Bar
Full-width on `#fafaf9`, no visible bottom border. Left: logomark +
wordmark. Center: nav links, Geist 14px weight 400 Charcoal, dropdown
carets on multi-item menus. Right: ghost "Log in" + filled "Sign up".
16px vertical padding, 24px horizontal, max-width 1200px centered.

### Hero Section
Centered single column on `#fafaf9`. Headline: Cooper LtBT 80px weight
400, line-height 1.10, one word italicized. Subtext: Geist 18px weight
400 `#79716b`. CTA pair: Ghost + Filled, 16px gap. ~80px vertical
breathing room top and bottom.

### Product Showcase Card
Full-width `#ffffff` card, 1px `#e7e5e4` border, 16px radius, shadow
`0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)`.
Image bleeds to card edges. 24px padding around any overlaid controls.

### Feature Card (3-column grid)
White card, 1px `#e7e5e4` border, 8px radius, 24px padding. Title Geist
18px weight 600 `#292524`. Body Geist 14px weight 400 `#79716b`. Footer:
"DOCS →" in Geist Mono 12px weight 500 uppercase 0.04em. 24px grid gaps.

### Arrow Link
Geist Mono 12px weight 500–600 uppercase, 0.04em tracking, `#292524`.
Trailing →. No underline; opacity 0.6 on hover.

### Stats Bar
White background, 1px top/bottom `#e7e5e4` border, 4 equal columns with
1px vertical dividers. Number: dataType 24px `#292524`. Label: Geist 12px
`#79716b`. 24px vertical / 16px horizontal column padding.

### Section Label Tag
Geist Mono 12px weight 500–600, 0.10em tracking (widest in the system),
`#79716b` or `#292524`, centered.

### Logo Strip
Single row, each logo max-height 24px, opacity 0.6. 40px vertical padding.

### Text Input
Background `#ffffff`, 1px `#e7e5e4` border, radius 12px, 12px/16px
padding. Placeholder `#a6a09b`. Focus: border → `#615fff`, ring
`0 0 0 3px rgba(97,95,255,0.15)`.

### Code Block
Geist Mono 14px `#292524`, background `#fafaf9`/transparent, 1px
`#e7e5e4` border, radius 8px, 16px padding.

## Do's and Don'ts

### Do
- Set the hero headline in Cooper LtBT 80px, italicize exactly one word
- Use `#615fff` fill + `#ffffff` text as the only primary CTA color
- Use `#fafaf9` canvas / `#ffffff` cards — never invert the relationship
- Keep the grid, sparkles, and corner tags subtle — background texture,
  never louder than the headline sitting on top of it
- Keep the nav completely flat through scroll — no shadow, no border,
  no background shift, even when sticky
- Offset every looping animation (clusters, corner tags, roaming cell) so
  nothing on the page pulses in visible unison

### Don't
- Don't use `#4f39f6` as a button fill — hover/pressed state only
- Don't set body text in Cooper — display headline tier only
- Don't add shadows anywhere except the Product Showcase Card and dropdown
  menu panels — those are the only two permitted shadow surfaces
- Don't use Electric Indigo outside the primary CTA, sparkle markers,
  active links, and the one banner-link exception — it stays rare on purpose
- Don't let the background animation loop fast enough to distract from
  reading the hero copy — every motion in this system is slow and quiet

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Warm Bone Canvas | `#fafaf9` | Base page background |
| 1 | Paper White Card | `#ffffff` | Elevated cards, panels, dropdown menus |
| 2 | Stone Mist Border | `#e7e5e4` | Hairline dividers, grid lines |

## Elevation

- **Product Showcase Card:** `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)`
- **Dropdown menu panel (new):** `0 4px 12px rgba(0,0,0,0.08)`

## Layout

Max-width 1200px centered on a full-bleed `#fafaf9` canvas. Hero background
animation spans the full hero section width regardless of the 1200px
content column — it's a canvas-level texture, not a content-column element.
Announcement banner and nav are full-width; everything else respects the
1200px column. 80px gap between major sections, 40px between related blocks.

## Agent Prompt Guide

Quick Color Reference:
- canvas: `#fafaf9` · card: `#ffffff` · border/grid lines: `#e7e5e4`
- primary text: `#292524` · muted text: `#79716b` · tertiary: `#a6a09b`
- primary action + sparkles: `#615fff` · banner: `#292524`

Example Prompts:

1. *Hero background* — Repeating 1px `#e7e5e4` grid lines on `#fafaf9`,
   120px cells. Two 18px indigo (`#615fff`) star markers breathing scale
   1→1.2 opacity 0.5→1 over 3s, offset 1.4s apart. 3–4 clusters of small
   `#a6a09b` squares materializing sparse-to-dense over 6s, offset 2s
   each. Four corner `[ .TAG ]` labels in Geist Mono 12px `#79716b`
   cycling every 2.5s.

2. *Announcement banner* — Full-width `#292524` band, `#ffffff` centered
   text, one `#615fff` underlined link. Slides down from 0 to ~44px
   height over 400ms ease-out on load.

3. *Dropdown menu* — `#ffffff` panel, 1px `#e7e5e4` border, 12px radius,
   shadow `0 4px 12px rgba(0,0,0,0.08)`. Fades in + slides from
   `translateY(8px)` to `0` over 150ms ease-out on open.

## Similar Brands

- **Firecrawl** — source of the grid/sparkle/corner-tag motion language
  merged into this system
- **Resend / Loops / Cal.com / Plausible** — source of the warm-stone
  palette and component architecture (unchanged from the AutoSend reference)

## Quick Start

### CSS Custom Properties

```css
:root {
  --color-warm-bone: #fafaf9;
  --color-paper-white: #ffffff;
  --color-stone-mist: #e7e5e4;
  --color-bark-grey: #79716b;
  --color-charcoal: #292524;
  --color-obsidian: #0c0a09;
  --color-pebble: #a6a09b;
  --color-electric-indigo: #615fff;
  --color-deep-violet: #4f39f6;
  --color-terracotta: #d97757;
  --color-lichen-green: #5ea500;
  --color-tide-teal: #22b8cd;
  --color-alarm-red: #ff0000;
  --color-sapphire-link: #007ebb;

  --font-geist: 'Geist', ui-sans-serif, system-ui, sans-serif;
  --font-cooper-ltbt: 'Cooper LtBT', Georgia, serif;
  --font-geist-mono: 'Geist Mono', ui-monospace, monospace;
  --font-datatype: 'dataType', ui-monospace, monospace;

  --radius-buttons: 8px;
  --radius-inputs: 12px;
  --radius-cards: 16px;
  --radius-pills: 9999px;

  --page-max-width: 1200px;
  --section-gap: 80px;
  --card-padding: 24px;

  --shadow-showcase: rgba(0,0,0,0.1) 0px 20px 25px -5px, rgba(0,0,0,0.1) 0px 8px 10px -6px;
  --shadow-dropdown: rgba(0,0,0,0.08) 0px 4px 12px;

  --grid-cell: 120px;
  --sparkle-duration: 3s;
  --cluster-duration: 6s;
  --corner-tag-duration: 10s;
}
```
