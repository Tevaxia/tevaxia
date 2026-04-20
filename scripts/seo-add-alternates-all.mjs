#!/usr/bin/env node
/**
 * Bulk add alternates (canonical + hreflang) to all layout.tsx files.
 *
 * Skips:
 * - root locale layouts (src/app/de/layout.tsx etc.)
 * - dynamic [token] / [id] / [slug] routes (no shared canonical across locales)
 * - files already declaring alternates with "languages"
 */
import fs from "node:fs";
import path from "node:path";

const LOCALES = ["de", "en", "pt", "lb"];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name === "layout.tsx") out.push(p);
  }
  return out;
}

function parseLocaleAndPath(file) {
  const rel = file.replace(/\\/g, "/").replace(/^src\/app\//, "").replace(/\/layout\.tsx$/, "");
  const parts = rel.split("/");
  if (parts.length === 0 || (parts.length === 1 && LOCALES.includes(parts[0]))) {
    return null; // root or root locale layout
  }
  let locale = "fr";
  let segs = parts;
  if (LOCALES.includes(parts[0])) {
    locale = parts[0];
    segs = parts.slice(1);
  }
  if (segs.length === 0) return null;
  const pagePath = "/" + segs.join("/");
  if (pagePath.includes("[")) return null; // dynamic route
  return { locale, pagePath };
}

function transform(content, locale, pagePath) {
  if (content.includes("localizedAlternates")) return { content, action: "skip-already-done" };
  if (!content.includes("export const metadata")) return { content, action: "skip-no-metadata" };
  if (content.includes("languages:")) return { content, action: "skip-has-languages" };

  // Ensure import of seo helper
  if (!content.includes('from "@/lib/seo"')) {
    if (content.match(/^import type \{ Metadata \} from "next";/m)) {
      content = content.replace(
        /^import type \{ Metadata \} from "next";/m,
        `import type { Metadata } from "next";\nimport { localizedAlternates } from "@/lib/seo";`,
      );
    } else if (content.match(/^import \{ Metadata \} from "next";/m)) {
      content = content.replace(
        /^import \{ Metadata \} from "next";/m,
        `import { Metadata } from "next";\nimport { localizedAlternates } from "@/lib/seo";`,
      );
    } else {
      return { content, action: "skip-unexpected-import" };
    }
  }

  const alternateLine = `  alternates: localizedAlternates("${pagePath}", "${locale}"),`;

  // Case A: has existing `alternates: { canonical: "..." }` → replace the whole alternates block
  const existingAltRE = /\n  alternates:\s*\{[^}]*\},?/m;
  if (existingAltRE.test(content)) {
    content = content.replace(existingAltRE, `\n${alternateLine}`);
    return { content, action: "replaced-alternates" };
  }

  // Case B: no alternates — inject before closing brace of `export const metadata: Metadata = {...}`
  const metaRE = /(export const metadata: Metadata = \{[\s\S]*?)(\n\};)/m;
  if (!metaRE.test(content)) return { content, action: "skip-no-metadata-match" };
  content = content.replace(metaRE, (_m, head, tail) => {
    // Ensure head ends with comma
    const needsComma = !/,\s*$/.test(head);
    return `${head}${needsComma ? "," : ""}\n${alternateLine}${tail}`;
  });

  return { content, action: "added-alternates" };
}

const files = walk("src/app");
const counters = {};
let written = 0;

for (const f of files) {
  const info = parseLocaleAndPath(f);
  if (!info) { counters["skip-root-or-dynamic"] = (counters["skip-root-or-dynamic"] || 0) + 1; continue; }
  const original = fs.readFileSync(f, "utf8");
  const { content, action } = transform(original, info.locale, info.pagePath);
  counters[action] = (counters[action] || 0) + 1;
  if (content !== original) {
    fs.writeFileSync(f, content, "utf8");
    written++;
  }
}

console.log(`Processed ${files.length} layout files. Written: ${written}`);
console.log(counters);
