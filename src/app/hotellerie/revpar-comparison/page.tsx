"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import SEOContent from "@/components/SEOContent";
import { computeRevparCompset } from "@/lib/hotellerie/revpar-comparison";

function formatEUR(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

const DIAG_BG: Record<string, string> = {
  "problème prix": "from-amber-500 to-orange-600",
  "problème commercial": "from-rose-500 to-rose-700",
  "sain": "from-emerald-500 to-emerald-700",
  "sur-performance": "from-blue-500 to-blue-700",
};

export default function RevparComparisonPage() {
  const locale = useLocale();
  const t = useTranslations("hotellerieToolPages");
  const tc = useTranslations("hotellerieCalc");
  const tcv = useTranslations("hotellerieCalc.revparCompset");
  const tl = useTranslations("hotellerieCalc.revparCompset.labels");
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [hotelOccupancy, setHotelOccupancy] = useState(0.62);
  const [hotelADR, setHotelADR] = useState(115);
  const [compsetOccupancy, setCompsetOccupancy] = useState(0.70);
  const [compsetADR, setCompsetADR] = useState(125);
  const [nbChambres, setNbChambres] = useState(50);

  const result = useMemo(() => {
    try {
      return computeRevparCompset({ hotelOccupancy, hotelADR, compsetOccupancy, compsetADR, nbChambres });
    } catch { return null; }
  }, [hotelOccupancy, hotelADR, compsetOccupancy, compsetADR, nbChambres]);

  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-orange-900 via-orange-800 to-orange-700 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href={`${lp}/hotellerie`} className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("backToHub")}
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t("revparComparisonTitle")}</h1>
          <p className="mt-2 text-lg text-white/70">{t("revparComparisonSubtitle")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
              <h2 className="text-base font-semibold text-orange-900">{tcv("yourHotel")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField label="Occupation moyenne" value={Math.round(hotelOccupancy * 100)} onChange={(v) => setHotelOccupancy(Math.max(5, Math.min(95, Number(v) || 0)) / 100)} suffix="%" />
                <InputField label="ADR moyen" value={hotelADR} onChange={(v) => setHotelADR(Number(v) || 0)} suffix="€" />
                <InputField label={tl("nbChambres")} value={nbChambres} onChange={(v) => setNbChambres(Number(v) || 0)} className="sm:col-span-2" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">{tcv("compset")}</h2>
              <p className="mt-1 text-xs text-muted">{tcv("compsetHint")}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField label="Occupation moyenne compset" value={Math.round(compsetOccupancy * 100)} onChange={(v) => setCompsetOccupancy(Math.max(5, Math.min(95, Number(v) || 0)) / 100)} suffix="%" />
                <InputField label="ADR moyen compset" value={compsetADR} onChange={(v) => setCompsetADR(Number(v) || 0)} suffix="€" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <>
                <div className={`rounded-xl bg-gradient-to-br ${DIAG_BG[result.diagnostic]} p-6 text-white shadow-lg`}>
                  <div className="text-sm uppercase tracking-wider text-white/80 font-semibold">{tcv("rgiBox")}</div>
                  <div className="mt-2 text-4xl font-bold">{result.rgi.toFixed(1)}</div>
                  <div className="mt-1 text-sm text-white/90">{result.diagnostic}</div>
                </div>

                <ResultPanel
                  title={tcv("fairShare")}
                  lines={[
                    { label: "MPI (Market Penetration Index)", value: `${result.mpi.toFixed(1)} — occupation vs marché`, highlight: true, warning: result.mpi < 95 },
                    { label: "ARI (Average Rate Index)", value: `${result.ari.toFixed(1)} — prix vs marché`, highlight: true, warning: result.ari < 95 },
                    { label: "RGI (Revenue Generation Index)", value: `${result.rgi.toFixed(1)} — RevPAR vs marché`, highlight: true, large: true, warning: result.rgi < 95 },
                  ]}
                />

                <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-900">
                  <div className="font-semibold">{tcv("diagnostic")}</div>
                  <p className="mt-1">{result.diagnosticDetail}</p>
                </div>

                <ResultPanel
                  title={tcv("revparCompared")}
                  lines={[
                    { label: "Votre RevPAR", value: `${result.hotelRevPAR.toFixed(0)} €/nuit/chambre`, highlight: true },
                    { label: "RevPAR compset", value: `${result.compsetRevPAR.toFixed(0)} €/nuit/chambre`, sub: true },
                    { label: "Écart", value: `${(result.hotelRevPAR - result.compsetRevPAR).toFixed(0)} €/nuit/chambre`, warning: result.hotelRevPAR < result.compsetRevPAR },
                  ]}
                />

                <ResultPanel
                  title={tcv("missedRevenue")}
                  lines={[
                    { label: `Si vous atteignez le RevPAR du compset (${result.compsetRevPAR.toFixed(0)} €)`, value: formatEUR(result.manqueAGagnerAnnuel), highlight: true, large: true },
                    { label: "= revenu chambres supplémentaire potentiel", value: result.manqueAGagnerAnnuel > 0 ? "Levier identifié" : "Vous êtes au fair share", sub: true },
                  ]}
                />
              </>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{tc("checkInputs")}</div>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
          {tcv("methodNote")}
        </div>
      </div>

      <SEOContent
        ns="hotellerieRevpar"
        sections={[
          { titleKey: "indicesTitle", contentKey: "indicesContent" },
          { titleKey: "compsetTitle", contentKey: "compsetContent" },
          { titleKey: "fairShareTitle", contentKey: "fairShareContent" },
        ]}
        faq={[
          { questionKey: "faq1q", answerKey: "faq1a" },
          { questionKey: "faq2q", answerKey: "faq2a" },
          { questionKey: "faq3q", answerKey: "faq3a" },
        ]}
        relatedLinks={[
          { href: "/hotellerie/valorisation", labelKey: "hotelValorisation" },
          { href: "/hotellerie/exploitation", labelKey: "hotelExploitation" },
        ]}
      />
    </div>
  );
}
