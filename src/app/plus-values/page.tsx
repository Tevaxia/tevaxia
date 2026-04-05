"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerPlusValue, formatEUR } from "@/lib/calculations";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import RelatedTools from "@/components/RelatedTools";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generatePlusValuesPdfBlob, PdfButton } from "@/components/ToolsPdf";

export default function PlusValues() {
  const t = useTranslations("plusValues");
  const [prixAcquisition, setPrixAcquisition] = useState(400000);
  const [anneeAcquisition, setAnneeAcquisition] = useState(2015);
  const [prixCession, setPrixCession] = useState(550000);
  const [anneeCession, setAnneeCession] = useState(2025);
  const [fraisAcquisition, setFraisAcquisition] = useState(0);
  const [travauxDeductibles, setTravauxDeductibles] = useState(0);
  const [estResidencePrincipale, setEstResidencePrincipale] = useState(false);
  const [estCouple, setEstCouple] = useState(false);

  const result = useMemo(
    () =>
      calculerPlusValue({
        prixAcquisition,
        anneeAcquisition,
        prixCession,
        anneeCession,
        fraisAcquisition: fraisAcquisition || undefined,
        travauxDeductibles: travauxDeductibles || undefined,
        estResidencePrincipale,
        estCouple,
      }),
    [prixAcquisition, anneeAcquisition, prixCession, anneeCession, fraisAcquisition, travauxDeductibles, estResidencePrincipale, estCouple]
  );

  const typeLabel =
    result.typeGain === "exonere"
      ? t("typeExonere")
      : result.typeGain === "speculation"
      ? t("typeSpeculation")
      : t("typeCession");

  const typeBadgeColor =
    result.typeGain === "exonere"
      ? "bg-green-100 text-green-800"
      : result.typeGain === "speculation"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
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
                />
                <InputField
                  label={t("anneeAcquisition")}
                  value={anneeAcquisition}
                  onChange={(v) => setAnneeAcquisition(Number(v))}
                  min={1960}
                  max={2026}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionCession")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t("prixCession")}
                  value={prixCession}
                  onChange={(v) => setPrixCession(Number(v))}
                  suffix="€"
                  min={0}
                />
                <InputField
                  label={t("anneeCession")}
                  value={anneeCession}
                  onChange={(v) => setAnneeCession(Number(v))}
                  min={1960}
                  max={2030}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionDeductions")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t("fraisAcquisition")}
                  value={fraisAcquisition}
                  onChange={(v) => setFraisAcquisition(Number(v))}
                  suffix="€"
                  min={0}
                  hint={t("fraisAcquisitionHint")}
                />
                <InputField
                  label={t("travauxPlusValue")}
                  value={travauxDeductibles}
                  onChange={(v) => setTravauxDeductibles(Number(v))}
                  suffix="€"
                  min={0}
                  hint={t("travauxHint")}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionSituation")}</h2>
              <div className="space-y-3">
                <ToggleField
                  label={t("residencePrincipale")}
                  checked={estResidencePrincipale}
                  onChange={setEstResidencePrincipale}
                  hint={t("residencePrincipaleHint")}
                />
                <ToggleField
                  label={t("coupleLabel")}
                  checked={estCouple}
                  onChange={setEstCouple}
                  hint={t("coupleHint")}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Type badge */}
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${typeBadgeColor}`}>
                {typeLabel}
              </span>
              <span className="text-sm text-muted">
                {t("detention", { duree: result.dureeDetention, s: result.dureeDetention > 1 ? "s" : "" })}
              </span>
            </div>

            {/* Timeline de détention */}
            {(() => {
              const maxYears = Math.max(5, result.dureeDetention + 1);
              const pctUser = Math.min((result.dureeDetention / maxYears) * 100, 100);
              const pctTwoYears = (2 / maxYears) * 100;
              return (
                <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-navy">{t("timelineTitle")}</h3>
                  {/* Bar */}
                  <div className="relative h-7 w-full rounded-full overflow-hidden bg-gray-100">
                    {/* Red zone: 0-2 years */}
                    <div
                      className="absolute inset-y-0 left-0 bg-red-400/70"
                      style={{ width: `${pctTwoYears}%` }}
                    />
                    {/* Amber zone: 2+ years */}
                    <div
                      className="absolute inset-y-0 bg-amber-400/60"
                      style={{ left: `${pctTwoYears}%`, right: 0 }}
                    />
                    {/* User dot */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full border-2 border-white bg-navy shadow-md z-10"
                      style={{ left: `${pctUser}%` }}
                      title={t("detention", { duree: result.dureeDetention, s: result.dureeDetention > 1 ? "s" : "" })}
                    />
                  </div>
                  {/* Labels under the bar */}
                  <div className="relative mt-1.5 h-5 text-[10px] font-medium">
                    <span className="absolute left-0 text-red-700">0</span>
                    <span
                      className="absolute -translate-x-1/2 text-red-700"
                      style={{ left: `${pctTwoYears}%` }}
                    >
                      {t("deuxAns")}
                    </span>
                    <span className="absolute right-0 text-amber-700">{t("nAns", { n: maxYears })}</span>
                  </div>
                  {/* Legend */}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" />
                      <span className="text-muted">{t("legendeSpeculation")}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />
                      <span className="text-muted">{t("legendeCession")}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
                      <span className="text-muted">{t("legendeExonere")}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-navy bg-navy" />
                      <span className="text-slate font-semibold">
                        {t("votreDetention", { duree: result.dureeDetention, s: result.dureeDetention > 1 ? "s" : "" })}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })()}

            {result.typeGain === "exonere" ? (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6">
                <h3 className="text-lg font-semibold text-green-800">{t("exonerationTotale")}</h3>
                <p className="mt-2 text-sm text-green-700">
                  {result.explication}
                </p>
                <p className="mt-3 text-sm text-green-600">
                  {t("plusValueBruteNonImposable", { montant: formatEUR(result.gainBrut) })}
                </p>
              </div>
            ) : (
              <>
                <ResultPanel
                  title={t("calculPlusValueTitle")}
                  lines={[
                    { label: t("prixCessionResult"), value: formatEUR(prixCession) },
                    ...(result.typeGain === "cession"
                      ? [
                          { label: t("prixAcquisitionResult"), value: formatEUR(prixAcquisition), sub: true },
                          {
                            label: t("coefficientReevaluation", { annee: anneeAcquisition }),
                            value: result.coefficient.toFixed(2),
                            sub: true,
                          },
                          {
                            label: t("prixAcquisitionRevalorise"),
                            value: `- ${formatEUR(result.prixAcquisitionRevalorise)}`,
                          },
                        ]
                      : [{ label: t("prixAcquisitionResult"), value: `- ${formatEUR(prixAcquisition)}` }]),
                    ...(result.fraisForfaitaires > 0
                      ? [{ label: t("fraisDeductibles"), value: `- ${formatEUR(result.fraisForfaitaires)}`, sub: true }]
                      : []),
                    { label: t("plusValueBrute"), value: formatEUR(result.gainBrut), highlight: true },
                    ...(result.abattement > 0
                      ? [
                          {
                            label: t("abattementDecennal", { couple: estCouple ? ` ${t("couple")}` : "" }),
                            value: `- ${formatEUR(result.abattement)}`,
                          },
                        ]
                      : []),
                    { label: t("plusValueImposable"), value: formatEUR(result.gainImposable), highlight: true, large: true },
                  ]}
                />

                <ResultPanel
                  title={t("estimationImpotTitle")}
                  className="border-warning/30"
                  lines={[
                    {
                      label: result.typeGain === "speculation" ? t("tauxGlobal") : t("demiTauxGlobal"),
                      value: `~${(result.tauxEffectif * 100).toFixed(0)} %`,
                      sub: true,
                    },
                    { label: t("impotEstime"), value: formatEUR(result.estimationImpot), highlight: true, large: true },
                    { label: t("netApresImpot"), value: formatEUR(result.netApresImpot), highlight: true },
                  ]}
                />
              </>
            )}

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">{t("explicationTitle")}</h3>
              <p className="text-sm text-muted leading-relaxed">{result.explication}</p>
              <div className="mt-4 space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">{t("infoSpeculationTitle")}</strong> — {t("infoSpeculationText")}
                </p>
                <p>
                  <strong className="text-slate">{t("infoCessionTitle")}</strong> — {t("infoCessionText")}
                </p>
                <p>
                  <strong className="text-slate">{t("infoResidenceTitle")}</strong> — {t("infoResidenceText")}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              <SaveButton
                onClick={() => {
                  sauvegarderEvaluation({
                    nom: `${t("savePrefix")} — ${formatEUR(prixAcquisition)} → ${formatEUR(prixCession)}`,
                    type: "plus-values",
                    valeurPrincipale: result.gainImposable,
                    data: { prixAcquisition, anneeAcquisition, prixCession, anneeCession, fraisAcquisition, travauxDeductibles, estResidencePrincipale, estCouple },
                  });
                }}
                label={t("sauvegarder")}
                successLabel={t("evaluationSauvegardee")}
              />
              <PdfButton
                label="PDF"
                filename={`plus-values-${new Date().toLocaleDateString("fr-LU")}.pdf`}
                generateBlob={() =>
                  generatePlusValuesPdfBlob({
                    prixAcquisition,
                    prixCession,
                    anneeAcquisition,
                    anneeCession,
                    dureeDetention: result.dureeDetention,
                    coefficientReeval: result.typeGain === "cession" ? result.coefficient : undefined,
                    prixAcquisitionReevalue: result.typeGain === "cession" ? result.prixAcquisitionRevalorise : undefined,
                    plusValueBrute: result.gainBrut,
                    abattement: result.abattement > 0 ? result.abattement : undefined,
                    plusValueImposable: result.gainImposable,
                    tauxImposition: result.tauxEffectif * 100,
                    impot: result.estimationImpot,
                    isSpeculative: result.typeGain === "speculation",
                  })
                }
              />
            </div>

            <RelatedTools keys={["estimation", "frais", "valorisation"]} />
          </div>
        </div>
      </div>

    </div>
  );
}
