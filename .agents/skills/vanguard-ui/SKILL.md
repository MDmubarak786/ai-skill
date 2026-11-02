---
name: vanguard-ui
description: >
  Optimized for auto-triggering when the user asks to build, redesign, audit,
  polish, or refactor any web UI, landing page, dashboard, SaaS screen,
  component library, or design system.
---

# Vanguard UI — Anti-Slop Web Interface Skill

## §1 Philosophy

**AI slop** is the uncanny sameness of AI-generated UI:

- Default purple/blue gradients with no brand rationale
- Cards nested inside cards inside cards
- `transition: all 0.3s ease` on every element
- Missing loading, empty, error, and overflow states
- Generic stock copy and placeholder-grade layout

**Why it matters:** Users develop instant distrust for slop. It tanks
conversion, destroys accessibility, and signals "nobody reviewed this."
Every pixel must be intentional. Every state must be handled. Every
animation must respect the user's system preferences.

> This skill enforces a **4-Gate Workflow**. No gate may be skipped.

---

## §2 Gate 1 — Design System & Token Lock

> **Rule: NEVER write raw UI code without `DESIGN.md` and CSS custom properties.**

### Required Steps

1. **Create `DESIGN.md`** at the project root documenting palette, type scale,
   spacing scale, radius, and shadows.
2. **Define CSS custom properties** on `:root` using **OKLCH** color space.
3. If the user provides an inspiration URL, extract tokens automatically:
   ```bash
   node scripts/extract-tokens.mjs <url>
   ```

### Mandatory Token Set

| Token                | Role                  | Example (OKLCH)                  |
|----------------------|-----------------------|----------------------------------|
| `--bg-surface`       | Primary background    | `oklch(0.98 0.005 260)`         |
| `--bg-surface-alt`   | Elevated surface      | `oklch(0.95 0.008 260)`         |
| `--text-primary`     | Body text             | `oklch(0.20 0.02 260)`          |
| `--text-secondary`   | Muted / supporting    | `oklch(0.45 0.015 260)`         |
| `--border-subtle`    | Dividers / card edges | `oklch(0.88 0.01 260)`          |
| `--accent-primary`   | CTA / active states   | `oklch(0.62 0.20 265)`          |
| `--accent-hover`     | Hover variant         | `oklch(0.55 0.22 265)`          |
| `--radius-sm/md/lg`  | Border radius scale   | `4px / 8px / 16px`              |
| `--shadow-sm/md`     | Elevation             | Subtle, no black blobs           |

### Anti-Slop Token Rules

- **No raw hex/rgb/hsl in component files.** Every color via `var(--token)`.
- **No `border-radius: 9999px`** unless explicitly a pill/avatar.
- **No gradient** unless `DESIGN.md` documents the gradient stops and rationale.

> 📖 Full token architecture → [`references/token-system.md`](references/token-system.md)

---

## §3 Gate 2 — 5-State Completeness

> **Every data-driven component and SaaS screen MUST implement all 5 states.**

### The 5 States

| #  | State        | Requirements                                                        |
|----|--------------|---------------------------------------------------------------------|
| 1  | **Loading**  | Geometry-matched skeleton; same dimensions as populated layout       |
| 2  | **Empty**    | Zero-state illustration/icon + actionable CTA ("Add your first…")   |
| 3  | **Error**    | Non-destructive inline recovery; retry button; no modal hijack      |
| 4  | **Overflow** | Text truncation with `text-overflow: ellipsis`; `tabular-nums` for  |
|    |              | numbers; `min-width: 0` on flex children; test with 200% content    |
| 5  | **Populated**| The "happy path" — fully rendered with real-shaped data              |

### Implementation Checklist

- [ ] Skeleton uses same grid/flex layout as populated state (no layout shift)
- [ ] Empty state CTA is a primary action button, not just text
- [ ] Error state preserves user input and offers inline retry
- [ ] Overflow tested with: long single words, 3× expected data length, narrow viewport
- [ ] Populated state tested with minimum AND maximum realistic data

### Anti-Slop State Rules

- **No bare spinner** — always a content-shaped skeleton
- **No "Something went wrong"** without a recovery action
- **No hidden scrollbars** masking overflow — handle it explicitly
- Empty states must **never** be a blank white box

> 📖 SaaS state patterns → [`references/saas-states.md`](references/saas-states.md)

---

## §4 Gate 3 — Motion & Interaction Physics

> **Animation must feel physical, fast, and respectful.**

### Defaults

