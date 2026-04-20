#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const GUIDE_DIR = "src/app/guide";
const files = fs.readdirSync(GUIDE_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => path.join(GUIDE_DIR, d.name, "page.tsx"))
  .filter((p) => fs.existsSync(p));

let updated = 0;
for (const f of files) {
  const slug = path.basename(path.dirname(f));
  let content = fs.readFileSync(f, "utf8");

  if (content.includes('localizedAlternates')) {
    console.log(`SKIP (already done): ${slug}`);
    continue;
  }

  const nsMatch = content.match(/getTranslations\("guide\.([^"]+)"\)/);
  if (!nsMatch) {
    console.log(`SKIP (no namespace): ${slug}`);
    continue;
  }
  const ns = nsMatch[1];

  // Ensure getLocale is imported
  if (!content.includes("getLocale")) {
    content = content.replace(
      /import \{ getTranslations \} from "next-intl\/server";/,
      'import { getTranslations, getLocale } from "next-intl/server";',
    );
  }

  // Add seo import right after next-intl/server import
  if (!content.includes('from "@/lib/seo"')) {
    content = content.replace(
      /(import \{ getTranslations(?:, getLocale)? \} from "next-intl\/server";)/,
      `$1\nimport { localizedAlternates } from "@/lib/seo";`,
    );
  }

  // Rewrite generateMetadata body
  const oldMetaRE = new RegExp(
    `export async function generateMetadata\\(\\)\\s*:\\s*Promise<Metadata>\\s*\\{\\s*` +
    `const t = await getTranslations\\("guide\\.${ns}"\\);\\s*` +
    `return \\{\\s*` +
    `title: t\\("title"\\),\\s*` +
    `description: t\\("metaDescription"\\),\\s*` +
    `\\};\\s*` +
    `\\}`,
    "m",
  );

  const newMeta =
`export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("guide.${ns}"),
    getLocale(),
  ]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates("/guide/${slug}", locale),
  };
}`;

  if (!oldMetaRE.test(content)) {
    console.log(`SKIP (unexpected shape): ${slug}`);
    continue;
  }

  content = content.replace(oldMetaRE, newMeta);
  fs.writeFileSync(f, content, "utf8");
  console.log(`OK: ${slug}`);
  updated++;
}

console.log(`\nUpdated ${updated} files`);
