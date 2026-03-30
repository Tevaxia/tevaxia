import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-card-border bg-navy-dark text-white/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo & description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-gold text-navy-dark font-bold text-sm">
                T
              </div>
              <span className="font-semibold text-white/80">
                tevaxia<span className="text-gold">.lu</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              Outils immobiliers pour le Luxembourg. Calculs fournis à titre indicatif.
            </p>
          </div>

          {/* Outils */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Outils</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/calculateur-loyer" className="hover:text-white transition-colors">Capital investi & Loyer</Link></li>
              <li><Link href="/frais-acquisition" className="hover:text-white transition-colors">Frais d'acquisition</Link></li>
              <li><Link href="/plus-values" className="hover:text-white transition-colors">Plus-values</Link></li>
              <li><Link href="/simulateur-aides" className="hover:text-white transition-colors">Simulateur d'aides</Link></li>
              <li><Link href="/valorisation" className="hover:text-white transition-colors">Valorisation EVS 2025</Link></li>
              <li><Link href="/outils-bancaires" className="hover:text-white transition-colors">Outils bancaires</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Contact</h3>
            <a
              href="mailto:contact@tevaxia.lu"
              className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              contact@tevaxia.lu
            </a>
            <p className="mt-3 text-xs text-white/40">
              Suggestion d'outil, signalement d'erreur,
              question — on répond.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/30">
          tevaxia.lu — Les calculs sont fournis à titre indicatif et ne constituent pas un conseil juridique, fiscal ou en évaluation.
        </div>
      </div>
    </footer>
  );
}
