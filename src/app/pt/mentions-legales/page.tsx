export default function MentionsLegales() {
  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-navy mb-8">Legal Notice</h1>
        <div className="prose prose-sm text-slate space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-navy">Website Publisher</h2>
            <p>
              tevaxia.lu<br />
              Contact: <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Hosting</h2>
            <p>The website tevaxia.lu is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Intellectual Property</h2>
            <p>
              All content on this website (text, calculators, charts, source code)
              is protected by copyright. Any reproduction, even partial, is
              subject to prior authorisation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Limitation of Liability</h2>
            <p>
              The calculation and simulation tools provided on tevaxia.lu are for
              informational purposes only. They do not constitute legal, tax,
              financial or property valuation advice under any circumstances.
            </p>
            <p>
              The results produced by the calculators are estimates based on the
              schedules and regulations in force at the date of their last update.
              They are not a substitute for the advice of a qualified professional
              (notary, lawyer, chartered accountant, certified valuer).
            </p>
            <p>
              tevaxia.lu shall not be held liable for any decisions made on the
              basis of the results of its tools, nor for any errors in the
              calculations or data used.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Data Sources</h2>
            <p>
              The market data used originates from publicly available sources:
              Observatoire de l'Habitat (data.public.lu, CC0 licence), STATEC,
              Administration de l'Enregistrement et des Domaines. The revaluation
              coefficients, tax schedules and regulatory thresholds are derived
              from current Luxembourg legislation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Applicable Law</h2>
            <p>
              This website is governed by Luxembourg law. Any dispute relating to
              the use of this website shall fall under the exclusive jurisdiction
              of the courts of the Grand Duchy of Luxembourg.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
