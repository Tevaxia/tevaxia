import { getTranslations } from "next-intl/server";
import { ArticleJsonLd } from "@/components/JsonLd";
import RelatedGuides from "@/components/RelatedGuides";
import AutoLink from "@/components/AutoLink";
import GuideHero from "./GuideHero";
import KeyTakeaways from "./KeyTakeaways";
import TableOfContents, { type TocItem } from "./TableOfContents";
import GuideSection from "./GuideSection";
import Callout from "./Callout";
import DataTable from "./DataTable";
import InlineCalculator from "./InlineCalculator";
import OfficialSources, { type Source } from "./OfficialSources";
import FaqSection, { type FaqItem } from "./FaqSection";
import RelatedTools, { type Tool } from "./RelatedTools";

type SectionConfig = {
  id: string;
  paragraphs: number;
  callout?: { variant: "info" | "warning" | "example" | "tip"; key: string };
};

type Props = {
  namespace: string;
  slug: string;
  sections: SectionConfig[];
  hasTable?: boolean;
  highlightCol?: number;
  inlineCalculatorHref: string;
  readingMinutes: number;
  updatedAt?: string;
};

export default async function GuideTemplate({
  namespace,
  slug,
  sections,
  hasTable = false,
  highlightCol = 3,
  inlineCalculatorHref,
  readingMinutes,
  updatedAt = "2026-04-26",
}: Props) {
  const [t, tc] = await Promise.all([getTranslations(namespace), getTranslations("common")]);
  const path = `/guide/${slug}`;

  const essentiel = t.raw("essentiel") as string[];
  const sources = t.raw("sources") as Source[];
  const faq = t.raw("faq") as FaqItem[];
  const tools = t.raw("tools") as Tool[];

  const toc: TocItem[] = [
    ...sections.map((s, i) => ({ id: s.id, label: t(`section${i + 1}Title`) })),
    { id: "faq", label: tc("faqTitle") },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <article className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <GuideHero
          title={t("title")}
          subtitle={t("subtitle")}
          category={t("category")}
          readingMinutes={readingMinutes}
          updatedAt={updatedAt}
        />

        <KeyTakeaways items={essentiel} />

        <TableOfContents items={toc} />

        {sections.map((s, i) => {
          const num = i + 1;
          return (
            <GuideSection key={s.id} id={s.id} number={num} title={t(`section${num}Title`)}>
              {Array.from({ length: s.paragraphs }).map((_, p) => (
                <p key={p}>
                  <AutoLink currentPath={path}>{t(`section${num}P${p + 1}`)}</AutoLink>
                </p>
              ))}
              {s.callout && (
                <Callout variant={s.callout.variant} title={t(`${s.callout.key}Title`)}>
                  {t(`${s.callout.key}Body`)}
                </Callout>
              )}
              {hasTable && i === sections.length - 1 && (
                <DataTable
                  caption={t("table.caption")}
                  headers={t.raw("table.headers") as string[]}
                  rows={t.raw("table.rows") as (string | number)[][]}
                  highlightCol={highlightCol}
                  footnote={t("table.footnote")}
                />
              )}
            </GuideSection>
          );
        })}

        <InlineCalculator
          title={t("inlineCalc.title")}
          description={t("inlineCalc.description")}
          href={inlineCalculatorHref}
          ctaLabel={t("inlineCalc.cta")}
        />

        <FaqSection items={faq} idPrefix="faq" />

        <OfficialSources sources={sources} />

        <RelatedTools tools={tools} />

        <RelatedGuides currentSlug={slug} />

        <ArticleJsonLd headline={t("title")} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </div>
    </article>
  );
}
