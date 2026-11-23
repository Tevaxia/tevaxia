import { getTranslations } from "next-intl/server";
import ProductLanding from "@/components/product/ProductLanding";

// Présentation du logiciel de gestion locative. Le portefeuille lui-même
// s'ouvre sur `/gestion-locative/portefeuille`, derrière la connexion.
export default async function GestionLocativeLanding() {
  const t = await getTranslations("productPages.rental.sources");
  return (
    <ProductLanding
      product="rental"
      path="/gestion-locative"
      openHref="/gestion-locative/portefeuille"
      links={[
        "/calculateur-loyer",
        "/gestion-locative/etat-des-lieux",
        "/gestion-locative/reconciliation",
        "/gestion-locative/ais",
        "/gestion-locative/assurance-impayes",
      ]}
    >
      <section className="border-t border-card-border py-8" aria-labelledby="rental-sources-title">
        <div className="mx-auto flex max-w-7xl flex-wrap items-baseline gap-x-6 gap-y-2 px-4 text-sm sm:px-6 lg:px-8">
          <h2 id="rental-sources-title" className="font-bold uppercase tracking-wider text-navy">{t("title")}</h2>
          <a className="text-navy underline hover:no-underline" href="https://logement.public.lu/fr/proprietaire/logement-location/faq-bail-a-loyer.html" target="_blank" rel="noreferrer">{t("rent")}</a>
          <a className="text-navy underline hover:no-underline" href="https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement-conseil-energie.html" target="_blank" rel="noreferrer">{t("energy")}</a>
        </div>
      </section>
    </ProductLanding>
  );
}
