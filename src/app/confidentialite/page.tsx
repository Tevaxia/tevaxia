export default function Confidentialite() {
  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-navy mb-8">Politique de confidentialité</h1>
        <div className="prose prose-sm text-slate space-y-6">
          <p className="text-muted">Dernière mise à jour : mars 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-navy">1. Responsable du traitement</h2>
            <p>
              tevaxia.lu<br />
              Contact : <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">2. Données collectées</h2>
            <p>
              <strong>Données de navigation :</strong> Lors de votre visite, des données
              techniques peuvent être collectées automatiquement (adresse IP, type de
              navigateur, pages visitées, durée de visite) via Google Analytics à des fins
              de mesure d'audience.
            </p>
            <p>
              <strong>Données saisies dans les calculateurs :</strong> Les données que vous
              entrez dans les outils de calcul (montants, surfaces, dates) sont traitées
              exclusivement côté client (dans votre navigateur). Elles ne sont ni transmises
              à nos serveurs, ni stockées, ni partagées avec des tiers.
            </p>
            <p>
              <strong>Contact :</strong> Si vous nous contactez par email, nous collectons
              votre adresse email et le contenu de votre message dans le seul but de vous
              répondre.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">3. Base légale du traitement</h2>
            <p>
              Le traitement des données de navigation repose sur votre consentement
              (article 6.1.a du RGPD). Vous pouvez retirer votre consentement à tout
              moment en paramétrant votre navigateur ou en nous contactant.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">4. Cookies</h2>
            <p>
              Le site utilise des cookies à des fins de mesure d'audience (Google Analytics).
              Ces cookies permettent de collecter des informations anonymisées sur la
              fréquentation du site. Vous pouvez les refuser via les paramètres de votre
              navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">5. Durée de conservation</h2>
            <p>
              Les données de navigation sont conservées pendant 14 mois maximum (durée
              standard Google Analytics). Les emails de contact sont conservés le temps
              nécessaire au traitement de votre demande, puis supprimés.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">6. Vos droits (RGPD)</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à
              la loi luxembourgeoise du 1er août 2018, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit d'opposition</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à{" "}
              <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">7. Autorité de contrôle</h2>
            <p>
              En cas de litige, vous pouvez introduire une réclamation auprès de la
              Commission Nationale pour la Protection des Données (CNPD),
              15 Boulevard du Jazz, L-4370 Belvaux, Luxembourg.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">8. Transferts internationaux</h2>
            <p>
              L'utilisation de Google Analytics implique un transfert de données vers les
              États-Unis. Ce transfert est encadré par les clauses contractuelles types
              de la Commission européenne et la décision d'adéquation UE-US Data Privacy
              Framework.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
