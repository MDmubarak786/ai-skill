#!/usr/bin/env node
// ============================================================================
// slop-audit.mjs — Vanguard UI Slop Audit Engine
// Zero-dependency static analyzer for AI-generated UI slop.
// Scans .tsx, .jsx, .html, .css, .vue, .svelte files.
// Usage: node slop-audit.mjs <file-path> [--json]
// ============================================================================

import { readFileSync } from "node:fs";
import { extname, basename, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_EXTS = new Set([".tsx", ".jsx", ".html", ".css", ".vue", ".svelte"]);

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

const GRADE_THRESHOLDS = [
  [100, "S"],
  [90, "A"],
  [75, "B"],
  [50, "C"],
  [0, "F"],
];

/** Known AI-slop hex values (lowercase for comparison) */
const AI_SLOP_HEX = ["#8b5cf6", "#6366f1", "#a855f7", "#7c3aed", "#4f46e5"];

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const isTTY = process.stdout.isTTY;

const ANSI = {
  reset: isTTY ? "\x1b[0m" : "",
  bold: isTTY ? "\x1b[1m" : "",
  dim: isTTY ? "\x1b[2m" : "",
  red: isTTY ? "\x1b[31m" : "",
  green: isTTY ? "\x1b[32m" : "",
  yellow: isTTY ? "\x1b[33m" : "",
  blue: isTTY ? "\x1b[34m" : "",
  magenta: isTTY ? "\x1b[35m" : "",
  cyan: isTTY ? "\x1b[36m" : "",
  white: isTTY ? "\x1b[37m" : "",
  bgRed: isTTY ? "\x1b[41m" : "",
  bgGreen: isTTY ? "\x1b[42m" : "",
};

function severityColor(severity) {
  if (severity === "critical") return ANSI.red;
  if (severity === "warning") return ANSI.yellow;
  return ANSI.blue;
}

function gradeColor(grade) {
  if (grade === "S" || grade === "A") return ANSI.green;
  if (grade === "B") return ANSI.yellow;
  return ANSI.red;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Find all 1-indexed line numbers where `regex` matches. */
function findLines(lines, regex) {
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) hits.push(i + 1);
  }
  return hits;
}

/** Find all 1-indexed line numbers containing `str` (case-insensitive). */
function findLinesStr(lines, str) {
  const lower = str.toLowerCase();
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(lower)) hits.push(i + 1);
  }
  return hits;
}

/** Calculate the grade from a score. */
function gradeFromScore(score) {
  for (const [threshold, grade] of GRADE_THRESHOLDS) {
    if (score >= threshold) return grade;
  }
  return "F";
}

// ---------------------------------------------------------------------------
// Rule definitions — each returns a violation object or null
// ---------------------------------------------------------------------------

// Category 1: Color & Token Slop ............................................

function ruleCol001({ lines }) {
  const re = /(from|via)-(purple|indigo|violet)-/;
  const hits = findLines(lines, re);
  if (!hits.length) return null;
  return {
    id: "COL-001",
    name: "AI purple/indigo gradient pattern",
    category: "color",
    severity: "critical",
    deduction: 8,
    lines: hits,
    message: "AI purple/indigo gradient detected — replace with brand palette",
    evidence: "from-/via- purple|indigo|violet",
  };
}

