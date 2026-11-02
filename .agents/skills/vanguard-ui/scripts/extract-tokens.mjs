#!/usr/bin/env node
// ============================================================================
// extract-tokens.mjs — Vanguard UI Token Extractor
// Zero-dependency token extractor for live URLs or local HTML/CSS files.
// Converts colors to OKLCH and outputs DESIGN.md and tokens.css.
// Usage: node extract-tokens.mjs <url-or-path> [--output-dir <dir>]
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";

// ---------------------------------------------------------------------------
// Color Math: RGB / Hex to OKLCH conversion
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length === 8) {
    clean = clean.slice(0, 6);
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function parseRgbString(str) {
  const match = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return null;
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
  };
}

function sRgbToLinear(c) {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function linearToOklch(rLinear, gLinear, bLinear) {
  // Convert linear sRGB to OKLab LMS
  const l = Math.cbrt(0.4122214708 * rLinear + 0.5363325363 * gLinear + 0.0514459929 * bLinear);
  const m = Math.cbrt(0.2119034982 * rLinear + 0.6806995451 * gLinear + 0.1073969566 * bLinear);
  const s = Math.cbrt(0.0883024619 * rLinear + 0.2817188376 * gLinear + 0.6299787005 * bLinear);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return {
    l: Math.max(0, Math.min(1, L)),
    c: Math.max(0, C),
    h: Math.round(h * 10) / 10,
  };
}

export function toOklchString(hexOrRgb) {
  const rgb = typeof hexOrRgb === "string" ? (hexToRgb(hexOrRgb) || parseRgbString(hexOrRgb)) : hexOrRgb;
  if (!rgb) return "oklch(0.5 0 0)";
  const rLin = sRgbToLinear(rgb.r);
  const gLin = sRgbToLinear(rgb.g);
  const bLin = sRgbToLinear(rgb.b);
  const oklch = linearToOklch(rLin, gLin, bLin);
  return `oklch(${oklch.l.toFixed(2)} ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)})`;
}

// ---------------------------------------------------------------------------
// Extraction & Parsing
// ---------------------------------------------------------------------------

export async function fetchOrReadFile(target) {
  const isUrl = /^https?:\/\//i.test(target);
  if (isUrl) {
    const res = await fetch(target, {
      headers: { "User-Agent": "VanguardUI-TokenExtractor/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status} fetching ${target}`);
    const html = await res.text();
    let cssBundle = "";

    // Extract inline <style>
    const styleMatches = html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    for (const m of styleMatches) {
      cssBundle += "\n" + m[1];
    }

    // Try fetching top 3 external stylesheets
    const linkMatches = html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi);
    let count = 0;
    for (const m of linkMatches) {
      if (count++ >= 3) break;
      try {
        const cssUrl = new URL(m[1], target).href;
        const cssRes = await fetch(cssUrl, {
          headers: { "User-Agent": "VanguardUI-TokenExtractor/1.0" },
        });
        if (cssRes.ok) {
          cssBundle += "\n" + (await cssRes.text());
        }
      } catch {
        // ignore stylesheet network errors
      }
    }
    return { content: html + "\n" + cssBundle, source: target };
  } else {
    const absPath = resolve(process.cwd(), target);
    if (!existsSync(absPath)) {
      throw new Error(`File not found: ${absPath}`);
    }
    return { content: readFileSync(absPath, "utf-8"), source: absPath };
  }
}

export function parseTokens(content) {
  const colorCounts = new Map();
  const fontFamilies = new Set();
  const radii = new Set();
  const shadows = new Set();

  // Hex colors: #xxx, #xxxxxx, #xxxxxxxx
  const hexMatches = content.matchAll(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g);
  for (const m of hexMatches) {
    const hex = m[0].toLowerCase();
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }

  // RGB/RGBA colors
  const rgbMatches = content.matchAll(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+\s*)?\)/gi);
  for (const m of rgbMatches) {
    const rgb = m[0].toLowerCase();
    colorCounts.set(rgb, (colorCounts.get(rgb) || 0) + 1);
  }

  // Font family
  const fontMatches = content.matchAll(/font-family\s*:\s*([^;}{]+)[;}]/gi);
  for (const m of fontMatches) {
    const val = m[1].trim().split(",")[0].replace(/['"]/g, "").trim();
    if (val && !/inherit|initial|unset/i.test(val)) fontFamilies.add(val);
  }

  // Border radius
  const radiusMatches = content.matchAll(/border-radius\s*:\s*([^;}{]+)[;}]/gi);
  for (const m of radiusMatches) {
    const val = m[1].trim();
    if (val && !/inherit|initial|unset/i.test(val)) radii.add(val);
  }

  // Box shadows
  const shadowMatches = content.matchAll(/box-shadow\s*:\s*([^;}{]+)[;}]/gi);
  for (const m of shadowMatches) {
    const val = m[1].trim();
    if (val && val !== "none" && !/inherit|initial/i.test(val)) shadows.add(val);
  }

  // Sort colors by frequency
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color, count]) => ({
      color,
      count,
      oklch: toOklchString(color),
    }));

  return {
    colors: sortedColors,
    fonts: Array.from(fontFamilies),
    radii: Array.from(radii),
    shadows: Array.from(shadows),
  };
}

