export default function Confidentialite() {
  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-navy mb-8">Privacy Policy</h1>
        <div className="prose prose-sm text-slate space-y-6">
          <p className="text-muted">Last updated: March 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-navy">1. Data Controller</h2>
            <p>
              tevaxia.lu<br />
              Contact: <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">2. Data Collected</h2>
            <p>
              <strong>Browsing data:</strong> When you visit the website, technical
              data may be collected automatically (IP address, browser type,
              pages visited, visit duration) via Google Analytics for audience
              measurement purposes.
            </p>
            <p>
              <strong>Data entered in the calculators:</strong> The data you enter
              in the calculation tools (amounts, areas, dates) is processed on the
              client side (in your browser) if you do not have an account. If you
              create an account, your saved valuations are stored on our servers
              (hosted by Supabase, European infrastructure) and associated with
              your account.
            </p>
            <p>
              <strong>User account:</strong> You can create an account via email/password
              or through a third-party service (Google, LinkedIn). In all cases, we collect
              your email address and name (as provided by the authentication service).
              Passwords are hashed and not readable. Your saved valuations (calculation
              parameters, results) are stored and accessible only by you. You may delete
              your account and all your data at any time by contacting us.
            </p>
            <p>
              <strong>Sign in via Google or LinkedIn:</strong> If you choose to sign in
              via Google or LinkedIn, we receive your name and email address from these
              services. We do not receive your Google or LinkedIn password, contacts, or
              any other data from your account. Authentication is handled by Supabase Auth
              via the OAuth 2.0 / OpenID Connect protocol. You can revoke access at any
              time from your Google account settings (myaccount.google.com) or LinkedIn
              security settings.
            </p>
            <p>
              <strong>Contact:</strong> If you contact us by email, we collect your
              email address and the content of your message solely for the purpose
              of responding to you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">3. Legal Basis for Processing</h2>
            <p>
              The processing of browsing data is based on your consent
              (Article 6(1)(a) GDPR). The processing of account data is based on
              the performance of a contract (Article 6(1)(b) -- provision of the
              cloud storage service). You may withdraw your consent at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">4. Cookies</h2>
            <p>
              The website uses cookies for audience measurement purposes (Google Analytics).
              These cookies collect anonymised information about website traffic.
              You may refuse them via your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">5. Data Retention Period</h2>
            <p>
              Browsing data is retained for a maximum of 14 months (standard
              Google Analytics duration). Contact emails are retained for the
              time necessary to process your request, then deleted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">6. Your Rights (GDPR)</h2>
            <p>
              In accordance with the General Data Protection Regulation (GDPR) and
              the Luxembourg law of 1 August 2018, you have the following rights:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Right of access to your personal data</li>
              <li>Right to rectification</li>
              <li>Right to erasure</li>
              <li>Right to restriction of processing</li>
              <li>Right to data portability</li>
              <li>Right to object</li>
            </ul>
            <p>
              To exercise these rights, contact us at{" "}
              <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">7. Supervisory Authority</h2>
            <p>
              In the event of a dispute, you may lodge a complaint with the
              Commission Nationale pour la Protection des Données (CNPD),
              15 Boulevard du Jazz, L-4370 Belvaux, Luxembourg.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">8. International Transfers</h2>
            <p>
              The use of Google Analytics involves a transfer of data to the
              United States. This transfer is governed by the European Commission's
              standard contractual clauses and the EU-US Data Privacy Framework
              adequacy decision.
            </p>
            <p>
              User account data is hosted by Supabase (AWS infrastructure,
              eu-central-1 region, Frankfurt). Passwords are hashed and are
              never stored in plain text.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
