"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import {
  calculerLTV,
  calculerMensualite,
  calculerCapaciteEmprunt,
  genererTableauAmortissement,
  calculerDSCR,
  formatEUR,
  formatEUR2,
  formatPct,
} from "@/lib/calculations";

type ActiveTab = "ltv" | "capacite" | "amortissement" | "dscr";

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "ltv", label: "LTV" },
  { id: "capacite", label: "Capacité d'emprunt" },
  { id: "amortissement", label: "Amortissement" },
  { id: "dscr", label: "DSCR" },
];

function TabLTV() {
  const [valeurBien, setValeurBien] = useState(750000);
  const [montantPret, setMontantPret] = useState(600000);

  const ltv = calculerLTV({ valeurBien, montantPret });
  const ltvColor = ltv > 0.9 ? "text-error" : ltv > 0.8 ? "text-warning" : "text-success";
  const ltvLabel =
    ltv > 0.9 ? "Élevé — risque accru" : ltv > 0.8 ? "Acceptable — attention" : "Sain";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Paramètres LTV</h2>
          <div className="space-y-4">
            <InputField label="Valeur du bien" value={valeurBien} onChange={(v) => setValeurBien(Number(v))} suffix="€" />
            <InputField label="Montant du prêt" value={montantPret} onChange={(v) => setMontantPret(Number(v))} suffix="€" />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
          <div className="text-sm text-muted">Loan-to-Value (LTV)</div>
          <div className={`mt-2 text-5xl font-bold ${ltvColor}`}>
            {(ltv * 100).toFixed(1)} %
          </div>
          <div className={`mt-2 text-sm font-medium ${ltvColor}`}>{ltvLabel}</div>
          <div className="mt-4 text-xs text-muted">Apport : {formatEUR(valeurBien - montantPret)} ({formatPct(1 - ltv)})</div>
        </div>
        <ResultPanel
          title="Seuils prudentiels"
          lines={[
            { label: "LTV ≤ 80%", value: "Standard résidentiel", sub: true },
            { label: "LTV ≤ 90%", value: "Primo-accédant (avec conditions)", sub: true },
            { label: "LTV > 90%", value: "Nécessite garantie État", sub: true, warning: true },
            { label: "Valeur prudente CRR/EBA", value: formatEUR(valeurBien * 0.85), sub: true },
          ]}
        />
      </div>
    </div>
  );
}

function TabCapacite() {
  const [revenuNet, setRevenuNet] = useState(5000);
  const [charges, setCharges] = useState(500);
  const [tauxEndettement, setTauxEndettement] = useState(40);
  const [tauxInteret, setTauxInteret] = useState(3.5);
  const [duree, setDuree] = useState(25);

  const result = useMemo(
    () =>
      calculerCapaciteEmprunt({
        revenuNetMensuel: revenuNet,
        chargesMensuelles: charges,
        tauxEndettementMax: tauxEndettement / 100,
        tauxInteret: tauxInteret / 100,
        dureeAnnees: duree,
      }),
    [revenuNet, charges, tauxEndettement, tauxInteret, duree]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">Revenus & Charges</h2>
        <div className="space-y-4">
          <InputField label="Revenu net mensuel" value={revenuNet} onChange={(v) => setRevenuNet(Number(v))} suffix="€" />
          <InputField label="Charges mensuelles existantes" value={charges} onChange={(v) => setCharges(Number(v))} suffix="€" hint="Crédits en cours, pensions..." />
          <InputField label="Taux d'endettement max" value={tauxEndettement} onChange={(v) => setTauxEndettement(Number(v))} suffix="%" min={10} max={50} />
          <InputField label="Taux d'intérêt" value={tauxInteret} onChange={(v) => setTauxInteret(Number(v))} suffix="%" step={0.1} />
          <InputField label="Durée du prêt" value={duree} onChange={(v) => setDuree(Number(v))} suffix="ans" min={5} max={35} />
        </div>
      </div>
      <div className="space-y-6">
        <ResultPanel
          title="Résultats"
          lines={[
            { label: "Mensualité max disponible", value: formatEUR2(result.mensualiteMax) },
            { label: "Capacité d'emprunt", value: formatEUR(result.capaciteEmprunt), highlight: true, large: true },
          ]}
        />
        <ResultPanel
          title="Avec un apport de..."
          lines={[
            { label: "+ 50 000 € d'apport", value: formatEUR(result.capaciteEmprunt + 50000), sub: true },
            { label: "+ 100 000 € d'apport", value: formatEUR(result.capaciteEmprunt + 100000), sub: true },
            { label: "+ 150 000 € d'apport", value: formatEUR(result.capaciteEmprunt + 150000), sub: true },
          ]}
        />
      </div>
    </div>
  );
}

