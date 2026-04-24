#!/usr/bin/env node
// Accurate scan: for each `t(...)` call, find the CLOSEST preceding useTranslations()
// in the same function scope. Not perfect but beats naive global matching.

import fs from 'node:fs';
import path from 'node:path';

const fr = JSON.parse(fs.readFileSync('src/messages/fr.json','utf8'));

function walkKeys(obj, prefix=[]) {
  const r = [];
  for (const [k,v] of Object.entries(obj)) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) r.push(...walkKeys(v, [...prefix, k]));
    else r.push(prefix.concat(k).join('.'));
  }
  return r;
}
const allKeys = new Set(walkKeys(fr));

function scanFile(f) {
  const c = fs.readFileSync(f,'utf8');
  // Match all const <name> = useTranslations("<ns>") with byte offset
  const rxUseT = /const\s+(\w+)\s*=\s*useTranslations\s*\(\s*["']([^"']+)["']/g;
  const scopes = [];
  let m;
  while ((m = rxUseT.exec(c)) !== null) {
    scopes.push({ offset: m.index, varName: m[1], ns: m[2] });
  }
  if (scopes.length === 0) return [];

  // For each t call, find closest preceding scope
  const missing = [];
  // Match any <varName>(<key>) where varName is any known scope
  const varNames = [...new Set(scopes.map(s => s.varName))];
  if (varNames.length === 0) return [];
  const pattern = new RegExp('\\b(' + varNames.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\s*\\(\\s*["\'`]([a-zA-Z0-9_.]+)["\'`]', 'g');
  while ((m = pattern.exec(c)) !== null) {
    const offset = m.index;
    const varName = m[1];
    const key = m[2];
    // Find last scope before this offset with matching varName
    let closest = null;
    for (const s of scopes) {
      if (s.offset < offset && s.varName === varName) {
        if (!closest || s.offset > closest.offset) closest = s;
      }
    }
    if (!closest) continue;
    const fullKey = closest.ns + '.' + key;
    if (!allKeys.has(fullKey)) missing.push(fullKey);
  }
  return missing;
}

function walkDir(dir) {
  const files = [];
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walkDir(p));
    else if (e.isFile() && /\.(tsx?|jsx?)$/.test(e.name)) files.push(p);
  }
  return files;
}

const allMissing = new Map();
for (const dir of ['src/app','src/components']) {
  if (!fs.existsSync(dir)) continue;
  for (const f of walkDir(dir)) {
    const miss = scanFile(f);
    for (const k of miss) {
      if (!allMissing.has(k)) allMissing.set(k, new Set());
      allMissing.get(k).add(f);
    }
  }
}

console.log('Total unique missing keys:', allMissing.size);
for (const [k, files] of [...allMissing.entries()].sort()) {
  const fl = [...files].map(f => f.replace(/\\/g,'/').replace('src/','')).slice(0,3).join(', ');
  console.log('  '+k+'  ←  '+fl);
}
