import { getTranslations } from "next-intl/server";

export default async function Confidentialite() {
  const t = await getTranslations("confidentialite");

  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-navy mb-8">{t("title")}</h1>
        <p className="text-muted mb-8">{t("lastUpdate")}</p>
        <div className="prose prose-sm text-slate space-y-6">

          {/* 1. Responsable du traitement */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("responsable.title")}</h2>
            <p>
              {t("responsable.name")}<br />
              {t("responsable.contact")} :{" "}
              <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>
            </p>
          </section>

          {/* 2. Données collectées */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("donnees.title")}</h2>
            <p>
              <strong>{t("donnees.navigation.label")}</strong><br />
              {t("donnees.navigation.text")}
            </p>
            <p>
              <strong>{t("donnees.compte.label")}</strong><br />
              {t("donnees.compte.text")}
            </p>
            <p>
              <strong>{t("donnees.oauth.label")}</strong><br />
              {t("donnees.oauth.text")}
            </p>
            <p>
              <strong>{t("donnees.simulations.label")}</strong><br />
              {t("donnees.simulations.text")}
            </p>
            <p>
              <strong>{t("donnees.profil.label")}</strong><br />
              {t("donnees.profil.text")}
            </p>
          </section>

          {/* 3. Finalités */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("finalites.title")}</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("finalites.fonctionnement")}</li>
              <li>{t("finalites.sauvegarde")}</li>
              <li>{t("finalites.personnalisation")}</li>
              <li>{t("finalites.amelioration")}</li>
            </ul>
          </section>

          {/* 4. Base légale */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("baseLegale.title")}</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>{t("baseLegale.consentement.label")}</strong> {t("baseLegale.consentement.text")}</li>
              <li><strong>{t("baseLegale.contrat.label")}</strong> {t("baseLegale.contrat.text")}</li>
              <li><strong>{t("baseLegale.interet.label")}</strong> {t("baseLegale.interet.text")}</li>
            </ul>
            <p className="mt-2">{t("baseLegale.retrait")}</p>
          </section>

          {/* 5. Sous-traitants */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("soustraitants.title")}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate/20">
                    <th className="text-left py-2 pr-4 font-semibold">{t("soustraitants.headerName")}</th>
                    <th className="text-left py-2 pr-4 font-semibold">{t("soustraitants.headerRole")}</th>
                    <th className="text-left py-2 font-semibold">{t("soustraitants.headerLocation")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate/10">
                  <tr>
                    <td className="py-2 pr-4">Supabase Inc.</td>
                    <td className="py-2 pr-4">{t("soustraitants.supabase")}</td>
                    <td className="py-2">{t("soustraitants.supabaseLoc")}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Vercel Inc.</td>
                    <td className="py-2 pr-4">{t("soustraitants.vercel")}</td>
                    <td className="py-2">{t("soustraitants.vercelLoc")}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Render.com</td>
                    <td className="py-2 pr-4">{t("soustraitants.render")}</td>
                    <td className="py-2">{t("soustraitants.renderLoc")}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Google LLC</td>
                    <td className="py-2 pr-4">{t("soustraitants.google")}</td>
                    <td className="py-2">{t("soustraitants.googleLoc")}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">LinkedIn (Microsoft)</td>
                    <td className="py-2 pr-4">{t("soustraitants.linkedin")}</td>
                    <td className="py-2">{t("soustraitants.linkedinLoc")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Durée de conservation */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("duree.title")}</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("duree.compte")}</li>
              <li>{t("duree.simulations")}</li>
              <li>{t("duree.liensPartages")}</li>
              <li>{t("duree.cookies")}</li>
            </ul>
          </section>

          {/* 7. Droits */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("droits.title")}</h2>
            <p>{t("droits.intro")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("droits.acces")}</li>
              <li>{t("droits.rectification")}</li>
              <li>{t("droits.effacement")}</li>
              <li>{t("droits.portabilite")}</li>
              <li>{t("droits.opposition")}</li>
            </ul>
            <p className="mt-2">
              {t("droits.exercer")}{" "}
              <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>.
            </p>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("cookies.title")}</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>{t("cookies.techniques.label")}</strong> {t("cookies.techniques.text")}</li>
              <li><strong>{t("cookies.analytiques.label")}</strong> {t("cookies.analytiques.text")}</li>
              <li><strong>{t("cookies.auth.label")}</strong> {t("cookies.auth.text")}</li>
            </ul>
          </section>

          {/* 9. Transferts hors UE */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("transferts.title")}</h2>
            <p>{t("transferts.p1")}</p>
            <p>{t("transferts.p2")}</p>
          </section>

          {/* 10. Sécurité */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("securite.title")}</h2>
            <p>{t("securite.intro")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("securite.https")}</li>
              <li>{t("securite.csp")}</li>
              <li>{t("securite.rls")}</li>
              <li>{t("securite.hash")}</li>
            </ul>
          </section>

          {/* 11. DPO / Contact */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("dpo.title")}</h2>
            <p>
              {t("dpo.text")}{" "}
              <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>.
            </p>
          </section>

          {/* 12. Réclamation */}
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("reclamation.title")}</h2>
            <p>{t("reclamation.text")}</p>
            <p className="mt-2">
              Commission Nationale pour la Protection des Donn&eacute;es (CNPD)<br />
              15 Boulevard du Jazz, L-4370 Belvaux, Luxembourg<br />
              <a href="https://cnpd.public.lu" className="text-navy hover:underline" target="_blank" rel="noopener noreferrer">cnpd.public.lu</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