function TabAmortissement() {
  const [capital, setCapital] = useState(600000);
  const [taux, setTaux] = useState(3.5);
  const [duree, setDuree] = useState(25);

  const mensualite = useMemo(() => calculerMensualite(capital, taux / 100, duree), [capital, taux, duree]);
  const tableau = useMemo(() => genererTableauAmortissement(capital, taux / 100, duree), [capital, taux, duree]);
  const totalInterets = useMemo(() => tableau.reduce((sum, l) => sum + l.interets, 0), [tableau]);

  // Show yearly summary
  const annuel = useMemo(() => {
    const years: { annee: number; capital: number; interets: number; restant: number }[] = [];
    for (let i = 0; i < tableau.length; i += 12) {
      const slice = tableau.slice(i, i + 12);
      years.push({
        annee: Math.floor(i / 12) + 1,
        capital: slice.reduce((s, l) => s + l.capital, 0),
        interets: slice.reduce((s, l) => s + l.interets, 0),
        restant: slice[slice.length - 1]?.capitalRestant || 0,
      });
    }
    return years;
  }, [tableau]);

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Paramètres du prêt</h2>
          <div className="space-y-4">
            <InputField label="Capital emprunté" value={capital} onChange={(v) => setCapital(Number(v))} suffix="€" />
            <InputField label="Taux d'intérêt annuel" value={taux} onChange={(v) => setTaux(Number(v))} suffix="%" step={0.1} />
            <InputField label="Durée" value={duree} onChange={(v) => setDuree(Number(v))} suffix="ans" min={5} max={35} />
          </div>
        </div>
        <ResultPanel
          title="Synthèse"
          lines={[
            { label: "Mensualité", value: formatEUR2(mensualite), highlight: true, large: true },
            { label: "Total des intérêts", value: formatEUR(totalInterets) },
            { label: "Coût total du crédit", value: formatEUR(capital + totalInterets) },
            { label: "Ratio intérêts / capital", value: formatPct(totalInterets / capital), sub: true },
          ]}
        />
      </div>

      {/* Tableau annuel */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-4 py-3 text-left font-semibold text-navy">Année</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">Capital remboursé</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">Intérêts payés</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">Capital restant</th>
            </tr>
          </thead>
          <tbody>
            {annuel.map((a) => (
              <tr key={a.annee} className="border-b border-card-border/50 hover:bg-background/50">
                <td className="px-4 py-2 font-medium">{a.annee}</td>
                <td className="px-4 py-2 text-right font-mono">{formatEUR(a.capital)}</td>
                <td className="px-4 py-2 text-right font-mono text-muted">{formatEUR(a.interets)}</td>
                <td className="px-4 py-2 text-right font-mono">{formatEUR(a.restant)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabDSCR() {
  const [revenuLocatif, setRevenuLocatif] = useState(36000);
  const [charges, setCharges] = useState(6000);
  const [serviceDette, setServiceDette] = useState(24000);

  const dscr = calculerDSCR({
    revenuLocatifAnnuel: revenuLocatif,
    chargesAnnuelles: charges,
    serviceDetteAnnuel: serviceDette,
  });

  const dscrColor = dscr < 1.0 ? "text-error" : dscr < 1.2 ? "text-warning" : "text-success";
  const dscrLabel =
    dscr < 1.0 ? "Insuffisant — déficit de couverture" : dscr < 1.2 ? "Limite — marge faible" : "Sain";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">Paramètres DSCR</h2>
        <div className="space-y-4">
          <InputField label="Revenu locatif annuel brut" value={revenuLocatif} onChange={(v) => setRevenuLocatif(Number(v))} suffix="€" />
          <InputField label="Charges annuelles d'exploitation" value={charges} onChange={(v) => setCharges(Number(v))} suffix="€" hint="Gestion, assurance, entretien, vacance..." />
          <InputField label="Service de la dette annuel" value={serviceDette} onChange={(v) => setServiceDette(Number(v))} suffix="€" hint="Capital + intérêts annuels" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
          <div className="text-sm text-muted">Debt Service Coverage Ratio</div>
          <div className={`mt-2 text-5xl font-bold ${dscrColor}`}>{dscr.toFixed(2)}</div>
          <div className={`mt-2 text-sm font-medium ${dscrColor}`}>{dscrLabel}</div>
        </div>
        <ResultPanel
          title="Détail"
          lines={[
            { label: "Revenu locatif brut", value: formatEUR(revenuLocatif) },
            { label: "Charges d'exploitation", value: `- ${formatEUR(charges)}` },
            { label: "NOI (Net Operating Income)", value: formatEUR(revenuLocatif - charges), highlight: true },
            { label: "Service de la dette", value: formatEUR(serviceDette) },
            { label: "DSCR = NOI / Service dette", value: dscr.toFixed(2), highlight: true, large: true },
          ]}
        />
        <ResultPanel
          title="Seuils de référence"
          lines={[
            { label: "DSCR < 1,0", value: "Déficit — NOI ne couvre pas la dette", sub: true, warning: true },
            { label: "DSCR 1,0 – 1,2", value: "Acceptable avec garanties", sub: true },
            { label: "DSCR > 1,2", value: "Sain — marge de sécurité", sub: true },
            { label: "DSCR > 1,5", value: "Confortable — investissement solide", sub: true },
          ]}
        />
      </div>
    </div>
  );
}

export default function OutilsBancaires() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("ltv");

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Outils Bancaires
          </h1>
          <p className="mt-2 text-muted">
            LTV, capacité d'emprunt, tableaux d'amortissement, DSCR — Référentiels CRR / EBA
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "ltv" && <TabLTV />}
        {activeTab === "capacite" && <TabCapacite />}
        {activeTab === "amortissement" && <TabAmortissement />}
        {activeTab === "dscr" && <TabDSCR />}
      </div>
    </div>
  );
}
