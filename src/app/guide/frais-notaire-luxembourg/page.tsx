import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import { ArticleJsonLd } from "@/components/JsonLd";
import RelatedGuides from "@/components/RelatedGuides";
import AutoLink from "@/components/AutoLink";
import GuideHero from "@/components/guide/GuideHero";
import KeyTakeaways from "@/components/guide/KeyTakeaways";
import TableOfContents, { type TocItem } from "@/components/guide/TableOfContents";
import GuideSection from "@/components/guide/GuideSection";
import Callout from "@/components/guide/Callout";
import DataTable from "@/components/guide/DataTable";
import InlineCalculator from "@/components/guide/InlineCalculator";
import OfficialSources, { type Source } from "@/components/guide/OfficialSources";
import FaqSection, { type FaqItem } from "@/components/guide/FaqSection";
import RelatedTools, { type Tool } from "@/components/guide/RelatedTools";

const PATH = "/guide/frais-notaire-luxembourg";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("guide.fraisNotaire"),
    getLocale(),
  ]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(PATH, locale),
  };
}

export default async function GuideFraisNotaire() {
  const t = await getTranslations("guide.fraisNotaire");

  const essentiel = t.raw("essentiel") as string[];
  const sources = t.raw("sources") as Source[];
  const faq = t.raw("faq") as FaqItem[];
  const tools = t.raw("tools") as Tool[];
  const tableHeaders = t.raw("table.headers") as string[];
  const tableRows = t.raw("table.rows") as (string | number)[][];

  const toc: TocItem[] = [
    { id: "droits", label: t("section1Title") },
    { id: "emoluments", label: t("section2Title") },
    { id: "hypotheque", label: t("section3Title") },
    { id: "exemples", label: t("section4Title") },
    { id: "faq", label: t("faqTitle") },
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
          readingMinutes={8}
          updatedAt="2026-04-26"
        />

        <KeyTakeaways items={essentiel} />

        <TableOfContents items={toc} />

        <GuideSection id="droits" number={1} title={t("section1Title")}>
          <p><AutoLink currentPath={PATH}>{t("section1P1")}</AutoLink></p>
          <p><AutoLink currentPath={PATH}>{t("section1P2")}</AutoLink></p>
          <Callout variant="info" title={t("callout1Title")}>{t("callout1Body")}</Callout>
        </GuideSection>

        <GuideSection id="emoluments" number={2} title={t("section2Title")}>
          <p><AutoLink currentPath={PATH}>{t("section2P1")}</AutoLink></p>
          <p><AutoLink currentPath={PATH}>{t("section2P2")}</AutoLink></p>
        </GuideSection>

        <GuideSection id="hypotheque" number={3} title={t("section3Title")}>
          <p><AutoLink currentPath={PATH}>{t("section3P1")}</AutoLink></p>
          <Callout variant="warning" title={t("callout2Title")}>{t("callout2Body")}</Callout>
        </GuideSection>

        <GuideSection id="exemples" number={4} title={t("section4Title")}>
          <p>{t("section4Intro")}</p>
          <DataTable
            caption={t("table.caption")}
            headers={tableHeaders}
            rows={tableRows}
            highlightCol={3}
            footnote={t("table.footnote")}
          />
          <Callout variant="example" title={t("callout3Title")}>{t("callout3Body")}</Callout>
        </GuideSection>

        <InlineCalculator
          title={t("inlineCalc.title")}
          description={t("inlineCalc.description")}
          href="/frais-acquisition"
          ctaLabel={t("inlineCalc.cta")}
        />

        <FaqSection items={faq} idPrefix="faq" />

        <OfficialSources sources={sources} />

        <RelatedTools tools={tools} />

        <RelatedGuides currentSlug="frais-notaire-luxembourg" />

        <ArticleJsonLd headline={t("title")} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </div>
    </article>
  );
}
