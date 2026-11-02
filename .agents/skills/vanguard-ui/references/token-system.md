# Design Token System

## Overview

Vanguard UI enforces a **semantic token layer** built on CSS custom properties.
Every color, radius, shadow, and typographic value used in generated components
**must** reference a semantic token — never a raw hex, rgb, or hsl literal.

Colors are specified in the **OKLCH** color space for perceptual uniformity,
wide-gamut support, and intuitive lightness reasoning.

---

## Mandatory Token Names

### Surface / Background

| Token                    | Role                                      |
| ------------------------ | ----------------------------------------- |
| `--bg-surface`           | Page / root background                    |
| `--bg-surface-raised`    | Card, modal, popover background           |
| `--bg-surface-overlay`   | Scrim / backdrop behind modals            |

### Text

| Token              | Role                                           |
| ------------------ | ---------------------------------------------- |
| `--text-primary`   | Headings, body copy — highest contrast         |
| `--text-secondary` | Supporting text, labels, captions              |
| `--text-tertiary`  | Placeholder text, disabled labels              |
| `--text-inverse`   | Text on accent-colored or dark backgrounds     |

### Border

| Token              | Role                                           |
| ------------------ | ---------------------------------------------- |
| `--border-subtle`  | Dividers, very light separators                |
| `--border-default` | Input outlines, card edges                     |
| `--border-strong`  | Focus rings, active borders                    |

### Accent

| Token                      | Role                                     |
| -------------------------- | ---------------------------------------- |
| `--accent-primary`         | Primary buttons, links, active states    |
| `--accent-primary-hover`   | Hover state — slightly lighter/darker    |
| `--accent-primary-active`  | Active / pressed state                   |

### Radius

| Token           | Value (default) | Usage                              |
| --------------- | --------------- | ---------------------------------- |
| `--radius-sm`   | `4px`           | Chips, badges, small inputs        |
| `--radius-md`   | `8px`           | Cards, buttons, dialogs            |
| `--radius-lg`   | `16px`          | Hero sections, large panels        |
| `--radius-full` | `9999px`        | Avatars, pills, circular buttons   |

### Shadow

| Token         | Default value                                         |
| ------------- | ----------------------------------------------------- |
| `--shadow-sm` | `0 1px 2px oklch(0% 0 0 / 0.05)`                     |
| `--shadow-md` | `0 4px 12px oklch(0% 0 0 / 0.08)`                    |
| `--shadow-lg` | `0 12px 40px oklch(0% 0 0 / 0.12)`                   |

### Typography

| Token         | Default value                                         |
| ------------- | ----------------------------------------------------- |
| `--font-sans` | `'Inter', system-ui, -apple-system, sans-serif`       |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace`           |

---

## OKLCH Color Space

### Why OKLCH?

1. **Perceptual uniformity** — equal numeric lightness steps produce equal
   visual lightness steps, unlike HSL.
2. **Wide gamut** — can express P3 and Rec.2020 colors natively.
3. **Intuitive** — L (lightness 0-1), C (chroma 0-0.4), H (hue 0-360).

### Conversion Formula (Hex → OKLCH Approximate)

```
1. Convert hex to linear sRGB (remove gamma).
2. Convert linear sRGB → CIE XYZ (D65).
3. Convert XYZ → Oklab (L, a, b).
4. Convert Oklab → OKLCH:
     L = L
     C = sqrt(a² + b²)
     H = atan2(b, a) × (180 / π)   (mod 360)
```

In CSS, use the native `oklch()` function:

```css
/* oklch(lightness  chroma  hue) */
--accent-primary: oklch(0.55 0.22 264);
```

---

## Light / Dark Theme Structure

### Light Theme (default — `:root`)

```css
:root {
  color-scheme: light;
  --bg-surface:         oklch(0.99 0 0);
  --bg-surface-raised:  oklch(1 0 0);
  --bg-surface-overlay: oklch(0.2 0 0 / 0.4);
  --text-primary:       oklch(0.15 0 0);
  --text-secondary:     oklch(0.40 0 0);
  --text-tertiary:      oklch(0.65 0 0);
  --text-inverse:       oklch(0.98 0 0);
  --border-subtle:      oklch(0.92 0 0);
  --border-default:     oklch(0.85 0 0);
  --border-strong:      oklch(0.50 0 0);
  --accent-primary:     oklch(0.55 0.22 264);
  --accent-primary-hover:  oklch(0.60 0.24 264);
  --accent-primary-active: oklch(0.48 0.20 264);
}
```

### Dark Theme

```css
/* Option A — class toggle */
.dark {
  color-scheme: dark;
  --bg-surface:         oklch(0.15 0 0);
  --bg-surface-raised:  oklch(0.20 0 0);
  --bg-surface-overlay: oklch(0.0 0 0 / 0.6);
  --text-primary:       oklch(0.95 0 0);
  --text-secondary:     oklch(0.75 0 0);
  --text-tertiary:      oklch(0.55 0 0);
  --text-inverse:       oklch(0.15 0 0);
  --border-subtle:      oklch(0.25 0 0);
  --border-default:     oklch(0.35 0 0);
  --border-strong:      oklch(0.60 0 0);
  --accent-primary:     oklch(0.68 0.19 264);
  --accent-primary-hover:  oklch(0.73 0.21 264);
  --accent-primary-active: oklch(0.62 0.17 264);
}

/* Option B — system preference */
@media (prefers-color-scheme: dark) {
  :root { /* same overrides as .dark above */ }
}
```

---

## Semantic vs. Primitive Token Layers

```
┌─────────────────────────────────────────┐
│  Component code                         │
│  color: var(--text-primary);            │  ← Semantic (use this)
├─────────────────────────────────────────┤
│  Semantic layer                         │
│  --text-primary: var(--gray-900);       │  ← Maps to primitive
├─────────────────────────────────────────┤
│  Primitive layer                        │
│  --gray-900: oklch(0.15 0 0);          │  ← Raw value
│  --blue-500: oklch(0.55 0.22 264);     │
└─────────────────────────────────────────┘
```

Component code **never** references primitives directly. The semantic layer is
the **only** public API — primitives are internal and can change freely.

---

## DESIGN.md Template

Every generated project must include a `DESIGN.md` with these sections:

```markdown
# Design System — [Project Name]

## Palette
<!-- oklch values for each primitive + semantic mapping -->

## Typography Scale
<!-- font-size / line-height / weight / letter-spacing per level -->

## Spacing Scale
<!-- 4px base unit: 4, 8, 12, 16, 24, 32, 48, 64 -->

## Radii
<!-- sm, md, lg, full -->

## Shadows
<!-- sm, md, lg with oklch alpha values -->

## Breakpoints
<!-- sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px -->
```
