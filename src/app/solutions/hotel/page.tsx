import { editorialPageMetadata } from "@/lib/editorial-seo";

import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";

export default async function HotelSolutionPage() {
  const [t, locale] = await Promise.all([getTranslations("hotelMarketing"), getLocale()]);
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const cards = [
    { route: "valorisation", title: "value", desc: "valueDesc" },
    { route: "dscr", title: "coverage", desc: "coverageDesc" },
    { route: "exploitation", title: "operating", desc: "operatingDesc" },
    { route: "score-e2", title: "e2", desc: "e2Desc" },
    { route: "due-diligence", title: "dd", desc: "ddDesc" },
    { route: "groupe", title: "group", desc: "groupDesc" },
  ];
  return <div className="bg-background">
    <section className="bg-navy px-4 py-14 text-white sm:py-20"><div className="mx-auto max-w-6xl">
      <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/85">{t("description")}</p>
      <div className="mt-7 flex flex-wrap gap-3"><Link className="rounded-lg bg-gold px-5 py-3 font-semibold text-navy" href={`${prefix}/hotellerie`}>{t("tools")}</Link><Link className="rounded-lg border border-white/50 px-5 py-3" href={`${prefix}/pms`}>{t("pms")}</Link></div>
    </div></section>
    <section className="mx-auto max-w-6xl px-4 py-10"><h2 className="text-2xl font-semibold">{t("tools")}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(card => <Link data-hotel-solution={card.route} key={card.route} href={`${prefix}/hotellerie/${card.route}`} className="min-w-0 rounded-xl border border-card-border bg-card p-5 transition hover:border-navy"><h3 className="text-lg font-semibold">{t(card.title)}</h3><p className="mt-3 text-sm leading-relaxed text-slate">{t(card.desc)}</p></Link>)}</div>
      <p className="mt-6 rounded-lg border p-4 text-sm leading-relaxed">{t("scope")}</p>
      <div className="mt-8 rounded-xl border border-card-border bg-card p-6"><h2 className="text-xl font-semibold">{t("setupTitle")}</h2><p className="mt-3 text-sm leading-relaxed">{t("pmsDesc")}</p><p className="mt-3 text-sm leading-relaxed">{t("setupDesc")}</p><Link className="mt-4 inline-block underline" href={`${prefix}/pms`}>{t("pms")}</Link></div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2"><section className="rounded-xl border p-5"><h2 className="text-lg font-semibold">{t("taxTitle")}</h2><p className="mt-3 text-sm leading-relaxed">{t("taxDesc")}</p><a className="mt-4 inline-block text-sm underline" href="https://pfi.public.lu/fr/citoyen/tva/taux-tva.html" target="_blank" rel="noreferrer">{t("sources")} — TVA</a></section><section className="rounded-xl border p-5"><h2 className="text-lg font-semibold">{t("greenTitle")}</h2><p className="mt-3 text-sm leading-relaxed">{t("greenDesc")}</p><a className="mt-4 inline-block text-sm underline" href="https://www.greenkey.global/criteria-20262031" target="_blank" rel="noreferrer">{t("sources")} — Green Key</a></section></div>
      <div className="mt-8 rounded-xl bg-navy p-6 text-white"><h2 className="text-xl font-semibold">{t("ctaTitle")}</h2><p className="mt-3 text-sm text-white/85">{t("ctaDesc")}</p><Link className="mt-4 inline-block rounded-lg bg-gold px-5 py-3 font-semibold text-navy" href={`${prefix}/pricing`}>{t("pricing")}</Link></div>
    </section>
  </div>;
}

export const generateMetadata = () => editorialPageMetadata("/solutions/hotel");
