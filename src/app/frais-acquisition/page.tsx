"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerFraisAcquisition, formatEUR, formatPct } from "@/lib/calculations";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import RelatedTools from "@/components/RelatedTools";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOContent from "@/components/SEOContent";
import { generateFraisPdfBlob, PdfButton } from "@/components/ToolsPdf";

export default function FraisAcquisition() {
  const t = useTranslations("fraisAcquisition");
  const [prixBien, setPrixBien] = useState(750000);
  const [estNeuf, setEstNeuf] = useState(false);
  const [partTerrain, setPartTerrain] = useState(250000);
  const [residencePrincipale, setResidencePrincipale] = useState(true);
  const [nonResident, setNonResident] = useState(false);
  const [achatSociete, setAchatSociete] = useState(false);
  const [nbAcquereurs, setNbAcquereurs] = useState<1 | 2>(2);
  const [montantHypotheque, setMontantHypotheque] = useState(600000);

  // Frais annexes optionnels (architecte, géomètre, diagnostic, déménagement)
  const [inclureFraisAnnexes, setInclureFraisAnnexes] = useState(false);
  const [fraisArchitecte, setFraisArchitecte] = useState(0);
  const [fraisGeometre, setFraisGeometre] = useState(0);
  const [fraisDiagnostic, setFraisDiagnostic] = useState(500);
  const [fraisDemenagement, setFraisDemenagement] = useState(1500);
  const [fraisCourtage, setFraisCourtage] = useState(0);
  const totalFraisAnnexes = inclureFraisAnnexes
    ? fraisArchitecte + fraisGeometre + fraisDiagnostic + fraisDemenagement + fraisCourtage
    : 0;

  // Un non-résident fiscal LU ne peut pas déclarer le bien comme RP LU
  // (sauf cas rares de détachement). On force donc residencePrincipale = false.
  const effRP = nonResident ? false : residencePrincipale;

  const partConstruction = prixBien - partTerrain;

  const result = useMemo(
    () =>
      calculerFraisAcquisition({
        prixBien,
        estNeuf,
        partTerrain: estNeuf ? partTerrain : undefined,
        partConstruction: estNeuf ? partConstruction : undefined,
        residencePrincipale: effRP,
        nbAcquereurs,
        montantHypotheque,
      }),
    [prixBien, estNeuf, partTerrain, partConstruction, effRP, nbAcquereurs, montantHypotheque]
  );

  return (
    <>
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
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionBien")}</h2>
              <div className="space-y-4">
                <InputField
                  label={t("prixBien")}
                  value={prixBien}
                  onChange={(v) => setPrixBien(Number(v))}
                  suffix="€"
                  min={0}
                />
                <ToggleField
                  label={t("neufLabel")}
                  checked={estNeuf}
                  onChange={setEstNeuf}
                  hint={t("neufHint")}
                />
                {estNeuf && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      label={t("partTerrain")}
                      value={partTerrain}
                      onChange={(v) => setPartTerrain(Number(v))}
                      suffix="€"
                      min={0}
                      hint={t("partTerrainHint")}
                    />
                    <InputField
                      label={t("partConstruction")}
                      value={partConstruction}
                      onChange={() => {}}
                      suffix="€"
                      hint={t("partConstructionHint")}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionAcquereur")}</h2>
              <div className="space-y-4">
                <ToggleField
                  label={t("nonResident")}
                  checked={nonResident}
                  onChange={setNonResident}
                  hint={t("nonResidentHint")}
                />
                {!nonResident && (
                  <ToggleField
                    label={t("residencePrincipale")}
                    checked={residencePrincipale}
                    onChange={setResidencePrincipale}
                    hint={t("residencePrincipaleHint")}
                  />
                )}
                {nonResident && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <strong className="block mb-1">{t("nonResidentDisclaimerTitle")}</strong>
                    {t("nonResidentDisclaimerText")}
                  </div>
                )}
                <ToggleField
                  label={t("achatSociete")}
                  checked={achatSociete}
                  onChange={setAchatSociete}
                  hint={t("achatSocieteHint")}
                />
                {achatSociete && (
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900 space-y-2">
                    <strong className="block">{t("achatSocieteInfoTitle")}</strong>
                    <ul className="ml-4 list-disc space-y-1">
                      <li>{t("achatSocieteItem1")}</li>
                      <li>{t("achatSocieteItem2")}</li>
                      <li>{t("achatSocieteItem3")}</li>
                      <li>{t("achatSocieteItem4")}</li>
                      <li>{t("achatSocieteItem5")}</li>
                    </ul>
                    <p className="mt-2 italic text-[11px]">{t("achatSocieteExpert")}</p>
                  </div>
                )}
                <InputField
                  label={t("nbAcquereurs")}
                  type="select"
                  value={String(nbAcquereurs)}
                  onChange={(v) => setNbAcquereurs(Number(v) as 1 | 2)}
                  options={[
                    { value: "1", label: t("acquereur1") },
                    { value: "2", label: t("acquereur2") },
                  ]}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionFinancement")}</h2>
              <InputField
                label={t("montantHypotheque")}
                value={montantHypotheque}
                onChange={(v) => setMontantHypotheque(Number(v))}
                suffix="€"
                min={0}
                hint={t("montantHypothequeHint")}
              />
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionAnnexes")}</h2>
              <ToggleField
                label={t("inclureAnnexes")}
                checked={inclureFraisAnnexes}
                onChange={setInclureFraisAnnexes}
                hint={t("inclureAnnexesHint")}
              />
              {inclureFraisAnnexes && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InputField
                    label={t("fraisArchitecte")}
                    value={fraisArchitecte}
                    onChange={(v) => setFraisArchitecte(Number(v))}
                    suffix="€"
                    min={0}
                    hint={t("fraisArchitecteHint")}
                  />
                  <InputField
                    label={t("fraisGeometre")}
                    value={fraisGeometre}
                    onChange={(v) => setFraisGeometre(Number(v))}
                    suffix="€"
                    min={0}
                    hint={t("fraisGeometreHint")}
                  />
                  <InputField
                    label={t("fraisDiagnostic")}
                    value={fraisDiagnostic}
                    onChange={(v) => setFraisDiagnostic(Number(v))}
                    suffix="€"
                    min={0}
                    hint={t("fraisDiagnosticHint")}
                  />
                  <InputField
                    label={t("fraisDemenagement")}
                    value={fraisDemenagement}
                    onChange={(v) => setFraisDemenagement(Number(v))}
                    suffix="€"
                    min={0}
                    hint={t("fraisDemenagementHint")}
                  />
                  <InputField
                    label={t("fraisCourtage")}
                    value={fraisCourtage}
                    onChange={(v) => setFraisCourtage(Number(v))}
                    suffix="€"
                    min={0}
                    hint={t("fraisCourtageHint")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <ResultPanel
              title={t("resultDroitsTitle")}
              lines={[
                { label: t("baseTaxable"), value: formatEUR(result.baseDroits), sub: true },
                { label: t("droitsEnregistrement"), value: formatEUR(result.droitsEnregistrement) },
                { label: t("droitsTranscription"), value: formatEUR(result.droitsTranscription) },
                { label: t("totalDroitsBruts"), value: formatEUR(result.droitsTotal) },
                ...(result.creditBellegenAkt > 0
                  ? [
                      {
                        label: t("bellegenAkt", { nb: nbAcquereurs }),
                        value: `- ${formatEUR(result.creditBellegenAkt)}`,
                      },
                    ]
                  : []),
                { label: t("droitsNets"), value: formatEUR(result.droitsApresCredit), highlight: true },
              ]}
            />

            {estNeuf && (
              <ResultPanel
                title={t("resultTvaTitle")}
                lines={[
                  { label: t("baseTva"), value: formatEUR(result.tvaApplicable), sub: true },
                  {
                    label: t("tauxApplique"),
                    value: effRP ? t("tauxReduit") : t("tauxNormal"),
                  },
                  { label: t("montantTva"), value: formatEUR(result.montantTva) },
                  ...(result.faveurFiscaleTva > 0
                    ? [{ label: t("faveurFiscaleTva"), value: formatEUR(result.faveurFiscaleTva), sub: true }]
                    : []),
                ]}
              />
            )}

            <ResultPanel
              title={t("resultAutresFrais")}
              lines={[
                { label: t("emolumentsNotaire"), value: formatEUR(result.emolumentsNotaire) },
                ...(montantHypotheque > 0
                  ? [
                      { label: t("fraisHypotheque"), value: formatEUR(result.fraisHypotheque) },
                    ]
                  : []),
              ]}
            />

            {inclureFraisAnnexes && totalFraisAnnexes > 0 && (
              <ResultPanel
                title={t("resultAnnexes")}
                lines={[
                  ...(fraisArchitecte > 0 ? [{ label: t("fraisArchitecte"), value: formatEUR(fraisArchitecte), sub: true }] : []),
                  ...(fraisGeometre > 0 ? [{ label: t("fraisGeometre"), value: formatEUR(fraisGeometre), sub: true }] : []),
                  ...(fraisDiagnostic > 0 ? [{ label: t("fraisDiagnostic"), value: formatEUR(fraisDiagnostic), sub: true }] : []),
                  ...(fraisDemenagement > 0 ? [{ label: t("fraisDemenagement"), value: formatEUR(fraisDemenagement), sub: true }] : []),
                  ...(fraisCourtage > 0 ? [{ label: t("fraisCourtage"), value: formatEUR(fraisCourtage), sub: true }] : []),
                  { label: t("totalAnnexes"), value: formatEUR(totalFraisAnnexes), highlight: true },
                ]}
              />
            )}

            <ResultPanel
              title={t("resultTotal")}
              className="border-gold/30"
              lines={[
                { label: t("prixDuBien"), value: formatEUR(prixBien) },
                { label: t("totalFrais", { pct: formatPct(result.totalPourcentage) }), value: formatEUR(result.totalFrais) },
                ...(totalFraisAnnexes > 0
                  ? [{ label: t("fraisAnnexesLabel"), value: formatEUR(totalFraisAnnexes), sub: true }]
                  : []),
                {
                  label: t("coutTotalAcquisition"),
                  value: formatEUR(result.coutTotalAcquisition + totalFraisAnnexes),
                  highlight: true,
                  large: true,
                },
              ]}
            />

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            {/* Camembert décomposition */}
            {result.totalFrais > 0 && (() => {
              const data = [
                { name: t("chartDroitsNets"), value: result.droitsApresCredit, color: "#1B2A4A" },
                ...(result.montantTva > 0 ? [{ name: t("chartTva"), value: result.montantTva, color: "#C8A951" }] : []),
                { name: t("chartNotaire"), value: result.emolumentsNotaire, color: "#2A9D8F" },
                ...(result.fraisHypotheque > 0 ? [{ name: t("chartHypotheque"), value: result.fraisHypotheque, color: "#6B7280" }] : []),
              ].filter((d) => d.value > 0);
              return (
                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-navy">{t("decompositionTitle")}</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatEUR(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {data.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-muted">{d.name}</span>
                        <span className="font-mono font-semibold">{formatEUR(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

              <h3 className="mb-3 text-base font-semibold text-navy">{t("bonASavoir")}</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">{t("infobellegenTitle")}</strong> — {t("infobellegenText")}
                </p>
                <p>
                  <strong className="text-slate">{t("infoVefaTitle")}</strong> — {t("infoVefaText")}
                </p>
                <p>
                  <strong className="text-slate">{t("infoNotaireTitle")}</strong> — {t("infoNotaireText")}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              <SaveButton
                onClick={() => {
                  sauvegarderEvaluation({
                    nom: `${t("savePrefix")} — ${formatEUR(prixBien)}`,
                    type: "frais",
                    valeurPrincipale: result.totalFrais,
                    data: { prixBien, estNeuf, partTerrain, residencePrincipale, nbAcquereurs, montantHypotheque },
                  });
                }}
                label={t("sauvegarder")}
                successLabel={t("evaluationSauvegardee")}
              />
              <PdfButton
                label="PDF"
                filename={`frais-acquisition-${new Date().toLocaleDateString("fr-LU")}.pdf`}
                generateBlob={() =>
                  generateFraisPdfBlob({
                    prixAchat: prixBien,
                    droitsEnregistrement: result.droitsEnregistrement,
                    droitTranscription: result.droitsTranscription,
                    tva: estNeuf ? result.montantTva : undefined,
                    fraisNotaire: result.emolumentsNotaire,
                    fraisHypotheque: montantHypotheque > 0 ? result.fraisHypotheque : undefined,
                    totalFrais: result.totalFrais,
                    totalAcquisition: result.coutTotalAcquisition,
                    isVEFA: estNeuf,
                  })
                }
              />
            </div>

            <RelatedTools keys={["aides", "estimation", "vefa"]} />
          </div>
        </div>
      </div>

    </div>

    <SEOContent
      ns="fraisAcquisition"
      sections={[
        { titleKey: "comprendreTitle", contentKey: "comprendreContent" },
        { titleKey: "bellegenAktTitle", contentKey: "bellegenAktContent" },
        { titleKey: "vefaTvaTitle", contentKey: "vefaTvaContent" },
        { titleKey: "exempleTitle", contentKey: "exempleContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
        { questionKey: "faq5q", answerKey: "faq5a" },
      ]}
      relatedLinks={[
        { href: "/simulateur-aides", labelKey: "aides" },
        { href: "/vefa", labelKey: "vefa" },
        { href: "/achat-vs-location", labelKey: "achatLocation" },
      ]}
    />
    </>
  );
}