function ruleCol002({ lines }) {
  const re = /(bg|text|border|ring|shadow|from|via|to)-\[#[0-9a-fA-F]{3,8}\]/;
  const hits = findLines(lines, re);
  if (!hits.length) return null;
  return {
    id: "COL-002",
    name: "Hardcoded hex in Tailwind arbitrary value",
    category: "color",
    severity: "critical",
    deduction: 5,
    lines: hits,
    message: "Hardcoded hex in arbitrary Tailwind value — use a design token / CSS variable",
    evidence: "bg-[#...] / text-[#...] etc.",
  };
}

function ruleCol003({ lines, content }) {
  // Detect co-occurrence of #000000 and #ffffff (or shorthand) suggesting
  // pure black-on-white or white-on-black without surface layering.
  const hasBlack = /(?:#000000|#000\b)/.test(content);
  const hasWhite = /(?:#ffffff|#fff\b)/i.test(content);
  if (!(hasBlack && hasWhite)) return null;
  const hits = [
    ...findLines(lines, /(?:#000000|#000\b)/),
    ...findLines(lines, /(?:#ffffff|#fff\b)/i),
  ];
  const unique = [...new Set(hits)].sort((a, b) => a - b);
  return {
    id: "COL-003",
    name: "Pure black-on-white / white-on-black",
    category: "color",
    severity: "warning",
    deduction: 3,
    lines: unique,
    message: "Pure #000/#fff pair detected — add surface tokens for depth",
    evidence: "#000000 + #ffffff co-occurring",
  };
}

function ruleCol004({ lines }) {
  const re = new RegExp(AI_SLOP_HEX.join("|"), "i");
  const hits = findLines(lines, re);
  if (!hits.length) return null;
  return {
    id: "COL-004",
    name: "Known AI-slop hex value",
    category: "color",
    severity: "critical",
    deduction: 8,
    lines: hits,
    message: "Known AI-generated hex color — replace with intentional palette",
    evidence: AI_SLOP_HEX.join(", "),
  };
}

function ruleCol005({ lines }) {
  const gradRe = /linear-gradient/i;
  const gradLines = findLines(lines, gradRe);
  if (!gradLines.length) return null;
  const hexRe = new RegExp(AI_SLOP_HEX.join("|"), "i");
  const hits = gradLines.filter((ln) => hexRe.test(lines[ln - 1]));
  if (!hits.length) return null;
  return {
    id: "COL-005",
    name: "Gradient with AI purple/indigo hex",
    category: "color",
    severity: "critical",
    deduction: 6,
    lines: hits,
    message: "linear-gradient contains AI-slop hex — use brand gradient tokens",
    evidence: "linear-gradient + AI hex",
  };
}

// Category 2: Typography & Numeric Slop .....................................

function ruleTyp001({ lines, content }) {
  const hasFontSans = /\bfont-sans\b/.test(content);
  if (!hasFontSans) return null;
  const hasFontVar = /--font-/.test(content);
  if (hasFontVar) return null;
  const hits = findLines(lines, /\bfont-sans\b/);
  return {
    id: "TYP-001",
    name: "Unconfigured default font-sans",
    category: "typography",
    severity: "warning",
    deduction: 3,
    lines: hits,
    message: "font-sans used without a custom --font- variable — configure your font stack",
    evidence: "font-sans without --font-*",
  };
}

function ruleTyp002({ lines, content }) {
  // Look for currency symbols, percentages, .00 patterns, or <td> with numeric content
  const numericPatterns = /(\$|€|£|¥|%|\.00\b|\b\d{1,3}(,\d{3})+)/;
  const tdNumeric = /<td[^>]*>[^<]*\d/;
  const hasNumeric = numericPatterns.test(content) || tdNumeric.test(content);
  if (!hasNumeric) return null;
  const hasTabular = /tabular-nums|font-variant-numeric/.test(content);
  if (hasTabular) return null;
  const hits = [
    ...findLines(lines, numericPatterns),
    ...findLines(lines, tdNumeric),
  ];
  const unique = [...new Set(hits)].sort((a, b) => a - b);
  if (!unique.length) return null;
  return {
    id: "TYP-002",
    name: "Currency/metrics missing tabular-nums",
    category: "typography",
    severity: "warning",
    deduction: 3,
    lines: unique,
    message: "Numeric data displayed without tabular-nums — numbers will shift on update",
    evidence: "$ / € / % / .00 / <td> numeric without tabular-nums",
  };
}

function ruleTyp003({ lines }) {
  // Detect text-4xl or larger without tracking-tight/tighter on same line
  const largeTxtRe = /text-(4xl|5xl|6xl|7xl|8xl|9xl)/;
  const trackingRe = /tracking-tight|tracking-tighter/;
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (largeTxtRe.test(lines[i]) && !trackingRe.test(lines[i])) {
      hits.push(i + 1);
    }
  }
  if (!hits.length) return null;
  return {
    id: "TYP-003",
    name: "Large heading missing tracking-tight",
    category: "typography",
    severity: "warning",
    deduction: 2,
    lines: hits,
    message: "Display-size text without tracking-tight — letter spacing will look loose",
    evidence: "text-4xl+ without tracking-tight",
  };
}

function ruleTyp004({ lines }) {
  // Detect h1/h2 elements or text-3xl+ without text-balance / text-wrap: balance
  const headingRe = /<h[12][\s>]|text-(3xl|4xl|5xl|6xl|7xl|8xl|9xl)/;
  const balanceRe = /text-balance|text-wrap:\s*balance/;
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (headingRe.test(lines[i]) && !balanceRe.test(lines[i])) {
      hits.push(i + 1);
    }
  }
  if (!hits.length) return null;
  return {
    id: "TYP-004",
    name: "Long heading missing text-balance",
    category: "typography",
    severity: "info",
    deduction: 1,
    lines: hits,
    message: "Heading could use text-balance for even line wrapping",
    evidence: "h1/h2 or text-3xl+ without text-balance",
  };
}

function ruleTyp005({ lines }) {
  // Font sizes larger than text-4xl without leading-tight / leading-none / leading-snug
  const largeTxtRe = /text-(5xl|6xl|7xl|8xl|9xl)/;
  const leadingRe = /leading-(tight|none|snug)/;
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (largeTxtRe.test(lines[i]) && !leadingRe.test(lines[i])) {
      hits.push(i + 1);
    }
  }
  if (!hits.length) return null;
  return {
    id: "TYP-005",
    name: "Large text missing leading-tight",
    category: "typography",
    severity: "warning",
    deduction: 2,
    lines: hits,
    message: "Display text larger than text-4xl without tight line-height — will look airy",
    evidence: "text-5xl+ without leading-tight/none/snug",
  };
}

// Category 3: Layout & Container Slop .......................................

function ruleLay001({ content }) {
  // Detect nested elements where BOTH have rounded- AND (border or shadow) AND p-
  // We scan for JSX/HTML blocks that match the card pattern, then check nesting.
  const cardPatternRe = /rounded-[^\s"']*[\s\S]{0,200}?(?:border|shadow)[\s\S]{0,200}?p-\d|p-\d[\s\S]{0,200}?(?:border|shadow)[\s\S]{0,200}?rounded-/;

  // Simpler approach: find lines that look like a "card" (rounded + border/shadow + padding)
  // then check if there's another such pattern nested inside.
  const cardClassRe = /className=["'][^"']*rounded-[^"']*(?:border|shadow)[^"']*p-\d[^"']*["']|className=["'][^"']*p-\d[^"']*(?:border|shadow)[^"']*rounded-[^"']*["']|class=["'][^"']*rounded-[^"']*(?:border|shadow)[^"']*p-\d[^"']*["']|class=["'][^"']*p-\d[^"']*(?:border|shadow)[^"']*rounded-[^"']*["']/g;

  const matches = [...content.matchAll(cardClassRe)];
  if (matches.length < 2) return null;

  // Report the line numbers of all card-pattern matches
  const lines = content.split("\n");
  const hits = [];
  for (const m of matches) {
    const before = content.slice(0, m.index);
    const lineNum = before.split("\n").length;
    hits.push(lineNum);
  }

  return {
    id: "LAY-001",
    name: "Cards-inside-cards",
    category: "layout",
    severity: "critical",
    deduction: 6,
    lines: hits,
    message: "Nested card patterns detected (rounded + border/shadow + padding) — flatten the hierarchy",
    evidence: "Multiple elements with rounded + border/shadow + p-*",
  };
}

function ruleLay002({ content }) {
  // Detect 3+ repeated sibling patterns of icon-tile-above-heading:
  // small icon wrapper (w-10 h-10 rounded or w-12 h-12 rounded) near h3/h4
  const iconTileRe = /(?:w-(?:10|12)\s[^"']*h-(?:10|12)\s[^"']*rounded|rounded[^"']*w-(?:10|12)\s[^"']*h-(?:10|12))/g;
  const iconMatches = [...content.matchAll(iconTileRe)];
  if (iconMatches.length < 3) return null;

  const hasHeading = /<h[34][\s>]/i.test(content);
  if (!hasHeading) return null;

  const lines = content.split("\n");
  const hits = [];
  for (const m of iconMatches) {
    const before = content.slice(0, m.index);
    hits.push(before.split("\n").length);
  }

  return {
    id: "LAY-002",
    name: "Icon-tile-above-heading cliché",
    category: "layout",
    severity: "warning",
    deduction: 4,
    lines: hits,
    message: "Repeated icon-tile + heading pattern — consider a more distinctive layout",
    evidence: "3+ icon tiles (w-10/12 h-10/12 rounded) near h3/h4",
  };
}

function ruleLay003({ lines, ext }) {
  // Only applies to markup elements (JSX/TSX/HTML) containing flex/grid classes or inline style
  const flexGridRe = /class(?:Name)?=["'][^"']*\b(flex|grid)\b[^"']*["']|style=["'][^"']*display:\s*(flex|grid)/i;
  const safeguardRe = /min-w-0|truncate|overflow-hidden|overflow:\s*hidden/;
  const hits = [];

  let inStyleBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/<style\b/i.test(line)) inStyleBlock = true;
    if (/<\/style>/i.test(line)) { inStyleBlock = false; continue; }
    if (inStyleBlock && ext === ".html") continue;

    if (flexGridRe.test(line) && !safeguardRe.test(line)) {
      // Check the next few lines (children) for text content without safeguards
      let hasTextChild = false;
      let childSafe = false;
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        if (/text-|<(p|span|h[1-6])\b|>[^<]+</.test(lines[j])) {
          hasTextChild = true;
        }
        if (safeguardRe.test(lines[j])) {
          childSafe = true;
        }
      }
      if (hasTextChild && !childSafe) {
        hits.push(i + 1);
      }
    }
  }
  if (!hits.length) return null;
  return {
    id: "LAY-003",
    name: "Flex/grid text child missing min-w-0",
    category: "layout",
    severity: "warning",
    deduction: 3,
    lines: hits,
    message: "Text inside flex/grid without min-w-0 or truncate — text may overflow",
    evidence: "flex/grid without overflow protection",
  };
}

function ruleLay004({ lines, content }) {
  const hasVH = /h-screen|100vh/.test(content);
  if (!hasVH) return null;
  const hasDVH = /100dvh/.test(content);
  if (hasDVH) return null;
  const hits = findLines(lines, /h-screen|100vh/);
  return {
    id: "LAY-004",
    name: "100vh without 100dvh fallback",
    category: "layout",
    severity: "warning",
    deduction: 2,
    lines: hits,
    message: "h-screen / 100vh used without 100dvh — broken on mobile Safari",
    evidence: "100vh without 100dvh",
  };
}

function ruleLay005({ lines }) {
  // Fixed-width with arbitrary pixel values without responsive breakpoint variants
  const fixedRe = /w-\[\d+px\]/;
  const responsiveRe = /(sm|md|lg|xl|2xl):w-/;
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (fixedRe.test(lines[i]) && !responsiveRe.test(lines[i])) {
      hits.push(i + 1);
    }
  }
  if (!hits.length) return null;
  return {
    id: "LAY-005",
    name: "Fixed-width without responsive variant",
    category: "layout",
    severity: "warning",
    deduction: 2,
    lines: hits,
    message: "Hardcoded pixel width without responsive breakpoints — will break on small screens",
    evidence: "w-[Npx] without sm:/md:/lg: variants",
  };
}

function ruleLay006({ lines }) {
  // Count nesting depth of styled divs (those with className containing styling classes)
  const openRe = /<(div|section|article|aside|main)\b[^>]*class(Name)?=/gi;
  const selfCloseRe = /<(div|section|article|aside|main)\b[^>]*\/>/gi;
  const closeRe = /<\/(div|section|article|aside|main)>/gi;
  let depth = 0;
  let maxDepth = 0;
  const deepLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Count opens, self-closing, and closes in the line
    const opens = (line.match(openRe) || []).length;
    const selfCloses = (line.match(selfCloseRe) || []).length;
    const closes = (line.match(closeRe) || []).length;
    const netOpens = Math.max(0, opens - selfCloses);
    depth += netOpens;
    if (depth > maxDepth) maxDepth = depth;
    if (depth > 4 && netOpens > 0) {
      deepLines.push(i + 1);
    }
    depth -= closes;
    if (depth < 0) depth = 0;
  }

  if (!deepLines.length) return null;
  return {
    id: "LAY-006",
    name: "Excessive nesting depth",
    category: "layout",
    severity: "warning",
    deduction: 2,
    lines: deepLines,
    message: `Styled element nesting exceeds 4 levels (max: ${maxDepth}) — flatten with composition`,
    evidence: `Max depth: ${maxDepth}`,
  };
}

// Category 4: Motion & Interaction Slop .....................................

function ruleMot001({ lines }) {
  const re = /\btransition-all\b/;
  const hits = findLines(lines, re);
  if (!hits.length) return null;
  return {
    id: "MOT-001",
    name: "transition-all on UI element",
    category: "motion",
    severity: "critical",
    deduction: 5,
    lines: hits,
    message: "transition-all causes unnecessary layout thrash — transition specific properties",
    evidence: "transition-all",
  };
}

function ruleMot002({ lines }) {
  // ease-in but NOT ease-in-out
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (/\bease-in\b/.test(lines[i]) && !/ease-in-out/.test(lines[i])) {
      hits.push(i + 1);
    }
  }
  if (!hits.length) return null;
  return {
    id: "MOT-002",
    name: "ease-in on entering element",
    category: "motion",
    severity: "warning",
    deduction: 3,
    lines: hits,
    message: "ease-in feels sluggish for enter transitions — use ease-out or ease-in-out",
    evidence: "ease-in (not ease-in-out)",
  };
}

function ruleMot003({ lines }) {
  const re = /duration-(500|700|1000|[4-9]\d\d|[1-9]\d{3,})/;
  const hits = findLines(lines, re);
  if (!hits.length) return null;
  return {
    id: "MOT-003",
    name: "Slow duration on interactive control",
    category: "motion",
    severity: "warning",
    deduction: 3,
    lines: hits,
    message: "Duration >300ms on interactive elements feels laggy — keep under 300ms",
    evidence: "duration-500 / duration-700 / etc.",
  };
}

function ruleMot004({ content, lines }) {
  const hasTransition = /\btransition\b|\banimate-/.test(content);
  if (!hasTransition) return null;
  const hasReducedMotion = /motion-reduce|prefers-reduced-motion/.test(content);
  if (hasReducedMotion) return null;
  const hits = [
    ...findLines(lines, /\btransition\b/),
    ...findLines(lines, /\banimate-/),
  ];
  const unique = [...new Set(hits)].sort((a, b) => a - b);
  return {
    id: "MOT-004",
    name: "Missing prefers-reduced-motion",
    category: "motion",
    severity: "warning",
    deduction: 3,
    lines: unique,
    message: "Animations present without prefers-reduced-motion — accessibility risk",
    evidence: "transition / animate-* without motion-reduce",
  };
}

function ruleMot005({ lines }) {
  // Detect transition- with non-compositor properties
  const badProps = ["width", "height", "top", "left", "margin", "padding"];
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/transition/.test(line)) {
      for (const prop of badProps) {
        // Match transition-[width] or CSS transition: width, etc.
        const propRe = new RegExp(`transition[^;]*${prop}|transition-\\[.*${prop}`, "i");
        if (propRe.test(line)) {
          hits.push(i + 1);
          break;
        }
      }
    }
  }
  if (!hits.length) return null;
  return {
    id: "MOT-005",
    name: "Animating non-compositor property",
    category: "motion",
    severity: "warning",
    deduction: 2,
    lines: hits,
    message: "Transitioning width/height/top/left/margin/padding causes layout recalc — use transform/opacity",
    evidence: "transition on non-compositor property",
  };
}

