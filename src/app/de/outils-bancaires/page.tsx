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
  { id: "ltv", label: "Loan-to-Value" },
  { id: "capacite", label: "Borrowing Capacity" },
  { id: "amortissement", label: "Amortisation" },
  { id: "dscr", label: "Debt Coverage" },
];

function TabLTV() {
  const [valeurBien, setValeurBien] = useState(750000);
  const [montantPret, setMontantPret] = useState(600000);

  const ltv = calculerLTV({ valeurBien, montantPret });
  const ltvColor = ltv > 0.9 ? "text-error" : ltv > 0.8 ? "text-warning" : "text-success";
  const ltvLabel =
    ltv > 0.9 ? "High — increased risk" : ltv > 0.8 ? "Acceptable — use caution" : "Healthy";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">LTV Parameters</h2>
          <div className="space-y-4">
            <InputField label="Property value" value={valeurBien} onChange={(v) => setValeurBien(Number(v))} suffix="€" />
            <InputField label="Loan amount" value={montantPret} onChange={(v) => setMontantPret(Number(v))} suffix="€" />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
          <div className="text-sm text-muted">Loan-to-Value ratio (LTV)</div>
          <div className={`mt-2 text-5xl font-bold ${ltvColor}`}>
            {(ltv * 100).toFixed(1)} %
          </div>
          <div className={`mt-2 text-sm font-medium ${ltvColor}`}>{ltvLabel}</div>
          <div className="mt-4 text-xs text-muted">Down payment: {formatEUR(valeurBien - montantPret)} ({formatPct(1 - ltv)})</div>
        </div>
        <ResultPanel
          title="LTV Thresholds — Luxembourg Regulations"
          lines={[
            { label: "LTV <= 80%", value: "Residential standard — 35% risk weight (CRR2 Art. 125)", sub: true },
            { label: "LTV <= 90%", value: "First-time buyer primary residence — tolerated by CSSF with conditions", sub: true },
            { label: "LTV > 90%", value: "State guarantee required (max 303,862 EUR)", sub: true, warning: true },
          ]}
        />

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-3">Prudent Value — CRR Art. 229</h3>
          <p className="text-xs text-muted leading-relaxed mb-3">
            The Prudent Value is not a fixed percentage of market value.
            It is the <strong className="text-slate">Mortgage Lending Value (MLV)</strong> determined by an
            independent appraiser under Article 229 of the CRR, excluding speculative elements and
            exceptional market conditions.
          </p>
          <div className="space-y-2 text-xs text-muted">
            <p><strong className="text-slate">Method:</strong> The appraiser applies prudential haircuts
            to the market value to reflect long-term sustainability:
            cyclical haircut (margin vs. current conditions), marketing haircut (time/liquidity),
            specific haircut (risks inherent to the property). The result is typically 80-95% of market value,
            but this ratio is not regulatory — it depends on the property and context.</p>
            <p><strong className="text-slate">Legal basis:</strong> CRR Art. 4(1)(74) defines the MLV.
            CRR Art. 229 requires an assessment by a qualified independent expert.
            EBA GL/2020/06 specifies monitoring and revaluation requirements.</p>
            <p><strong className="text-slate">To calculate:</strong> Use the{" "}
            <a href="/de/valorisation" className="text-navy font-medium hover:underline">Mortgage Lending Value</a>{" "}
            tab in the EVS valuation module — it applies CRR haircuts with justification.</p>
          </div>
        </div>
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
  const [tauxAssurance, setTauxAssurance] = useState(0.30); // % of capital

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
        <h2 className="mb-4 text-base font-semibold text-navy">Income & Expenses</h2>
        <div className="space-y-4">
          <InputField label="Monthly net income" value={revenuNet} onChange={(v) => setRevenuNet(Number(v))} suffix="€" />
          <InputField label="Existing monthly expenses" value={charges} onChange={(v) => setCharges(Number(v))} suffix="€" hint="Current loans, alimony..." />
          <InputField label="Max debt-to-income ratio" value={tauxEndettement} onChange={(v) => setTauxEndettement(Number(v))} suffix="%" min={10} max={50} />
          <InputField label="Interest rate" value={tauxInteret} onChange={(v) => setTauxInteret(Number(v))} suffix="%" step={0.1} />
          <InputField label="Loan term" value={duree} onChange={(v) => setDuree(Number(v))} suffix="years" min={5} max={35} />
          <InputField label="Outstanding balance insurance" value={tauxAssurance} onChange={(v) => setTauxAssurance(Number(v))} suffix="% capital" step={0.05} hint="Typically 0.20-0.40%. Mandatory in Luxembourg." />
        </div>
        <div className="mt-4 rounded-lg bg-navy/5 p-3">
          <div className="text-xs font-semibold text-navy mb-2">Indicative Luxembourg rates (March 2026)</div>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted">
            <span>Fixed 10 years</span><span className="font-mono text-right">2.90-3.20%</span>
            <span>Fixed 15 years</span><span className="font-mono text-right">3.00-3.30%</span>
            <span>Fixed 20 years</span><span className="font-mono text-right">3.10-3.50%</span>
            <span>Fixed 25 years</span><span className="font-mono text-right">3.20-3.60%</span>
            <span>Variable</span><span className="font-mono text-right">2.80-3.10%</span>
          </div>
          <p className="mt-1 text-[10px] text-muted">Source: BCL / Luxembourg banks. Indicative rates, vary by borrower profile.</p>
        </div>
      </div>
      <div className="space-y-6">
        <ResultPanel
          title="Results"
          lines={[
            { label: "Max available monthly payment", value: formatEUR2(result.mensualiteMax) },
            { label: `Of which insurance (${tauxAssurance}%)`, value: formatEUR2(result.capaciteEmprunt * tauxAssurance / 100 / 12), sub: true },
            { label: "Borrowing capacity", value: formatEUR(result.capaciteEmprunt), highlight: true, large: true },
          ]}
        />
        <ResultPanel
          title="With a down payment of..."
          lines={[
            { label: "+ 50,000 EUR down payment", value: formatEUR(result.capaciteEmprunt + 50000), sub: true },
            { label: "+ 100,000 EUR down payment", value: formatEUR(result.capaciteEmprunt + 100000), sub: true },
            { label: "+ 150,000 EUR down payment", value: formatEUR(result.capaciteEmprunt + 150000), sub: true },
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
          <h2 className="mb-4 text-base font-semibold text-navy">Loan Parameters</h2>
          <div className="space-y-4">
            <InputField label="Borrowed capital" value={capital} onChange={(v) => setCapital(Number(v))} suffix="€" />
            <InputField label="Annual interest rate" value={taux} onChange={(v) => setTaux(Number(v))} suffix="%" step={0.1} />
            <InputField label="Term" value={duree} onChange={(v) => setDuree(Number(v))} suffix="years" min={5} max={35} />
          </div>
        </div>
        <ResultPanel
          title="Summary"
          lines={[
            { label: "Monthly payment", value: formatEUR2(mensualite), highlight: true, large: true },
            { label: "Total interest", value: formatEUR(totalInterets) },
            { label: "Total loan cost", value: formatEUR(capital + totalInterets) },
            { label: "Interest / capital ratio", value: formatPct(totalInterets / capital), sub: true },
          ]}
        />
      </div>

      {/* Yearly table */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-4 py-3 text-left font-semibold text-navy">Year</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">Principal repaid</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">Interest paid</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">Outstanding balance</th>
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
    dscr < 1.0 ? "Insufficient — coverage deficit" : dscr < 1.2 ? "Borderline — thin margin" : "Healthy";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">DSCR Parameters</h2>
        <div className="space-y-4">
          <InputField label="Gross annual rental income" value={revenuLocatif} onChange={(v) => setRevenuLocatif(Number(v))} suffix="€" />
          <InputField label="Annual operating expenses" value={charges} onChange={(v) => setCharges(Number(v))} suffix="€" hint="Management, insurance, maintenance, vacancy..." />
          <InputField label="Annual debt service" value={serviceDette} onChange={(v) => setServiceDette(Number(v))} suffix="€" hint="Annual principal + interest" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
          <div className="text-sm text-muted">Debt Service Coverage Ratio (DSCR)</div>
          <div className={`mt-2 text-5xl font-bold ${dscrColor}`}>{dscr.toFixed(2)}</div>
          <div className={`mt-2 text-sm font-medium ${dscrColor}`}>{dscrLabel}</div>
        </div>
        <ResultPanel
          title="Breakdown"
          lines={[
            { label: "Gross rental income", value: formatEUR(revenuLocatif) },
            { label: "Operating expenses", value: `- ${formatEUR(charges)}` },
            { label: "NOI (Net Operating Income)", value: formatEUR(revenuLocatif - charges), highlight: true },
            { label: "Debt service", value: formatEUR(serviceDette) },
            { label: "DSCR = NOI / Debt service", value: dscr.toFixed(2), highlight: true, large: true },
          ]}
        />
        <ResultPanel
          title="Reference thresholds"
          lines={[
            { label: "DSCR < 1.0", value: "Deficit — NOI does not cover debt", sub: true, warning: true },
            { label: "DSCR 1.0 – 1.2", value: "Acceptable with guarantees", sub: true },
            { label: "DSCR > 1.2", value: "Healthy — safety margin", sub: true },
            { label: "DSCR > 1.5", value: "Comfortable — solid investment", sub: true },
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
            Banking Tools
          </h1>
          <p className="mt-2 text-muted">
            LTV, borrowing capacity, amortisation schedules, DSCR — CRR / EBA benchmarks
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
