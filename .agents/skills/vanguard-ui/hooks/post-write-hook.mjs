#!/usr/bin/env node
// post-write-hook.mjs — Antigravity PostToolUse hook
// Runs slop-audit on UI files after write_file / edit_file / create_file.
//
// Reads the PostToolUse JSON payload from stdin, extracts the file path,
// and conditionally runs slop-audit.mjs. Always writes `{}` to stdout
// and never exits non-zero, so the agent is never interrupted.

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Resolve the audit script relative to *this* file (../scripts/slop-audit.mjs)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const auditScript = path.resolve(__dirname, "..", "scripts", "slop-audit.mjs");

// UI file extensions that warrant an audit
const UI_EXTENSIONS = new Set([".tsx", ".jsx", ".vue", ".svelte", ".html", ".css"]);

/**
 * Collect all of stdin, parse the PostToolUse payload, and decide whether
 * to run the slop audit.
 */
function main() {
  let data = "";

  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (chunk) => (data += chunk));
  process.stdin.on("end", () => {
    try {
      const payload = JSON.parse(data);

      // The file path lives in toolCall.args.Path (write_file / edit_file)
      // or toolCall.args.path (some tools use lowercase)
      const filePath =
        payload?.toolCall?.args?.Path ??
        payload?.toolCall?.args?.path ??
        "";

      const ext = path.extname(filePath).toLowerCase();

      if (filePath && UI_EXTENSIONS.has(ext)) {
        try {
          // Run the audit — output goes to stderr so the agent sees warnings
          execSync(`node ${JSON.stringify(auditScript)} ${JSON.stringify(filePath)}`, {
            stdio: ["pipe", "inherit", "inherit"],
            timeout: 12_000, // stay under the 15 s hook timeout
          });
        } catch {
          // Swallow audit failures — never crash the hook
        }
      }
    } catch {
      // Malformed JSON or unexpected payload — silently continue
    }

    // PostToolUse hooks MUST write a JSON object to stdout
    process.stdout.write("{}");
  });
}

main();
