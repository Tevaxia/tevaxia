"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PdfButton } from "@/components/PdfButton";
import { calculateEnergyImpactScenario, ENERGY_CLASSES, EXAMPLE_ENERGY_HYPOTHESES, type EnergyClass } from "@/lib/energy-impact-scenario";

export default function ImpactPage() {
  const t = useTranslations("energyImpactAudit");
  const locale = useLocale();
  const [value, setValue] = useState(750000);
  const [current, setCurrent] = useState<EnergyClass>("D");
  const [hypotheses, setHypotheses] = useState({ ...EXAMPLE_ENERGY_HYPOTHESES });
  let result = null;
  try { result = calculateEnergyImpactScenario(value, current, hypotheses); } catch { /* Invalid inputs hide results and export. */ }
  const euro = (n: number) => new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const inputClass = "mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-foreground";
  return <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
    <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
    <p className="mt-3 text-muted">{t("description")}</p>
    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">{t("scope")}</div>
    <section className="mt-6 rounded-2xl border border-card-border bg-card p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label>{t("value")}<input id="impact-value" type="number" min="1" max="100000000" value={Number.isNaN(value) ? "" : value} onChange={e => setValue(e.target.valueAsNumber)} className={inputClass} /></label>
        <label>{t("current")}<select id="impact-current" value={current} onChange={e => setCurrent(e.target.value as EnergyClass)} className={inputClass}>{ENERGY_CLASSES.map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      <h2 className="mt-6 font-semibold">{t("hypotheses")}</h2>
      <p className="mt-2 text-sm text-muted">{t("example")}</p>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">{ENERGY_CLASSES.map(c => <label key={c} className="text-sm">{t("class")} {c} (%)<input id={"impact-" + c} type="number" min="-90" max="100" step="0.1" disabled={c === "D"} value={Number.isNaN(hypotheses[c]) ? "" : hypotheses[c]} onChange={e => setHypotheses({ ...hypotheses, [c]: e.target.valueAsNumber })} className={inputClass} /></label>)}</div>
    </section>
    {!result && <p role="alert" className="mt-5 text-red-700">{t("invalid")}</p>}
    {result && <section className="mt-6 rounded-2xl border border-card-border bg-card p-5 sm:p-6">
      <h2 className="font-semibold">{t("results")}</h2>
      <p className="mt-2 text-sm text-muted">{t("base")}: {euro(result.valeurBase)}</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr>{["class", "coefficient", "target", "delta"].map(k => <th key={k} className="px-3 py-3 text-left">{t(k)}</th>)}</tr></thead><tbody>{result.classes.map(row => <tr key={row.classe} className={"border-t border-card-border " + (row.classe === current ? "bg-energy/10" : "")}><th className="px-3 py-3 text-left">{row.classe}{row.classe === current ? " *" : ""}</th><td className="px-3 py-3">{row.ajustementPct}%</td><td className="whitespace-nowrap px-3 py-3">{euro(row.valeurAjustee)}</td><td className="whitespace-nowrap px-3 py-3">{euro(row.delta)}</td></tr>)}</tbody></table></div>
      <p className="mt-3 text-sm text-muted">* {t("current")}</p>
      <div className="mt-4"><PdfButton label={t("pdf")} filename="tevaxia-impact-scenario.pdf" generateBlob={async () => (await import("@/components/energy/EnergyPdf")).generateImpactPdfBlob(result, current, value)} /></div>
    </section>}
    <section className="mt-6 space-y-3 rounded-2xl border border-card-border p-5 sm:p-6"><h2 className="font-semibold">{t("methodTitle")}</h2><p className="text-sm text-muted">{t("formula")}</p><p className="text-sm text-muted">{t("limits")}</p><a className="inline-block text-energy underline" href={(locale === "fr" ? "" : "/" + locale) + "/energy/renovation"}>{t("renovation")}</a></section>
  </div>;
}
