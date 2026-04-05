"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
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
import { generateBancairePdfBlob, PdfButton } from "@/components/ToolsPdf";

type ActiveTab = "ltv" | "capacite" | "amortissement" | "dscr";

function TabLTV() {
  const t = useTranslations("outilsBancaires");
  const [valeurBien, setValeurBien] = useState(750000);
  const [montantPret, setMontantPret] = useState(600000);

  const ltv = calculerLTV({ valeurBien, montantPret });
  const ltvColor = ltv > 0.9 ? "text-error" : ltv > 0.8 ? "text-warning" : "text-success";
  const ltvLabel =
    ltv > 0.9 ? t("ltvHigh") : ltv > 0.8 ? t("ltvAcceptable") : t("ltvHealthy");

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("ltvParams")}</h2>
          <div className="space-y-4">
            <InputField label={t("propertyValue")} value={valeurBien} onChange={(v) => setValeurBien(Number(v))} suffix="€" />
            <InputField label={t("loanAmount")} value={montantPret} onChange={(v) => setMontantPret(Number(v))} suffix="€" />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
          <div className="text-sm text-muted">{t("ltvRatio")}</div>
          <div className={`mt-2 text-5xl font-bold ${ltvColor}`}>
            {(ltv * 100).toFixed(1)} %
          </div>
          <div className={`mt-2 text-sm font-medium ${ltvColor}`}>{ltvLabel}</div>
          <div className="mt-4 text-xs text-muted">{t("deposit")} : {formatEUR(valeurBien - montantPret)} ({formatPct(1 - ltv)})</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-3">{t("ltvThresholdsTitle")}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
              <span className="shrink-0 rounded-full bg-success px-2.5 py-0.5 text-xs font-bold text-white">≤ 80%</span>
              <div>
                <div className="text-sm font-medium text-slate">{t("ltvStandard")}</div>
                <p className="text-xs text-muted mt-0.5">{t("ltvStandardDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <span className="shrink-0 rounded-full bg-warning px-2.5 py-0.5 text-xs font-bold text-white">≤ 90%</span>
              <div>
                <div className="text-sm font-medium text-slate">{t("ltvFirstBuyer")}</div>
                <p className="text-xs text-muted mt-0.5">{t("ltvFirstBuyerDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
              <span className="shrink-0 rounded-full bg-error px-2.5 py-0.5 text-xs font-bold text-white">&gt; 90%</span>
              <div>
                <div className="text-sm font-medium text-slate">{t("ltvStateGuarantee")}</div>
                <p className="text-xs text-muted mt-0.5">{t("ltvStateGuaranteeDesc")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-3">{t("prudentValueTitle")}</h3>
          <p className="text-xs text-muted leading-relaxed mb-3">
            {t.rich("prudentValueIntro", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
            })}
          </p>
          <div className="space-y-2 text-xs text-muted">
            <p>{t.rich("prudentValueMethod", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
            })}</p>
            <p>{t.rich("prudentValueLegal", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
            })}</p>
            <p>{t.rich("prudentValueCalculate", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
              link: (chunks) => <a href="/valorisation" className="text-navy font-medium hover:underline">{chunks}</a>,
            })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabCapacite() {
  const t = useTranslations("outilsBancaires");
  const [revenuNet, setRevenuNet] = useState(5000);
  const [charges, setCharges] = useState(500);
  const [tauxEndettement, setTauxEndettement] = useState(40);
  const [tauxInteret, setTauxInteret] = useState(3.5);
  const [duree, setDuree] = useState(25);
  const [tauxAssurance, setTauxAssurance] = useState(0.30); // % du capital

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
        <h2 className="mb-4 text-base font-semibold text-navy">{t("incomeAndCharges")}</h2>
        <div className="space-y-4">
          <InputField label={t("netMonthlyIncome")} value={revenuNet} onChange={(v) => setRevenuNet(Number(v))} suffix="€" />
          <InputField label={t("existingMonthlyCharges")} value={charges} onChange={(v) => setCharges(Number(v))} suffix="€" hint={t("existingMonthlyChargesHint")} />
          <InputField label={t("maxDebtRatio")} value={tauxEndettement} onChange={(v) => setTauxEndettement(Number(v))} suffix="%" min={10} max={50} />
          <InputField label={t("interestRate")} value={tauxInteret} onChange={(v) => setTauxInteret(Number(v))} suffix="%" step={0.1} />
          <InputField label={t("loanDuration")} value={duree} onChange={(v) => setDuree(Number(v))} suffix={t("years")} min={5} max={35} />
          <InputField label={t("remainingBalanceInsurance")} value={tauxAssurance} onChange={(v) => setTauxAssurance(Number(v))} suffix={t("pctCapital")} step={0.05} hint={t("remainingBalanceInsuranceHint")} />
        </div>
        <div className="mt-4 rounded-lg bg-navy/5 p-3">
          <div className="text-xs font-semibold text-navy mb-2">{t("indicativeRatesTitle")}</div>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted">
            <span>{t("fixed10y")}</span><span className="font-mono text-right">2.90-3.20%</span>
            <span>{t("fixed15y")}</span><span className="font-mono text-right">3.00-3.30%</span>
            <span>{t("fixed20y")}</span><span className="font-mono text-right">3.10-3.50%</span>
            <span>{t("fixed25y")}</span><span className="font-mono text-right">3.20-3.60%</span>
            <span>{t("variable")}</span><span className="font-mono text-right">2.80-3.10%</span>
          </div>
          <p className="mt-1 text-[10px] text-muted">{t("indicativeRatesSource")}</p>
        </div>
      </div>
      <div className="space-y-6">
        <ResultPanel
          title={t("results")}
          lines={[
            { label: t("maxMonthlyPayment"), value: formatEUR2(result.mensualiteMax) },
            { label: t("ofWhichInsurance", { pct: tauxAssurance }), value: formatEUR2(result.capaciteEmprunt * tauxAssurance / 100 / 12), sub: true },
            { label: t("borrowingCapacity"), value: formatEUR(result.capaciteEmprunt), highlight: true, large: true },
          ]}
        />
        <ResultPanel
          title={t("withDeposit")}
          lines={[
            { label: t("plusDeposit", { amount: "50 000" }), value: formatEUR(result.capaciteEmprunt + 50000), sub: true },
            { label: t("plusDeposit", { amount: "100 000" }), value: formatEUR(result.capaciteEmprunt + 100000), sub: true },
            { label: t("plusDeposit", { amount: "150 000" }), value: formatEUR(result.capaciteEmprunt + 150000), sub: true },
          ]}
        />
      </div>
    </div>
  );
}

function TabAmortissement() {
  const t = useTranslations("outilsBancaires");
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
          <h2 className="mb-4 text-base font-semibold text-navy">{t("loanParams")}</h2>
          <div className="space-y-4">
            <InputField label={t("borrowedCapital")} value={capital} onChange={(v) => setCapital(Number(v))} suffix="€" />
            <InputField label={t("annualInterestRate")} value={taux} onChange={(v) => setTaux(Number(v))} suffix="%" step={0.1} />
            <InputField label={t("duration")} value={duree} onChange={(v) => setDuree(Number(v))} suffix={t("years")} min={5} max={35} />
          </div>
        </div>
        <ResultPanel
          title={t("summary")}
          lines={[
            { label: t("monthlyPayment"), value: formatEUR2(mensualite), highlight: true, large: true },
            { label: t("totalInterest"), value: formatEUR(totalInterets) },
            { label: t("totalCreditCost"), value: formatEUR(capital + totalInterets) },
            { label: t("interestCapitalRatio"), value: formatPct(totalInterets / capital), sub: true },
          ]}
        />
        <div className="flex justify-end">
          <PdfButton
            label="PDF"
            filename={`simulation-bancaire-${new Date().toLocaleDateString("fr-LU")}.pdf`}
            generateBlob={() => {
              const prixBien = Math.round(capital / 0.8);
              const apport = prixBien - capital;
              return generateBancairePdfBlob({
                prixBien,
                apport,
                montantCredit: capital,
                dureeAns: duree,
                tauxNominal: taux,
                mensualite,
                coutTotal: capital + totalInterets,
                coutInterets: totalInterets,
                ltv: 80,
                tauxEndettement: 0,
              });
            }}
          />
        </div>
      </div>

      {/* Tableau annuel */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-4 py-3 text-left font-semibold text-navy">{t("year")}</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">{t("capitalRepaid")}</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">{t("interestPaid")}</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">{t("remainingCapital")}</th>
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
  const t = useTranslations("outilsBancaires");
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
    dscr < 1.0 ? t("dscrInsufficient") : dscr < 1.2 ? t("dscrLimit") : t("dscrHealthy");

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">{t("dscrParams")}</h2>
        <div className="space-y-4">
          <InputField label={t("grossRentalIncome")} value={revenuLocatif} onChange={(v) => setRevenuLocatif(Number(v))} suffix="€" />
          <InputField label={t("annualOperatingCharges")} value={charges} onChange={(v) => setCharges(Number(v))} suffix="€" hint={t("annualOperatingChargesHint")} />
          <InputField label={t("annualDebtService")} value={serviceDette} onChange={(v) => setServiceDette(Number(v))} suffix="€" hint={t("annualDebtServiceHint")} />
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
          <div className="text-sm text-muted">{t("dscrRatio")}</div>
          <div className={`mt-2 text-5xl font-bold ${dscrColor}`}>{dscr.toFixed(2)}</div>
          <div className={`mt-2 text-sm font-medium ${dscrColor}`}>{dscrLabel}</div>
        </div>
        <ResultPanel
          title={t("detail")}
          lines={[
            { label: t("grossRentalIncomeShort"), value: formatEUR(revenuLocatif) },
            { label: t("operatingCharges"), value: `- ${formatEUR(charges)}` },
            { label: t("noi"), value: formatEUR(revenuLocatif - charges), highlight: true },
            { label: t("debtService"), value: formatEUR(serviceDette) },
            { label: t("dscrFormula"), value: dscr.toFixed(2), highlight: true, large: true },
          ]}
        />
        <ResultPanel
          title={t("referenceThresholds")}
          lines={[
            { label: t("dscrBelow1"), value: t("dscrBelow1Desc"), sub: true, warning: true },
            { label: t("dscr1to1_2"), value: t("dscr1to1_2Desc"), sub: true },
            { label: t("dscrAbove1_2"), value: t("dscrAbove1_2Desc"), sub: true },
            { label: t("dscrAbove1_5"), value: t("dscrAbove1_5Desc"), sub: true },
          ]}
        />
      </div>
    </div>
  );
}

export default function OutilsBancaires() {
  const t = useTranslations("outilsBancaires");
  const [activeTab, setActiveTab] = useState<ActiveTab>("ltv");

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: "ltv", label: t("tabLtv") },
    { id: "capacite", label: t("tabCapacite") },
    { id: "amortissement", label: t("tabAmortissement") },
    { id: "dscr", label: t("tabDscr") },
  ];

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
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
