#!/usr/bin/env node
// ============================================================================
// stress-test.mjs — Vanguard UI Stress Test Payload Generator
// Generates extreme edge-case payloads for testing UI components against
// layout-breaking data, localization challenges, numeric limits, and array bounds.
// Usage: node stress-test.mjs [--output <path>]
// ============================================================================

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

export function generatePayloads() {
  // Generate 500-item array programmatically
  const largeArray = Array.from({ length: 500 }, (_, i) => ({
    id: `item-${i + 1}`,
    index: i + 1,
    title: `Data Record #${i + 1} with variable length content ${"•".repeat((i % 7) + 1)}`,
    amount: (Math.sin(i) * 10000).toFixed(2),
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    status: ["active", "pending", "failed", "archived"][i % 4],
  }));

  return {
    metadata: {
      generator: "vanguard-ui/stress-test",
      version: "1.0.0",
      description: "Adversarial UI test fixtures covering 5-state edge cases",
      timestamp: new Date().toISOString(),
    },
    strings: {
      longUnbroken:
        "Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz_Donaudampfschifffahrtsgesellschaftskapitänswitwenkasse_120chars!",
      longUrl:
        "https://example.com/very/long/nested/path/that/keeps/going/and/going/until/it/reaches/one/hundred/twenty/characters/total/length/here/test",
      longEmail:
        "extremely.long.unbroken.user.email.address.that.nobody.would.ever.use.in.production@deeply.nested.subdomain.example.enterprise.org",
      singleChar: "A",
      empty: "",
      whitespaceOnly: "      \t\n   ",
      rtlArabic: "مرحبا بالعالم! هذا نص تجريبي لاختبار محاذاة الخط العربي مع الأرقام 12345",
      rtlHebrew: "שלום עולם! זוהי בדיקת פריסה של כיווניות מימין לשמאל עם מספרים 67890",
      mixedBidi: "Price: 1,234.56 ر.س (شامل الضريبة المضافة) — SKU: 987-XYZ",
      emojiCombo: "👨‍👩‍👧‍👦 🏳️‍🌈 🧑🏽‍💻 🚀 💥 ⚡️ 🔥",
      zalgoText: "H̷̭̓e̵̢͐l̶̼͝l̷̰̈́o̴̱̊ W̵̰̾ö̶̜́r̶̤̾l̸̤̈́ḏ̵̊",
      cjkLong: "東京都港区六本木ヒルズ森タワーおよび超高層ビル複合商業施設案内情報",
      htmlInjection: "<script>alert('xss')</script><b>Bold Tag</b>&amp;\"quotes\"",
      newlines: "Line 1\nLine 2\nLine 3\nLine 4 with very long trailing content that should wrap nicely",
    },
    numbers: {
      zero: 0,
      negativeFloat: -9999999.99,
      positiveLarge: 1492837492,
      smallFraction: 0.000001,
      percentageZero: 0.0,
      percentageMax: 100.0,
      percentageOverflow: 1000.42,
      currencyUSD: "$1,492,837,492.50",
      currencyNegative: "-$9,999.99",
      infinityString: "Infinity",
      nanString: "NaN",
    },
    arrays: {
      empty: [],
      singleItem: [{ id: "solo", title: "Single Item Record", value: 42 }],
      fiveItems: Array.from({ length: 5 }, (_, i) => ({ id: `s-${i}`, title: `Item ${i + 1}` })),
      fiveHundredItems: largeArray,
      deeplyNested: [
        {
          id: "level-1",
          children: [
            {
              id: "level-2",
              children: [
                {
                  id: "level-3",
                  children: [{ id: "level-4", leaf: true }],
                },
              ],
            },
          ],
        },
      ],
    },
    dates: {
      epoch: "1970-01-01T00:00:00.000Z",
      current: new Date().toISOString(),
      farFuture: "2099-12-31T23:59:59.999Z",
      leapYear: "2024-02-29T12:00:00.000Z",
      invalidDate: "Invalid Date",
    },
    media: {
      brokenUrl: "https://example.com/non-existent-image-404.png",
      svgDataUri: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect fill='%233b82f6' width='100' height='100'/></svg>",
      nullValue: null,
      undefinedValue: undefined,
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  let outputPath = resolve(process.cwd(), "stress-payloads.json");

  const outIdx = args.indexOf("--output");
  if (outIdx !== -1 && args[outIdx + 1]) {
    outputPath = resolve(args[outIdx + 1]);
  }

  const payloads = generatePayloads();
  const dir = dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(outputPath, JSON.stringify(payloads, null, 2), "utf-8");

  console.log(`
╔══════════════════════════════════════════════════════╗
║  VANGUARD UI — STRESS TEST HARNESS GENERATOR         ║
╠══════════════════════════════════════════════════════╣
║  ✓ Unbroken 120-char strings                         ║
║  ✓ RTL Arabic & Hebrew bidi mix                      ║
║  ✓ Extreme numeric limits (-9999999.99, large ints)  ║
║  ✓ 0-item empty arrays & 500-item stress arrays      ║
║  ✓ Zalgo, CJK, and XSS probe strings                 ║
╠══════════════════════════════════════════════════════╣
║  Output: ${outputPath}
╚══════════════════════════════════════════════════════╝
`);
}

const isDirectCall = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (isDirectCall) {
  main();
}
