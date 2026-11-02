# Vanguard UI — Precision Prompting Playbook
## The Science of Prompting AI for Zero-Slop, Production-Grade UI

> **Core Axiom:** A skill provides the *rules* and *tools*, but the **prompt** sets the *constraints* and *intent*. Without precision prompting, LLMs automatically regress to their training mean: generic purple gradients, nested cards, missing states, and `transition: all`.

---

## 1. Why AI Defaults to Slop Without Proper Prompting

Language models optimize for average statistical likelihood. The average frontend code in training corpora:
- Uses arbitrary hex codes copied from tutorials (`#8b5cf6`, `#6366f1`).
- Uses `transition: all 0.3s ease` because it is easy to write, even though it causes severe layout reflows and battery drain.
- Neglects loading, error, empty, and overflow states because tutorial demos only show the "happy path".
- Omits keyboard `:focus-visible` styles and dark mode tokens.

When you add a **Skill** like `vanguard-ui`, `impeccable`, or `ui-ux-pro-max`, the AI has the *knowledge*. But when paired with a **Precision Prompt**, the AI is locked into executing at the level of a Staff Design Technologist.

---

## 2. The 5-Pillar Precision UI Prompt Schema

Every high-performing UI prompt should incorporate these 5 pillars:

```text
┌────────────────────────────────────────────────────────┐
│ 1. ROLE & CALIBER FRAMING                              │
│    (Principal Design Technologist at Stripe/Linear)   │
├────────────────────────────────────────────────────────┤
│ 2. DESIGN ARCHETYPE & TOKEN SYSTEM                     │
│    (OKLCH color space, typography pairing, tokens)    │
├────────────────────────────────────────────────────────┤
│ 3. NEGATIVE CONSTRAINTS (THE BLACKLIST)               │
│    (No purple gradients, no nested cards, no slop)     │
├────────────────────────────────────────────────────────┤
│ 4. 5-STATE RESILIENCE MATRIX                           │
│    (Loading, Empty, Error, Overflow, Populated)        │
├────────────────────────────────────────────────────────┤
│ 5. SELF-AUDIT & VERIFICATION GATE                      │
│    (Must achieve 100/100 Grade S via vanguard-ui audit)│
└────────────────────────────────────────────────────────┘
```

---

## 3. Golden Prompt Templates

### Template 1: The Zero-Slop SaaS Landing Page
Use this prompt when generating a complete landing page:

```markdown
Act as a Principal Frontend Architect and Design Technologist. Build a modern, high-conversion landing page for [PRODUCT_NAME: e.g. An ultra-fast distributed cache].

Follow the Vanguard UI and Impeccable engineering standards:

1. DESIGN SYSTEM & TOKENS:
   - Declare all colors in OKLCH on :root with semantic names (--bg-surface, --text-primary, --accent-primary).
   - Use an intentional palette: Dark slate graphite neutrals with a single high-contrast electric amber or deep cobalt accent (no generic purple/cyan).
   - Fluid typography using clamp(), system font stack (-apple-system, Inter, sans-serif), and tabular-nums on all metrics.
   - Light and dark themes via @media (prefers-color-scheme: dark) or data-theme.

2. HARD NEGATIVE CONSTRAINTS (STRICTLY FORBIDDEN):
   - NO purple-to-blue AI gradients.
   - NO nested cards (cards inside cards). Use clean borders, divide-y, or subtle surface differentiation.
   - NO icon-tile stacks (48x48 rounded square icon floating directly above an h3).
   - NO `transition: all` — animate ONLY compositor properties (`opacity`, `transform`) <= 200ms ease-out.
   - NO emojis as icons — use sharp, minimalist inline SVGs with aria-hidden="true".
   - NO skipped heading tags (h1 -> h2 -> h3 hierarchy must be strict).

3. RESPONSIVE & ACCESSIBILITY GUARANTEES:
   - Full keyboard navigation with distinct :focus-visible rings (2px outline with 2px offset).
   - All flex/grid children must carry `min-width: 0` and `overflow-wrap: break-word`.
   - WCAG 2.2 AA contrast minimums (>= 4.5:1 body, >= 3:1 display).
   - Wrap all animations in `@media (prefers-reduced-motion: reduce)`.

4. VERIFICATION:
   - Audit the output against `vanguard-ui audit` and `impeccable detect`. Ensure zero anti-patterns and Grade S.
```

---

### Template 2: The Bulletproof 5-State Production Component
Use this prompt when building a reusable widget, card, table, or modal:

