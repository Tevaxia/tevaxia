"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerCapitalInvesti, formatEUR, formatEUR2 } from "@/lib/calculations";
import { COEFFICIENTS_REEVALUATION } from "@/lib/constants";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import RelatedTools from "@/components/RelatedTools";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOContent from "@/components/SEOContent";
import { generateLoyerPdfBlob, PdfButton } from "@/components/ToolsPdf";

export default function CalculateurLoyer() {
  const t = useTranslations("calculLoyer");
  const [prixAcquisition, setPrixAcquisition] = useState(500000);
  const [anneeAcquisition, setAnneeAcquisition] = useState(2010);
  const [travauxMontant, setTravauxMontant] = useState(0);
  const [travauxAnnee, setTravauxAnnee] = useState(2015);
  const [anneeBail, setAnneeBail] = useState(2026);
  const [surfaceHabitable, setSurfaceHabitable] = useState(80);
  const [appliquerVetuste, setAppliquerVetuste] = useState(false);
  const [tauxVetuste, setTauxVetuste] = useState(2);
  const [avecColocation, setAvecColocation] = useState(false);
  const [nbColocataires, setNbColocataires] = useState(3);
  const [estMeuble, setEstMeuble] = useState(false);
  const [showCoefficients, setShowCoefficients] = useState(false);

  // Simulation post-travaux (projet de rénovation non encore réalisé)
  const [showPostTravaux, setShowPostTravaux] = useState(false);
  const [postTravauxMontant, setPostTravauxMontant] = useState(30000);
  const [postTravauxAnnee, setPostTravauxAnnee] = useState(new Date().getFullYear());

  // Mode copropriété : travaux collectifs capitalisés × quote-part tantièmes
  const [modeCopro, setModeCopro] = useState(false);
  const [tantiemes, setTantiemes] = useState(100);
  const [tantiemesTotal, setTantiemesTotal] = useState(1000);
  const [travauxCollectifsMontant, setTravauxCollectifsMontant] = useState(0);
  const [travauxCollectifsAnnee, setTravauxCollectifsAnnee] = useState(2020);

  // Quote-part en copropriété (tantièmes / total) + travaux collectifs capitalisés
  const quotePart = useMemo(
    () => (modeCopro && tantiemesTotal > 0 ? tantiemes / tantiemesTotal : 1),
    [modeCopro, tantiemes, tantiemesTotal]
  );
  const coproTranches = useMemo(() => {
    if (!modeCopro || travauxCollectifsMontant <= 0) return [] as { montant: number; annee: number }[];
    return [{ montant: travauxCollectifsMontant * quotePart, annee: travauxCollectifsAnnee }];
  }, [modeCopro, travauxCollectifsMontant, travauxCollectifsAnnee, quotePart]);

  const result = useMemo(
    () =>
      calculerCapitalInvesti({
        prixAcquisition,
        anneeAcquisition,
        travauxMontant,
        travauxAnnee,
        tranchesSupplementaires: coproTranches.length > 0 ? coproTranches : undefined,
        anneeBail,
        surfaceHabitable,
        nbColocataires: avecColocation ? nbColocataires : undefined,
        appliquerVetuste,
        tauxVetusteAnnuel: tauxVetuste / 100,
        estMeuble,
      }),
    [prixAcquisition, anneeAcquisition, travauxMontant, travauxAnnee, coproTranches, anneeBail, surfaceHabitable, avecColocation, nbColocataires, appliquerVetuste, tauxVetuste, estMeuble]
  );

  // Scénario post-travaux : inclut les travaux projetés comme tranche supplémentaire
  const resultPostTravaux = useMemo(() => {
    if (!showPostTravaux || postTravauxMontant <= 0) return null;
    return calculerCapitalInvesti({
      prixAcquisition,
      anneeAcquisition,
      travauxMontant,
      travauxAnnee,
      tranchesSupplementaires: [
        ...coproTranches,
        { montant: postTravauxMontant, annee: postTravauxAnnee },
      ],
      anneeBail,
      surfaceHabitable,
      nbColocataires: avecColocation ? nbColocataires : undefined,
      appliquerVetuste,
      tauxVetusteAnnuel: tauxVetuste / 100,
      estMeuble,
    });
  }, [showPostTravaux, postTravauxMontant, postTravauxAnnee, coproTranches, prixAcquisition, anneeAcquisition, travauxMontant, travauxAnnee, anneeBail, surfaceHabitable, avecColocation, nbColocataires, appliquerVetuste, tauxVetuste, estMeuble]);

  return (
    <>
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

              <div className="mt-5 border-t border-card-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowPostTravaux(!showPostTravaux)}
                  className="text-sm font-semibold text-navy hover:text-navy-light"
                >
                  {showPostTravaux ? "▼ " : "▶ "}{t("postTravauxToggle")}
                </button>
                {showPostTravaux && (
                  <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-4 space-y-3">
                    <p className="text-[11px] text-sky-900">{t("postTravauxIntro")}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField
                        label={t("postTravauxMontant")}
                        value={postTravauxMontant}
                        onChange={(v) => setPostTravauxMontant(Number(v))}
                        suffix="€"
                        min={0}
                      />
                      <InputField
                        label={t("postTravauxAnnee")}
                        value={postTravauxAnnee}
                        onChange={(v) => setPostTravauxAnnee(Number(v))}
                        min={new Date().getFullYear()}
                        max={new Date().getFullYear() + 10}
                      />
                    </div>
                    {resultPostTravaux && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-3 text-xs">
                        <div className="rounded bg-white p-2 border border-sky-200">
                          <div className="text-[10px] uppercase text-muted">{t("postTravauxLoyerAvant")}</div>
                          <div className="font-mono font-bold text-slate">{Math.round(result.loyerMensuelMax).toLocaleString("fr-LU")} €/mois</div>
                        </div>
                        <div className="rounded bg-white p-2 border border-emerald-200">
                          <div className="text-[10px] uppercase text-emerald-700">{t("postTravauxLoyerApres")}</div>
                          <div className="font-mono font-bold text-emerald-900">{Math.round(resultPostTravaux.loyerMensuelMax).toLocaleString("fr-LU")} €/mois</div>
                        </div>
                        <div className="rounded bg-navy p-2 border border-navy">
                          <div className="text-[10px] uppercase text-white/70">{t("postTravauxGain")}</div>
                          <div className="font-mono font-bold text-white">
                            + {Math.round(resultPostTravaux.loyerMensuelMax - result.loyerMensuelMax).toLocaleString("fr-LU")} €/mois
                          </div>
                          <div className="text-[10px] text-white/80">
                            ({Math.round((resultPostTravaux.loyerMensuelMax - result.loyerMensuelMax) * 12).toLocaleString("fr-LU")} €/an)
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-sky-800 italic">{t("postTravauxNote")}</p>
                  </div>
                )}
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
              <h2 className="mb-4 text-base font-semibold text-navy">{t("coproSectionTitle")}</h2>
              <ToggleField
                label={t("coproToggle")}
                checked={modeCopro}
                onChange={setModeCopro}
                hint={t("coproToggleHint")}
              />
              {modeCopro && (
                <div className="mt-4 space-y-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InputField
                      label={t("coproTantiemes")}
                      value={tantiemes}
                      onChange={(v) => setTantiemes(Number(v))}
                      min={1}
                      hint={t("coproTantiemesHint")}
                    />
                    <InputField
                      label={t("coproTantiemesTotal")}
                      value={tantiemesTotal}
                      onChange={(v) => setTantiemesTotal(Number(v))}
                      min={1}
                      hint={t("coproTantiemesTotalHint")}
                    />
                  </div>
                  <div className="rounded bg-white p-2 text-xs">
                    <span className="text-muted">{t("coproQuotePart")} : </span>
                    <span className="font-mono font-bold text-navy">
                      {tantiemesTotal > 0 ? ((tantiemes / tantiemesTotal) * 100).toFixed(2) : "0"} %
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InputField
                      label={t("coproTravauxMontant")}
                      value={travauxCollectifsMontant}
                      onChange={(v) => setTravauxCollectifsMontant(Number(v))}
                      suffix="€"
                      min={0}
                      hint={t("coproTravauxMontantHint")}
                    />
                    <InputField
                      label={t("coproTravauxAnnee")}
                      value={travauxCollectifsAnnee}
                      onChange={(v) => setTravauxCollectifsAnnee(Number(v))}
                      min={1960}
                      max={2026}
                    />
                  </div>
                  {travauxCollectifsMontant > 0 && (
                    <div className="rounded bg-white p-2 text-xs">
                      <span className="text-muted">{t("coproTravauxQuotePart")} : </span>
                      <span className="font-mono font-bold text-navy">
                        {formatEUR(travauxCollectifsMontant * quotePart)}
                      </span>
                    </div>
                  )}
                  <p className="text-[11px] text-indigo-900 italic">{t("coproNote")}</p>
                </div>
              )}
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
                    const c = COEFFICIENTS_REEVALUATION[a];
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

            <div className="mt-4 rounded-xl border border-navy/20 bg-navy/5 p-4 text-center">
              <h3 className="text-sm font-semibold text-navy">Observer le marché</h3>
              <p className="mt-1 text-xs text-muted">
                Comparez votre plafond légal aux loyers réellement observés au Luxembourg par commune et typologie.
              </p>
              <Link href="/calculateur-loyer/observatoire"
                className="mt-3 inline-block rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light">
                Observatoire des loyers LU →
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>

    <SEOContent
      ns="calculLoyer"
      sections={[
        { titleKey: "plafonnementTitle", contentKey: "plafonnementContent" },
        { titleKey: "capitalInvestiTitle", contentKey: "capitalInvestiContent" },
        { titleKey: "coefficientTitle", contentKey: "coefficientContent" },
        { titleKey: "vetusteTitle", contentKey: "vetusteContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
        { questionKey: "faq5q", answerKey: "faq5a" },
      ]}
      relatedLinks={[
        { href: "/estimation", labelKey: "estimation" },
        { href: "/plus-values", labelKey: "plusValues" },
        { href: "/frais-acquisition", labelKey: "frais" },
      ]}
    />
    </>
  );
}
