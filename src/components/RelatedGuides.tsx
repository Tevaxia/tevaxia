import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { getRelatedGuides } from "@/lib/guides";

export default async function RelatedGuides({ currentSlug, max = 3 }: { currentSlug: string; max?: number }) {
  const [t, tc, locale] = await Promise.all([
    getTranslations("guideHub"),
    getTranslations("common"),
    getLocale(),
  ]);
  const related = getRelatedGuides(currentSlug, max);
  if (related.length === 0) return null;

  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <section className="mt-10 border-t border-card-border pt-8">
      <h2 className="text-lg font-semibold text-navy">{tc("relatedGuidesTitle")}</h2>
      <p className="mt-1 text-sm text-muted">{tc("relatedGuidesSubtitle")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {related.map((g) => (
          <Link
            key={g.slug}
            href={`${lp}/guide/${g.slug}`}
            className="group rounded-xl border border-card-border bg-card p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="text-sm font-semibold text-navy group-hover:text-gold transition-colors">
              {t(g.titleKey)}
            </div>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-3">
              {t(g.descKey)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
