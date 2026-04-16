"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import SEOContent from "@/components/SEOContent";
import { formatEUR, formatEUR2 } from "@/lib/calculations";

// Indice des prix à la consommation (IPC) LU — STATEC
// Valeurs annuelles moyennes (base 100 = 2015). Référence : STATEC E1100.
// Maintenues à jour manuellement lors des publications annuelles.
const IPC_LU: Record<number, number> = {
  2000: 80.3,
  2005: 88.7,
  2010: 97.1,
  2015: 100.0,
  2016: 100.0,
  2017: 101.7,
  2018: 103.5,
  2019: 105.2,
  2020: 105.9,
  2021: 108.4,
  2022: 114.7,
  2023: 118.9,
  2024: 122.6,
  2025: 125.8,
  2026: 128.4,
};

function getIpc(year: number): number {
  if (IPC_LU[year]) return IPC_LU[year];
  const years = Object.keys(IPC_LU).map(Number).sort((a, b) => a - b);
  const nearest = years.reduce((prev, curr) =>
    Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
  );
  return IPC_LU[nearest];
}

export default function BailCommercial() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const currentYear = new Date().getFullYear();
  const [loyerInitial, setLoyerInitial] = useState(36000);
  const [anneeSignature, setAnneeSignature] = useState(currentYear - 6);
  const [anneeIndexation, setAnneeIndexation] = useState(currentYear);
  const [plafondIndexationPct, setPlafondIndexationPct] = useState(20);
  const [duree, setDuree] = useState<9 | 12 | 15 | 18 | 24 | 99>(9);

  const indexation = useMemo(() => {
    const ipcSignature = getIpc(anneeSignature);
    const ipcCible = getIpc(anneeIndexation);
    const coefficient = ipcCible / ipcSignature;
    const loyerIndexeBrut = loyerInitial * coefficient;
    const plafonne = plafondIndexationPct > 0 ? loyerInitial * (1 + plafondIndexationPct / 100) : Infinity;
    const loyerIndexe = Math.min(loyerIndexeBrut, plafonne);
    const evolutionBrutePct = (coefficient - 1) * 100;
    const indexPlafonne = loyerIndexeBrut > plafonne;

    return {
      ipcSignature,
      ipcCible,
      coefficient,
      loyerIndexeBrut,
      loyerIndexe,
      evolutionBrutePct,
      indexPlafonne,
    };
  }, [loyerInitial, anneeSignature, anneeIndexation, plafondIndexationPct]);

  const [pasDePtMontant, setPasDePtMontant] = useState(0);
  const [depotGarantieMois, setDepotGarantieMois] = useState(3);
  const [chargesAnnuelles, setChargesAnnuelles] = useState(0);

  const dureeLabel: Record<typeof duree, string> = {
    9: "9 ans (durée minimale légale LU)",
    12: "12 ans",
    15: "15 ans",
    18: "18 ans",
    24: "24 ans",
    99: "Durée libre (> 24 ans)",
  };

  const yearByYear = useMemo(() => {
    const rows: { year: number; ipc: number; coeff: number; loyerBrut: number; loyerPlaf: number; mensuel: number }[] = [];
    const ipcRef = getIpc(anneeSignature);
    const maxYear = Math.min(anneeSignature + (duree === 99 ? 25 : duree), currentYear + 3);
    for (let y = anneeSignature; y <= maxYear; y++) {
      const ipc = getIpc(y);
      const coeff = ipc / ipcRef;
      const loyerBrut = loyerInitial * coeff;
      const plafond = plafondIndexationPct > 0 ? loyerInitial * (1 + plafondIndexationPct / 100) : Infinity;
      const loyerPlaf = Math.min(loyerBrut, plafond);
      rows.push({ year: y, ipc, coeff, loyerBrut, loyerPlaf, mensuel: loyerPlaf / 12 });
    }
    return rows;
  }, [loyerInitial, anneeSignature, plafondIndexationPct, duree, currentYear]);

  const breakDates = useMemo(() => {
    if (duree === 99) return [];
    const dates: { year: number; label: string }[] = [];
    for (let i = 3; i <= duree; i += 3) {
      const y = anneeSignature + i;
      if (i === duree) {
        dates.push({ year: y, label: `Fin du bail (${i} ans)` });
      } else {
        dates.push({ year: y, label: `Période triennale n° ${i / 3} (résiliation possible)` });
      }
    }
    return dates;
  }, [anneeSignature, duree]);

  const totalCostDuree = useMemo(() => {
    const yearsInDuree = duree === 99 ? 25 : duree;
    let totalLoyers = 0;
    const ipcRef = getIpc(anneeSignature);
    for (let i = 0; i < yearsInDuree; i++) {
      const y = anneeSignature + i;
      const ipc = getIpc(y);
      const coeff = ipc / ipcRef;
      const lb = loyerInitial * coeff;
      const plafond = plafondIndexationPct > 0 ? loyerInitial * (1 + plafondIndexationPct / 100) : Infinity;
      totalLoyers += Math.min(lb, plafond);
    }
    const totalCharges = chargesAnnuelles * yearsInDuree;
    const depotGarantie = (loyerInitial / 12) * depotGarantieMois;
    return { totalLoyers, totalCharges, pasDePt: pasDePtMontant, depotGarantie, total: totalLoyers + totalCharges + pasDePtMontant };
  }, [loyerInitial, anneeSignature, plafondIndexationPct, duree, chargesAnnuelles, pasDePtMontant, depotGarantieMois]);

  return (
    <div className="bg-background py-8 sm:py-12 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`${lp}/`} className="text-xs text-muted hover:text-navy">← tevaxia.lu</Link>
          <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Bail commercial LU — indexation &amp; durée</h1>
          <p className="mt-2 text-sm text-muted">
            Calcul de l&apos;indexation du loyer selon l&apos;IPC luxembourgeois (STATEC) et rappel des règles
            applicables au bail commercial (loi du 3 février 2018).
          </p>
        </div>

        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 mb-6 text-xs text-amber-900">
          <strong>⚠ Important :</strong> contrairement au bail d&apos;habitation, la règle des 5 % (plafond légal de loyer)
          <strong> ne s&apos;applique pas</strong> au bail commercial. Le loyer est librement convenu à la signature,
          puis encadré par les clauses d&apos;indexation négociées entre les parties.
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-base font-semibold text-navy">Loyer initial &amp; dates</h2>
              <div className="mt-3 space-y-3">
                <InputField
                  label="Loyer annuel initial (hors charges)"
                  value={loyerInitial}
                  onChange={(v) => setLoyerInitial(Number(v) || 0)}
                  suffix="€"
                  min={1000}
                />
                <InputField
                  label="Année de signature du bail"
                  value={anneeSignature}
                  onChange={(v) => setAnneeSignature(Number(v) || currentYear)}
                  min={2000}
                  max={currentYear}
                />
                <InputField
                  label="Année de l'indexation calculée"
                  value={anneeIndexation}
                  onChange={(v) => setAnneeIndexation(Number(v) || currentYear)}
                  min={anneeSignature}
                  max={currentYear + 3}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-base font-semibold text-navy">Clauses du bail</h2>
              <div className="mt-3 space-y-3">
                <InputField
                  label="Durée du bail"
                  type="select"
                  value={String(duree)}
                  onChange={(v) => setDuree(Number(v) as typeof duree)}
                  options={(Object.keys(dureeLabel) as string[]).map((k) => ({
                    value: k,
                    label: dureeLabel[Number(k) as typeof duree],
                  }))}
                />
                <InputField
                  label="Plafond d'indexation total (% vs loyer initial)"
                  value={plafondIndexationPct}
                  onChange={(v) => setPlafondIndexationPct(Number(v) || 0)}
                  suffix="%"
                  hint="Usuel : 15-25 %. Au-delà, le locataire peut demander la révision judiciaire (art. 1757-4 Code civil)."
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-base font-semibold text-navy">Coûts complémentaires</h2>
              <div className="mt-3 space-y-3">
                <InputField
                  label="Pas-de-porte (droit d'entrée)"
                  value={pasDePtMontant}
                  onChange={(v) => setPasDePtMontant(Number(v) || 0)}
                  suffix="€"
                  hint="Somme versée en une fois à la signature, non récupérable."
                  min={0}
                />
                <InputField
                  label="Dépôt de garantie"
                  value={depotGarantieMois}
                  onChange={(v) => setDepotGarantieMois(Number(v) || 0)}
                  suffix="mois de loyer"
                  hint="Usuel : 3 à 12 mois. Restitué en fin de bail (sauf dégradations)."
                  min={0}
                  max={24}
                />
                <InputField
                  label="Charges annuelles (provisions)"
                  value={chargesAnnuelles}
                  onChange={(v) => setChargesAnnuelles(Number(v) || 0)}
                  suffix="€/an"
                  min={0}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">
                Loyer indexé à {anneeIndexation}
              </div>
              <div className="mt-2 text-3xl font-bold">{formatEUR(indexation.loyerIndexe)} /an</div>
              <div className="mt-1 text-sm text-white/80">
                Soit {formatEUR(indexation.loyerIndexe / 12)} /mois
              </div>
              <div className="mt-4 text-xs text-white/90 space-y-0.5">
                <div>IPC {anneeSignature} : {formatEUR2(indexation.ipcSignature)}</div>
                <div>IPC {anneeIndexation} : {formatEUR2(indexation.ipcCible)}</div>
                <div>Coefficient : × {indexation.coefficient.toFixed(4)}</div>
                <div>Évolution brute : +{indexation.evolutionBrutePct.toFixed(2)} %</div>
              </div>
              {indexation.indexPlafonne && (
                <div className="mt-3 rounded-lg bg-white/15 p-2 text-xs">
                  Indexation plafonnée : l&apos;IPC aurait donné {formatEUR(indexation.loyerIndexeBrut)},
                  mais votre clause limite à +{plafondIndexationPct} % du loyer initial.
                </div>
              )}
            </div>

            <ResultPanel
              title="Rappels réglementaires — bail commercial LU"
              lines={[
                { label: "Durée minimale légale", value: "9 ans (loi du 03.02.2018)", sub: true },
                { label: "Période triennale", value: "Résiliation possible tous les 3 ans (préavis 6 mois)", sub: true },
                { label: "Renouvellement automatique", value: "Sauf congé donné 6 mois avant terme", sub: true },
                { label: "Indice d'indexation LU", value: "IPC STATEC (pas d'ILC/ILAT équivalent LU)", sub: true },
                { label: "Règle des 5 %", value: "Ne s'applique PAS aux baux commerciaux", highlight: true },
                { label: "Forme", value: "Écrit obligatoire si > 9 ans (art. 1715 Code civil)", sub: true },
              ]}
            />

            {/* Coût total du bail */}
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-base font-semibold text-navy">Coût total du bail ({duree === 99 ? "25" : duree} ans)</h2>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted">Loyers cumulés (indexés)</span><span className="font-medium">{formatEUR(totalCostDuree.totalLoyers)}</span></div>
                {totalCostDuree.totalCharges > 0 && (
                  <div className="flex justify-between"><span className="text-muted">Charges cumulées</span><span className="font-medium">{formatEUR(totalCostDuree.totalCharges)}</span></div>
                )}
                {totalCostDuree.pasDePt > 0 && (
                  <div className="flex justify-between"><span className="text-muted">Pas-de-porte</span><span className="font-medium">{formatEUR(totalCostDuree.pasDePt)}</span></div>
                )}
                <div className="flex justify-between border-t border-card-border pt-1.5">
                  <span className="text-muted">Dépôt de garantie (immobilisé)</span>
                  <span className="font-medium">{formatEUR(totalCostDuree.depotGarantie)}</span>
                </div>
                <div className="flex justify-between border-t border-card-border pt-1.5 text-sm font-semibold text-navy">
                  <span>Coût total occupation</span>
                  <span>{formatEUR(totalCostDuree.total)}</span>
                </div>
                <div className="text-muted pt-1">
                  Soit {formatEUR(totalCostDuree.total / (duree === 99 ? 25 : duree))} /an en moyenne
                </div>
              </div>
            </div>

            {/* Dates de résiliation triennale */}
            {breakDates.length > 0 && (
              <div className="rounded-xl border border-card-border bg-card p-5">
                <h2 className="text-base font-semibold text-navy">Périodes triennales</h2>
                <div className="mt-3 space-y-1 text-xs">
                  {breakDates.map((d) => (
                    <div key={d.year} className="flex justify-between">
                      <span className="text-muted">{d.label}</span>
                      <span className="font-medium text-navy">{d.year}</span>
                    </div>
                  ))}
                  <div className="mt-2 text-muted">
                    Préavis de 6 mois par LRAR avant chaque échéance triennale.
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
              <strong>Clauses fréquentes à vérifier :</strong> pas-de-porte, dépôt de garantie
              (3-12 mois), charges déductibles, destination des lieux, droit au renouvellement,
              indemnité d&apos;éviction en cas de non-renouvellement.
            </div>
          </div>
        </div>

        {/* Tableau d'indexation année par année */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy">Tableau d&apos;indexation IPC — année par année</h2>
          <p className="mt-1 text-xs text-muted">
            Évolution du loyer indexé de {anneeSignature} à {yearByYear[yearByYear.length - 1]?.year ?? anneeSignature}
            · IPC STATEC (base 100 = 2015) · plafond contractuel : {plafondIndexationPct > 0 ? `+${plafondIndexationPct} %` : "aucun"}
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border bg-background text-left text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-3 py-2">Année</th>
                  <th className="px-3 py-2 text-right">IPC STATEC</th>
                  <th className="px-3 py-2 text-right">Coefficient</th>
                  <th className="px-3 py-2 text-right">Loyer brut indexé</th>
                  <th className="px-3 py-2 text-right">Loyer plafonné</th>
                  <th className="px-3 py-2 text-right">Mensuel</th>
                  <th className="px-3 py-2 text-right">Évol. vs initial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50">
                {yearByYear.map((r) => {
                  const isRef = r.year === anneeSignature;
                  const isCible = r.year === anneeIndexation;
                  const evolPct = ((r.loyerPlaf / loyerInitial) - 1) * 100;
                  return (
                    <tr key={r.year} className={isRef ? "bg-blue-50/40" : isCible ? "bg-emerald-50/40" : ""}>
                      <td className="px-3 py-1.5 font-medium text-navy">
                        {r.year} {isRef && <span className="text-[10px] text-blue-600">(réf.)</span>} {isCible && <span className="text-[10px] text-emerald-600">(cible)</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">{r.ipc.toFixed(1)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">× {r.coeff.toFixed(4)}</td>
                      <td className="px-3 py-1.5 text-right">{formatEUR(r.loyerBrut)}</td>
                      <td className={`px-3 py-1.5 text-right font-medium ${r.loyerBrut > r.loyerPlaf ? "text-amber-700" : "text-navy"}`}>
                        {formatEUR(r.loyerPlaf)}
                        {r.loyerBrut > r.loyerPlaf && <span className="text-[10px] text-amber-600"> (plaf.)</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right">{formatEUR(r.mensuel)}</td>
                      <td className="px-3 py-1.5 text-right text-muted">{evolPct >= 0 ? "+" : ""}{evolPct.toFixed(1)} %</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SEOContent
        ns="bailCommercial"
        sections={[
          { titleKey: "contextTitle", contentKey: "contextContent" },
          { titleKey: "indexationTitle", contentKey: "indexationContent" },
          { titleKey: "dureeTitle", contentKey: "dureeContent" },
        ]}
        faq={[
          { questionKey: "faq1q", answerKey: "faq1a" },
          { questionKey: "faq2q", answerKey: "faq2a" },
          { questionKey: "faq3q", answerKey: "faq3a" },
          { questionKey: "faq4q", answerKey: "faq4a" },
        ]}
        relatedLinks={[
          { href: "/calculateur-loyer", labelKey: "loyer" },
          { href: "/valorisation", labelKey: "valorisation" },
          { href: "/dcf-multi", labelKey: "dcfMulti" },
        ]}
      />
    </div>
  );
}
