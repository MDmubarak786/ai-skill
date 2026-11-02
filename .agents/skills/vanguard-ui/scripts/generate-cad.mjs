#!/usr/bin/env node
// ============================================================================
// generate-cad.mjs — Vanguard UI Component CAD Blueprint Generator
// Generates standalone monochrome Apple-style technical blueprints in HTML/SVG
// showing bounding dimensions, padding zones, gap measurements, radii arcs,
// and complete typography and spacing specifications.
// Usage: node generate-cad.mjs <component-path> [--output <path>]
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, basename, dirname } from "node:path";

// ---------------------------------------------------------------------------
// Tailwind token to pixel/rem lookup
// ---------------------------------------------------------------------------

const TAILWIND_SPACING = {
  "0": "0px",
  "0.5": "0.125rem (2px)",
  "1": "0.25rem (4px)",
  "1.5": "0.375rem (6px)",
  "2": "0.5rem (8px)",
  "2.5": "0.625rem (10px)",
  "3": "0.75rem (12px)",
  "3.5": "0.875rem (14px)",
  "4": "1rem (16px)",
  "5": "1.25rem (20px)",
  "6": "1.5rem (24px)",
  "7": "1.75rem (28px)",
  "8": "2rem (32px)",
  "9": "2.25rem (36px)",
  "10": "2.5rem (40px)",
  "11": "2.75rem (44px)",
  "12": "3rem (48px)",
  "14": "3.5rem (56px)",
  "16": "4rem (64px)",
  "20": "5rem (80px)",
  "24": "6rem (96px)",
  "32": "8rem (128px)",
};

const TAILWIND_RADII = {
  none: "0px",
  sm: "0.125rem (2px)",
  DEFAULT: "0.25rem (4px)",
  md: "0.375rem (6px)",
  lg: "0.5rem (8px)",
  xl: "0.75rem (12px)",
  "2xl": "1rem (16px)",
  "3xl": "1.5rem (24px)",
  full: "9999px",
};

const TAILWIND_FONT_SIZE = {
  xs: "0.75rem (12px) / line-height: 1rem",
  sm: "0.875rem (14px) / line-height: 1.25rem",
  base: "1rem (16px) / line-height: 1.5rem",
  lg: "1.125rem (18px) / line-height: 1.75rem",
  xl: "1.25rem (20px) / line-height: 1.75rem",
  "2xl": "1.5rem (24px) / line-height: 2rem",
  "3xl": "1.875rem (30px) / line-height: 2.25rem",
  "4xl": "2.25rem (36px) / line-height: 2.5rem",
  "5xl": "3rem (48px) / line-height: 1",
  "6xl": "3.75rem (60px) / line-height: 1",
};

// ---------------------------------------------------------------------------
// Component Parser
// ---------------------------------------------------------------------------

