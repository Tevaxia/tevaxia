"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";
import { evaluerTerreAgricole } from "@/lib/agricultural";
import SEOContent from "@/components/SEOContent";

export default function TerresAgricoles() {
  const t = useTranslations("terresAgricoles");
  const [surfaceHa, setSurfaceHa] = useState(5);
  const [qualiteSol, setQualiteSol] = useState<"bonne" | "moyenne" | "faible">("moyenne");
  const [localisation, setLocalisation] = useState<"centre_sud" | "centre" | "nord" | "est">("centre");
  const [batimentsExistants, setBatimentsExistants] = useState(false);
  const [surfaceBatiments, setSurfaceBatiments] = useState(500);
  const [amiantePresume, setAmiantePresume] = useState(false);
  const [exploitationActive, setExploitationActive] = useState(true);
  const [bailRuralEnCours, setBailRuralEnCours] = useState(false);

  const result = useMemo(() =>
    evaluerTerreAgricole({ surfaceHa, qualiteSol, localisation, batimentsExistants, surfaceBatiments, amiantePresume, exploitationActive, bailRuralEnCours }),
  [surfaceHa, qualiteSol, localisation, batimentsExistants, surfaceBatiments, amiantePresume, exploitationActive, bailRuralEnCours]);

  return (
    <>
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionLand")}</h2>
              <div className="space-y-4">
                <InputField label={t("surface")} value={surfaceHa} onChange={(v) => setSurfaceHa(Number(v))} suffix={t("hectares")} step={0.5} min={0.1} hint={`= ${(surfaceHa * 10000).toLocaleString("fr-LU")} m²`} />
                <InputField label={t("soilQuality")} type="select" value={qualiteSol} onChange={(v) => setQualiteSol(v as typeof qualiteSol)} options={[
                  { value: "bonne", label: t("soilGood") },
                  { value: "moyenne", label: t("soilAverage") },
                  { value: "faible", label: t("soilPoor") },
                ]} />
                <InputField label={t("location")} type="select" value={localisation} onChange={(v) => setLocalisation(v as typeof localisation)} options={[
                  { value: "centre_sud", label: t("locCentreSud") },
                  { value: "centre", label: t("locCentre") },
                  { value: "est", label: t("locEst") },
                  { value: "nord", label: t("locNord") },
                ]} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionLandStatus")}</h2>
              <div className="space-y-3 mb-6">
                <ToggleField label={t("ruralLease")} checked={bailRuralEnCours} onChange={setBailRuralEnCours} hint={t("ruralLeaseHint")} />
              </div>
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionBuildings")}</h2>
              <div className="space-y-3">
                <ToggleField label={t("existingBuildings")} checked={batimentsExistants} onChange={setBatimentsExistants} />
                {batimentsExistants && (<>
                  <InputField label={t("buildingSurface")} value={surfaceBatiments} onChange={(v) => setSurfaceBatiments(Number(v))} suffix="m²" hint={t("buildingSurfaceHint")} />
                  <ToggleField label={t("activeFarm")} checked={exploitationActive} onChange={setExploitationActive} hint={t("activeFarmHint")} />
                  {!exploitationActive && (
                    <ToggleField label={t("asbestosPresent")} checked={amiantePresume} onChange={setAmiantePresume} hint={t("asbestosHint")} />
                  )}
                </>)}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`rounded-2xl p-8 text-center shadow-lg ${result.valeurNette > 0 ? "bg-gradient-to-br from-navy to-navy-light text-white" : "bg-gradient-to-br from-error to-red-600 text-white"}`}>
              <div className="text-sm text-white/60">{t("estimatedNetValue")}</div>
              <div className="mt-2 text-4xl font-bold">{formatEUR(result.valeurNette)}</div>
              <div className="mt-2 text-xs text-white/50">{formatEUR(result.prixHaEstime)}/ha × {surfaceHa} ha</div>
            </div>

            <ResultPanel title={t("evaluationDetail")} lines={[
              { label: t("landLine", { ha: String(surfaceHa), price: formatEUR(result.prixHaEstime) }), value: formatEUR(result.valeurTerres) },
              ...(result.valeurBatiments > 0 ? [{ label: t("farmBuildings"), value: formatEUR(result.valeurBatiments) }] : []),
              ...(result.coutDemolition > 0 ? [{ label: t("demolitionCost"), value: `- ${formatEUR(result.coutDemolition)}`, warning: true }] : []),
              ...(result.coutDesamiantage > 0 ? [{ label: t("asbestosRemovalCost"), value: `- ${formatEUR(result.coutDesamiantage)}`, warning: true }] : []),
              { label: t("netValue"), value: formatEUR(result.valeurNette), highlight: true, large: true },
            ]} />

            {result.alertes.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">{t("alerts")}</h3>
                <ul className="space-y-2">
                  {result.alertes.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                      <svg className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Référentiel prix */}
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-navy mb-3">{t("referencePriceTitle")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="px-2 py-1.5 text-left text-navy">{t("thZone")}</th>
                      <th className="px-2 py-1.5 text-right text-navy">{t("thGood")}</th>
                      <th className="px-2 py-1.5 text-right text-navy">{t("thAverage")}</th>
                      <th className="px-2 py-1.5 text-right text-navy">{t("thPoor")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { zone: t("zoneCentreSud"), b: 65000, m: 50000, f: 35000 },
                      { zone: t("zoneCentre"), b: 55000, m: 42000, f: 30000 },
                      { zone: t("zoneEst"), b: 50000, m: 38000, f: 28000 },
                      { zone: t("zoneNord"), b: 40000, m: 32000, f: 22000 },
                    ].map((r) => (
                      <tr key={r.zone} className="border-b border-card-border/50">
                        <td className="px-2 py-1.5">{r.zone}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{formatEUR(r.b)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{formatEUR(r.m)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{formatEUR(r.f)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[10px] text-muted">{t("sourceDisclaimer")}</p>
            </div>

            {/* Viticulture AOP Moselle — référentiel dédié LU */}
            <div className="rounded-xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-purple-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-5 w-5 text-fuchsia-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
                <h3 className="text-sm font-semibold text-fuchsia-900">{t("vitiTitle")}</h3>
              </div>
              <p className="text-[11px] text-fuchsia-800 mb-3">{t("vitiIntro")}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-fuchsia-200">
                      <th className="px-2 py-1.5 text-left text-fuchsia-900">{t("vitiThCepage")}</th>
                      <th className="px-2 py-1.5 text-right text-fuchsia-900">{t("vitiThZone")}</th>
                      <th className="px-2 py-1.5 text-right text-fuchsia-900">{t("vitiThPrixHa")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { cepage: "Riesling, Pinot Gris", zone: t("vitiZoneRiesling"), price: "350 000 – 500 000 €" },
                      { cepage: "Pinot Blanc, Auxerrois", zone: t("vitiZoneClassique"), price: "200 000 – 320 000 €" },
                      { cepage: "Rivaner, Elbling", zone: t("vitiZoneBase"), price: "120 000 – 200 000 €" },
                      { cepage: t("vitiCremant"), zone: t("vitiZoneCremant"), price: "+ 15 % (primes) " },
                    ].map((r) => (
                      <tr key={r.cepage} className="border-b border-fuchsia-100">
                        <td className="px-2 py-1.5 font-medium text-fuchsia-900">{r.cepage}</td>
                        <td className="px-2 py-1.5 text-right text-fuchsia-700 text-[10px]">{r.zone}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-fuchsia-900">{r.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[10px] text-fuchsia-800 leading-relaxed">
                <strong>{t("vitiSources")}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Carte des prix par région et type */}
        <div className="mt-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy">{t("mapTitle")}</h2>
          <p className="mt-0.5 text-xs text-muted mb-4">{t("mapSubtitle")}</p>
          {(() => {
            const REGIONS = [
              { key: "centre_sud", label: t("regionCentreSud") },
              { key: "centre", label: t("regionCentre") },
              { key: "nord", label: t("regionNord") },
              { key: "est", label: t("regionEst") },
            ] as const;
            const CULTURES: { key: string; label: string; coef: number; note: string; onlyEst?: boolean }[] = [
              { key: "prairie", label: t("culturePrairie"), coef: 0.85, note: t("culturePrairieNote") },
              { key: "cereales", label: t("cultureCereales"), coef: 1.0, note: t("cultureCerealesNote") },
              { key: "vigne", label: t("cultureVigne"), coef: 4.5, note: t("cultureVigneNote"), onlyEst: true },
              { key: "foret", label: t("cultureForet"), coef: 0.25, note: t("cultureForetNote") },
            ];
            // Base price per region = moyenne bonne qualité
            const BASE: Record<string, number> = { centre_sud: 57500, centre: 48500, nord: 36000, est: 44000 };
            // Find color based on price
            const colorFor = (price: number) => {
              if (price < 20000) return "bg-emerald-100 text-emerald-900 border-emerald-200";
              if (price < 40000) return "bg-lime-100 text-lime-900 border-lime-200";
              if (price < 60000) return "bg-amber-100 text-amber-900 border-amber-200";
              if (price < 100000) return "bg-orange-100 text-orange-900 border-orange-200";
              return "bg-rose-100 text-rose-900 border-rose-200";
            };
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border bg-background">
                      <th className="px-3 py-2 text-left font-semibold text-navy">{t("mapColRegion")}</th>
                      {CULTURES.map((c) => (
                        <th key={c.key} className="px-3 py-2 text-right font-semibold text-navy">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {REGIONS.map((r) => {
                      const base = BASE[r.key];
                      return (
                        <tr key={r.key} className="border-b border-card-border/40">
                          <td className="px-3 py-2 font-semibold">{r.label}</td>
                          {CULTURES.map((c) => {
                            if (c.onlyEst && r.key !== "est") {
                              return <td key={c.key} className="px-3 py-2 text-right text-muted italic">—</td>;
                            }
                            const price = Math.round(base * c.coef / 1000) * 1000;
                            return (
                              <td key={c.key} className="px-3 py-2 text-right">
                                <span className={`inline-block rounded border px-2 py-0.5 font-mono font-semibold ${colorFor(price)}`}>
                                  {formatEUR(price)}/ha
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
          <div className="mt-4 grid gap-2 text-[11px] text-muted sm:grid-cols-2">
            <div>
              <strong className="text-navy">{t("mapLegendTitle")} :</strong>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded border bg-emerald-100 border-emerald-200 px-1.5 py-0.5 text-emerald-900">&lt; 20k</span>
                <span className="rounded border bg-lime-100 border-lime-200 px-1.5 py-0.5 text-lime-900">20-40k</span>
                <span className="rounded border bg-amber-100 border-amber-200 px-1.5 py-0.5 text-amber-900">40-60k</span>
                <span className="rounded border bg-orange-100 border-orange-200 px-1.5 py-0.5 text-orange-900">60-100k</span>
                <span className="rounded border bg-rose-100 border-rose-200 px-1.5 py-0.5 text-rose-900">&gt; 100k</span>
              </div>
            </div>
            <p className="italic">{t("mapDisclaimer")}</p>
          </div>
        </div>
      </div>
    </div>

    <SEOContent
      ns="terresAgricoles"
      sections={[
        { titleKey: "evaluationTitle", contentKey: "evaluationContent" },
        { titleKey: "prixZonesTitle", contentKey: "prixZonesContent" },
        { titleKey: "facteursTitle", contentKey: "facteursContent" },
        { titleKey: "bailRuralTitle", contentKey: "bailRuralContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
      ]}
      relatedLinks={[
        { href: "/pag-pap", labelKey: "pagPap" },
        { href: "/estimation", labelKey: "estimation" },
      ]}
    />
    </>
  );
}
