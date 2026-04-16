import { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ArticleJsonLd } from "@/components/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guide.tva3Pourcent");
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function GuideTva3Pourcent() {
  const [t, locale, tc] = await Promise.all([
    getTranslations("guide.tva3Pourcent"),
    getLocale(),
    getTranslations("common"),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: t("faq1Q"),
        acceptedAnswer: { "@type": "Answer", text: t("faq1A") },
      },
      {
        "@type": "Question",
        name: t("faq2Q"),
        acceptedAnswer: { "@type": "Answer", text: t("faq2A") },
      },
    ],
  };

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link
          href={`${lp}/guide`}
          className="text-xs text-muted hover:text-navy"
        >
          &larr; Guide immobilier LU
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-navy sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-base text-slate-700 leading-relaxed">
          {t("intro")}
        </p>

        <h2 className="mt-8 text-xl font-semibold text-navy">
          {t("section1Title")}
        </h2>
        <p className="mt-3 text-base text-slate-700 leading-relaxed">
          {t("section1Content")}
        </p>

        <h2 className="mt-8 text-xl font-semibold text-navy">
          {t("section2Title")}
        </h2>
        <p className="mt-3 text-base text-slate-700 leading-relaxed">
          {t("section2Content")}
        </p>

        <h2 className="mt-8 text-xl font-semibold text-navy">
          {t("section3Title")}
        </h2>
        <p className="mt-3 text-base text-slate-700 leading-relaxed">
          {t("section3Content")}
        </p>

        <p className="mt-8 text-xs text-muted">{tc("authorByline")} · {tc("authorBylineDate")}</p>

        <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 p-5">
          <Link
            href={`${lp}${t("relatedToolLink")}`}
            className="inline-flex items-center gap-2 font-semibold text-navy hover:text-gold transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zM5.25 21h13.5A2.25 2.25 0 0021 18.75V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v12A2.25 2.25 0 005.25 21z"
              />
            </svg>
            {t("relatedToolLabel")}
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-navy">FAQ</h2>
          <div className="mt-4 space-y-4">
            <details className="group rounded-lg border border-card-border bg-white p-4">
              <summary className="cursor-pointer font-medium text-navy group-open:text-gold">
                {t("faq1Q")}
              </summary>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {t("faq1A")}
              </p>
            </details>
            <details className="group rounded-lg border border-card-border bg-white p-4">
              <summary className="cursor-pointer font-medium text-navy group-open:text-gold">
                {t("faq2Q")}
              </summary>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {t("faq2A")}
              </p>
            </details>
          </div>
        </section>

        <ArticleJsonLd headline={t("title")} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </div>
    </div>
  );
}
