"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

/**
 * Agences Immobilières Sociales (AIS) Luxembourg — info + calculateur abattement.
 *
 * Sources publiques :
 * - guichet.lu « Agence Immobilière Sociale »
 * - Règlement grand-ducal du 2 mai 2007 sur les AIS + modification 2023
 * - Accord tripartite mars 2023 : 50 % → 75 % d'abattement fiscal
 *
 * Pas de partenariat commercial nécessaire — orientation vers les AIS
 * partenaires publiques, dont le bailleur contacte directement.
 */

const AIS_PARTNERS = [
  {
    nom: "Agence Immobilière Sociale (AIS) — Fondation pour l'accès au logement",
    couverture: "National",
    specialite: "Gestion locative sociale pour personnes revenus modestes",
    url: "https://www.fondationlogement.lu",
    tel: "+352 26 48 39",
  },
  {
    nom: "Wunnengshëllef asbl",
    couverture: "National",
    specialite: "Logement assisté, accompagnement personnes précaires",
    url: "https://www.wunnengshellef.lu",
    tel: "+352 49 80 60",
  },
  {
    nom: "Caritas Accueil et Solidarité",
    couverture: "National",
    specialite: "Logement transitoire, réfugiés, familles précaires",
    url: "https://www.caritas.lu",
    tel: "+352 40 21 31 200",
  },
  {
    nom: "Stëmm vun der Strooss",
    couverture: "Luxembourg-Ville, Esch",
    specialite: "Logement ultra-précaires, insertion",
    url: "https://www.stemm.lu",
    tel: "+352 49 02 60",
  },
  {
    nom: "Inter-Actions asbl",
    couverture: "Centre, Sud",
    specialite: "Accompagnement familles, logement intermédiaire",
    url: "https://www.interactions.lu",
    tel: "+352 26 85 28 1",
  },
];

export default function AISPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("ais");

  const [loyerMensuel, setLoyerMensuel] = useState(1800);
  const [tauxMarginalIR, setTauxMarginalIR] = useState(39);
  const [chargesDeductibles, setChargesDeductibles] = useState(3000);

  const calc = useMemo(() => {
    const revenusAnnuels = loyerMensuel * 12;
    const revenusNets = Math.max(0, revenusAnnuels - chargesDeductibles);

    // Scénario standard : 100 % du revenu net imposable
    const impotStandard = revenusNets * (tauxMarginalIR / 100);

    // Scénario AIS : abattement 75 % → 25 % seulement du revenu imposable
    const revenuImposableAIS = revenusNets * 0.25;
    const impotAIS = revenuImposableAIS * (tauxMarginalIR / 100);

    const economie = impotStandard - impotAIS;
    const economiePct = impotStandard > 0 ? (economie / impotStandard) * 100 : 0;

    return {
      revenusAnnuels,
      revenusNets,
      impotStandard: Math.round(impotStandard),
      impotAIS: Math.round(impotAIS),
      economie: Math.round(economie),
      economiePct,
    };
  }, [loyerMensuel, tauxMarginalIR, chargesDeductibles]);

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/gestion-locative`} className="text-xs text-muted hover:text-navy">
          {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t("subtitle")}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-800 font-semibold">
            {t("abattement75")}
          </span>
          <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-sky-800">
            {t("publicInfo")}
          </span>
        </div>

        {/* Calculateur d'économie */}
        <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-4">{t("calcTitle")}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate mb-1">{t("loyerMensuel")}</label>
                <input
                  type="number"
                  value={loyerMensuel}
                  onChange={(e) => setLoyerMensuel(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate mb-1">{t("chargesDeductibles")}</label>
                <input
                  type="number"
                  value={chargesDeductibles}
                  onChange={(e) => setChargesDeductibles(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                />
                <p className="mt-1 text-[11px] text-muted">{t("chargesHint")}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate mb-1">{t("tauxMarginal")}</label>
                <input
                  type="range"
                  min={0}
                  max={45.78}
                  step={0.5}
                  value={tauxMarginalIR}
                  onChange={(e) => setTauxMarginalIR(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs font-mono font-bold text-navy">{tauxMarginalIR.toFixed(1)} %</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">{t("scenarioStandard")}</div>
                <div className="mt-0.5 font-mono text-xl font-bold text-amber-900">{calc.impotStandard.toLocaleString("fr-FR")} €</div>
                <div className="text-[11px] text-amber-800">{t("scenarioStandardHint")}</div>
              </div>
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
                <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">{t("scenarioAIS")}</div>
                <div className="mt-0.5 font-mono text-xl font-bold text-emerald-900">{calc.impotAIS.toLocaleString("fr-FR")} €</div>
                <div className="text-[11px] text-emerald-800">{t("scenarioAISHint")}</div>
              </div>
              <div className="rounded-lg border-2 border-navy bg-navy/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-navy font-semibold">{t("economie")}</div>
                <div className="mt-0.5 font-mono text-2xl font-bold text-navy">{calc.economie.toLocaleString("fr-FR")} €</div>
                <div className="text-[11px] text-navy/80">{t("economiePct", { pct: calc.economiePct.toFixed(0) })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-3">{t("conditionsTitle")}</h2>
          <ul className="space-y-2 text-sm text-slate">
            <li className="flex items-start gap-2">
              <svg className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>{t("cond1")}</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>{t("cond2")}</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>{t("cond3")}</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>{t("cond4")}</span>
            </li>
          </ul>
        </div>

        {/* Partenaires AIS */}
        <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-1">{t("partnersTitle")}</h2>
          <p className="text-xs text-muted mb-4">{t("partnersSubtitle")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {AIS_PARTNERS.map((p) => (
              <div key={p.nom} className="rounded-lg border border-card-border bg-background p-3">
                <div className="text-sm font-semibold text-navy">{p.nom}</div>
                <div className="mt-0.5 text-[11px] text-muted">
                  <span className="font-medium">{t("zone")} :</span> {p.couverture}
                </div>
                <div className="text-[11px] text-slate mt-1">{p.specialite}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-navy hover:underline">{t("site")}</a>
                  <span className="text-muted">·</span>
                  <a href={`tel:${p.tel.replace(/\s/g, "")}`} className="text-navy hover:underline font-mono">{p.tel}</a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-5">
          <h3 className="text-sm font-semibold text-sky-900 mb-2">{t("sourcesTitle")}</h3>
          <ul className="ml-4 list-disc space-y-1 text-xs text-sky-800">
            <li><a href="https://guichet.public.lu/fr/citoyens/logement/location/gestion-locative-sociale.html" target="_blank" rel="noreferrer" className="underline hover:no-underline">guichet.lu — Gestion locative sociale</a></li>
            <li>Règlement grand-ducal du 2 mai 2007 relatif aux AIS (modifié)</li>
            <li>Accord tripartite gouvernement-UEL-OGBL mars 2023 (abattement 50 % → 75 %)</li>
            <li>Article L. 162bis LIR — abattement revenus locatifs via AIS</li>
          </ul>
          <p className="mt-3 text-[11px] text-sky-900">{t("sourcesNote")}</p>
        </div>

        <p className="mt-6 text-xs text-muted italic">{t("disclaimer")}</p>
      </div>
    </div>
  );
}
