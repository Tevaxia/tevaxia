"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";

function computeInteretsRetard(montant: number, jours: number, tauxAnnuel: number): number {
  return montant * (tauxAnnuel / 100) * (jours / 365);
}

export default function HotelImpayesPage() {
  const t = useTranslations("hotelImpayes");
  const [montantFacture, setMontantFacture] = useState(8500);
  const [joursRetard, setJoursRetard] = useState(35);
  const [tauxInteretRetard, setTauxInteretRetard] = useState(12.5);
  const [fraisAdministratifs, setFraisAdministratifs] = useState(40);
  const [avocatHonoraires, setAvocatHonoraires] = useState(0);
  const [nbFactures, setNbFactures] = useState(1);
  const [lastInvoiceDate, setLastInvoiceDate] = useState(new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString().slice(0, 10));

  function calcPalier(j: number): { niveau: 0 | 1 | 2 | 3; label: string; description: string; action: string } {
    if (j < 15) return { niveau: 0, label: t("palier0Label"), description: t("palier0Desc"), action: t("palier0Action") };
    if (j < 30) return { niveau: 1, label: t("palier1Label"), description: t("palier1Desc"), action: t("palier1Action") };
    if (j < 60) return { niveau: 2, label: t("palier2Label"), description: t("palier2Desc"), action: t("palier2Action") };
    return { niveau: 3, label: t("palier3Label"), description: t("palier3Desc"), action: t("palier3Action") };
  }

  const palier = useMemo(() => calcPalier(joursRetard), [joursRetard, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const interetsRetard = useMemo(
    () => computeInteretsRetard(montantFacture * nbFactures, joursRetard, tauxInteretRetard),
    [montantFacture, nbFactures, joursRetard, tauxInteretRetard]
  );

  const totalDu = montantFacture * nbFactures;
  const totalAvecInterets = totalDu + interetsRetard;
  const totalFraisRecouvrement =
    (palier.niveau >= 2 ? fraisAdministratifs : 0) +
    (palier.niveau >= 3 ? avocatHonoraires : 0);
  const totalReclame = totalAvecInterets + totalFraisRecouvrement;

  const probaRecouvrement = palier.niveau === 0 ? 0.95 : palier.niveau === 1 ? 0.80 : palier.niveau === 2 ? 0.55 : 0.30;
  const esperanceRecupere = totalReclame * probaRecouvrement;
  const risqueDepreciation = totalReclame - esperanceRecupere;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 text-muted">{t("pageSubtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionFacture")}</h2>
              <div className="space-y-4">
                <InputField label={t("inputMontant")} value={montantFacture} onChange={(v) => setMontantFacture(Number(v))} suffix="€" />
                <InputField label={t("inputNbFactures")} value={nbFactures} onChange={(v) => setNbFactures(Number(v))} min={1} max={50} />
                <InputField label={t("inputDate")} type="text" value={lastInvoiceDate} onChange={setLastInvoiceDate} hint={t("inputDateHint")} />
                <InputField label={t("inputJoursRetard")} value={joursRetard} onChange={(v) => setJoursRetard(Number(v))} min={0} max={365} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionFrais")}</h2>
              <div className="space-y-4">
                <InputField label={t("inputTauxInteret")} value={tauxInteretRetard} onChange={(v) => setTauxInteretRetard(Number(v))} suffix="%" step={0.5} hint={t("inputTauxInteretHint")} />
                <InputField label={t("inputForfait")} value={fraisAdministratifs} onChange={(v) => setFraisAdministratifs(Number(v))} suffix="€" hint={t("inputForfaitHint")} />
                <InputField label={t("inputAvocat")} value={avocatHonoraires} onChange={(v) => setAvocatHonoraires(Number(v))} suffix="€" hint={t("inputAvocatHint")} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`rounded-2xl p-6 shadow-lg text-white ${
              palier.niveau === 0 ? "bg-gradient-to-br from-emerald-600 to-teal-700"
                : palier.niveau === 1 ? "bg-gradient-to-br from-amber-500 to-orange-600"
                  : palier.niveau === 2 ? "bg-gradient-to-br from-orange-600 to-rose-600"
                    : "bg-gradient-to-br from-rose-700 to-red-800"
            }`}>
              <div className="text-sm text-white/70">{t("palierActuel")}</div>
              <div className="mt-1 text-3xl font-bold">{palier.label}</div>
              <p className="mt-2 text-sm text-white/90">{palier.description}</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-xs text-white/60">{t("actionLabel")}</div>
                <div className="mt-1 text-sm font-semibold">{palier.action}</div>
              </div>
            </div>

            <ResultPanel
              title={t("panelTotalTitle")}
              lines={[
                { label: t("panelFactures", { n: nbFactures, amount: formatEUR(montantFacture) }), value: formatEUR(totalDu) },
                { label: t("panelInterets", { taux: tauxInteretRetard, jours: joursRetard }), value: formatEUR(interetsRetard), sub: true },
                { label: t("panelTotalDuInterets"), value: formatEUR(totalAvecInterets), highlight: true },
                { label: t("panelFraisAdmin"), value: palier.niveau >= 2 ? formatEUR(fraisAdministratifs) : "—", sub: true },
                { label: t("panelHonoraires"), value: palier.niveau >= 3 ? formatEUR(avocatHonoraires) : "—", sub: true },
                { label: t("panelTotalReclame"), value: formatEUR(totalReclame), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title={t("panelProbaTitle")}
              lines={[
                { label: t("panelProbaLine"), value: `${(probaRecouvrement * 100).toFixed(0)} %`, highlight: true },
                { label: t("panelEsperance"), value: formatEUR(esperanceRecupere) },
                { label: t("panelRisque"), value: formatEUR(risqueDepreciation), warning: true },
              ]}
            />

            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-3">{t("calendarTitle")}</h3>
              <div className="space-y-2">
                {[
                  { n: 1, day: 15, label: t("cal1Label"), desc: t("cal1Desc") },
                  { n: 2, day: 30, label: t("cal2Label"), desc: t("cal2Desc") },
                  { n: 3, day: 60, label: t("cal3Label"), desc: t("cal3Desc") },
                ].map((s) => {
                  const reached = joursRetard >= s.day;
                  const current = palier.niveau === s.n;
                  return (
                    <div key={s.n} className={`flex items-start gap-3 rounded-lg border p-3 ${
                      current ? "border-amber-400 bg-amber-50"
                        : reached ? "border-emerald-200 bg-emerald-50"
                          : "border-card-border bg-background"
                    }`}>
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        current ? "bg-amber-600 text-white"
                          : reached ? "bg-emerald-600 text-white"
                            : "bg-gray-300 text-gray-600"
                      }`}>
                        {reached ? "✓" : s.n}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-navy">{s.label}</div>
                          <div className="text-[10px] font-mono text-muted">J+{s.day}</div>
                        </div>
                        <p className="text-xs text-muted">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <strong>{t("legalStrong")}</strong> {t("legalBody")}{" "}
              <Link href="/gestion-locative/relances" className="underline">{t("legalLink")}</Link>{" "}
              {t("legalSuffix")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
