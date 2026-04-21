import Link from "next/link";
import { getLocale } from "next-intl/server";
import { LINK_TERMS, type LinkTerm } from "@/lib/auto-link-terms";
import type { ReactNode } from "react";

type Match = { start: number; end: number; href: string; label: string };

function findMatches(text: string, term: LinkTerm): Match[] {
  const haystack = term.caseSensitive ? text : text.toLowerCase();
  const needle = term.caseSensitive ? term.term : term.term.toLowerCase();
  const matches: Match[] = [];
  const wordChar = /[\p{L}\p{N}]/u;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    const before = idx === 0 ? "" : text[idx - 1];
    const after = idx + needle.length >= text.length ? "" : text[idx + needle.length];
    if (!wordChar.test(before) && !wordChar.test(after)) {
      matches.push({
        start: idx,
        end: idx + needle.length,
        href: term.href,
        label: text.slice(idx, idx + needle.length),
      });
      break; // only first occurrence per term
    }
    idx += needle.length;
  }
  return matches;
}

type Props = {
  children: string;
  currentPath?: string;
  max?: number;
};

export default async function AutoLink({ children, currentPath, max = 3 }: Props) {
  const locale = await getLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const text = children;
  const usedHrefs = new Set<string>();
  const candidates: Match[] = [];

  for (const term of LINK_TERMS) {
    if (usedHrefs.has(term.href)) continue;
    if (currentPath && term.href === currentPath) continue;
    const matches = findMatches(text, term);
    if (matches.length > 0) {
      candidates.push(matches[0]);
      usedHrefs.add(term.href);
    }
  }

  candidates.sort((a, b) => a.start - b.start);

  const picked: Match[] = [];
  let cursor = -1;
  for (const m of candidates) {
    if (picked.length >= max) break;
    if (m.start < cursor) continue;
    picked.push(m);
    cursor = m.end;
  }

  if (picked.length === 0) return <>{text}</>;

  const nodes: ReactNode[] = [];
  let pos = 0;
  for (const m of picked) {
    if (m.start > pos) nodes.push(text.slice(pos, m.start));
    nodes.push(
      <Link
        key={m.start}
        href={`${lp}${m.href}`}
        className="text-navy underline decoration-gold/50 underline-offset-2 hover:decoration-gold transition-colors"
      >
        {m.label}
      </Link>
    );
    pos = m.end;
  }
  if (pos < text.length) nodes.push(text.slice(pos));

  return <>{nodes}</>;
}