export function inspectComponent(sourceCode, fileName) {
  const classMatches = sourceCode.matchAll(/class(?:Name)?=["'`]([^"'`]+)["'`]/g);
  const allClasses = new Set();
  for (const m of classMatches) {
    m[1].split(/\s+/).forEach((c) => c && allClasses.add(c));
  }

  const paddings = new Set();
  const gaps = new Set();
  const radii = new Set();
  const fontSizes = new Set();
  const fontWeights = new Set();
  const layouts = new Set();
  const dimensions = new Set();

  for (const cls of allClasses) {
    // Padding
    const pMatch = cls.match(/^(?:(?:sm|md|lg|xl):)?p(?:[xytrbl])?-(\d+(?:\.\d+)?|px)$/);
    if (pMatch) paddings.add(cls);

    // Gap
    const gMatch = cls.match(/^(?:(?:sm|md|lg|xl):)?gap(?:-[xy])?-(\d+(?:\.\d+)?)$/);
    if (gMatch) gaps.add(cls);

    // Radii
    const rMatch = cls.match(/^(?:(?:sm|md|lg|xl):)?rounded(?:-([a-z0-9]+))?$/);
    if (rMatch) radii.add(cls);

    // Font size
    const fsMatch = cls.match(/^(?:(?:sm|md|lg|xl):)?text-(xs|sm|base|lg|xl|[2-9]xl)$/);
    if (fsMatch) fontSizes.add(fsMatch[1]);

    // Font weight
    const fwMatch = cls.match(/^(?:(?:sm|md|lg|xl):)?font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/);
    if (fwMatch) fontWeights.add(fwMatch[1]);

    // Layout
    if (cls === "flex" || cls === "grid" || cls === "inline-flex" || cls.startsWith("grid-cols-")) {
      layouts.add(cls);
    }

    // Dimensions
    if (cls.startsWith("w-") || cls.startsWith("h-") || cls.startsWith("max-w-") || cls.startsWith("min-h-")) {
      dimensions.add(cls);
    }
  }

  return {
    fileName: basename(fileName),
    classesCount: allClasses.size,
    paddings: Array.from(paddings),
    gaps: Array.from(gaps),
    radii: Array.from(radii),
    fontSizes: Array.from(fontSizes),
    fontWeights: Array.from(fontWeights),
    layouts: Array.from(layouts),
    dimensions: Array.from(dimensions),
  };
}

// ---------------------------------------------------------------------------
// HTML / SVG Blueprint Generator
// ---------------------------------------------------------------------------

export function renderBlueprintHtml(data) {
  const primaryPadding = data.paddings[0] || "p-6";
  const primaryRadius = data.radii[0] || "rounded-lg";
  const primaryGap = data.gaps[0] || "gap-4";

  const paddingVal = primaryPadding.replace(/^[a-z:]*p(?:[xytrbl])?-/, "");
  const paddingSpec = TAILWIND_SPACING[paddingVal] || `${paddingVal} units`;

  const radiusVal = primaryRadius.replace(/^[a-z:]*rounded-?/, "") || "DEFAULT";
  const radiusSpec = TAILWIND_RADII[radiusVal] || "0.5rem (8px)";

  const gapVal = primaryGap.replace(/^[a-z:]*gap(?:-[xy])?-/, "");
  const gapSpec = TAILWIND_SPACING[gapVal] || `${gapVal} units`;

  const dateStr = new Date().toISOString().split("T")[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CAD Blueprint — ${data.fileName}</title>
  <style>
    :root {
      --bg: #090a0f;
      --card-bg: #11131a;
      --grid: rgba(255, 255, 255, 0.04);
      --axis: #2563eb;
      --dim: #60a5fa;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --border-tech: #1e293b;
      --accent: #38bdf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      padding: 2.5rem 1.5rem;
      background-image: 
        linear-gradient(to right, var(--grid) 1px, transparent 1px),
        linear-gradient(to bottom, var(--grid) 1px, transparent 1px);
      background-size: 24px 24px;
    }
    .blueprint-wrapper {
      max-width: 1040px;
      margin: 0 auto;
      border: 1px solid var(--border-tech);
      background: var(--card-bg);
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }
    header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--border-tech);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(17, 19, 26, 0.95);
    }
    .title-group h1 {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .title-group p {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .badge {
      font-size: 0.75rem;
      background: rgba(56, 189, 248, 0.1);
      color: var(--accent);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
    }
    .cad-viewport {
      padding: 3rem 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background: radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, transparent 70%);
      border-bottom: 1px solid var(--border-tech);
    }
    svg text {
      font-family: ui-monospace, SFMono-Regular, monospace;
      user-select: none;
    }
    .spec-table-section {
      padding: 2rem;
    }
    .section-heading {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      margin-bottom: 1rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    th, td {
      text-align: left;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-tech);
    }
    th {
      color: var(--text-muted);
      font-weight: 600;
    }
    td code {
      background: rgba(255, 255, 255, 0.06);
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      color: #e2e8f0;
    }
    footer {
      padding: 1rem 2rem;
      background: rgba(9, 10, 15, 0.8);
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <div class="blueprint-wrapper">
    <header>
      <div class="title-group">
        <h1>📐 VANGUARD CAD SPEC // ${data.fileName}</h1>
        <p>Monochrome Architectural Blueprint • Generated: ${dateStr}</p>
      </div>
      <div class="badge">SPECIFICATION V1.0</div>
    </header>

    <div class="cad-viewport">
      <svg width="760" height="420" viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#60a5fa" />
          </marker>
          <marker id="arrow-white" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#94a3b8" />
          </marker>
        </defs>

        <!-- Outer Bounding Dimension Lines -->
        <!-- Top Width -->
        <line x1="120" y1="35" x2="640" y2="35" stroke="#60a5fa" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
        <line x1="120" y1="28" x2="120" y2="55" stroke="#334155" stroke-width="1" stroke-dasharray="2 2" />
        <line x1="640" y1="28" x2="640" y2="55" stroke="#334155" stroke-width="1" stroke-dasharray="2 2" />
        <text x="380" y="25" fill="#60a5fa" font-size="11" text-anchor="middle" font-weight="600">WIDTH: 100% (max-w container)</text>

        <!-- Left Height -->
        <line x1="75" y1="65" x2="75" y2="365" stroke="#60a5fa" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
        <line x1="68" y1="65" x2="110" y2="65" stroke="#334155" stroke-width="1" stroke-dasharray="2 2" />
        <line x1="68" y1="365" x2="110" y2="365" stroke="#334155" stroke-width="1" stroke-dasharray="2 2" />
        <text x="65" y="215" fill="#60a5fa" font-size="11" text-anchor="middle" font-weight="600" transform="rotate(-90 65 215)">INTRINSIC HEIGHT (auto)</text>

        <!-- Component Bounding Card -->
        <rect x="120" y="65" width="520" height="300" rx="12" ry="12" fill="#141824" stroke="#38bdf8" stroke-width="1.8" />

        <!-- Padding Zone (Dashed inner perimeter) -->
        <rect x="155" y="100" width="450" height="230" rx="6" ry="6" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="4 4" />

        <!-- Padding Dimension Callout -->
        <line x1="120" y1="120" x2="155" y2="120" stroke="#f43f5e" stroke-width="1.2" marker-start="url(#arrow-white)" marker-end="url(#arrow-white)" />
        <text x="137" y="140" fill="#fda4af" font-size="9" text-anchor="middle">PAD: ${paddingSpec}</text>

        <!-- Inner Content: Header Area -->
        <rect x="175" y="115" width="220" height="24" rx="4" fill="#1e293b" stroke="#334155" stroke-width="1" />
        <text x="185" y="131" fill="#f8fafc" font-size="10" font-weight="600">HEADER: text-2xl tracking-tight</text>

        <!-- Subheader Area -->
        <rect x="175" y="145" width="320" height="14" rx="3" fill="#1e293b" stroke="#334155" stroke-width="1" />
        <text x="185" y="156" fill="#94a3b8" font-size="9">SUBTITLE: text-sm text-secondary</text>

        <!-- 3 Child Cards with Gap indicator -->
        <rect x="175" y="180" width="125" height="120" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1" />
        <text x="237" y="245" fill="#64748b" font-size="10" text-anchor="middle">ITEM 01</text>

        <!-- Gap Dimension 1 -->
        <line x1="300" y1="240" x2="325" y2="240" stroke="#fbbf24" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
        <text x="312" y="232" fill="#fbbf24" font-size="8" text-anchor="middle">GAP: ${gapSpec}</text>

        <rect x="325" y="180" width="125" height="120" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1" />
        <text x="387" y="245" fill="#64748b" font-size="10" text-anchor="middle">ITEM 02</text>

        <!-- Gap Dimension 2 -->
        <line x1="450" y1="240" x2="475" y2="240" stroke="#fbbf24" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
        <text x="462" y="232" fill="#fbbf24" font-size="8" text-anchor="middle">GAP: ${gapSpec}</text>

        <rect x="475" y="180" width="125" height="120" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1" />
        <text x="537" y="245" fill="#64748b" font-size="10" text-anchor="middle">ITEM 03</text>

        <!-- Border Radius Callout Arc -->
        <path d="M 628 65 A 12 12 0 0 1 640 77" fill="none" stroke="#22c55e" stroke-width="2.5" />
        <line x1="635" y1="71" x2="685" y2="85" stroke="#22c55e" stroke-width="1" />
        <text x="690" y="89" fill="#86efac" font-size="10">R: ${radiusSpec}</text>
      </svg>
    </div>

    <div class="spec-table-section">
      <h2 class="section-heading">01 // Architectural Layer Specifications</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Active Tokens</th>
            <th>Computed Dimension / Behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Padding Zone</strong></td>
            <td><code>${data.paddings.join("</code> <code>") || "default: p-6"}</code></td>
            <td>${paddingSpec} inner breathing room</td>
          </tr>
          <tr>
            <td><strong>Grid / Flex Gap</strong></td>
            <td><code>${data.gaps.join("</code> <code>") || "default: gap-4"}</code></td>
            <td>${gapSpec} inter-element spacing</td>
          </tr>
          <tr>
            <td><strong>Corner Curvature</strong></td>
            <td><code>${data.radii.join("</code> <code>") || "default: rounded-lg"}</code></td>
            <td>${radiusSpec} corner radius</td>
          </tr>
          <tr>
            <td><strong>Typography Scale</strong></td>
            <td><code>${data.fontSizes.map((s) => "text-" + s).join("</code> <code>") || "text-base"}</code></td>
            <td>Enforces <code>tracking-tight</code> + <code>tabular-nums</code></td>
          </tr>
          <tr>
            <td><strong>Layout Container</strong></td>
            <td><code>${data.layouts.join("</code> <code>") || "block"}</code></td>
            <td>Mobile-first adaptive flow</td>
          </tr>
          <tr>
            <td><strong>Dimension Bounds</strong></td>
            <td><code>${data.dimensions.join("</code> <code>") || "auto"}</code></td>
            <td>Fluid responsive layout constraints</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer>
      <span>VANGUARD-UI BLUEPRINT ENGINE</span>
      <span>DETERMINISTIC VERIFICATION PASS</span>
    </footer>
  </div>

</body>
</html>
`;
}

export function generateCAD(componentPath, options = {}) {
  const absPath = resolve(process.cwd(), componentPath);
  if (!existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  const content = readFileSync(absPath, "utf-8");
  const inspected = inspectComponent(content, absPath);
  const html = renderBlueprintHtml(inspected);

  const outputPath =
    options.output ||
    resolve(dirname(absPath), `${basename(absPath, "." + absPath.split(".").pop())}.cad.html`);

  writeFileSync(outputPath, html, "utf-8");
  return { outputPath, inspected };
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: node generate-cad.mjs <component-path> [--output <path>]

Parses layout tokens (padding, gap, radius, typography) from a UI component
and generates a standalone monochrome Apple-style technical CAD blueprint.
`);
    process.exit(0);
  }

  const componentPath = args[0];
  let output = null;
  const outIdx = args.indexOf("--output");
  if (outIdx !== -1 && args[outIdx + 1]) {
    output = resolve(args[outIdx + 1]);
  }

  try {
    const { outputPath } = generateCAD(componentPath, { output });
    console.log(`✓ Blueprint generated: ${outputPath}`);
  } catch (err) {
    console.error(`✗ Blueprint generation failed: ${err.message}`);
    process.exit(1);
  }
}

const isDirectCall = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (isDirectCall) {
  main();
}
