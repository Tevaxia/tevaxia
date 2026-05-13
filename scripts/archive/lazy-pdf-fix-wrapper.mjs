#!/usr/bin/env node
// Fix wrapper lines that incorrectly use _lazy_X instead of X inside the
// typeof import() lookup and the awaited module call.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "C:/tevaxia/src/app";

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (e.endsWith(".tsx") || e.endsWith(".ts")) out.push(p);
  }
  return out;
}

let modified = 0;
for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const before = src;
  // Pattern: ["_lazy_generateXxxPdfBlob"] → ["generateXxxPdfBlob"]
  src = src.replace(/\["_lazy_(generate\w+)"\]/g, '["$1"]');
  // Pattern: )._lazy_generateXxxPdfBlob( → ).generateXxxPdfBlob(
  src = src.replace(/\)\._lazy_(generate\w+)\(/g, ").$1(");
  if (src !== before) {
    writeFileSync(file, src);
    modified++;
    console.log("  fixed:", file.replace(/^.*\/src\//, "src/"));
  }
}
console.log(`Done. ${modified} files fixed.`);
