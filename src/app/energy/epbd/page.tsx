"use client";
import LocaleLink from "@/components/LocaleLink";
import {useState} from "react";
import {useTranslations} from "next-intl";
import {PdfButton} from "@/components/PdfButton";
import type {EnergyAuditReport} from "@/components/energy/EnergyAuditPdf";
const sources=["https://eur-lex.europa.eu/eli/dir/2024/1275/oj","https://energy.ec.europa.eu/topics/energy-efficiency/energy-performance-buildings/energy-performance-buildings-directive_en","https://meco.gouvernement.lu/fr/domaines-activites/energie/efficacite-energetique/informations-techniques.html"];
export default function EPBDPage(){
 const t=useTranslations("epbdAudit");
 const [kind,setKind]=useState("residential");
 const report:EnergyAuditReport={title:t("title"),sections:[{title:t("scopeTitle"),text:t("scope")+" "+t("reviewed")},{title:t(kind),text:t(kind+"Text")},{title:t("national"),text:t("nationalText")},{title:t("value"),text:t("valueText")}],sources};
 return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1><p className="mt-3 text-muted">{t("intro")}</p>
  <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><h2 className="font-semibold">{t("scopeTitle")}</h2><p className="mt-2">{t("scope")}</p></section>
  <label className="mt-6 block font-medium">{t("kind")}<select id="epbd-kind" value={kind} onChange={e=>setKind(e.target.value)} className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-3">{["residential","nonResidential","new"].map(k=><option key={k} value={k}>{t(k)}</option>)}</select></label>
  <section className="mt-6 rounded-2xl border border-card-border bg-card p-6"><h2 className="font-semibold">{t(kind)}</h2><p className="mt-3 leading-relaxed">{t(kind+"Text")}</p></section>
  <section className="mt-6 space-y-3 rounded-2xl border border-card-border p-6"><h2 className="font-semibold">{t("national")}</h2><p className="text-sm text-muted">{t("nationalText")}</p><h2 className="pt-3 font-semibold">{t("value")}</h2><p className="text-sm text-muted">{t("valueText")}</p><LocaleLink className="inline-block text-energy underline" href="/energy/impact">{t("scenario")}</LocaleLink></section>
  <div className="mt-6"><PdfButton label={t("pdf")} filename="tevaxia-epbd.pdf" generateBlob={async()=>(await import("@/components/energy/EnergyAuditPdf")).generateEnergyAuditPdf(report)}/></div>
  <section className="mt-6 space-y-3 text-sm"><h2 className="font-semibold">{t("sources")}</h2>{sources.map((url,i)=><a key={url} href={url} className="block text-energy underline">{t("source"+i)}</a>)}<p className="text-muted">{t("reviewed")}</p></section>
 </main>;
}
