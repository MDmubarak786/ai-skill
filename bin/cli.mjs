#!/usr/bin/env node
// ============================================================================
// bin/cli.mjs — Vanguard UI Command Line Interface
// Dispatcher for init, audit, extract, and cad subcommands.
// ============================================================================

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, writeFileSync, readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const SKILLS_DIR = resolve(ROOT_DIR, "skills", "vanguard-ui");
const SCRIPTS_DIR = resolve(SKILLS_DIR, "scripts");

const pkg = JSON.parse(readFileSync(resolve(ROOT_DIR, "package.json"), "utf-8"));

function printHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ██╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ██╗   ██╗██╗                   ║
║   ██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██║                   ║
║   ██║   ██║███████║██╔██╗ ██║██║  ███╗██║   ██║██║                   ║
║   ╚██╗ ██╔╝██╔══██║██║╚██╗██║██║   ██║██║   ██║██║                   ║
║    ╚████╔╝ ██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║                   ║
║     ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝                   ║
║               VANGUARD UI — CLI v${pkg.version}                              ║
╚══════════════════════════════════════════════════════════════════════╝

The definitive anti-AI-slop Frontend & SaaS UI Engineering Toolkit.

COMMANDS:
  init                     Scaffold DESIGN.md & tokens.css with OKLCH in cwd
  audit <path> [--json]    Scan .tsx, .jsx, .html, .css for AI UI slop (0-100)
  extract <url|file>       Extract colors & tokens from live URL or local HTML/CSS
  cad <component-path>     Generate Apple-style technical blueprint (.cad.html)
  stress [--output <path>] Generate 5-state edge-case test fixtures
  prompt [landing|comp|audit|multi] Print battle-tested precision AI prompts

OPTIONS:
  -v, --version            Display installed version
  -h, --help               Display this help message

EXAMPLES:
  $ vanguard-ui init
  $ vanguard-ui audit src/components/Hero.tsx
  $ vanguard-ui audit src/components/Hero.tsx --json
  $ vanguard-ui extract https://stripe.com
  $ vanguard-ui cad src/components/MetricCard.tsx
  $ vanguard-ui stress
`);
}

function handlePrompt(type) {
  const landingPrompt = `