```markdown
Act as a Senior UI Systems Engineer. Build a production-ready, fully accessible [COMPONENT_NAME: e.g. Real-Time Telemetry Metric Card / Team Members Data Table].

The component MUST implement and render all 5 SaaS UI States:
1. LOADING: Geometry-matched skeleton with subtle shimmer, preserving exact layout dimensions (no CLS).
2. EMPTY: Helpful zero-state illustration or icon, empathetic copy, and an actionable primary CTA button.
3. ERROR: Non-destructive inline error banner with error explanation, retry button callback, and error code.
4. OVERFLOW: Test against 120-character strings, multi-line titles, and extreme numbers. Must use `min-w-0`, `truncate` / `line-clamp`, and `tabular-nums`.
5. POPULATED (IDEAL): Rich interactive view with hover, active, focus-visible, and disabled states.

TECHNICAL REQUIREMENTS:
- Tailwind CSS or modern CSS using custom properties.
- Full ARIA compliance (role, aria-live for updates, aria-busy for loading, aria-label on icon buttons).
- Interactive state toggle in development mode so all 5 states can be inspected instantly.
```

---

### Template 3: The Surgical UI Audit & Anti-Slop Refactor
Use this prompt when you have an existing sloppy UI and want the AI to fix it:

```markdown
Act as a Staff Design Technologist specializing in anti-slop refactoring. Audit and refactor the following UI component:

[PASTE_COMPONENT_CODE_OR_FILE_PATH]

EXECUTE THE VANGUARD REFACTORING PIPELINE:
1. RUN AUDIT: Identify every AI slop anti-pattern:
   - Find raw hex/rgb values and replace with OKLCH semantic tokens.
   - Flatten any nested cards into unified containers or divider layouts.
   - Remove `transition: all` and replace with GPU-accelerated micro-interactions.
   - Fix low-contrast color combinations to exceed 4.5:1.
   - Fix layout overflow vulnerabilities (missing min-w-0, fixed px widths).
2. ENHANCE ACCESSIBILITY: Add missing :focus-visible, aria labels, and prefers-reduced-motion.
3. HARDEN STATES: Add loading skeletons, empty recovery states, and error resilience.
4. VERIFY: Output the before-and-after diff and verify that `vanguard-ui audit` scores 100/100 (Grade S).
```

---

### Template 4: The Multi-Skill Composite Prompt
Use this prompt when you want to harness multiple installed AGY skills simultaneously:

```markdown
Build a flagship [PROJECT: e.g. Developer Billing & Usage Dashboard] utilizing our installed AGY design skills:

1. ARCHITECTURE & AUDIT (Vanguard UI):
   - Enforce the 4-Gate Workflow.
   - Ensure 100/100 Grade S deterministic audit score.
2. DESIGN INTELLIGENCE (UI/UX Pro Max):
   - Query palette and font pairings for the "Developer Tools / Enterprise Infrastructure" profile.
   - Adhere to the top-tier UX guidelines for data visualization.
3. MOTION PHYSICS (Emil Animate):
   - Transitions must use ease-out curves (cubic-bezier(0.16, 1, 0.3, 1)) capped at 200ms.
   - Active micro-interactions on button press: transform: scale(0.98).
4. POLISH & RESTRAINT (Impeccable & Hallmark):
   - Zero card nesting, zero purple AI gradients, untracked sentence-case labels.
```

---

### Template 5: Apple-Style Monochrome Technical Spec (CAD)
Use this prompt when creating an engineering spec sheet or component redline:

```markdown
Generate an Apple-style monochrome dimensional CAD drawing sheet for [COMPONENT_NAME].

RULES:
- Grayscale only (black lines, white background, precise hatching).
- Annotate exact spacing variables (S1, S2, S3), height constraints (H1, H2), and corner radii (R1, R2).
- Include title block with DWG NO, REV, SCALE, and units (px/rem).
- Produce a self-contained, high-resolution SVG or interactive HTML blueprint.
```

---

## 4. Key Takeaways for Everyday Prompting

| Instead of writing... | Write this instead... |
| :--- | :--- |
| *"Make a nice modern button"* | *"Create a button component with default, hover, active (scale 0.98), focus-visible (2px offset ring), and loading (disabled + inline spinner) states using semantic OKLCH tokens."* |
| *"Create a dashboard"* | *"Build an enterprise dashboard using a single-card container layout with divide-y dividers, tabular-nums on all metrics, and a skeleton loading state."* |
| *"Animate this card"* | *"Add a 150ms ease-out transform and opacity transition, guarded by @media (prefers-reduced-motion: reduce)."* |
| *"Make it look professional"* | *"Apply WCAG 2.2 AA contrast (> 5.5:1), zero purple gradients, neutral slate surface tokens, and 16px base typography."* |
