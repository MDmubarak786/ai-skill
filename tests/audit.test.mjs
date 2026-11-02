import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, unlinkSync } from "node:fs";
import { runAudit } from "../skills/vanguard-ui/scripts/slop-audit.mjs";
import { generateCAD } from "../skills/vanguard-ui/scripts/generate-cad.mjs";
import { generatePayloads } from "../skills/vanguard-ui/scripts/stress-test.mjs";
import { parseTokens, toOklchString, buildSemanticPalette } from "../skills/vanguard-ui/scripts/extract-tokens.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, "fixtures");

describe("Vanguard UI Slop Audit Suite", () => {
  const badFixture = resolve(FIXTURES_DIR, "bad-ai-slop.tsx");
  const cleanFixture = resolve(FIXTURES_DIR, "clean-component.tsx");

  it("should fail bad-ai-slop.tsx with a score below 40 and Grade F", () => {
    const report = runAudit(badFixture);

    assert.ok(report, "Audit report should exist");
    assert.ok(report.score < 40, `Expected score < 40, but got ${report.score}`);
    assert.equal(report.grade, "F", `Expected Grade F, but got ${report.grade}`);

    // Verify key critical rules are triggered
    const triggeredIds = report.violations.map((v) => v.id);
    assert.ok(triggeredIds.includes("COL-001"), "COL-001 (AI purple gradient) must be triggered");
    assert.ok(triggeredIds.includes("COL-002"), "COL-002 (Hardcoded hex) must be triggered");
    assert.ok(triggeredIds.includes("COL-004"), "COL-004 (Known AI hex) must be triggered");
    assert.ok(triggeredIds.includes("COL-005"), "COL-005 (AI gradient hex) must be triggered");
    assert.ok(triggeredIds.includes("LAY-001"), "LAY-001 (Cards in cards) must be triggered");
    assert.ok(triggeredIds.includes("MOT-001"), "MOT-001 (transition-all) must be triggered");

    // Verify warnings are triggered
    assert.ok(triggeredIds.includes("COL-003"), "COL-003 (#000/#fff contrast) must be triggered");
    assert.ok(triggeredIds.includes("LAY-002"), "LAY-002 (Icon tile cliché) must be triggered");
    assert.ok(triggeredIds.includes("LAY-003"), "LAY-003 (Flex min-w-0) must be triggered");
    assert.ok(triggeredIds.includes("LAY-004"), "LAY-004 (100vh) must be triggered");
    assert.ok(triggeredIds.includes("LAY-005"), "LAY-005 (Fixed width) must be triggered");
    assert.ok(triggeredIds.includes("MOT-002"), "MOT-002 (ease-in) must be triggered");
    assert.ok(triggeredIds.includes("MOT-003"), "MOT-003 (duration > 300ms) must be triggered");
    assert.ok(triggeredIds.includes("STA-001"), "STA-001 (.map without check) must be triggered");
    assert.ok(triggeredIds.includes("TYP-001"), "TYP-001 (unconfigured font-sans) must be triggered");
    assert.ok(triggeredIds.includes("TYP-003"), "TYP-003 (display tracking-tight) must be triggered");
  });

  it("should pass clean-component.tsx with a perfect score of 100 and Grade S", () => {
    const report = runAudit(cleanFixture);

    assert.ok(report, "Audit report should exist");
    assert.equal(report.score, 100, `Expected score 100, but got ${report.score}`);
    assert.equal(report.grade, "S", `Expected Grade S, but got ${report.grade}`);
    assert.equal(report.violations.length, 0, `Expected 0 violations, but got ${report.violations.length}`);
  });

  it("should gracefully skip unsupported file types", () => {
    const jsFile = resolve(__dirname, "..", "package.json");
    const report = runAudit(jsFile);
    assert.ok(report.skipped, "Should mark non-UI files as skipped");
  });
});

describe("Vanguard UI Token Extraction Engine", () => {
  it("should convert hex colors to valid OKLCH color strings", () => {
    const hex = "#8b5cf6";
    const oklch = toOklchString(hex);
    assert.match(oklch, /^oklch\(\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?\)$/);
  });

  it("should parse CSS declarations and build a semantic palette", () => {
    const sampleCss = `
      body { background-color: #f8fafc; color: #0f172a; font-family: 'Inter', sans-serif; }
      .btn { border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); background: #3b82f6; }
    `;
    const tokens = parseTokens(sampleCss);
    assert.ok(tokens.colors.length >= 2, "Should extract colors");
    assert.ok(tokens.fonts.length >= 1, "Should extract font family");
    assert.ok(tokens.radii.length >= 1, "Should extract border radius");

    const palette = buildSemanticPalette(tokens.colors);
    assert.ok(palette.light["--bg-surface"], "Light surface token should exist");
    assert.ok(palette.dark["--bg-surface"], "Dark surface token should exist");
  });
});

describe("Vanguard UI Stress Test Payload Generator", () => {
  it("should generate 120-char strings, extreme numbers, and 500-item arrays", () => {
    const payloads = generatePayloads();

    assert.ok(payloads.strings.longUnbroken.length >= 120, "Should include unbroken 120-char string");
    assert.ok(payloads.strings.rtlArabic.length > 0, "Should include RTL Arabic");
    assert.ok(payloads.strings.rtlHebrew.length > 0, "Should include RTL Hebrew");
    assert.equal(payloads.numbers.zero, 0, "Should test zero");
    assert.ok(payloads.numbers.negativeFloat < -1000, "Should test extreme negative float");
    assert.equal(payloads.arrays.empty.length, 0, "Should test empty array");
    assert.equal(payloads.arrays.fiveHundredItems.length, 500, "Should test 500-item array");
  });
});

describe("Vanguard UI CAD Blueprint Generator", () => {
  const cleanFixture = resolve(FIXTURES_DIR, "clean-component.tsx");
  const tempCadOutput = resolve(FIXTURES_DIR, "temp-test.cad.html");

  it("should generate a standalone HTML CAD blueprint with SVG dimensions", () => {
    const { outputPath } = generateCAD(cleanFixture, { output: tempCadOutput });

    assert.ok(existsSync(outputPath), "CAD output file should be created");
    // Clean up
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
    }
  });
});
