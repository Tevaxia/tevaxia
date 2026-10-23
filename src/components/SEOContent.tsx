"use client";

import LocaleLink from "./LocaleLink";
import { useTranslations } from "next-intl";

// ============================================================
// SEO CONTENT — Expert guide section below each tool
// ============================================================
// Renders structured content with FAQ schema.org markup
// for Google rich snippets. Content comes from i18n keys.

interface FAQItem {
  questionKey: string;
  answerKey: string;
}

interface RelatedLink {
  href: string;
  labelKey: string;
}

interface SEOSection {
  titleKey: string;
  contentKey: string;
}

interface SEOContentProps {
  /** Translation namespace (e.g., "estimation", "fraisAcquisition") */
  ns: string;
  /** Ordered sections to render as H2 blocks */
  sections: SEOSection[];
  /** FAQ items for rich snippets */
  faq: FAQItem[];
  /** Related tools for internal linking */
  relatedLinks: RelatedLink[];
}

export default function SEOContent({ ns, sections, faq, relatedLinks }: SEOContentProps) {
  const t = useTranslations(`${ns}.seo`);
  const tn = useTranslations("nav");

  // Build FAQ JSON-LD for Google rich snippets
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: t(item.questionKey),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(item.answerKey),
      },
    })),
  };

  return (
    <section className="mt-8 sm:mt-12 border-t border-card-border bg-background">
      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <article className="mx-auto max-w-4xl px-4 py-12 [overflow-wrap:anywhere] sm:px-6 lg:px-8">
        {/* Guide sections */}
        {sections.map((section) => (
          <section key={section.titleKey} className="mb-10">
            <h2 className="text-xl font-bold text-navy mb-4">
              {t(section.titleKey)}
            </h2>
            <div
              className="prose prose-sm max-w-none text-muted leading-relaxed"
              // These reviewed catalog entries contain HTML, not ICU rich-text messages.
              dangerouslySetInnerHTML={{ __html: t.raw(section.contentKey) }}
            />
          </section>
        ))}

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-navy mb-6">
              {t("faqTitle")}
            </h2>
            <div className="space-y-4">
              {faq.map((item) => (
                <details
                  key={item.questionKey}
                  className="group rounded-xl border border-card-border bg-card"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-navy">
                    {t(item.questionKey)}
                    <svg
                      className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-muted leading-relaxed">
                    {t(item.answerKey)}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related tools */}
        {relatedLinks.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-navy mb-4">
              {t("relatedTitle")}
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedLinks.map((link) => (
                <LocaleLink
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm font-medium text-navy hover:bg-navy/5 transition-colors"
                >
                  {tn(link.labelKey)}
                </LocaleLink>
              ))}
            </div>
          </section>
        )}
      </article>
    </section>
  );
}
