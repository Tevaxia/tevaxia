"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerCapitalInvesti, formatEUR, formatEUR2 } from "@/lib/calculations";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import RelatedTools from "@/components/RelatedTools";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generateLoyerPdfBlob, PdfButton } from "@/components/ToolsPdf";

export default function CalculateurLoyer() {
  const t = useTranslations("calculLoyer");
  const [prixAcquisition, setPrixAcquisition] = useState(500000);
  const [anneeAcquisition, setAnneeAcquisition] = useState(2010);
  const [travauxMontant, setTravauxMontant] = useState(0);
  const [travauxAnnee, setTravauxAnnee] = useState(2015);
  const [anneeBail, setAnneeBail] = useState(2025);
  const [surfaceHabitable, setSurfaceHabitable] = useState(80);
  const [appliquerVetuste, setAppliquerVetuste] = useState(false);
  const [tauxVetuste, setTauxVetuste] = useState(2);
  const [avecColocation, setAvecColocation] = useState(false);
  const [nbColocataires, setNbColocataires] = useState(3);
  const [estMeuble, setEstMeuble] = useState(false);
  const [showCoefficients, setShowCoefficients] = useState(false);

  const result = useMemo(
    () =>
      calculerCapitalInvesti({
        prixAcquisition,
        anneeAcquisition,
        travauxMontant,
        travauxAnnee,
        anneeBail,
        surfaceHabitable,
        nbColocataires: avecColocation ? nbColocataires : undefined,
        appliquerVetuste,
        tauxVetusteAnnuel: tauxVetuste / 100,
        estMeuble,
      }),
    [prixAcquisition, anneeAcquisition, travauxMontant, travauxAnnee, anneeBail, surfaceHabitable, avecColocation, nbColocataires, appliquerVetuste, tauxVetuste, estMeuble]
  );

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionAcquisition")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t("prixAcquisition")}
                  value={prixAcquisition}
                  onChange={(v) => setPrixAcquisition(Number(v))}
                  suffix="€"
                  min={0}
                  hint={t("prixAcquisitionHint")}
                />
                <InputField
                  label={t("anneeAcquisition")}
                  value={anneeAcquisition}
                  onChange={(v) => setAnneeAcquisition(Number(v))}
                  min={1960}
                  max={2026}
                  hint={t("anneeAcquisitionHint")}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionTravaux")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t("montantTravaux")}
                  value={travauxMontant}
                  onChange={(v) => setTravauxMontant(Number(v))}
                  suffix="€"
                  min={0}
                  hint={t("montantTravauxHint")}
                />
                <InputField
                  label={t("anneeTravaux")}
                  value={travauxAnnee}
                  onChange={(v) => setTravauxAnnee(Number(v))}
                  min={1960}
                  max={2026}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionBailSurface")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t("anneeBail")}
                  value={anneeBail}
                  onChange={(v) => setAnneeBail(Number(v))}
                  min={1960}
                  max={2030}
                />
                <InputField
                  label={t("surfaceHabitable")}
                  value={surfaceHabitable}
                  onChange={(v) => setSurfaceHabitable(Number(v))}
                  suffix="m²"
                  min={1}
                />
              </div>
              <div className="mt-4 space-y-3">
                <ToggleField
                  label={t("logementMeuble")}
                  checked={estMeuble}
                  onChange={setEstMeuble}
                  hint={t("logementMeubleHint")}
                />
                <ToggleField
                  label={t("colocation")}
                  checked={avecColocation}
                  onChange={setAvecColocation}
                  hint={t("colocationHint")}
                />
                {avecColocation && (
                  <InputField
                    label={t("nbColocataires")}
                    value={nbColocataires}
                    onChange={(v) => setNbColocataires(Number(v))}
                    min={2}
                    max={10}
                  />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionVetuste")}</h2>
              <div className="space-y-3">
                <ToggleField
                  label={t("appliquerVetuste")}
                  checked={appliquerVetuste}
                  onChange={setAppliquerVetuste}
                  hint={t("appliquerVetusteHint")}
                />
                {appliquerVetuste && (
                  <InputField
                    label={t("tauxVetuste")}
                    value={tauxVetuste}
                    onChange={(v) => setTauxVetuste(Number(v))}
                    suffix="%"
                    min={0}
                    max={5}
                    step={0.5}
                    hint={t("tauxVetusteHint")}
                  />
                )}
              </div>
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>{t("vetusteWarningTitle")}</strong> {t("vetusteWarningText")}
                </p>
              </div>
            </div>

            {/* Tableau coefficients STATEC */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <button onClick={() => setShowCoefficients(!showCoefficients)} className="flex items-center justify-between w-full text-left">
                <h2 className="text-base font-semibold text-navy">{t("coefficientsSTATEC")}</h2>
                <svg className={`h-5 w-5 text-muted transition-transform ${showCoefficients ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {showCoefficients && (
                <div className="mt-4 grid grid-cols-3 gap-1 text-xs sm:grid-cols-5">
                  {Array.from({ length: 2026 - 1960 + 1 }, (_, i) => {
                    const a = 1960 + i;
                    const c = require("@/lib/constants").COEFFICIENTS_REEVALUATION[a];
                    return c ? (
                      <div key={a} className={`flex justify-between rounded px-2 py-1 ${a === anneeAcquisition ? "bg-navy/10 font-semibold text-navy" : ""}`}>
                        <span className="text-muted">{a}</span>
                        <span className="font-mono">{c.toFixed(2)}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <ResultPanel
              title={t("resultCapitalInvesti")}
              lines={[
                { label: t("prixAcquisition"), value: formatEUR(prixAcquisition) },
                { label: t("coeffReevaluation", { annee: anneeAcquisition }), value: result.coeffAcquisition.toFixed(2), sub: true },
                { label: t("prixReevalue"), value: formatEUR(result.prixReevalue) },
                ...(travauxMontant > 0
                  ? [
                      { label: t("travauxAmelioration"), value: formatEUR(travauxMontant) },
                      { label: t("coeffReevaluation", { annee: travauxAnnee }), value: result.coeffTravaux.toFixed(2), sub: true },
                      { label: t("travauxReevalues"), value: formatEUR(result.travauxReevalues) },
                    ]
                  : []),
                ...(appliquerVetuste
                  ? [{
                      label: t("vetusteLabel", { annees: result.anneesVetuste, taux: tauxVetuste }),
                      value: `- ${formatEUR(result.decoteVetuste)} (${(result.decoteVetustePct * 100).toFixed(0)}%)`,
                      warning: result.decoteVetustePct >= 0.5,
                    }]
                  : []),
                { label: t("capitalInvesti"), value: formatEUR(result.capitalInvesti), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title={t("resultPlafondLoyer")}
              className="border-gold/30"
              lines={[
                { label: t("loyerAnnuelMax"), value: formatEUR2(result.loyerAnnuelMax) },
                { label: t("loyerMensuelMax"), value: formatEUR2(result.loyerMensuelMax), highlight: true, large: true },
                { label: t("loyerM2Mois"), value: formatEUR2(result.loyerM2Mensuel), sub: true },
                ...(avecColocation && result.loyerParColocataire
                  ? [
                      {
                        label: t("loyerParColocataire", { nb: nbColocataires }),
                        value: formatEUR2(result.loyerParColocataire),
                        highlight: true,
                      },
                    ]
                  : []),
              ]}
            />

            {/* Explications */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">{t("baseLegaleTitle")}</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">{t("loi2006Title")}</strong> — {t("loi2006Text")}
                </p>
                <p>
                  <strong className="text-slate">{t("capitalInvestiTitle")}</strong> = {t("capitalInvestiText")}
                </p>
                <p>
                  <strong className="text-slate">{t("reforme2024Title")}</strong> — {t("reforme2024Text")}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              <SaveButton
                onClick={() => {
                  sauvegarderEvaluation({
                    nom: `${t("savePrefix")} — ${formatEUR(prixAcquisition)} (${surfaceHabitable} m²)`,
                    type: "loyer",
                    valeurPrincipale: result.loyerMensuelMax,
                    data: { prixAcquisition, anneeAcquisition, travauxMontant, travauxAnnee, anneeBail, surfaceHabitable, appliquerVetuste, tauxVetuste, avecColocation, nbColocataires, estMeuble },
                  });
                }}
                label={t("saveButton")}
                successLabel={t("saveToast")}
              />
              <PdfButton
                label="PDF"
                filename={`loyer-plafond-${new Date().toLocaleDateString("fr-LU")}.pdf`}
                generateBlob={() =>
                  generateLoyerPdfBlob({
                    capitalInvesti: result.capitalInvesti,
                    surface: surfaceHabitable,
                    plafondLoyer: result.loyerAnnuelMax,
                    loyerMensuel: result.loyerMensuelMax,
                    loyerM2: result.loyerM2Mensuel,
                    rendementBrut: result.capitalInvesti > 0 ? (result.loyerAnnuelMax / result.capitalInvesti) * 100 : 0,
                  })
                }
              />
            </div>

            <RelatedTools keys={["estimation", "carte", "achatLocation"]} />
          </div>
        </div>
      </div>

    </div>
  );
}
