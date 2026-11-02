# Motion & Physics Specification

## Overview

All Vanguard UI animations target **compositor-only properties** (`transform`
and `opacity`) for jank-free 60 fps rendering. Motion is purposeful — it
communicates hierarchy, guides attention, and provides spatial context.

---

## Easing Curves

| Name                    | Value                             | Usage                          |
| ----------------------- | --------------------------------- | ------------------------------ |
| `--ease-out` (entry)    | `cubic-bezier(0.22, 1, 0.36, 1)` | Elements entering the viewport |
| `--ease-in` (exit)      | `cubic-bezier(0.55, 0, 1, 0.45)` | Elements leaving the viewport  |
| `--ease-in-out`         | `cubic-bezier(0.45, 0, 0.55, 1)` | Layout shifts, resizing        |

**"ease-out-expo-soft"** (`0.22, 1, 0.36, 1`) — fast initial movement that
gently decelerates into a soft settle. Feels responsive without being abrupt.

**Exit easing** (`0.55, 0, 1, 0.45`) — starts slowly from rest, then
accelerates out of view. Signals departure without lingering.

---

## Duration Tiers

| Tier       | Range      | Custom property      | Examples                        |
| ---------- | ---------- | -------------------- | ------------------------------- |
| Micro      | ≤ 150 ms   | `--duration-fast`    | Hover, focus, toggle, checkbox  |
| Standard   | ≤ 300 ms   | `--duration-normal`  | Fade-in, slide-in, dropdown     |
| Emphasis   | ≤ 500 ms   | `--duration-slow`    | Page transition, hero reveal    |

```css
:root {
  --ease-out:         cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in:          cubic-bezier(0.55, 0, 1, 0.45);
  --ease-in-out:      cubic-bezier(0.45, 0, 0.55, 1);
  --duration-fast:    100ms;
  --duration-normal:  200ms;
  --duration-slow:    400ms;
}
```

---

## Compositor-Only Rule

**ONLY** animate `transform` and `opacity`. These are the only CSS properties
that can be composited on the GPU without triggering layout or paint.

```
✅  transform: translateY(8px)  →  transform: translateY(0)
✅  opacity: 0  →  opacity: 1
❌  height: 0  →  height: auto
❌  top: 100px  →  top: 0
❌  margin, padding, width, left, right, bottom
```

If you need an expand/collapse, use `transform: scaleY()` with
`transform-origin: top` or the `<details>` element, not height animation.

---

## Reduced Motion

Users who set `prefers-reduced-motion: reduce` **must** get safe alternatives.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 150ms !important;
    /* Cross-fade only — no spatial movement */
  }
}
```

**Requirements:**
- Replace all spatial transforms (translate, scale, rotate) with a simple
  opacity cross-fade at 150 ms.
- No spring animations.
- No stagger delays.
- Skeleton shimmer: stop animation, show static placeholder.

---

## Stagger Patterns

When animating a list of items, stagger entry with a fixed delay:

```css
.stagger-list > * {
  opacity: 0;
  transform: translateY(8px);
  animation: stagger-in var(--duration-normal) var(--ease-out) forwards;
}

.stagger-list > *:nth-child(1)  { animation-delay: 0ms; }
.stagger-list > *:nth-child(2)  { animation-delay: 50ms; }
.stagger-list > *:nth-child(3)  { animation-delay: 100ms; }
.stagger-list > *:nth-child(4)  { animation-delay: 150ms; }
/* … */

@keyframes stagger-in {
  to { opacity: 1; transform: translateY(0); }
}
```

**Rules:**
- Base delay: **50 ms** between consecutive items.
- Maximum total stagger: **500 ms** (i.e., cap at 10 items with delay; items
  beyond 10 animate simultaneously with the 10th).
- Respect reduced motion — skip all stagger delays.

---

## Spring Physics (JS Libraries)

When using framer-motion, react-spring, or similar:

```js
const springConfig = {
  stiffness: 400,   // higher = snappier
  damping:   30,    // higher = less oscillation
  mass:      1,     // keep at 1 for UI elements
};
```

| Preset      | Stiffness | Damping | Mass | Feel                    |
| ----------- | --------- | ------- | ---- | ----------------------- |
| Snappy      | 400       | 30      | 1    | Default UI interactions |
| Gentle      | 200       | 20      | 1    | Modals, overlays        |
| Bouncy      | 500       | 15      | 1    | Playful micro-feedback  |

---

## Scroll-Driven Animations

Use the CSS `animation-timeline` property where supported for
scroll-linked effects (progress bars, parallax, reveal-on-scroll):

```css
.scroll-reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

@keyframes reveal {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Rules:**
- Always provide a no-animation fallback for browsers without support.
- Keep scroll-driven animations subtle — avoid distracting parallax.
- Respect `prefers-reduced-motion` — disable entirely.

---

## Hover & Focus Transition Defaults

Every interactive element gets this baseline transition:

```css
.interactive {
  transition-property: color, background-color, border-color, box-shadow, opacity, transform;
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--ease-out);
}
```

Focus rings use `box-shadow` (not `outline` — for border-radius consistency):

```css
.interactive:focus-visible {
  box-shadow: 0 0 0 2px var(--bg-surface), 0 0 0 4px var(--accent-primary);
  outline: none;
}
```
