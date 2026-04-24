"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { listLotsAsync, deleteLot, analyzeLot, summarize, type RentalLot } from "@/lib/gestion-locative";
import { formatEUR, formatPct } from "@/lib/calculations";
import { useAuth } from "@/components/AuthProvider";

export default function PortefeuillePage() {
  const locale = useLocale();
  const t = useTranslations("glPortefeuille");
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user } = useAuth();

  const [lots, setLots] = useState<RentalLot[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);

  useEffect(() => {
    listLotsAsync().then(({ items, cloud }) => {
      setLots(items);
      setCloudSynced(cloud);
      setHydrated(true);
    });
  }, []);

  const analyses = useMemo(() => lots.map(analyzeLot), [lots]);
  const summary = useMemo(() => summarize(lots), [lots]);

  const handleDelete = (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteLot(id);
    listLotsAsync().then(({ items, cloud }) => {
      setLots(items);
      setCloudSynced(cloud);
    });
  };

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href={`${lp}/gestion-locative`} className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
            <div className="mt-2 flex items-center gap-2">
              <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
              {user && cloudSynced && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800" title={t("cloudTooltip")}>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                  </svg>
                  {t("cloudSynced")}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">{t("pageSubtitle")}</p>
          </div>
          <Link
            href={`${lp}/gestion-locative/lot/nouveau`}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
          >
            {t("addLot")}
          </Link>
        </div>

        {hydrated && lots.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-card-border bg-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiLots")}</div>
              <div className="mt-1 text-2xl font-bold text-navy">{summary.nbLots}</div>
              {summary.nbVacants > 0 && (
                <div className="mt-1 text-xs text-amber-700">
                  {summary.nbVacants > 1 ? t("vacantMany", { n: summary.nbVacants }) : t("vacantOne", { n: summary.nbVacants })}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-card-border bg-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiRentMonthly")}</div>
              <div className="mt-1 text-2xl font-bold text-navy">{formatEUR(summary.loyerMensuelTotal)}</div>
              <div className="mt-1 text-xs text-muted">{t("rentPerYear", { value: formatEUR(summary.loyerAnnuelTotal) })}</div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiYieldAvg")}</div>
              <div className="mt-1 text-2xl font-bold text-navy">{formatPct(summary.rendementBrutMoyen)}</div>
              <div className="mt-1 text-xs text-muted">{t("capitalLabel", { value: formatEUR(summary.capitalTotal) })}</div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiAlerts")}</div>
              <div className="mt-1 flex gap-3 text-sm">
                {summary.lotsHorsPlafond > 0 && (
                  <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-xs font-medium">
                    {t("alertOffLimit", { n: summary.lotsHorsPlafond })}
                  </span>
                )}
                {summary.lotsKlimabonus > 0 && (
                  <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium">
                    {t("alertKlimabonus", { n: summary.lotsKlimabonus })}
                  </span>
                )}
                {summary.lotsHorsPlafond === 0 && summary.lotsKlimabonus === 0 && (
                  <span className="text-xs text-emerald-700">{t("alertCompliant")}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {hydrated && lots.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-card-border bg-card p-10 text-center">
            <div className="text-4xl">🏠</div>
            <h2 className="mt-3 text-lg font-semibold text-navy">{t("emptyTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("emptyBody")}</p>
            <Link
              href={`${lp}/gestion-locative/lot/nouveau`}
              className="mt-4 inline-flex rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
            >
              {t("addFirstLot")}
            </Link>
          </div>
        )}

        {hydrated && lots.length > 0 && (
          <div className="mt-6 space-y-3">
            {analyses.map((a) => {
              const l = a.lot;
              return (
                <div key={l.id} className="rounded-xl border border-card-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-navy">{l.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${classeColor(l.classeEnergie)}`}>
                          {l.classeEnergie}
                        </span>
                        {l.vacant && <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold">{t("badgeVacant")}</span>}
                        {a.depasseLegal && <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-semibold">{t("badgeOffLimit")}</span>}
                        {a.klimabonusEligible && <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">{t("badgeKlimabonus")}</span>}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {l.address ? `${l.address}${l.commune ? " · " : ""}` : ""}{l.commune ?? ""}
                        {" · "}{l.surface} m²
                        {l.nbChambres ? ` · ${l.nbChambres} ch.` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Link
                        href={`${lp}/gestion-locative/lot/${l.id}`}
                        className="rounded-md border border-card-border bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50"
                      >
                        {t("btnEdit")}
                      </Link>
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="rounded-md p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50"
                        title={t("btnDelete")}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
                    <div>
                      <div className="text-xs text-muted">{t("lotRentActual")}</div>
                      <div className="font-semibold text-navy">{t("lotRentPerMonth", { value: formatEUR(l.loyerMensuelActuel) })}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">{t("lotLegalCap")}</div>
                      <div className={`font-semibold ${a.depasseLegal ? "text-rose-700" : "text-emerald-700"}`}>
                        {t("lotRentPerMonth", { value: formatEUR(a.loyerLegalMensuelMax) })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">{t("lotGap")}</div>
                      <div className={`font-semibold ${a.depasseLegal ? "text-rose-700" : "text-emerald-700"}`}>
                        {a.ecartLegalPct > 0 ? "+" : ""}{(a.ecartLegalPct * 100).toFixed(1)} %
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">{t("lotYield")}</div>
                      <div className="font-semibold text-navy">{formatPct(a.rendementBrutPct)}</div>
                    </div>
                  </div>

                  {a.klimabonusMessage && (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
                      🌱 {a.klimabonusMessage}
                    </div>
                  )}
                  {a.depasseLegal && (
                    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900">
                      {t("warningOffLimit")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          {user ? t("storageAuth") : t("storageGuest")}
        </div>
      </div>
    </div>
  );
}

function classeColor(c: string): string {
  const map: Record<string, string> = {
    A: "bg-emerald-100 text-emerald-800",
    B: "bg-emerald-100 text-emerald-800",
    C: "bg-lime-100 text-lime-800",
    D: "bg-yellow-100 text-yellow-800",
    E: "bg-amber-100 text-amber-800",
    F: "bg-orange-100 text-orange-800",
    G: "bg-rose-100 text-rose-800",
    NC: "bg-slate-100 text-slate-700",
  };
  return map[c] ?? "bg-slate-100 text-slate-700";
}