// Category 5: State Completeness ............................................

function ruleSta001({ lines }) {
  // Detect .map( without a length check / ternary / ?? / || nearby
  const mapRe = /\.map\s*\(/;
  const guardRe = /\.length|[?]{2}|\|\||&&\s*\w+\.map|ternary|\?\s*.*\.map/;
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (mapRe.test(lines[i])) {
      // Check the current line and preceding 5 lines for a length / presence guard
      const context = [
        lines[i - 5] || "",
        lines[i - 4] || "",
        lines[i - 3] || "",
        lines[i - 2] || "",
        lines[i - 1] || "",
        lines[i],
      ].join(" ");
      if (!guardRe.test(context)) {
        hits.push(i + 1);
      }
    }
  }
  if (!hits.length) return null;
  return {
    id: "STA-001",
    name: ".map() without empty-array fallback",
    category: "state",
    severity: "warning",
    deduction: 4,
    lines: hits,
    message: ".map() called without checking for empty array — renders nothing silently",
    evidence: ".map( without length / ?? / || guard",
  };
}

function ruleSta002({ content, lines }) {
  // Detect useEffect+fetch or useSWR or useQuery without loading state
  const hasFetch =
    /(useEffect[\s\S]{0,500}fetch\s*\()/.test(content) ||
    /\buseSWR\b/.test(content) ||
    /\buseQuery\b/.test(content);
  if (!hasFetch) return null;

  const hasLoading = /isLoading|loading|skeleton|Skeleton|isPending|isFetching/.test(content);
  if (hasLoading) return null;

  const hits = [
    ...findLines(lines, /fetch\s*\(/),
    ...findLines(lines, /\buseSWR\b/),
    ...findLines(lines, /\buseQuery\b/),
  ];
  const unique = [...new Set(hits)].sort((a, b) => a - b);
  if (!unique.length) return null;

  return {
    id: "STA-002",
    name: "Data-fetching without loading state",
    category: "state",
    severity: "warning",
    deduction: 3,
    lines: unique,
    message: "Fetching data without a loading/skeleton state — users see a blank flash",
    evidence: "fetch / useSWR / useQuery without isLoading / Skeleton",
  };
}

function ruleSta003({ content, lines }) {
  // Detect fetch/async without catch or error state
  const hasAsync = /\bfetch\s*\(|\basync\b/.test(content);
  if (!hasAsync) return null;
  const hasErrorHandling = /\.catch\b|try\s*\{|onError|isError|error\s*[=:]|Error\b/.test(content);
  if (hasErrorHandling) return null;

  const hits = [
    ...findLines(lines, /\bfetch\s*\(/),
    ...findLines(lines, /\basync\b/),
  ];
  const unique = [...new Set(hits)].sort((a, b) => a - b);
  if (!unique.length) return null;

  return {
    id: "STA-003",
    name: "Missing error handling",
    category: "state",
    severity: "warning",
    deduction: 3,
    lines: unique,
    message: "Async operation without error handling — failures will go unnoticed",
    evidence: "fetch / async without .catch / try-catch / error state",
  };
}

// Category 6: Accessibility .................................................

function ruleAcc001({ lines }) {
  // <div onClick or <span onClick without role, tabIndex, onKeyDown/onKeyUp
  const clickRe = /<(div|span)\b[^>]*onClick/;
  const safeRe = /role=|tabIndex|onKeyDown|onKeyUp/;
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (clickRe.test(lines[i]) && !safeRe.test(lines[i])) {
      hits.push(i + 1);
    }
  }
  if (!hits.length) return null;
  return {
    id: "ACC-001",
    name: "Non-interactive element with onClick",
    category: "accessibility",
    severity: "critical",
    deduction: 5,
    lines: hits,
    message: "<div/span onClick> without role, tabIndex, or keyboard handler — inaccessible",
    evidence: "<div onClick / <span onClick without ARIA",
  };
}

function ruleAcc002({ lines, content }) {
  // Check for Tailwind hover: without focus-visible:
  const hasTwHover = /(?:^|[^\w-])hover:/.test(content);
  const hasTwFocus = /(?:^|[^\w-])focus(?:-visible)?:/.test(content);
  if (hasTwHover && !hasTwFocus) {
    const hits = findLines(lines, /(?:^|[^\w-])hover:/);
    return {
      id: "ACC-002",
      name: "hover: without focus-visible:",
      category: "accessibility",
      severity: "warning",
      deduction: 2,
      lines: hits,
      message: "Hover styles without focus-visible — keyboard users cannot see active state",
      evidence: "hover: without focus-visible: / focus:",
    };
  }

  // Check for CSS :hover without :focus-visible / :focus
  const hasCssHover = /:hover\b/.test(content);
  const hasCssFocus = /:focus(?:-visible)?\b/.test(content);
  if (hasCssHover && !hasCssFocus && !hasTwFocus) {
    const hits = findLines(lines, /:hover\b/);
    return {
      id: "ACC-002",
      name: "hover: without focus-visible:",
      category: "accessibility",
      severity: "warning",
      deduction: 2,
      lines: hits,
      message: "Hover styles without focus-visible — keyboard users cannot see active state",
      evidence: ":hover without :focus-visible / :focus",
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// All rules registry
// ---------------------------------------------------------------------------

const ALL_RULES = [
  ruleCol001,
  ruleCol002,
  ruleCol003,
  ruleCol004,
  ruleCol005,
  ruleTyp001,
  ruleTyp002,
  ruleTyp003,
  ruleTyp004,
  ruleTyp005,
  ruleLay001,
  ruleLay002,
  ruleLay003,
  ruleLay004,
  ruleLay005,
  ruleLay006,
  ruleMot001,
  ruleMot002,
  ruleMot003,
  ruleMot004,
  ruleMot005,
  ruleSta001,
  ruleSta002,
  ruleSta003,
  ruleAcc001,
  ruleAcc002,
];

// ---------------------------------------------------------------------------
// Core engine
// ---------------------------------------------------------------------------

/**
 * Run the slop audit on a file.
 * @param {string} filePath — absolute or relative path to the source file
 * @returns {{ filePath: string, score: number, grade: string, violations: object[], categories: object }}
 */
export function runAudit(filePath) {
  const resolved = resolve(filePath);
  const ext = extname(resolved).toLowerCase();

  if (!SUPPORTED_EXTS.has(ext)) {
    return {
      filePath: resolved,
      score: 100,
      grade: "S",
      violations: [],
      categories: { color: [], typography: [], layout: [], motion: [], state: [], accessibility: [] },
      skipped: true,
    };
  }

  const content = readFileSync(resolved, "utf-8");
  const lines = content.split("\n");
  const ctx = { content, lines, filePath: resolved, ext };

  const violations = [];
  for (const ruleFn of ALL_RULES) {
    const v = ruleFn(ctx);
    if (v) violations.push(v);
  }

  // Sort violations: critical first, then warning, then info
  violations.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.id.localeCompare(b.id),
  );

  // Calculate score
  let score = 100;
  for (const v of violations) {
    score -= v.deduction;
  }
  score = Math.max(0, score);

  const grade = gradeFromScore(score);

  // Group by category
  const categories = {
    color: violations.filter((v) => v.category === "color"),
    typography: violations.filter((v) => v.category === "typography"),
    layout: violations.filter((v) => v.category === "layout"),
    motion: violations.filter((v) => v.category === "motion"),
    state: violations.filter((v) => v.category === "state"),
    accessibility: violations.filter((v) => v.category === "accessibility"),
  };

  return { filePath: resolved, score, grade, violations, categories };
}

// ---------------------------------------------------------------------------
// ASCII Scorecard Renderer
// ---------------------------------------------------------------------------

function renderScorecard(result) {
  const { filePath, score, grade, violations } = result;
  const displayPath = basename(filePath);

  // Group violations by severity
  const critical = violations.filter((v) => v.severity === "critical");
  const warning = violations.filter((v) => v.severity === "warning");
  const info = violations.filter((v) => v.severity === "info");

  // Build content lines first to determine max width
  const contentLines = [];

  // Vanguard ASCII art
  const art = [
    "██╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ██╗   ██╗██╗",
    "██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██║",
    "██║   ██║███████║██╔██╗ ██║██║  ███╗██║   ██║██║",
    "╚██╗ ██╔╝██╔══██║██║╚██╗██║██║   ██║██║   ██║██║",
    " ╚████╔╝ ██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║",
    "  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝",
  ];

  const tagline = "SLOP AUDIT";
  const fileLine = `File:  ${displayPath}`;
  const scoreLine = `Score: ${score}/100    Grade: ${grade}`;

  // Calculate the minimum width needed (based on longest content)
  let maxLen = 0;
  for (const a of art) maxLen = Math.max(maxLen, a.length);
  maxLen = Math.max(maxLen, tagline.length, fileLine.length, scoreLine.length);

  // Check violation lines
  for (const v of violations) {
    const lnStr = v.lines.slice(0, 6).map((l) => `L${l}`).join(",");
    const prefix = v.severity === "critical" ? "✗" : v.severity === "warning" ? "⚠" : "ℹ";
    const line = `${prefix} ${v.id}  ${v.message}  ${lnStr}`;
    maxLen = Math.max(maxLen, line.length);
  }

  // Add padding
  const W = maxLen + 6; // 3 left pad + 3 right pad

  // Helpers
  const pad = (s, w) => s + " ".repeat(Math.max(0, w - s.length));
  const boxLine = (s) => `║  ${pad(s, W - 4)}  ║`;
  const topBorder = `╔${"═".repeat(W)}╗`;
  const midBorder = `╠${"═".repeat(W)}╣`;
  const thinBorder = `╠${"─".repeat(W)}╣`;
  const botBorder = `╚${"═".repeat(W)}╝`;
  const emptyLine = boxLine("");

  const out = [];
  out.push(topBorder);
  out.push(emptyLine);

  // Art
  for (const a of art) {
    out.push(boxLine(`${ANSI.cyan}${a}${ANSI.reset}`));
  }

  // Tagline
  const tagPad = Math.floor((W - 4 - tagline.length) / 2);
  out.push(boxLine(" ".repeat(tagPad) + `${ANSI.bold}${tagline}${ANSI.reset}`));
  out.push(midBorder);

  // File + Score
  out.push(boxLine(fileLine));
  const gc = gradeColor(grade);
  out.push(boxLine(`Score: ${ANSI.bold}${score}/100${ANSI.reset}    Grade: ${gc}${ANSI.bold}${grade}${ANSI.reset}`));
  out.push(midBorder);

  // Helper to render a severity section
  const renderSection = (items, label, icon, color) => {
    if (!items.length) return;
    out.push(boxLine(`${color}${ANSI.bold}${label} (${items.length})${ANSI.reset}`));
    for (const v of items) {
      const lnStr = v.lines.slice(0, 8).map((l) => `L${l}`).join(",");
      const line = `${color}${icon}${ANSI.reset} ${ANSI.bold}${v.id}${ANSI.reset}  ${v.message}  ${ANSI.dim}${lnStr}${ANSI.reset}`;
      out.push(boxLine(line));
    }
  };

  renderSection(critical, "CRITICAL", "✗", ANSI.red);
  if (critical.length && (warning.length || info.length)) out.push(thinBorder);
  renderSection(warning, "WARNING", "⚠", ANSI.yellow);
  if (warning.length && info.length) out.push(thinBorder);
  renderSection(info, "INFO", "ℹ", ANSI.blue);

  if (!violations.length) {
    out.push(boxLine(`${ANSI.green}${ANSI.bold}✓ No slop detected — ship it!${ANSI.reset}`));
  }

  out.push(botBorder);

  return out.join("\n");
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const jsonFlag = args.includes("--json");
  const filePath = args.find((a) => !a.startsWith("--"));

  if (!filePath) {
    console.error("Usage: node slop-audit.mjs <file-path> [--json]");
    process.exit(1);
  }

  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTS.has(ext)) {
    console.log("Skipped: unsupported file type");
    process.exit(0);
  }

  const result = runAudit(filePath);

  if (result.skipped) {
    console.log("Skipped: unsupported file type");
    process.exit(0);
  }

  if (jsonFlag) {
    const jsonResult = {
      filePath: result.filePath,
      score: result.score,
      grade: result.grade,
      violations: result.violations,
      summary: `${result.violations.length} violation(s) found. Score: ${result.score}/100 (${result.grade})`,
    };
    console.log(JSON.stringify(jsonResult, null, 2));
  } else {
    console.log(renderScorecard(result));
  }

  process.exit(result.score >= 75 ? 0 : 1);
}

// Only run main when executed directly (not imported)
const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);

if (isMain) {
  main();
}
