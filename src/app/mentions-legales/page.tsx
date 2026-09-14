import { editorialPageMetadata } from "@/lib/editorial-seo";
import { getTranslations } from "next-intl/server";

export default async function MentionsLegales() {
  const t = await getTranslations("mentionsLegales");

  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-navy mb-8">{t("title")}</h1>
        <p className="text-muted mb-8">{t("lastUpdate")}</p>
        <div className="prose prose-sm text-slate space-y-6">

          {/* 1. Éditeur */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("editeur.title")}</h2>
            <p>
              {t("editeur.name")}<br />
              {t("editeur.auteur")}
            </p>
            <ul className="list-none pl-0 space-y-1 mt-2">
              <li>
                {t("editeur.linkedin")} :{" "}
                <a href="https://www.linkedin.com/in/erwanbargain" target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">{t("editeur.linkedinUrl")}</a>
              </li>
              <li>
                {t("editeur.expertise")} :{" "}
                <a href="https://bargain-expertise.fr" target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">{t("editeur.expertiseUrl")}</a>
              </li>
              <li>
                {t("editeur.contact")} :{" "}
                <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>
              </li>
            </ul>
            <p className="mt-2">{t("editeur.langues")}</p>
          </section>

          {/* 2. Hébergement */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("hebergement.title")}</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>{t("hebergement.frontend")}</strong> {t("hebergement.vercel")}</li>
              <li><strong>{t("hebergement.api")}</strong> {t("hebergement.render")}</li>
              <li><strong>{t("hebergement.db")}</strong> {t("hebergement.supabase")}</li>
              <li><strong>{t("hebergement.payments")}</strong> {t("hebergement.stripe")}</li>
              <li><strong>{t("hebergement.psd2")}</strong> {t("hebergement.enableBanking")}</li>
            </ul>
            <p className="mt-2">{t("hebergement.subdomain")}</p>
          </section>

          {/* 3. Propriété intellectuelle */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("propriete.title")}</h2>
            <p>{t("propriete.p1")}</p>
            <p>{t("propriete.p2")}</p>
          </section>

          {/* 4. Sources des données */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("sources.title")}</h2>
            <p>{t("sources.p1")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("sources.observatoire")}</li>
              <li>{t("sources.statec")}</li>
              <li>{t("sources.geoportail")}</li>
              <li>{t("sources.datapublic")}</li>
            </ul>
            <p className="mt-2">{t("sources.p2")}</p>
          </section>

          {/* 5. Limitation de responsabilité */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("disclaimer.title")}</h2>
            <p>{t("disclaimer.p1")}</p>
            <p>{t("disclaimer.p2")}</p>
            <p>{t("disclaimer.p3")}</p>
          </section>

          {/* 6. Droit applicable */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("droit.title")}</h2>
            <p>{t("droit.p1")}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export const generateMetadata = () => editorialPageMetadata("/mentions-legales");
