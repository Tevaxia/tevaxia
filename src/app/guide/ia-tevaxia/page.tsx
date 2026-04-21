import { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import { ArticleJsonLd } from "@/components/JsonLd";
import RelatedGuides from "@/components/RelatedGuides";
import AutoLink from "@/components/AutoLink";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("guide.iaTevaxia"),
    getLocale(),
  ]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates("/guide/ia-tevaxia", locale),
  };
}

export default async function GuideIaTevaxia() {
  const [t, locale, tc] = await Promise.all([
    getTranslations("guide.iaTevaxia"),
    getLocale(),
    getTranslations("common"),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: t("faq1Q"), acceptedAnswer: { "@type": "Answer", text: t("faq1A") } },
      { "@type": "Question", name: t("faq2Q"), acceptedAnswer: { "@type": "Answer", text: t("faq2A") } },
      { "@type": "Question", name: t("faq3Q"), acceptedAnswer: { "@type": "Answer", text: t("faq3A") } },
    ],
  };

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link href={`${lp}/guide`} className="text-xs text-muted hover:text-navy">
          &larr; Guide immobilier LU
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-4 text-base text-slate-700 leading-relaxed"><AutoLink currentPath="/guide/ia-tevaxia">{t("intro")}</AutoLink></p>

        <h2 className="mt-8 text-xl font-semibold text-navy">{t("section1Title")}</h2>
        <p className="mt-3 text-base text-slate-700 leading-relaxed"><AutoLink currentPath="/guide/ia-tevaxia">{t("section1Content")}</AutoLink></p>

        <h2 className="mt-8 text-xl font-semibold text-navy">{t("section2Title")}</h2>
        <p className="mt-3 text-base text-slate-700 leading-relaxed"><AutoLink currentPath="/guide/ia-tevaxia">{t("section2Content")}</AutoLink></p>

        <h2 className="mt-8 text-xl font-semibold text-navy">{t("section3Title")}</h2>
        <p className="mt-3 text-base text-slate-700 leading-relaxed"><AutoLink currentPath="/guide/ia-tevaxia">{t("section3Content")}</AutoLink></p>

        <h2 className="mt-8 text-xl font-semibold text-navy">{t("section4Title")}</h2>
        <p className="mt-3 text-base text-slate-700 leading-relaxed"><AutoLink currentPath="/guide/ia-tevaxia">{t("section4Content")}</AutoLink></p>

        <p className="mt-8 text-xs text-muted">{tc("authorByline")} · {tc("authorBylineDate")}</p>

        <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 p-5">
          <Link
            href={`${lp}/profil`}
            className="inline-flex items-center gap-2 font-semibold text-navy hover:text-gold transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09Z" />
            </svg>
            {t("relatedToolLabel")}
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-navy">FAQ</h2>
          <div className="mt-4 space-y-4">
            <details className="group rounded-lg border border-card-border bg-white p-4">
              <summary className="cursor-pointer font-medium text-navy group-open:text-gold">{t("faq1Q")}</summary>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("faq1A")}</p>
            </details>
            <details className="group rounded-lg border border-card-border bg-white p-4">
              <summary className="cursor-pointer font-medium text-navy group-open:text-gold">{t("faq2Q")}</summary>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("faq2A")}</p>
            </details>
            <details className="group rounded-lg border border-card-border bg-white p-4">
              <summary className="cursor-pointer font-medium text-navy group-open:text-gold">{t("faq3Q")}</summary>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("faq3A")}</p>
            </details>
          </div>
        </section>

        <RelatedGuides currentSlug="ia-tevaxia" />

        <ArticleJsonLd headline={t("title")} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </div>
    </div>
  );
}