| Property          | Value                              |
|-------------------|------------------------------------|
| Enter easing      | `cubic-bezier(0.22, 1, 0.36, 1)`  |
| Exit easing       | `cubic-bezier(0.55, 0, 1, 0.45)`  |
| Micro-interaction | **≤ 300ms** duration ceiling       |
| Page transition   | **≤ 500ms** duration ceiling       |
| Animatable props  | `transform`, `opacity` **only**    |

### Rules

- **Never animate `width`, `height`, `margin`, `padding`, `top/left`** — layout
  thrash triggers reflow.
- Use `will-change` sparingly and only on elements about to animate.
- Stagger delays: `calc(var(--i) * 50ms)` with CSS custom property index.
- All motion wrapped in:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- **No `transition: all`** — always specify exact properties.

> 📖 Motion system details → [`references/motion-physics.md`](references/motion-physics.md)

---

## §5 Gate 4 — Deterministic Verification & Auto-Heal

> **Every file must pass the slop audit before being presented to the user.**

### Workflow

1. After writing/modifying any UI file, **automatically run**:
   ```bash
   node scripts/slop-audit.mjs <target-file>
   ```
2. The audit checks for: raw colors, `transition: all`, missing states, naked
   `border-radius: 9999px`, animation on layout properties, missing
   `prefers-reduced-motion`, cards-in-cards nesting depth > 2.
3. **Fix ALL critical and warning violations** before presenting output.
4. Re-run audit to confirm Grade **B or above**.

### Grading Scale

| Grade | Meaning                           | Action           |
|-------|-----------------------------------|------------------|
| **S** | Zero violations, exemplary        | Ship it          |
| **A** | Zero critical, ≤ 2 warnings      | Ship it          |
| **B** | Zero critical, ≤ 5 warnings      | Acceptable       |
| **C** | 1–2 critical OR > 5 warnings     | Must fix         |
| **F** | 3+ critical violations            | Full rewrite     |

### Auto-Heal Hook

The audit runs as a **post-write hook** — every time a UI file is saved,
the agent must re-audit before moving on. No manual trigger needed.

---

## §6 CAD Blueprint

Generate precise dimension documentation for any component:

```bash
node scripts/generate-cad.mjs <component>
```

This outputs an annotated ASCII blueprint showing:

- Exact spacing values (padding, margin, gap) in `px` / `rem`
- Border radius and shadow offsets
- Typography metrics (font-size, line-height, letter-spacing)
- Touch target minimums (≥ 44×44px)

> 📖 CAD blueprint format → [`references/cad-blueprint.md`](references/cad-blueprint.md)

---

## §7 Quick Reference Cheatsheet

### Token Naming Convention

| Prefix       | Usage              | Examples                            |
|--------------|--------------------|-------------------------------------|
| `--bg-`      | Backgrounds        | `--bg-surface`, `--bg-surface-alt`  |
| `--text-`    | Text colors        | `--text-primary`, `--text-secondary`|
| `--border-`  | Borders/dividers   | `--border-subtle`, `--border-strong`|
| `--accent-`  | Brand / CTA        | `--accent-primary`, `--accent-hover`|
| `--radius-`  | Border radius      | `--radius-sm`, `--radius-md`        |
| `--shadow-`  | Box shadows        | `--shadow-sm`, `--shadow-md`        |
| `--space-`   | Spacing scale      | `--space-1` through `--space-8`     |

### 5-State Checklist (per component)

```
□ Loading   → skeleton matches populated geometry
□ Empty     → CTA present, not a blank box
□ Error     → inline, non-destructive, retry action
□ Overflow  → ellipsis, tabular-nums, min-w-0
□ Populated → tested with min + max realistic data
```

### Motion Defaults (copy-paste)

```css
:root {
  --ease-enter: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-exit:  cubic-bezier(0.55, 0, 1, 0.45);
  --duration-micro: 200ms;  /* ≤ 300ms ceiling */
  --duration-page:  400ms;  /* ≤ 500ms ceiling */
}
```

### Pre-Flight Commands

| Command                                  | Purpose               |
|------------------------------------------|-----------------------|
| `node scripts/extract-tokens.mjs <url>`  | Extract design tokens |
| `node scripts/slop-audit.mjs <file>`     | Audit for AI slop     |
| `node scripts/generate-cad.mjs <comp>`   | CAD blueprint         |

---

## §8 Precision Prompting Playbook

A skill's enforcement is multiplied when paired with explicit, constrained user prompts.
Always refer to the 5-Pillar schema (Role framing, OKLCH tokens, negative blacklist, 5-state matrix, and audit gate).

> 📖 Golden prompt templates for landing pages, components & refactors → [`references/prompting-playbook.md`](references/prompting-playbook.md)
