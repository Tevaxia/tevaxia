"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { computeRenovationHotel } from "@/lib/hotellerie/renovation";

function formatEUR(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function formatYears(n: number): string {
  if (!isFinite(n) || n > 999) return "—";
  return `${n.toFixed(1)} ans`;
}

export default function RenovationHotelPage() {
  const locale = useLocale();
  const t = useTranslations("hotellerieToolPages");
  const tc = useTranslations("hotellerieCalc");
  const tcr = useTranslations("hotellerieCalc.renovation");
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [surfaceChauffeeM2, setSurfaceChauffeeM2] = useState(2500);
  const [nbChambres, setNbChambres] = useState(40);
  const [consoActuelleKwhM2, setConsoActuelleKwhM2] = useState(280);
  const [consoCibleKwhM2, setConsoCibleKwhM2] = useState(0);
  const [prixKwhMoyen, setPrixKwhMoyen] = useState(0.20);
  const [travauxIsolation, setIsolation] = useState(true);
  const [travauxCVC, setCVC] = useState(true);
  const [travauxECS, setECS] = useState(false);
  const [travauxLED, setLED] = useState(true);
  const [travauxFenetres, setFenetres] = useState(false);
  const [adr, setAdr] = useState(120);
  const [occupancy, setOccupancy] = useState(0.65);
  const [gainRevparPctViaLabel, setGainLabel] = useState(2);

  const result = useMemo(() => {
    try {
      return computeRenovationHotel({
        surfaceChauffeeM2, nbChambres, consoActuelleKwhM2, consoCibleKwhM2, prixKwhMoyen,
        travauxIsolation, travauxCVC, travauxECS, travauxLED, travauxFenetres,
        adr, occupancy, gainRevparPctViaLabel,
      });
    } catch { return null; }
  }, [surfaceChauffeeM2, nbChambres, consoActuelleKwhM2, consoCibleKwhM2, prixKwhMoyen, travauxIsolation, travauxCVC, travauxECS, travauxLED, travauxFenetres, adr, occupancy, gainRevparPctViaLabel]);

  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-700 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href={`${lp}/hotellerie`} className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("backToHub")}
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t("renovationTitle")}</h1>
          <p className="mt-2 text-lg text-white/70">{t("renovationSubtitle")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">{tcr("building")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField label="Surface chauffée totale" value={surfaceChauffeeM2} onChange={(v) => setSurfaceChauffeeM2(Number(v) || 0)} suffix="m²" />
                <InputField label="Nombre de chambres" value={nbChambres} onChange={(v) => setNbChambres(Number(v) || 0)} />
                <InputField label="Consommation actuelle" value={consoActuelleKwhM2} onChange={(v) => setConsoActuelleKwhM2(Number(v) || 0)} suffix="kWh/m²/an" hint="Voir CPE / facture énergie" />
                <InputField label="Consommation cible (optionnelle)" value={consoCibleKwhM2} onChange={(v) => setConsoCibleKwhM2(Number(v) || 0)} suffix="kWh/m²/an" hint="0 = calculée auto" />
                <InputField label="Prix moyen kWh" value={prixKwhMoyen.toFixed(3)} onChange={(v) => setPrixKwhMoyen(Number(v) || 0)} suffix="€" className="sm:col-span-2" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">{tcr("worksPlanned")}</h2>
              <div className="mt-4 space-y-2">
                {[
                  { v: travauxIsolation, set: setIsolation, label: "Isolation enveloppe (toiture, façade)" },
                  { v: travauxCVC, set: setCVC, label: "CVC (chauffage / ventilation / clim)" },
                  { v: travauxECS, set: setECS, label: "Eau chaude sanitaire (PAC, solaire)" },
                  { v: travauxLED, set: setLED, label: "Éclairage LED + GTB" },
                  { v: travauxFenetres, set: setFenetres, label: "Menuiseries (triple vitrage)" },
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-3 cursor-pointer rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm">
                    <input type="checkbox" checked={item.v} onChange={(e) => item.set(e.target.checked)} className="h-4 w-4 rounded border-input-border" />
                    <span className="text-navy">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">{tcr("hotelPerf")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField label="ADR" value={adr} onChange={(v) => setAdr(Number(v) || 0)} suffix="€" />
                <InputField label="Occupation" value={Math.round(occupancy * 100)} onChange={(v) => setOccupancy(Math.max(5, Math.min(95, Number(v) || 0)) / 100)} suffix="%" />
                <InputField label="Gain RevPAR via label éco" value={gainRevparPctViaLabel} onChange={(v) => setGainLabel(Math.max(0, Math.min(15, Number(v) || 0)))} suffix="%" hint="Green Key, EU Ecolabel = +1-3 % RevPAR observé" className="sm:col-span-2" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <>
                <div className="rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-white p-6">
                  <div className="text-sm uppercase tracking-wider text-green-700 font-semibold">{tcr("investmentNet")}</div>
                  <div className="mt-2 text-3xl font-bold text-navy">{formatEUR(result.coutNetTotal)}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800">Brut : {formatEUR(result.coutBrutTotal)}</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">- Klimabonus : {formatEUR(result.aideKlimabonusTotal)}</span>
                  </div>
                </div>

                <ResultPanel
                  title={tcr("annualBenefits")}
                  lines={[
                    { label: "Économies factures énergie", value: formatEUR(result.economiesAnnuelles), highlight: true },
                    { label: "Gain RevPAR via label", value: formatEUR(result.gainRevparAnnuel), highlight: true },
                    { label: "Total annuel", value: formatEUR(result.economiesAnnuelles + result.gainRevparAnnuel), highlight: true, large: true },
                  ]}
                />

                <ResultPanel
                  title={tcr("paybackVAN")}
                  lines={[
                    { label: "Payback (factures seules)", value: formatYears(result.paybackSansLabel) },
                    { label: "Payback (factures + label)", value: formatYears(result.paybackAvecLabel), highlight: true },
                    { label: "VAN cumulée 10 ans", value: formatEUR(result.vanDixAns), highlight: true, warning: result.vanDixAns < 0 },
                  ]}
                />

                <ResultPanel
                  title={tcr("energyImpact")}
                  lines={[
                    { label: "Conso avant travaux", value: `${(result.consoAvantKwh / 1000).toFixed(0)} MWh/an` },
                    { label: "Conso après travaux", value: `${(result.consoApresKwh / 1000).toFixed(0)} MWh/an` },
                    { label: "Réduction", value: `${(result.reductionKwh / 1000).toFixed(0)} MWh/an (${result.consoAvantKwh > 0 ? ((result.reductionKwh / result.consoAvantKwh) * 100).toFixed(0) : 0} %)`, highlight: true },
                  ]}
                />

                <div className="rounded-xl border border-card-border bg-card p-6">
                  <h3 className="mb-4 text-base font-semibold text-navy">{tcr("perPostDetail")}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-card-border text-muted">
                          <th className="px-2 py-2 text-left font-medium">Poste</th>
                          <th className="px-2 py-2 text-right font-medium">Brut</th>
                          <th className="px-2 py-2 text-right font-medium">Aide</th>
                          <th className="px-2 py-2 text-right font-medium">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border/50">
                        {result.lines.map((line) => (
                          <tr key={line.poste} className={!line.retenu ? "opacity-40" : ""}>
                            <td className="px-2 py-2 text-navy">{line.poste}</td>
                            <td className="px-2 py-2 text-right">{formatEUR(line.coutBrut)}</td>
                            <td className="px-2 py-2 text-right text-emerald-700">{formatEUR(line.aide)}</td>
                            <td className="px-2 py-2 text-right font-semibold text-navy">{formatEUR(line.coutNet)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{tc("checkInputs")}</div>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          {tcr("methodNote")}
        </div>
      </div>
    </div>
  );
}
