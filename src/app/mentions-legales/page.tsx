export default function MentionsLegales() {
  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-navy mb-8">Mentions légales</h1>
        <div className="prose prose-sm text-slate space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-navy">Éditeur du site</h2>
            <p>
              tevaxia.lu<br />
              Contact : <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Hébergement</h2>
            <p>Le site tevaxia.lu est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, calculateurs, graphiques, code source)
              est protégé par le droit d'auteur. Toute reproduction, même partielle, est
              soumise à autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Limitation de responsabilité</h2>
            <p>
              Les outils de calcul et de simulation proposés sur tevaxia.lu sont fournis à
              titre informatif uniquement. Ils ne constituent en aucun cas un conseil juridique,
              fiscal, financier ou en évaluation immobilière.
            </p>
            <p>
              Les résultats des calculateurs sont des estimations basées sur les barèmes et
              réglementations en vigueur à la date de leur dernière mise à jour. Ils ne
              sauraient se substituer à l'avis d'un professionnel qualifié (notaire, avocat,
              expert-comptable, évaluateur certifié).
            </p>
            <p>
              tevaxia.lu ne peut être tenu responsable des décisions prises sur la base des
              résultats de ses outils, ni des éventuelles erreurs dans les calculs ou les
              données utilisées.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Sources des données</h2>
            <p>
              Les données de marché utilisées proviennent de sources publiques ouvertes :
              Observatoire de l'Habitat (data.public.lu, licence CC0), STATEC, Administration
              de l'Enregistrement et des Domaines. Les coefficients de réévaluation, barèmes
              fiscaux et seuils réglementaires sont issus des textes de loi luxembourgeois
              en vigueur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Droit applicable</h2>
            <p>
              Le présent site est soumis au droit luxembourgeois. Tout litige relatif à
              l'utilisation du site sera de la compétence exclusive des tribunaux du
              Grand-Duché de Luxembourg.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
