// Prefix remaining unused vars with `_` and remove unused-disable-directives.
// Reads a fresh `npm run lint` output, then edits files line-by-line.
import fs from "fs";
import { execSync } from "child_process";

execSync("npm run lint > .lint-output.tmp 2>&1", { stdio: "ignore" });
const out = fs.readFileSync(".lint-output.tmp", "utf8");

const items = [];
let cf = null;
for (const raw of out.split(/\r?\n/)) {
  const fm = raw.match(/^([A-Z]:[\\/].+?)(?::\d+:\d+)?$/);
  if (fm && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(fm[1])) { cf = fm[1]; continue; }
  const ud = raw.match(/^\s*(\d+):(\d+)\s+warning\s+Unused eslint-disable directive/);
  if (ud && cf) { items.push({ type: "unused-disable", file: cf, line: parseInt(ud[1], 10) }); continue; }
  const uv = raw.match(/^\s*(\d+):(\d+)\s+warning\s+'([^']+)'/);
  if (uv && cf && /no-unused-vars/.test(raw)) {
    items.push({ type: "unused-var", file: cf, line: parseInt(uv[1], 10), col: parseInt(uv[2], 10), name: uv[3] });
  }
}

const byFile = {};
for (const it of items) (byFile[it.file] ||= []).push(it);

let renamed = 0;
let removed = 0;

for (const [file, its] of Object.entries(byFile)) {
  const text = fs.readFileSync(file, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);

  its.sort((a, b) => b.line - a.line);

  for (const it of its) {
    const idx = it.line - 1;
    if (it.type === "unused-disable") {
      if (/eslint-disable/.test(lines[idx])) {
        lines.splice(idx, 1);
        removed++;
      }
      continue;
    }
    if (it.name.startsWith("_")) continue;
    const line = lines[idx];
    const escaped = it.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("\\b" + escaped + "\\b");
    if (re.test(line)) {
      lines[idx] = line.replace(re, "_" + it.name);
      renamed++;
    }
  }

  fs.writeFileSync(file, lines.join(eol));
}

console.log("Renamed (prefixed _): " + renamed);
console.log("Unused disable directives removed: " + removed);
