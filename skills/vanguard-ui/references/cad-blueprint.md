# CAD Blueprint Specification

## Overview

Vanguard UI generates **Apple-style monochrome technical drawings** for every
component — a precise, dimensioned blueprint that documents spacing, typography,
colors, radii, and z-index layering in a single visual artifact.

The blueprint is an HTML file with inline CSS and SVG, produced by
`generate-cad.mjs`.

---

## Color Palette

The blueprint itself uses a strict monochrome palette:

| Role             | Color     | Usage                                 |
| ---------------- | --------- | ------------------------------------- |
| Foreground       | `#1a1a1a` | Component outlines, labels, text      |
| Background       | `#fafafa` | Canvas / page background              |
| Dimension lines  | `#e5e5e5` | Measurement lines, arrows, guides     |
| Accent callout   | `#999999` | Secondary annotations, muted labels   |

No color from the component's own design system appears in the structural
drawing — component colors are shown only in the **color swatch strip**.

---

## SVG Dimension Lines

Dimension lines use SVG `<line>` or `<path>` elements with arrow markers:

```svg
<defs>
  <marker id="arrow" viewBox="0 0 10 10"
          refX="10" refY="5"
          markerWidth="6" markerHeight="6"
          orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#e5e5e5" />
  </marker>
</defs>

<!-- Horizontal dimension -->
<line x1="20" y1="80" x2="180" y2="80"
      stroke="#e5e5e5" stroke-width="1"
      marker-start="url(#arrow)" marker-end="url(#arrow)" />
<text x="100" y="75" text-anchor="middle"
      font-size="11" fill="#1a1a1a" font-family="var(--font-mono)">
  160px (10rem)
</text>
```

All measurements are labeled in both **px** and **rem** (assuming 16px base).

---

## Padding Annotation

Padding is shown as **dashed lines inside** the component boundary:

```
┌─────────────────────────────────┐  ← component border (solid #1a1a1a)
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│ │                             │ │  ← padding boundary (dashed #e5e5e5)
│ │         content             │ │
│ │                             │ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
└─────────────────────────────────┘
       ↕ padding-top: 16px
```

CSS for SVG dashed lines: `stroke-dasharray="4 3"`.

---

## Margin Annotation

Margin is shown as **dashed lines outside** the component boundary:

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  ← margin boundary (dashed #e5e5e5)
│ ┌─────────────────────────────┐   │
│ │        component            │   │
│ └─────────────────────────────┘   │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
   ↔ margin-left: 24px
```

---

## Gap Annotation

For flex/grid layouts, gap is annotated **between children**:

```
┌────────┐  ←16px→  ┌────────┐  ←16px→  ┌────────┐
│  child │          │  child │          │  child │
└────────┘          └────────┘          └────────┘
```

A double-headed dimension arrow spans each gap with the value centered above.

---

## Border-Radius Annotation

Corner radii are shown as **small arc indicators** at each corner with the
radius value labeled:

```
   r=8px
    ╭───────────────────────╮
    │                       │
    │                       │
    ╰───────────────────────╯
```

In SVG, draw a small arc path at each corner and place a text label beside it.

---

## Typography Spec Table

Below the blueprint drawing, include a table documenting every text style:

| Element     | font-family       | size    | weight | line-height | letter-spacing | color              |
| ----------- | ----------------- | ------- | ------ | ----------- | -------------- | ------------------ |
| Heading     | `var(--font-sans)`| 1.5rem  | 700    | 1.25        | -0.02em        | `var(--text-primary)` |
| Body        | `var(--font-sans)`| 1rem    | 400    | 1.5         | 0              | `var(--text-primary)` |
| Caption     | `var(--font-sans)`| 0.8125rem | 400  | 1.4         | 0.01em         | `var(--text-secondary)` |
| Code        | `var(--font-mono)`| 0.875rem| 400    | 1.6         | 0              | `var(--text-primary)` |

---

## Color Swatch Strip

A horizontal strip of small squares showing each token color used in the
component, with the OKLCH value labeled below:

```
┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐
│    │  │    │  │    │  │    │  │    │
└────┘  └────┘  └────┘  └────┘  └────┘
bg-     text-   accent- border- bg-
surface primary primary default surface-
                                raised
oklch(  oklch(  oklch(  oklch(  oklch(
0.99    0.15    0.55    0.85    1
0 0)    0 0)    0.22    0 0)    0 0)
                264)
```

Each swatch is a 32×32px square with a 1px `#e5e5e5` border. The token name
appears above and the OKLCH value below in `--font-mono` at 9px.

---

## Layer Hierarchy Diagram

Visualize z-index stacking as an **exploded isometric** or **layered side view**:

```
z-50  ┌──────────────┐  Toast / Notification
      └──────────────┘
z-40  ┌──────────────┐  Modal
      └──────────────┘
z-30  ┌──────────────┐  Overlay / Scrim
      └──────────────┘
z-20  ┌──────────────┐  Dropdown / Popover
      └──────────────┘
z-10  ┌──────────────┐  Sticky Header
      └──────────────┘
z-0   ┌──────────────┐  Page Content
      └──────────────┘
```

---

## Responsive Breakpoint Annotations

Show the component at each breakpoint with width labels:

```
│◄─────── sm: 640px ────────►│
│◄──────────── md: 768px ──────────────►│
│◄────────────────── lg: 1024px ────────────────────►│
```

Annotate layout changes: column count, hidden elements, stacked vs. inline.

---

## How `generate-cad.mjs` Produces the Blueprint

1. **Parse** the component's HTML + CSS (from the generated output).
2. **Extract** computed styles: padding, margin, gap, border-radius, font
   properties, colors, z-index.
3. **Build an SVG layer** with:
   - Component outline rectangles (solid `#1a1a1a` 1px stroke).
   - Padding/margin dashed boundaries.
   - Dimension lines with arrow markers and px/rem labels.
   - Corner arc indicators for border-radius.
4. **Build the HTML document**:
   - `<head>`: inline CSS for monochrome styling, `--font-mono` for labels.
   - `<body>`: the SVG blueprint, typography table, color swatch strip,
     z-index diagram, and responsive annotations.
5. **Write** the file to `{output}/cad-blueprint.html`.

The output is a self-contained, zero-dependency HTML file that can be opened
in any browser for design review and handoff.