🎯 [PRECISION PROMPT: ZERO-SLOP SAAS LANDING PAGE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Act as a Principal Frontend Architect and Design Technologist. Build a modern, high-conversion landing page for [PRODUCT_NAME].

Follow the Vanguard UI and Impeccable engineering standards:
1. DESIGN SYSTEM & TOKENS:
   - Declare all colors in OKLCH on :root (--bg-surface, --text-primary, --accent-primary).
   - Use an intentional palette: Dark slate graphite neutrals with a single high-contrast cobalt/amber accent.
   - Fluid typography with clamp(), system font stack, and tabular-nums on all metrics.
2. HARD NEGATIVE CONSTRAINTS (STRICTLY FORBIDDEN):
   - NO purple-to-blue AI gradients.
   - NO nested cards (cards inside cards). Use clean borders or divide-y layouts.
   - NO 48x48 rounded icon-tiles stacked above headings.
   - NO "transition: all" — animate ONLY compositor properties (opacity, transform) <= 200ms ease-out.
   - NO emojis as icons — use sharp, minimalist inline SVGs with aria-hidden="true".
   - NO skipped heading tags (strict h1 -> h2 -> h3 outline).
3. RESPONSIVE & ACCESSIBILITY GUARANTEES:
   - Full keyboard navigation with distinct :focus-visible rings (2px outline, 2px offset).
   - All flex/grid children must carry "min-width: 0" and "overflow-wrap: break-word".
   - WCAG 2.2 AA contrast minimums (>= 4.5:1 body, >= 3:1 display).
   - Guard animations with @media (prefers-reduced-motion: reduce).
4. VERIFICATION:
   - Verify that "vanguard-ui audit" scores 100/100 (Grade S) and "impeccable detect" reports 0 anti-patterns.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const compPrompt = `
🎯 [PRECISION PROMPT: BULLETPROOF 5-STATE COMPONENT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Act as a Senior UI Systems Engineer. Build a production-ready, fully accessible [COMPONENT_NAME].

The component MUST implement and render all 5 SaaS UI States:
1. LOADING: Geometry-matched skeleton with subtle shimmer, preserving exact layout dimensions (no CLS).
2. EMPTY: Helpful zero-state illustration or icon, empathetic copy, and an actionable primary CTA button.
3. ERROR: Non-destructive inline error banner with error explanation, retry button callback, and error code.
4. OVERFLOW: Test against 120-character strings and extreme numbers using min-w-0, truncate, and tabular-nums.
5. POPULATED: Rich interactive view with hover, active (scale 0.98), focus-visible, and disabled states.

REQUIREMENTS:
- Semantic OKLCH tokens, ARIA attributes (role, aria-live, aria-busy, aria-label).
- Include an interactive state-switcher in development mode so all 5 states can be tested.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const auditPrompt = `
🎯 [PRECISION PROMPT: ANTI-SLOP SURGICAL REFACTOR]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Act as a Staff Design Technologist specializing in anti-slop refactoring. Audit and refactor the following UI:
[PASTE_CODE_OR_PATH]

PIPELINE:
1. Replace raw hex/rgb values with semantic OKLCH tokens.
2. Flatten nested cards into unified containers or divider layouts.
3. Eliminate "transition: all" — replace with <= 200ms ease-out transform/opacity transitions.
4. Fix contrast deficiencies to exceed WCAG 2.2 AA (>= 4.5:1).
5. Add missing :focus-visible, min-w-0 layout guards, and tabular-nums.
6. Verify output passes "vanguard-ui audit" with 100/100 Grade S.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const multiPrompt = `
🎯 [PRECISION PROMPT: MULTI-SKILL COMPOSITE ORCHESTRATION]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Build a flagship [PROJECT_NAME] utilizing our active AGY design skills:
1. Vanguard UI: Enforce the 4-Gate Workflow and 100/100 Grade S audit floor.
2. UI/UX Pro Max: Query design profiles for color palette and font pairing.
3. Emil Animate: Cap transitions at 200ms ease-out (cubic-bezier(0.16, 1, 0.3, 1)) with active scale(0.98).
4. Impeccable: Zero card nesting, zero purple AI gradients, untracked sentence-case labels.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  if (type === "landing" || type === "page") {
    console.log(landingPrompt);
  } else if (type === "comp" || type === "component") {
    console.log(compPrompt);
  } else if (type === "audit" || type === "refactor") {
    console.log(auditPrompt);
  } else if (type === "multi" || type === "ecosystem") {
    console.log(multiPrompt);
  } else {
    console.log("\n🚀 VANGUARD UI — PRECISION PROMPTING TEMPLATES\n" +
      "Select a template to copy or use in your AI prompts:\n" +
      landingPrompt + "\n" +
      compPrompt + "\n" +
      auditPrompt + "\n" +
      multiPrompt + "\n\n" +
      "💡 Pro-tip: Run 'vanguard-ui prompt landing' or 'vanguard-ui prompt comp' to view individual prompts.\n"
    );
  }
}

async function handleInit() {
  const designPath = resolve(process.cwd(), "DESIGN.md");
  const tokensPath = resolve(process.cwd(), "tokens.css");

  console.log("🚀 Initializing Vanguard UI Design Tokens in current project...");

  const defaultTokensCss = `/**
 * tokens.css — Vanguard UI Design Tokens
 * OKLCH Perceptually Uniform Color Space
 */

:root {
  /* Surfaces */
  --bg-surface: oklch(0.985 0.002 247.5);
  --bg-surface-raised: oklch(1 0 0);
  --bg-surface-overlay: oklch(0.96 0.005 247.5);

  /* Typography */
  --text-primary: oklch(0.145 0.005 247.5);
  --text-secondary: oklch(0.45 0.01 247.5);
  --text-tertiary: oklch(0.65 0.01 247.5);

  /* Borders */
  --border-subtle: oklch(0.88 0.005 247.5);
  --border-strong: oklch(0.75 0.01 247.5);

  /* Brand / Accent */
  --accent-primary: oklch(0.55 0.18 250);
  --accent-primary-hover: oklch(0.50 0.18 250);
  --text-on-accent: oklch(0.99 0 0);

  /* Font Stacks */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;

  /* Geometry */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.08);
  --shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.1);

  /* Motion & Physics */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in: cubic-bezier(0.55, 0, 1, 0.45);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
}