export function buildSemanticPalette(extractedColors) {
  // Categorize colors by lightness / saturation
  let bgSurface = "oklch(0.985 0.002 247.5)";
  let bgSurfaceDark = "oklch(0.145 0.005 247.5)";
  let textPrimary = "oklch(0.145 0.005 247.5)";
  let textPrimaryDark = "oklch(0.985 0.002 247.5)";
  let accentPrimary = "oklch(0.55 0.18 250)";
  let borderSubtle = "oklch(0.88 0.005 247.5)";
  let borderSubtleDark = "oklch(0.25 0.005 247.5)";

  if (extractedColors.length > 0) {
    // Pick the most frequent light color as surface or dark as surface
    const lightCandidates = extractedColors.filter((c) => {
      const match = c.oklch.match(/oklch\(([\d.]+)/);
      return match && parseFloat(match[1]) > 0.85;
    });
    const darkCandidates = extractedColors.filter((c) => {
      const match = c.oklch.match(/oklch\(([\d.]+)/);
      return match && parseFloat(match[1]) < 0.25;
    });
    const chromaticCandidates = extractedColors.filter((c) => {
      const match = c.oklch.match(/oklch\([\d.]+\s+([\d.]+)/);
      return match && parseFloat(match[1]) > 0.05;
    });

    if (lightCandidates.length > 0) bgSurface = lightCandidates[0].oklch;
    if (darkCandidates.length > 0) textPrimary = darkCandidates[0].oklch;
    if (chromaticCandidates.length > 0) accentPrimary = chromaticCandidates[0].oklch;
  }

  return {
    light: {
      "--bg-surface": bgSurface,
      "--bg-surface-raised": "oklch(1 0 0)",
      "--text-primary": textPrimary,
      "--text-secondary": "oklch(0.45 0.01 247.5)",
      "--border-subtle": borderSubtle,
      "--border-strong": "oklch(0.75 0.01 247.5)",
      "--accent-primary": accentPrimary,
    },
    dark: {
      "--bg-surface": bgSurfaceDark,
      "--bg-surface-raised": "oklch(0.20 0.005 247.5)",
      "--text-primary": textPrimaryDark,
      "--text-secondary": "oklch(0.65 0.01 247.5)",
      "--border-subtle": borderSubtleDark,
      "--border-strong": "oklch(0.35 0.005 247.5)",
      "--accent-primary": accentPrimary,
    },
  };
}

export function generateDesignMd(source, tokens, palette) {
  const fontList = tokens.fonts.length
    ? tokens.fonts.map((f) => `- \`${f}\``).join("\n")
    : "- `Inter`, system-ui, -apple-system, sans-serif";

  const colorRows = Object.entries(palette.light)
    .map(([token, val]) => `| \`${token}\` | \`${val}\` | Semantic Token |`)
    .join("\n");

  const rawColorRows = tokens.colors
    .slice(0, 10)
    .map((c) => `| \`${c.color}\` | \`${c.oklch}\` | ${c.count} |`)
    .join("\n");

  return `# DESIGN.md — Extracted Design Tokens

> Extracted from: \`${source}\`  
> Generated by **Vanguard UI** token extraction engine.

---

## 1. Semantic Color System (OKLCH)

All color tokens are defined using the perceptually uniform **OKLCH** color space for predictable lightness contrast and gamut mapping.

| Token | Light Value | Purpose |
| :--- | :--- | :--- |
${colorRows}

---

## 2. Extracted Raw Colors (Top 10)

| Source Value | OKLCH Approximation | Occurrences |
| :--- | :--- | :--- |
${rawColorRows || "| *(none)* | *(none)* | 0 |"}

---

## 3. Typography Stack

${fontList}

- **Display Headings**: Always pair with \`tracking-tight\` and \`text-balance\`.
- **Numeric & Data**: Always enforce \`tabular-nums\` / \`font-variant-numeric: tabular-nums\`.

---

## 4. Radii & Surface Elevation

- \`--radius-sm\`: \`0.25rem\` (4px)
- \`--radius-md\`: \`0.5rem\` (8px)
- \`--radius-lg\`: \`0.75rem\` (12px)
- \`--radius-full\`: \`9999px\`

---

## 5. Motion Constraints

- **Enter Transitions**: \`cubic-bezier(0.22, 1, 0.36, 1)\` (\`ease-out\`)
- **Duration Ceiling**: \`≤ 200ms\` for micro-interactions, \`≤ 300ms\` for modal/drawer transitions
- **Compositor Properties Only**: Animate \`transform\` and \`opacity\` exclusively
- **Reduced Motion**: Fall back to simple cross-fade (\`motion-reduce:transition-none\`)
`;
}

export function generateTokensCss(palette, fonts) {
  const primaryFont = fonts[0] ? `'${fonts[0]}', system-ui, sans-serif` : "system-ui, -apple-system, sans-serif";

  return `/**
 * tokens.css — Vanguard UI Design Tokens
 * Generated automatically. OKLCH color space enabled.
 */

:root {
  /* Surface & Backgrounds */
  --bg-surface: ${palette.light["--bg-surface"]};
  --bg-surface-raised: ${palette.light["--bg-surface-raised"]};

  /* Typography Colors */
  --text-primary: ${palette.light["--text-primary"]};
  --text-secondary: ${palette.light["--text-secondary"]};

  /* Borders & Dividers */
  --border-subtle: ${palette.light["--border-subtle"]};
  --border-strong: ${palette.light["--border-strong"]};

  /* Brand / Accent */
  --accent-primary: ${palette.light["--accent-primary"]};

  /* Typography Stacks */
  --font-sans: ${primaryFont};
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Geometry & Radii */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;

  /* Shadows (Elevations) */
  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.08), 0 2px 4px -2px oklch(0 0 0 / 0.04);
  --shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.05);

  /* Motion & Physics */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in: cubic-bezier(0.55, 0, 1, 0.45);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
}

.dark,
@media (prefers-color-scheme: dark) {
  :root {
    --bg-surface: ${palette.dark["--bg-surface"]};
    --bg-surface-raised: ${palette.dark["--bg-surface-raised"]};
    --text-primary: ${palette.dark["--text-primary"]};
    --text-secondary: ${palette.dark["--text-secondary"]};
    --border-subtle: ${palette.dark["--border-subtle"]};
    --border-strong: ${palette.dark["--border-strong"]};
    --accent-primary: ${palette.dark["--accent-primary"]};
  }
}
`;
}

// ---------------------------------------------------------------------------
// Main programmatic API and CLI
// ---------------------------------------------------------------------------

export async function extractTokens(source, options = {}) {
  const outputDir = options.outputDir || process.cwd();
  const { content, source: srcLabel } = await fetchOrReadFile(source);
  const parsed = parseTokens(content);
  const palette = buildSemanticPalette(parsed.colors);

  const designMd = generateDesignMd(srcLabel, parsed, palette);
  const tokensCss = generateTokensCss(palette, parsed.fonts);

  const designMdPath = resolve(outputDir, "DESIGN.md");
  const tokensCssPath = resolve(outputDir, "tokens.css");

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  writeFileSync(designMdPath, designMd, "utf-8");
  writeFileSync(tokensCssPath, tokensCss, "utf-8");

  return {
    source: srcLabel,
    tokens: parsed,
    palette,
    files: {
      designMd: designMdPath,
      tokensCss: tokensCssPath,
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: node extract-tokens.mjs <url-or-path> [--output-dir <dir>]

Extracts colors, fonts, and geometry tokens from a URL or local file,
converts them to OKLCH, and writes DESIGN.md and tokens.css.
`);
    process.exit(0);
  }

  const target = args[0];
  let outputDir = process.cwd();
  const dirIdx = args.indexOf("--output-dir");
  if (dirIdx !== -1 && args[dirIdx + 1]) {
    outputDir = resolve(args[dirIdx + 1]);
  }

  try {
    console.log(`🔍 Extracting design tokens from: ${target}`);
    const result = await extractTokens(target, { outputDir });
    console.log(`✓ Found ${result.tokens.colors.length} color declarations`);
    console.log(`✓ Found ${result.tokens.fonts.length} font definitions`);
    console.log(`✓ Generated: ${result.files.designMd}`);
    console.log(`✓ Generated: ${result.files.tokensCss}`);
  } catch (err) {
    console.error(`✗ Extraction failed: ${err.message}`);
    process.exit(1);
  }
}

// Run if called directly
const isDirectCall = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (isDirectCall) {
  main();
}
