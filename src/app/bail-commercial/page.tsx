"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import SEOContent from "@/components/SEOContent";
import { calculateCommercialLease, commercialLeaseBreakYears } from "@/lib/commercial-lease";

export default function BailCommercial() {
  const locale = useLocale(), lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("bailCommercialPage"), tl = useTranslations("bailCommercialLabels");
  const money = (amount: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(amount);
  const [annualRent, setAnnualRent] = useState(36000);
  const [referenceIndex, setReferenceIndex] = useState(100);
  const [targetIndex, setTargetIndex] = useState(100);
  const [hasCap, setHasCap] = useState(false), [cap, setCap] = useState(0);
  const [indefinite, setIndefinite] = useState(false), [years, setYears] = useState(3);
  const [annualCharges, setAnnualCharges] = useState(0), [depositMonths, setDepositMonths] = useState(3);
  const [hasBreak, setHasBreak] = useState(false), [interval, setInterval] = useState(3);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const result = useMemo(() => {
    try {
      return { values: calculateCommercialLease({ annualRent, referenceIndex, targetIndex, capPercent: hasCap ? cap : null, years, annualCharges, depositMonths }),
        breaks: commercialLeaseBreakYears(startYear, years, hasBreak ? interval : null) };
    } catch { return null; }
  }, [annualRent, referenceIndex, targetIndex, hasCap, cap, years, annualCharges, depositMonths, startYear, hasBreak, interval]);

  return <div className="bg-background py-8 sm:py-12 min-h-screen">
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <Link href={`${lp}/`} className="text-xs text-muted hover:text-navy">{t("backLink")}</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{t("pageDescription")}</p>
      <p className="my-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t("warningText")}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <section className="rounded-xl border border-card-border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-navy">{t("sectionLoyerInitial")}</h2>
            <InputField label={tl("loyerAnnuel")} value={annualRent} onChange={v => setAnnualRent(Number(v))} min={0.01} suffix="€" />
            <InputField label={t("referenceIndexInput")} value={referenceIndex} onChange={v => setReferenceIndex(Number(v))} min={0.001} step={0.001} />
            <InputField label={t("targetIndexInput")} value={targetIndex} onChange={v => setTargetIndex(Number(v))} min={0.001} step={0.001} />
            <p className="text-xs text-muted">{t("indexInputHelp")}</p>
            <a href="https://statistiques.public.lu/fr/donnees/themes/economie-finances/dossier-indice-prix-inflation.html" target="_blank" rel="noopener noreferrer" className="text-xs underline">{t("officialIndexSource")}</a>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={hasCap} onChange={e => setHasCap(e.target.checked)} />{t("capConfirmed")}</label>
            {hasCap && <InputField label={tl("plafond")} value={cap} onChange={v => setCap(Number(v))} min={0} max={100} suffix="%" />}
          </section>
          <section className="rounded-xl border border-card-border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-navy">{t("sectionClausesBail")}</h2>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={indefinite} onChange={e => setIndefinite(e.target.checked)} />{t("indefiniteTerm")}</label>
            <InputField label={indefinite ? t("analysisHorizon") : tl("duree")} value={years} onChange={v => setYears(Number(v))} min={1} max={99} suffix={t("ansLabel")} />
            <p className="text-xs text-muted">{t("termHelp")}</p>
            <InputField label={tl("anneeSignature")} value={startYear} onChange={v => setStartYear(Number(v))} min={1900} max={2200} />
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={hasBreak} onChange={e => setHasBreak(e.target.checked)} />{t("breakConfirmed")}</label>
            {hasBreak && <InputField label={t("breakInterval")} value={interval} onChange={v => setInterval(Number(v))} min={1} max={99} suffix={t("ansLabel")} />}
          </section>
          <section className="rounded-xl border border-card-border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-navy">{t("sectionCoutsComplementaires")}</h2>
            <InputField label={tl("depot")} value={depositMonths} onChange={v => setDepositMonths(Number(v))} min={0} max={6} step={0.5} suffix={t("suffixMoisLoyer")} hint={tl("hintDepot")} />
            <InputField label={tl("charges")} value={annualCharges} onChange={v => setAnnualCharges(Number(v))} min={0} suffix={t("suffixEuroAn")} />
            <p className="text-xs text-muted">{t("noKeyMoney")}</p>
          </section>
        </div>
        <div className="space-y-4">
          {!result ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{t("invalidInputs")}</p> : <>
            <ResultPanel title={t("indexScenarioTitle")} lines={[
              { label: t("annualIndexedRent"), value: money(result.values.indexedRent), highlight: true },
              { label: t("monthlyIndexedRent"), value: money(result.values.monthlyRent) },
              { label: t("coefficientLabel"), value: result.values.coefficient.toFixed(4) },
            ]} />
            <section className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="font-semibold text-navy">{t("coutTotalBail")} ({years} {t("ansLabel")})</h2>
              <p className="my-3 text-xs text-muted">{t("constantScenario")}</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4"><dt>{t("loyersCumules")}</dt><dd>{money(result.values.rentTotal)}</dd></div>
                <div className="flex justify-between gap-4"><dt>{t("chargesCumulees")}</dt><dd>{money(result.values.chargesTotal)}</dd></div>
                <div className="flex justify-between gap-4 font-semibold"><dt>{t("coutTotalOccupation")}</dt><dd>{money(result.values.occupationTotal)}</dd></div>
                <div className="flex justify-between gap-4"><dt>{t("depotGarantieImmob")}</dt><dd>{money(result.values.deposit)}</dd></div>
              </dl>
            </section>
            {hasBreak && <section className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="font-semibold text-navy">{t("periodesTriennales")}</h2>
              <p className="my-2 text-xs text-muted">{t("preavisTriennale")}</p>
              <p>{result.breaks.length ? result.breaks.join(" · ") : t("noBreakInHorizon")}</p>
            </section>}
          </>}
          <ResultPanel title={t("resultTitle")} lines={[
            { label: t("regDureeMin"), value: t("regDureeMinVal"), sub: true },
            { label: t("regTriennale"), value: t("regTriennaleVal"), sub: true },
            { label: t("regRenouvellement"), value: t("regRenouvellementVal"), sub: true },
            { label: t("regRegle5"), value: t("regRegle5Val"), sub: true },
            { label: t("regForme"), value: t("regFormeVal"), sub: true },
          ]} />
          <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">{t("clausesText")}</p>
        </div>
      </div>
    </div>
    <SEOContent ns="bailCommercial" sections={[
      { titleKey: "contextTitle", contentKey: "contextContent" }, { titleKey: "indexationTitle", contentKey: "indexationContent" }, { titleKey: "dureeTitle", contentKey: "dureeContent" },
    ]} faq={[
      { questionKey: "faq1q", answerKey: "faq1a" }, { questionKey: "faq2q", answerKey: "faq2a" }, { questionKey: "faq3q", answerKey: "faq3a" }, { questionKey: "faq4q", answerKey: "faq4a" },
    ]} relatedLinks={[{ href: `${lp}/calculateur-loyer`, labelKey: "loyer" }, { href: `${lp}/valorisation`, labelKey: "valorisation" }, { href: `${lp}/dcf-multi`, labelKey: "dcfMulti" }]} />
  </div>;
}