.dark,
@media (prefers-color-scheme: dark) {
  :root {
    --bg-surface: oklch(0.145 0.005 247.5);
    --bg-surface-raised: oklch(0.20 0.005 247.5);
    --bg-surface-overlay: oklch(0.25 0.005 247.5);
    --text-primary: oklch(0.985 0.002 247.5);
    --text-secondary: oklch(0.65 0.01 247.5);
    --text-tertiary: oklch(0.45 0.01 247.5);
    --border-subtle: oklch(0.25 0.005 247.5);
    --border-strong: oklch(0.35 0.005 247.5);
    --accent-primary: oklch(0.65 0.18 250);
    --accent-primary-hover: oklch(0.70 0.18 250);
  }
}
`;

  const defaultDesignMd = `# DESIGN.md — Project Design System Guidelines

## Core Philosophy
This project strictly enforces the **Vanguard UI Anti-AI-Slop** standard:
1. **No arbitrary hardcoded hex values** in component code. Use \`var(--...)\` tokens.
2. **5-State Completeness**: loading, empty, error, overflow, populated.
3. **Motion Physics**: Under 300ms, \`cubic-bezier(0.22, 1, 0.36, 1)\`, transform/opacity only.
4. **Data Layout**: Enforce \`tabular-nums\` on all metrics and \`min-w-0\` on flex children.

## Design Tokens
Import \`tokens.css\` at your application root (e.g., \`layout.tsx\` or \`index.css\`).
`;

  if (!existsSync(tokensPath)) {
    writeFileSync(tokensPath, defaultTokensCss, "utf-8");
    console.log("✓ Created tokens.css");
  } else {
    console.log("ℹ tokens.css already exists, skipping overwrite.");
  }

  if (!existsSync(designPath)) {
    writeFileSync(designPath, defaultDesignMd, "utf-8");
    console.log("✓ Created DESIGN.md");
  } else {
    console.log("ℹ DESIGN.md already exists, skipping overwrite.");
  }

  console.log("\n✨ Initialization complete. Ready to build anti-slop interfaces.");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "-h" || command === "--help" || command === "help") {
    printHelp();
    process.exit(0);
  }

  if (command === "-v" || command === "--version") {
    console.log(`vanguard-ui v${pkg.version}`);
    process.exit(0);
  }

  switch (command) {
    case "init": {
      await handleInit();
      break;
    }

    case "audit": {
      const target = args[1];
      if (!target) {
        console.error("Error: Please provide a file path to audit.");
        console.error("Usage: vanguard-ui audit <file-path> [--json]");
        process.exit(1);
      }
      // Forward remaining args to slop-audit.mjs
      process.argv = [process.argv[0], resolve(SCRIPTS_DIR, "slop-audit.mjs"), ...args.slice(1)];
      await import(resolve(SCRIPTS_DIR, "slop-audit.mjs"));
      break;
    }

    case "extract": {
      const target = args[1];
      if (!target) {
        console.error("Error: Please provide a URL or local file path to extract tokens from.");
        console.error("Usage: vanguard-ui extract <url-or-path> [--output-dir <dir>]");
        process.exit(1);
      }
      process.argv = [process.argv[0], resolve(SCRIPTS_DIR, "extract-tokens.mjs"), ...args.slice(1)];
      await import(resolve(SCRIPTS_DIR, "extract-tokens.mjs"));
      break;
    }

    case "cad": {
      const target = args[1];
      if (!target) {
        console.error("Error: Please provide a component file path to generate CAD blueprint for.");
        console.error("Usage: vanguard-ui cad <component-path> [--output <path>]");
        process.exit(1);
      }
      process.argv = [process.argv[0], resolve(SCRIPTS_DIR, "generate-cad.mjs"), ...args.slice(1)];
      await import(resolve(SCRIPTS_DIR, "generate-cad.mjs"));
      break;
    }

    case "stress": {
      process.argv = [process.argv[0], resolve(SCRIPTS_DIR, "stress-test.mjs"), ...args.slice(1)];
      await import(resolve(SCRIPTS_DIR, "stress-test.mjs"));
      break;
    }

    case "prompt": {
      const type = (args[1] || "all").toLowerCase();
      handlePrompt(type);
      break;
    }

    default: {
      console.error(`Unknown command: "${command}"\n`);
      printHelp();
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
