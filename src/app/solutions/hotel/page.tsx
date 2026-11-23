import { editorialPageMetadata } from "@/lib/editorial-seo";

import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import ProductLanding from "@/components/product/ProductLanding";

// Présentation du PMS hôtelier, suivie des outils d'analyse hôtelière en accès
// libre. Le PMS lui-même s'ouvre sur `/pms`, derrière la connexion.
export default async function HotelSolutionPage() {
  const [t, tp, locale] = await Promise.all([
    getTranslations("hotelMarketing"),
    getTranslations("productPages.pms.links"),
    getLocale(),
  ]);
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const cards = [
    { route: "valorisation", title: "value", desc: "valueDesc" },
    { route: "dscr", title: "coverage", desc: "coverageDesc" },
    { route: "exploitation", title: "operating", desc: "operatingDesc" },
    { route: "score-e2", title: "e2", desc: "e2Desc" },
    { route: "due-diligence", title: "dd", desc: "ddDesc" },
    { route: "groupe", title: "group", desc: "groupDesc" },
  ];
  return (
    <ProductLanding product="pms" path="/solutions/hotel" openHref="/pms" links={[]}>
      <section className="border-t border-card-border py-14 sm:py-16" aria-labelledby="hotel-tools-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="hotel-tools-title" className="text-2xl font-bold text-navy sm:text-3xl">{tp("title")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(card => (
              <Link data-hotel-solution={card.route} key={card.route} href={`${prefix}/hotellerie/${card.route}`} className="min-w-0 rounded-xl border border-card-border bg-card p-5 transition hover:border-navy">
                <h3 className="text-lg font-semibold text-navy">{t(card.title)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate">{t(card.desc)}</p>
              </Link>
            ))}
          </div>
          <p className="mt-6 rounded-lg border border-card-border p-4 text-sm leading-relaxed text-slate">{t("scope")}</p>
          <p className="mt-4 text-sm">
            <Link className="font-medium text-navy underline hover:no-underline" href={`${prefix}/hotellerie`}>{t("tools")}</Link>
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-card-border p-5">
              <h3 className="text-lg font-semibold text-navy">{t("taxTitle")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate">{t("taxDesc")}</p>
              <a className="mt-4 inline-block text-sm underline" href="https://pfi.public.lu/fr/citoyen/tva/taux-tva.html" target="_blank" rel="noreferrer">{t("sources")} — TVA</a>
            </div>
            <div className="rounded-xl border border-card-border p-5">
              <h3 className="text-lg font-semibold text-navy">{t("greenTitle")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate">{t("greenDesc")}</p>
              <a className="mt-4 inline-block text-sm underline" href="https://www.greenkey.global/criteria-20262031" target="_blank" rel="noreferrer">{t("sources")} — Green Key</a>
            </div>
          </div>
        </div>
      </section>
    </ProductLanding>
  );
}

export const generateMetadata = () => editorialPageMetadata("/solutions/hotel");
