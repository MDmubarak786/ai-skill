# SaaS 5-State Enforcement

## Overview

Every data-driven component **must** handle all five UI states explicitly.
Shipping a component without any one of these states is a blocking defect.
The scaffolded code must include concrete markup and styling for each state —
never leave a state as a `// TODO` comment.

---

## State Checklist

| #  | State        | Required elements                                    | ARIA             |
| -- | ------------ | ---------------------------------------------------- | ---------------- |
| 1  | **Loading**  | Geometry-matched skeleton, shimmer animation          | `aria-busy`      |
| 2  | **Empty**    | Illustration + headline + subtext + CTA              | —                |
| 3  | **Error**    | Inline message + retry button + preserved input      | `role="alert"`   |
| 4  | **Overflow** | Truncation, line-clamp, scroll, responsive fallback  | —                |
| 5  | **Populated**| Happy path with spacing, alignment, pagination       | —                |

---

## 1 · Loading State

The loading state uses **geometry-matched skeletons**, never a centered spinner.
The skeleton must approximate the final layout's dimensions so the page does not
reflow when real content appears.

```html
<div class="card-skeleton" aria-busy="true" aria-label="Loading cards…">
  <div class="skeleton-line skeleton-title"></div>
  <div class="skeleton-line skeleton-body"></div>
  <div class="skeleton-line skeleton-body short"></div>
</div>
```

```css
.skeleton-line {
  background: var(--bg-surface-raised);
  border-radius: var(--radius-sm);
  position: relative;
  overflow: hidden;
}

.skeleton-title { width: 60%; height: 1.25rem; margin-bottom: 0.75rem; }
.skeleton-body  { width: 100%; height: 0.875rem; margin-bottom: 0.5rem; }
.skeleton-body.short { width: 40%; }

/* Shimmer animation */
.skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    oklch(1 0 0 / 0.08) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Reduced-motion: disable shimmer, show static placeholder */
@media (prefers-reduced-motion: reduce) {
  .skeleton-line::after { animation: none; opacity: 0; }
}
```

**Rules:**
- Skeleton width/height must match the populated element's dimensions.
- Always set `aria-busy="true"` on the container; remove when loaded.
- Provide an `aria-label` describing what is loading.

---

## 2 · Empty State

Never show blank white space. Empty states are onboarding opportunities.

```html
<div class="empty-state">
  <img src="/illustrations/empty-projects.svg"
       alt="" role="presentation"
       class="empty-illustration" />
  <h2 class="empty-headline">No projects yet</h2>
  <p class="empty-subtext">
    Create your first project to start tracking tasks and milestones.
  </p>
  <button class="btn btn-primary empty-cta">
    <svg aria-hidden="true"><!-- plus icon --></svg>
    New Project
  </button>
</div>
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.empty-illustration { width: 200px; height: auto; opacity: 0.8; }
.empty-headline     { font-size: 1.25rem; color: var(--text-primary); }
.empty-subtext      { font-size: 0.9375rem; color: var(--text-secondary); max-width: 36ch; }
```

**Rules:**
- Illustration should be relevant, lightweight SVG.
- Headline: action-oriented or descriptive (not "No data").
- Subtext: explain *why* it's empty and *what to do*.
- CTA: primary action button to resolve the empty state.
- Personalize if user context is available ("Welcome, Alex — start by…").

---

## 3 · Error State

Errors must be **inline, non-destructive, and recoverable**. Never navigate
away from the user's current context.

```html
<div class="error-banner" role="alert">
  <div class="error-content">
    <svg aria-hidden="true" class="error-icon"><!-- alert-circle --></svg>
    <div>
      <p class="error-message">
        Unable to load your projects. Check your connection and try again.
      </p>
      <details class="error-details">
        <summary>Technical details</summary>
        <pre><code>GET /api/projects → 503 Service Unavailable</code></pre>
      </details>
    </div>
  </div>
  <button class="btn btn-secondary error-retry" data-retry-count="0">
    Retry
  </button>
</div>
```

```css
.error-banner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: oklch(0.95 0.03 25);
  border: 1px solid oklch(0.75 0.12 25);
  border-radius: var(--radius-md);
}

.error-icon    { color: oklch(0.55 0.2 25); flex-shrink: 0; width: 1.25rem; }
.error-message { color: var(--text-primary); margin: 0; }
.error-details { margin-top: 0.5rem; font-size: 0.8125rem; color: var(--text-secondary); }
```

**Rules:**
- Use `role="alert"` so screen readers announce the error.
- **Never** show raw stack traces, exception classes, or internal IDs.
- Technical details go inside a collapsed `<details>` element.
- Retry button should hint at exponential backoff internally
  (e.g., wait 1s → 2s → 4s between retries, cap at 30s).
- **Preserve user input** — never clear forms on error.

---

## 4 · Overflow State

Data will always exceed expected bounds. Plan for it.

### Text Overflow

```css
/* Single-line truncation */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Multi-line clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### Numeric Overflow

```css
/* Prevent layout shift with variable-width digits */
.numeric { font-variant-numeric: tabular-nums; }
```

### Flex Child Overflow

```css
/* Required on every flex child that may contain long text */
.flex-child { min-width: 0; }
```

### Responsive Table Patterns

```css
/* Horizontal scroll wrapper on mobile */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Alternative: card view on mobile */
@media (max-width: 640px) {
  .responsive-table thead { display: none; }
  .responsive-table tr {
    display: block;
    padding: 1rem;
    border-bottom: 1px solid var(--border-subtle);
  }
  .responsive-table td {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
  }
  .responsive-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-secondary);
  }
}
```

**Rules:**
- Always add `min-width: 0` on flex children.
- Test with extreme data from `stress-test.mjs` (long strings, huge numbers,
  thousands of rows, Unicode edge cases, RTL text).
- Use `tabular-nums` for any column of numbers.
- Provide a responsive fallback for tables: horizontal scroll or card layout.
- Add `title` attributes on truncated text for hover reveal.

---

## 5 · Populated State (Happy Path)

```html
<ul class="project-list" role="list">
  <li class="project-card">
    <h3 class="project-name">Acme Dashboard</h3>
    <p class="project-desc line-clamp-2">Real-time analytics…</p>
    <div class="project-meta">
      <span class="numeric">12 tasks</span>
      <time datetime="2025-01-15">Jan 15</time>
    </div>
  </li>
  <!-- more items -->
</ul>
```

**Rules:**
- Consistent spacing using the 4px-base spacing scale.
- Proper visual alignment — text baselines, icon optical alignment.
- Responsive: stack on mobile, grid on tablet+.
- Pagination or virtualization for lists exceeding 50 items.
- Use `role="list"` when Safari VoiceOver list semantics would otherwise be
  stripped by `list-style: none`.

---

## Integration Pattern

Every data-fetching component should follow this control flow:

```
┌──────────┐     fetch      ┌──────────┐
│ Loading  │ ──────────────▶│ Success? │
│ skeleton │                └────┬─────┘
└──────────┘                     │
                          yes ───┤──── no
                          ▼      │      ▼
                   ┌──────────┐  │ ┌──────────┐
                   │items > 0?│  │ │  Error   │
                   └────┬─────┘  │ │  banner  │
                   yes──┤──no    │ └──────────┘
                   ▼    │  ▼     │
             ┌─────────┐│┌──────────┐
             │Populated│││  Empty   │
             │  list   │││  state   │
             └─────────┘│└──────────┘
                        │
              Overflow guards applied
              across ALL text / tables
```
