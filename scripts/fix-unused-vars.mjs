// Read fresh lint output, then for each "no-unused-vars" warning either
// remove the named import (if the symbol appears in `import { ... } from "..."`)
// or prefix the identifier with `_` (function params, destructure, locals).
// Idempotent: skips names already prefixed with `_`.

import fs from "fs";
import { execSync } from "child_process";

execSync("npm run lint > .lint-output.tmp 2>&1", { cwd: process.cwd(), stdio: "ignore" });
const out = fs.readFileSync(".lint-output.tmp", "utf8");

const warnings = [];
let currentFile = null;
for (const raw of out.split(/\r?\n/)) {
  const fileMatch = raw.match(/^([A-Z]:[\\/].+?)(?::\d+:\d+)?$/);
  if (fileMatch && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(fileMatch[1])) { currentFile = fileMatch[1]; continue; }
  const m = raw.match(/^\s*(\d+):(\d+)\s+warning\s+'([^']+)'\s+(?:is (?:defined but never used|assigned a value but never used))/);
  if (!m || !currentFile) continue;
  warnings.push({ file: currentFile, line: parseInt(m[1], 10), col: parseInt(m[2], 10), name: m[3] });
}

// Group by file; process one file at a time to keep line-number coherence.
const byFile = {};
for (const w of warnings) (byFile[w.file] ||= []).push(w);

let importsRemoved = 0;

for (const [file, ws] of Object.entries(byFile)) {
  let text = fs.readFileSync(file, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";

  // Phase 1: remove unused names from import statements.
  // We do a regex pass per name; safer than line-based when imports span lines.
  for (const w of ws) {
    if (w.name.startsWith("_")) continue;
    // Match patterns:
    //  - `import { X } from "..."`  → remove whole import if X is the only one
    //  - `import { X, Y } from ...` → remove X, keep ", Y"
    //  - `import { Y, X } from ...` → remove ", X"
    //  - `import { X as Z }` → ignore (Z is the bound name, not X)
    // Operate per-import-statement to avoid global confusion.
    const importStmtRegex = /import\s*(?:type\s+)?\{([^}]*)\}\s*from\s*["'][^"']+["'];?/g;
    let modified = false;
    text = text.replace(importStmtRegex, (full, group) => {
      const items = group.split(",").map((s) => s.trim()).filter(Boolean);
      const filtered = items.filter((it) => {
        // it could be `X`, `type X`, `X as Y`, `type X as Y`
        const parts = it.split(/\s+as\s+/);
        const left = parts[0].replace(/^type\s+/, "").trim();
        const right = parts[1] ? parts[1].trim() : left;
        return right !== w.name;
      });
      if (filtered.length === items.length) return full;
      modified = true;
      if (filtered.length === 0) {
        // Whole import is empty — remove it
        return "";
      }
      return full.replace(/\{[^}]*\}/, "{ " + filtered.join(", ") + " }");
    });
    if (modified) importsRemoved++;
  }

  // Clean up any blank lines left from removed full-line imports.
  text = text.replace(/\r?\n\r?\n\r?\n+/g, eol + eol);

  fs.writeFileSync(file, text);
}

console.log("Imports removed: " + importsRemoved);
console.log("Run lint again to see what remains; remaining warnings need _ prefix or refactor.");
