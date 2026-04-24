"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  runScreening, LU_TOP15_THRESHOLDS, LU_NZEB_THRESHOLDS, EPC_CLASS_ORDER,
  type TaxonomyScreeningInput, type BuildYear, type EpcClass,
} from "@/lib/taxonomy";

type PropertyType = "residential_mfh" | "residential_sfh" | "office" | "retail" | "hotel";

export default function TaxonomyWizardPage() {
  const t = useTranslations("esgTaxo");
  const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
    residential_mfh: t("typeMfh"),
    residential_sfh: t("typeSfh"),
    office: t("typeOffice"),
    retail: t("typeRetail"),
    hotel: t("typeHotel"),
  };

  const BUILD_YEAR_LABELS: Record<BuildYear, string> = {
    after_2021: t("buildAfter2021"),
    before_2021_top15: t("buildBeforeTop15"),
    before_2021_epca: t("buildBeforeEpcA"),
    before_2021_other: t("buildBeforeOther"),
  };

  const [step, setStep] = useState(1);
  const [propertyType, setPropertyType] = useState<PropertyType>("residential_mfh");
  const [address, setAddress] = useState("");

  const [buildYear, setBuildYear] = useState<BuildYear>("after_2021");
  const [epcClass, setEpcClass] = useState<EpcClass>("B");
  const [pedKwhM2, setPedKwhM2] = useState(40);

  const [dnsh, setDnsh] = useState({
    climateRiskAssessed: false,
    adaptationPlan: false,
    waterEfficient: false,
    circularCDWaste: false,
    pollutionControlled: false,
    biodiversityProtected: false,
  });

  const [ms, setMs] = useState({
    oecdCompliance: false,
    unGuidingPrinciples: false,
    ilo: false,
    humanRights: false,
  });

  const input: TaxonomyScreeningInput = useMemo(() => ({
    sc: {
      activity: "7.7",
      buildYear,
      epcClass,
      pedKwhM2,
      nzebThresholdKwhM2: LU_NZEB_THRESHOLDS[propertyType],
      top15PctThresholdKwhM2: LU_TOP15_THRESHOLDS[propertyType],
    },
    dnsh,
    minimumSafeguards: ms,
  }), [buildYear, epcClass, pedKwhM2, propertyType, dnsh, ms]);

  const result = useMemo(() => runScreening(input), [input]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Link href="/esg" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
      <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
      <p className="mt-1 text-sm text-muted max-w-3xl">
        {t("pageSubtitle")}
      </p>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto">
        {[
          { n: 1, label: t("stepBien") },
          { n: 2, label: t("stepSC") },
          { n: 3, label: t("stepDNSH") },
          { n: 4, label: t("stepMS") },
          { n: 5, label: t("stepResult") },
        ].map((s, i, arr) => (
          <div key={s.n} className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setStep(s.n)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                step === s.n
                  ? "border-navy bg-navy text-white font-semibold"
                  : "border-card-border bg-background text-slate hover:border-navy/40"
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === s.n ? "bg-white text-navy" : "bg-slate-200 text-slate-700"}`}>
                {s.n}
              </span>
              {s.label}
            </button>
            {i < arr.length - 1 && <span className="text-muted">→</span>}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6 rounded-xl border border-card-border bg-card p-6 space-y-5">
        {step === 1 && (
          <>
            <h2 className="text-base font-semibold text-navy">{t("step1Title")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <label>
                <span className="text-muted">{t("addressLabel")}</span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("addressPlaceholder")}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
                />
              </label>
              <label>
                <span className="text-muted">{t("typeLabel")}</span>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
                >
                  {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((k) => (
                    <option key={k} value={k}>{PROPERTY_TYPE_LABELS[k]}</option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-900">
                <strong>{t("thresholdsHeader", { type: PROPERTY_TYPE_LABELS[propertyType] })}</strong><br />
                {t("thresholdNzeb")} : <span className="font-mono font-semibold">{LU_NZEB_THRESHOLDS[propertyType]} kWh/m²/an</span> · {t("thresholdNzeb10")} : <span className="font-mono font-semibold">{Math.round(LU_NZEB_THRESHOLDS[propertyType] * 0.9)} kWh/m²/an</span><br />
                {t("thresholdTop15")} : <span className="font-mono font-semibold">{LU_TOP15_THRESHOLDS[propertyType]} kWh/m²/an</span>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-base font-semibold text-navy">{t("step2Title")}</h2>
            <p className="text-xs text-muted">
              {t("step2Intro")}
            </p>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="text-muted">{t("buildYearLabel")}</span>
                <select
                  value={buildYear}
                  onChange={(e) => setBuildYear(e.target.value as BuildYear)}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
                >
                  {(Object.keys(BUILD_YEAR_LABELS) as BuildYear[]).map((k) => (
                    <option key={k} value={k}>{BUILD_YEAR_LABELS[k]}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-muted">{t("epcLabel")}</span>
                  <select
                    value={epcClass}
                    onChange={(e) => setEpcClass(e.target.value as EpcClass)}
                    className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
                  >
                    {EPC_CLASS_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-muted">{t("pedLabel")}</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={pedKwhM2}
                    onChange={(e) => setPedKwhM2(Math.max(0, Number(e.target.value)))}
                    className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm font-mono"
                  />
                </label>
              </div>
              <ResultBadge
                passed={result.substantialContribution.passed}
                reason={result.substantialContribution.reason}
                passedLabel={t("badgePassed")}
                failedLabel={t("badgeFailed")}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-base font-semibold text-navy">{t("step3Title")}</h2>
            <p className="text-xs text-muted">
              {t("step3Intro")}
            </p>
            <div className="space-y-2">
              <DnshRow
                label={t("dnshClimateLabel")}
                hint={t("dnshClimateHint")}
                checked={dnsh.climateRiskAssessed}
                onChange={(v) => setDnsh({ ...dnsh, climateRiskAssessed: v })}
              />
              <DnshRow
                label={t("dnshAdaptLabel")}
                hint={t("dnshAdaptHint")}
                checked={dnsh.adaptationPlan}
                onChange={(v) => setDnsh({ ...dnsh, adaptationPlan: v })}
              />
              <DnshRow
                label={t("dnshWaterLabel")}
                hint={t("dnshWaterHint")}
                checked={dnsh.waterEfficient}
                onChange={(v) => setDnsh({ ...dnsh, waterEfficient: v })}
              />
              <DnshRow
                label={t("dnshCircularLabel")}
                hint={t("dnshCircularHint")}
                checked={dnsh.circularCDWaste}
                onChange={(v) => setDnsh({ ...dnsh, circularCDWaste: v })}
              />
              <DnshRow
                label={t("dnshPollutionLabel")}
                hint={t("dnshPollutionHint")}
                checked={dnsh.pollutionControlled}
                onChange={(v) => setDnsh({ ...dnsh, pollutionControlled: v })}
              />
              <DnshRow
                label={t("dnshBiodivLabel")}
                hint={t("dnshBiodivHint")}
                checked={dnsh.biodiversityProtected}
                onChange={(v) => setDnsh({ ...dnsh, biodiversityProtected: v })}
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-base font-semibold text-navy">{t("step4Title")}</h2>
            <p className="text-xs text-muted">
              {t("step4Intro")}
            </p>
            <div className="space-y-2">
              <DnshRow
                label={t("msOecdLabel")}
                hint={t("msOecdHint")}
                checked={ms.oecdCompliance}
                onChange={(v) => setMs({ ...ms, oecdCompliance: v })}
              />
              <DnshRow
                label={t("msUngpLabel")}
                hint={t("msUngpHint")}
                checked={ms.unGuidingPrinciples}
                onChange={(v) => setMs({ ...ms, unGuidingPrinciples: v })}
              />
              <DnshRow
                label={t("msIloLabel")}
                hint={t("msIloHint")}
                checked={ms.ilo}
                onChange={(v) => setMs({ ...ms, ilo: v })}
              />
              <DnshRow
                label={t("msHrLabel")}
                hint={t("msHrHint")}
                checked={ms.humanRights}
                onChange={(v) => setMs({ ...ms, humanRights: v })}
              />
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="text-base font-semibold text-navy">{t("step5Title")}</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`rounded-xl border p-5 ${result.aligned ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50"}`}>
                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                  {t("alignmentTitle")}
                </div>
                <div className={`mt-1 text-2xl font-bold ${result.aligned ? "text-emerald-900" : "text-rose-900"}`}>
                  {result.aligned ? t("alignedYes") : t("alignedNo")}
                </div>
                <div className={`mt-2 text-xs ${result.aligned ? "text-emerald-800" : "text-rose-800"}`}>
                  {result.aligned ? t("alignedDescYes") : t("alignedDescNo")}
                </div>
              </div>

              <div className="rounded-xl bg-navy text-white p-5">
                <div className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
                  {t("scoreTitle")}
                </div>
                <div className="mt-1 text-4xl font-bold tabular-nums">{result.score}<span className="text-xl text-white/60">/100</span></div>
                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all ${result.score >= 80 ? "bg-emerald-400" : result.score >= 50 ? "bg-amber-400" : "bg-rose-400"}`}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
                <div className="mt-2 text-[10px] text-white/50">{t("scoreSplit")}</div>
              </div>
            </div>

            {/* Détails */}
            <div className="space-y-3 mt-5">
              <Detail title={t("detailSC")} passed={result.substantialContribution.passed} passedLabel={t("detailBadgePassed")} failedLabel={t("detailBadgeFailed")}>
                <div>{result.substantialContribution.reason}</div>
                {result.substantialContribution.path && (
                  <div className="mt-1 text-[10px] text-muted">
                    {t("detailPathLabel")}{" "}
                    <span className="font-mono">
                      {result.substantialContribution.path === "nzeb_minus_10" ? t("pathNzeb10")
                        : result.substantialContribution.path === "top_15_pct" ? t("pathTop15")
                        : t("pathEpcAB")}
                    </span>
                  </div>
                )}
              </Detail>

              <Detail title={t("detailDnsh", { passed: result.dnsh.axes.filter((a) => a.passed).length, total: result.dnsh.axes.length })} passed={result.dnsh.passed} passedLabel={t("detailBadgePassed")} failedLabel={t("detailBadgeFailed")}>
                <ul className="space-y-1">
                  {result.dnsh.axes.map((a) => (
                    <li key={a.axis} className="flex items-start gap-2">
                      <span className={a.passed ? "text-emerald-700" : "text-rose-700"}>{a.passed ? "✓" : "✗"}</span>
                      <span>
                        <span className={a.passed ? "" : "font-semibold"}>{a.axis}</span>
                        {a.reason && !a.passed && <span className="block text-[10px] text-muted">{a.reason}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </Detail>

              <Detail title={t("detailMs", { passed: result.minimumSafeguards.pillars.filter((p) => p.passed).length, total: result.minimumSafeguards.pillars.length })} passed={result.minimumSafeguards.passed} passedLabel={t("detailBadgePassed")} failedLabel={t("detailBadgeFailed")}>
                <ul className="space-y-1">
                  {result.minimumSafeguards.pillars.map((p) => (
                    <li key={p.pillar} className="flex items-start gap-2">
                      <span className={p.passed ? "text-emerald-700" : "text-rose-700"}>{p.passed ? "✓" : "✗"}</span>
                      <span>{p.pillar}</span>
                    </li>
                  ))}
                </ul>
              </Detail>
            </div>

            {result.recommendations.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="text-sm font-semibold text-amber-900 mb-2">{t("recoTitle")}</h3>
                <ul className="space-y-1.5 text-xs text-amber-900">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="shrink-0">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 rounded-lg bg-slate-50 border border-card-border p-4 text-[11px] text-muted">
              <strong className="text-slate">{t("usageStrong")}</strong> {t("usageBody")}
            </div>
          </>
        )}

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-card-border">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="rounded-md border border-card-border bg-background px-4 py-2 text-xs font-medium text-slate hover:border-navy disabled:opacity-40"
          >
            {t("btnPrev")}
          </button>
          <div className="text-[11px] text-muted">{t("stepIndicator", { n: step })}</div>
          <button
            type="button"
            onClick={() => setStep(Math.min(5, step + 1))}
            disabled={step === 5}
            className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-40"
          >
            {t("btnNext")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultBadge({ passed, reason, passedLabel, failedLabel }: { passed: boolean; reason: string; passedLabel: string; failedLabel: string }) {
  return (
    <div className={`rounded-lg border p-3 text-xs ${passed ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-rose-300 bg-rose-50 text-rose-900"}`}>
      <div className="flex items-center gap-2 font-semibold">
        {passed ? passedLabel : failedLabel}
      </div>
      <div className="mt-1">{reason}</div>
    </div>
  );
}

function DnshRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
      checked ? "border-emerald-300 bg-emerald-50" : "border-card-border bg-background hover:border-navy/30"
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 shrink-0"
      />
      <div>
        <div className={`text-sm font-medium ${checked ? "text-emerald-900" : "text-navy"}`}>{label}</div>
        <div className="mt-0.5 text-[11px] text-muted">{hint}</div>
      </div>
    </label>
  );
}

function Detail({ title, passed, passedLabel, failedLabel, children }: { title: string; passed: boolean; passedLabel: string; failedLabel: string; children: React.ReactNode }) {
  return (
    <details className="rounded-lg border border-card-border bg-background" open>
      <summary className="cursor-pointer flex items-center justify-between px-4 py-3 text-sm font-semibold">
        <span className="flex items-center gap-2">
          <span className={passed ? "text-emerald-700" : "text-rose-700"}>{passed ? "✓" : "✗"}</span>
          {title}
        </span>
        <span className={`text-[10px] font-semibold uppercase ${passed ? "text-emerald-700" : "text-rose-700"}`}>
          {passed ? passedLabel : failedLabel}
        </span>
      </summary>
      <div className="px-4 pb-4 text-xs text-slate">{children}</div>
    </details>
  );
}
