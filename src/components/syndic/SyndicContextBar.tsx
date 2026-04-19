"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";

/**
 * Barre de contexte + switcher d'outils syndic.
 *
 * Pattern : bouton retour toujours visible + bouton « Outils syndic ▾ »
 * qui ouvre un popover avec grille de 8 cartes catégorisées.
 * Tout est accessible en un clic, pas de scroll horizontal.
 *
 * Activée sur les pages atteintes depuis /syndic (via ?from=syndic).
 */
export default function SyndicContextBar() {
  const t = useTranslations("syndicContextBar");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (params.get("from") !== "syndic") return null;

  const tools: Array<{ href: string; label: string; desc: string; category: string; categoryColor: string }> = [
    { href: `${lp}/syndic/coproprietes?from=syndic`, label: t("coproprietes"), desc: t("coproprietesDesc"), category: t("catCore"), categoryColor: "bg-navy/10 text-navy" },
    { href: `${lp}/calculateur-loyer?from=syndic`, label: t("loyerLegal"), desc: t("loyerLegalDesc"), category: t("catCalc"), categoryColor: "bg-emerald-100 text-emerald-900" },
    { href: `${lp}/portfolio?from=syndic`, label: t("portefeuille"), desc: t("portefeuilleDesc"), category: t("catAsset"), categoryColor: "bg-indigo-100 text-indigo-900" },
    { href: `${lp}/energy/portfolio?from=syndic`, label: t("portfolioEnergie"), desc: t("portfolioEnergieDesc"), category: t("catEnergy"), categoryColor: "bg-amber-100 text-amber-900" },
    { href: `${lp}/energy/epbd?from=syndic`, label: t("epbd"), desc: t("epbdDesc"), category: t("catEnergy"), categoryColor: "bg-amber-100 text-amber-900" },
    { href: `${lp}/aml-kyc?from=syndic`, label: t("amlKyc"), desc: t("amlKycDesc"), category: t("catCompliance"), categoryColor: "bg-slate-200 text-slate-900" },
    { href: `${lp}/syndic/benchmark?from=syndic`, label: t("benchmark"), desc: t("benchmarkDesc"), category: t("catAnalysis"), categoryColor: "bg-fuchsia-100 text-fuchsia-900" },
    { href: `${lp}/syndic/lettres-types?from=syndic`, label: t("lettresTypes"), desc: t("lettresTypesDesc"), category: t("catDocs"), categoryColor: "bg-sky-100 text-sky-900" },
  ];

  return (
    <div className="sticky top-16 z-30 border-b border-card-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-2.5">
          <Link href={`${lp}/syndic`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 bg-navy/5 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy hover:text-white transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t("backToSyndic")}
          </Link>

          <div ref={ref} className="relative">
            <button onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-haspopup="true"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                open ? "border-navy bg-navy text-white" : "border-card-border bg-white text-slate hover:border-navy/50 hover:text-navy"
              }`}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              {t("switcherButton")}
              <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {open && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-2 w-[min(92vw,720px)] rounded-xl border border-card-border bg-card p-3 shadow-xl">
                <div className="mb-2 px-1 text-[10px] uppercase tracking-wider font-bold text-muted">
                  {t("switcherPanelTitle")}
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {tools.map((tool) => (
                    <Link key={tool.href} href={tool.href}
                      onClick={() => setOpen(false)}
                      className="group rounded-lg border border-card-border/60 bg-background/40 p-2.5 hover:border-navy hover:bg-navy/5 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tool.categoryColor}`}>
                            {tool.category}
                          </span>
                          <div className="mt-1 text-xs font-bold text-navy group-hover:text-navy-light">{tool.label}</div>
                          <p className="mt-0.5 text-[10px] text-muted leading-snug line-clamp-2">{tool.desc}</p>
                        </div>
                        <svg className="h-3.5 w-3.5 text-muted group-hover:text-navy group-hover:translate-x-0.5 transition-all shrink-0 mt-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
