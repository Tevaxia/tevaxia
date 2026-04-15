"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { computeE2Score } from "@/lib/hotellerie/e2-score";

function formatEUR(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

const DIAG_BG: Record<string, string> = {
  "rejet probable": "from-rose-500 to-rose-700",
  "à renforcer": "from-amber-500 to-amber-700",
  "favorable": "from-emerald-500 to-emerald-700",
  "très favorable": "from-emerald-600 to-emerald-800",
};

export default function ScoreE2Page() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [capitalInvesti, setCapitalInvesti] = useState(750000);
  const [coutTotalProjet, setCoutTotalProjet] = useState(1000000);
  const [fondsEngages, setFondsEngages] = useState(true);
  const [revenuPrevisionnelAnnuel, setRevenuPrevisionnelAnnuel] = useState(180000);
  const [minimumVitalAnnuel, setMinimumVitalAnnuel] = useState(80000);
  const [emploisCreesOuMaintenus, setEmploisCreesOuMaintenus] = useState(6);
  const [isHotelActif, setIsHotelActif] = useState(true);

  const result = useMemo(() => {
    try {
      return computeE2Score({
        capitalInvesti,
        coutTotalProjet,
        fondsEngages,
        revenuPrevisionnelAnnuel,
        minimumVitalAnnuel,
        emploisCreesOuMaintenus,
        isHotelActif,
      });
    } catch {
      return null;
    }
  }, [capitalInvesti, coutTotalProjet, fondsEngages, revenuPrevisionnelAnnuel, minimumVitalAnnuel, emploisCreesOuMaintenus, isHotelActif]);

  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-rose-900 via-rose-800 to-rose-700 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href={`${lp}/hotellerie`}
            className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Hub hôtellerie
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Score visa E-2 / investisseur</h1>
          <p className="mt-2 text-lg text-white/70">
            5 sous-tests USCIS : substantiality, at-risk, marginality, real &amp; operating, job creation
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">Investissement</h2>
              <div className="mt-4 grid gap-4">
                <InputField
                  label="Capital personnel investi"
                  value={capitalInvesti}
                  onChange={(v) => setCapitalInvesti(Number(v) || 0)}
                  suffix="€"
                  hint="Equity réellement engagé (hors prêt bancaire)"
                  min={0}
                />
                <InputField
                  label="Coût total du projet"
                  value={coutTotalProjet}
                  onChange={(v) => setCoutTotalProjet(Number(v) || 0)}
                  suffix="€"
                  hint="Acquisition + travaux + working capital"
                  min={1}
                />
                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-input-border bg-input-bg p-3">
                  <input
                    type="checkbox"
                    checked={fondsEngages}
                    onChange={(e) => setFondsEngages(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-input-border"
                  />
                  <div>
                    <div className="text-sm font-medium text-navy">Fonds réellement engagés (at-risk test)</div>
                    <p className="text-xs text-muted">
                      Escrow signé, compromis avec acompte, contrat travaux signés. Une simple intention
                      de virement ne suffit pas pour USCIS.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">Performance attendue &amp; emplois</h2>
              <div className="mt-4 grid gap-4">
                <InputField
                  label="Revenu prévisionnel annuel (net pour la famille)"
                  value={revenuPrevisionnelAnnuel}
                  onChange={(v) => setRevenuPrevisionnelAnnuel(Number(v) || 0)}
                  suffix="€"
                  hint="Salaire/distribution net après imposition US"
                  min={0}
                />
                <InputField
                  label="Minimum vital annuel famille (US)"
                  value={minimumVitalAnnuel}
                  onChange={(v) => setMinimumVitalAnnuel(Number(v) || 0)}
                  suffix="€"
                  hint="Référence US poverty guidelines × 1,5 selon état + composition foyer"
                  min={1}
                />
                <InputField
                  label="Emplois US créés ou maintenus (FTE)"
                  value={emploisCreesOuMaintenus}
                  onChange={(v) => setEmploisCreesOuMaintenus(Math.max(0, Number(v) || 0))}
                  hint="Hors investisseur et famille — équivalents temps plein US"
                  min={0}
                />
                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-input-border bg-input-bg p-3">
                  <input
                    type="checkbox"
                    checked={isHotelActif}
                    onChange={(e) => setIsHotelActif(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-input-border"
                  />
                  <div>
                    <div className="text-sm font-medium text-navy">Hôtel en exploitation active (real &amp; operating)</div>
                    <p className="text-xs text-muted">
                      Doit être un vrai business actif, pas une simple holding ou un investissement
                      passif (à décocher uniquement si projet de transformation purement passive).
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                <div className={`rounded-xl bg-gradient-to-br ${DIAG_BG[result.diagnostic]} p-6 text-white shadow-lg`}>
                  <div className="text-sm uppercase tracking-wider text-white/80 font-semibold">
                    Score E-2
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-5xl font-bold">{result.scoreTotal}</span>
                    <span className="text-2xl text-white/80">/ 100</span>
                  </div>
                  <div className="mt-2 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                    Diagnostic : {result.diagnostic}
                  </div>
                </div>

                <ResultPanel
                  title="Détail des 5 sous-tests USCIS"
                  lines={[
                    { label: "Substantiality (capital substantiel)", value: `${result.scoreSubstantiality} / 30 — ratio ${(result.ratioCapital * 100).toFixed(0)} %`, highlight: true },
                    { label: "At-risk (fonds engagés)", value: `${result.scoreAtRisk} / 15`, warning: result.scoreAtRisk === 0 },
                    { label: "Marginality (revenu > minimum vital)", value: `${result.scoreMarginality} / 25 — ratio ${result.ratioRevenu.toFixed(2)}x`, warning: result.scoreMarginality < 10 },
                    { label: "Real & operating (business actif)", value: `${result.scoreRealOperating} / 10`, warning: result.scoreRealOperating === 0 },
                    { label: "Job creation (emplois créés)", value: `${result.scoreJobCreation} / 20`, warning: result.scoreJobCreation === 0 },
                    { label: "Total", value: `${result.scoreTotal} / 100`, highlight: true, large: true },
                  ]}
                />

                {result.redFlags.length > 0 && (
                  <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-5">
                    <div className="flex items-center gap-2 text-rose-800 font-semibold">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      Points d&apos;attention ({result.redFlags.length})
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-rose-900">
                      {result.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500"></span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-xl border border-card-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-navy">Synthèse chiffres</h3>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="flex justify-between border-b border-card-border/50 py-1">
                      <dt className="text-muted">Capital investi</dt>
                      <dd className="font-medium text-navy">{formatEUR(capitalInvesti)}</dd>
                    </div>
                    <div className="flex justify-between border-b border-card-border/50 py-1">
                      <dt className="text-muted">Coût total projet</dt>
                      <dd className="font-medium text-navy">{formatEUR(coutTotalProjet)}</dd>
                    </div>
                    <div className="flex justify-between border-b border-card-border/50 py-1">
                      <dt className="text-muted">Ratio capital</dt>
                      <dd className="font-medium text-navy">{(result.ratioCapital * 100).toFixed(0)} %</dd>
                    </div>
                    <div className="flex justify-between border-b border-card-border/50 py-1">
                      <dt className="text-muted">Ratio revenu / minimum vital</dt>
                      <dd className="font-medium text-navy">{result.ratioRevenu.toFixed(2)}x</dd>
                    </div>
                  </dl>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
                Vérifiez les valeurs saisies (coût projet et minimum vital &gt; 0).
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>Avertissement :</strong> ce score reproduit les critères publiés par USCIS et la jurisprudence
          consulaire (FAM 9 9 FAM 402.9-6) mais ne remplace pas une analyse par un avocat US en
          immigration. Les décisions consulaires comportent une part discrétionnaire. Aucune réponse
          USCIS n&apos;est garantie par le simple respect d&apos;un score.
        </div>
      </div>
    </div>
  );
}
