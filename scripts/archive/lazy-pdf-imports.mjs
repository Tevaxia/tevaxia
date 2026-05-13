#!/usr/bin/env node
// One-shot: convert static `import { generateXxxPdfBlob, PdfButton }` from
// ToolsPdf/EnergyPdf into PdfButton-only static + dynamic generateXxx via
// await import(). Splits ~3 MB of @react-pdf/renderer out of every page's
// initial chunk into a lazy chunk loaded only on "Download PDF" click.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "C:/tevaxia/src";

const TARGETS = [
  { from: "@/components/ToolsPdf", lazyFrom: "@/components/ToolsPdf" },
  { from: "@/components/energy/EnergyPdf", lazyFrom: "@/components/energy/EnergyPdf" },
];

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
  // Skip ToolsPdf / EnergyPdf / PdfButton themselves and PortfolioPdf / ValuationReport
  // (they need to keep their static imports for internal helpers)
  if (file.includes("ToolsPdf.tsx") || file.includes("EnergyPdf.tsx") ||
      file.includes("PdfButton.tsx") || file.includes("PortfolioPdf.tsx") ||
      file.includes("ValuationReport.tsx")) continue;

  let src = readFileSync(file, "utf8");
  let changed = false;

  for (const { from, lazyFrom } of TARGETS) {
    // Match: import { generateXxxPdfBlob[, ..., PdfButton] } from "FROM";
    // Or:    import { PdfButton[, generateXxxPdfBlob] } from "FROM";
    const re = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${from.replace(/[/]/g, "\\/")}['"];?`, "g");
    src = src.replace(re, (full, body) => {
      const names = body.split(",").map((n) => n.trim()).filter(Boolean);
      const generates = names.filter((n) => /^generate[A-Z]/.test(n));
      const others = names.filter((n) => !/^generate[A-Z]/.test(n));
      // Only handle the common case: at most one generate*PdfBlob in the import
      if (generates.length === 0) return full;
      changed = true;
      const lines = [];
      // Re-import PdfButton (and any other non-generate names) from new PdfButton module
      // when "PdfButton" is among others.
      const hasPdfButton = others.includes("PdfButton");
      const otherNames = others.filter((n) => n !== "PdfButton");
      if (hasPdfButton) lines.push(`import { PdfButton } from "@/components/PdfButton";`);
      if (otherNames.length > 0) {
        // Keep non-generate, non-PdfButton names static (rare case)
        lines.push(`import { ${otherNames.join(", ")} } from "${from}";`);
      }
      // Generate functions become async lazy wrappers (one per name).
      for (const gname of generates) {
        const wrapperName = `_lazy_${gname}`;
        lines.push(`const ${wrapperName} = async (...args: Parameters<typeof import("${lazyFrom}")["${gname}"]>): Promise<Blob> => (await import("${lazyFrom}")).${gname}(...args);`);
      }
      return lines.join("\n");
    });

    // Now rewrite all callsites: generateXxxPdfBlob(...) → _lazy_generateXxxPdfBlob(...)
    // BUT only after the import has been replaced above.
    if (changed) {
      for (const gname of (src.match(/_lazy_generate\w+/g) || []).map((n) => n.replace(/^_lazy_/, ""))) {
        const callRe = new RegExp(`\\b${gname}\\b(?!\\w)`, "g");
        src = src.replace(callRe, (match, offset, fullSrc) => {
          // Don't replace inside the import line we just wrote (already _lazy_…)
          const surround = fullSrc.slice(Math.max(0, offset - 10), offset);
          if (surround.endsWith("_lazy_")) return match;
          return `_lazy_${gname}`;
        });
      }
    }
  }

  if (changed) {
    writeFileSync(file, src);
    modified++;
    console.log("  modified:", file.replace(/^.*\/src\//, "src/"));
  }
}

console.log(`Done. ${modified} files updated.`);
