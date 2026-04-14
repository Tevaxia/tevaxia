"use client";

import LocaleLink from "./LocaleLink";
import { useTranslations } from "next-intl";

const TOOL_KEYS: Record<string, string> = {
  estimation: "/estimation",
  frais: "/frais-acquisition",
  loyer: "/calculateur-loyer",
  aides: "/simulateur-aides",
  plusValues: "/plus-values",
  achatLocation: "/achat-vs-location",
  valorisation: "/valorisation",
  vefa: "/vefa",
  bancaire: "/outils-bancaires",
  carte: "/carte",
};

export default function RelatedTools({ keys }: { keys: string[] }) {
  const t = useTranslations("nav");
  const tools = keys.filter((k) => TOOL_KEYS[k]);
  if (tools.length === 0) return null;

  return (
    <div className="mt-8 border-t border-card-border pt-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {tools.map((key) => (
          <LocaleLink key={key} href={TOOL_KEYS[key]}
            className="rounded-xl border border-card-border bg-card p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="text-sm font-semibold text-navy">{t(key)}</div>
          </LocaleLink>
        ))}
      </div>
    </div>
  );
}
