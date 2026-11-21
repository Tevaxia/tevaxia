import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArticleJsonLd } from "@/components/JsonLd";

/** `title` is the guide's own headline (same text as its <title>), so the
 * guide no longer shares its H1 with the calculator it documents. */
export default async function AuditedFiscalGuide({ kind, title }: { kind: "pv" | "rent"; title: string }) {
  const [a, p, r, locale] = await Promise.all([getTranslations("fiscalGuideAudit"), getTranslations("plusValuesAudit"), getTranslations("calculLoyer"), getLocale()]);
  const pv = kind === "pv";
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const sections = pv ? [
    [p("transaction"), a("pvRegime"), p("scope")],
    [p("base"), p("transmission"), p("justificatifs")],
    [p("fiscalite"), a("pvAbat"), p("abatSuccessionHint"), p("rpHint")],
    [p("impots"), p("provision"), p("produitHint"), p("limitations")],
  ] : [
    [r("capitalInvestiTitle"), a("rentRule"), a("rentCoef"), r("capitalInvestiText")],
    [r("sectionVetuste"), r("vetusteWarningText"), r("terrainHint"), r("entretienHint")],
    [r("logementMeuble"), a("rentFurniture"), a("rentScope")],
    [r("resultCapitalInvesti"), a("rentExample")],
  ];
  const sources = pv ? [
    ["ACD — LIR 2026", "https://impotsdirects.public.lu/dam-assets/fr/legislation/LIR/texte-coordonn-en-vigueur-au-1er-janvier-2026-ver-08052026.pdf"],
    ["ACD — 700F 2025", "https://impotsdirects.public.lu/dam-assets/fr/formulaires/pers_physiques/2025/700F-2025.pdf"],
    ["ACD — résidence principale", "https://impotsdirects.public.lu/fr/az/v/vente_resid_principale.html"],
    ["ACD — demi-taux global", "https://impotsdirects.public.lu/fr/az/d/demi_txglob.html"],
  ] : [
    ["Loi modifiée du 21 septembre 2006 — article 3", "https://logement.public.lu/dam-assets/documents/legislation/lois/bl-loi-modifiee-du-21-09-2006-accessible.pdf"],
    ["ACD — article 102 LIR, tableaux annuels", "https://impotsdirects.public.lu/fr/legislation/LIR.html"],
    ["Ministère du Logement — exemple historique 2020", "https://logement.public.lu/dam-assets/documents/publications/bail/Brochure-capital-investi-Calcul-du-plafond-legal-du-loyer.pdf"],
  ];
  return <article className="mx-auto max-w-3xl px-4 py-10 space-y-8">
    <ArticleJsonLd headline={title} />
    <header><h1 className="text-2xl font-bold text-navy">{title}</h1><p className="mt-3 text-sm text-muted">{a("updated")}</p></header>
    {sections.map(([heading, ...paragraphs]) => <section key={heading} className="space-y-3"><h2 className="text-lg font-semibold">{heading}</h2>{paragraphs.map((text, i) => <p className="text-sm leading-relaxed" key={i}>{text}</p>)}</section>)}
    <Link className="inline-block rounded-lg bg-navy px-5 py-3 text-white" href={`${prefix}/${pv ? "plus-values" : "calculateur-loyer"}`}>{a("open")}</Link>
    <section><h2 className="text-lg font-semibold">{p("sources")}</h2><ul className="mt-3 space-y-3 list-disc pl-5">{sources.map(([label, url]) => <li key={url}><a className="underline break-words text-sm" href={url} target="_blank" rel="noopener noreferrer">{label}</a></li>)}</ul></section>
  </article>;
}
