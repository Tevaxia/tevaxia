"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { loadBusinessDashboard, summarizeMandates, propertyEstimateCount, type BusinessDashboard } from "@/lib/business-dashboard";
import { listOwnedSharedLinks, type OwnedSharedLink as SharedLink } from "@/lib/owned-shared-links";
import { listerEvaluationsAsync, type SavedValuation } from "@/lib/storage";
import { SkeletonStat, SkeletonText } from "@/components/Skeleton";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  if(loading)return null;
  return <DashboardPageContent key={user?.id ?? "guest"}/>;
}

function DashboardPageContent() {
  const t = useTranslations("dashboardPage");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-FR" : locale === "lb" ? "de-LU" : locale;
  const money = (value: number) => new Intl.NumberFormat(dateLocale, {style:"currency", currency:"EUR", minimumFractionDigits:2, maximumFractionDigits:2}).format(value);

  const fmtDate = (s: string): string =>
    new Date(s).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" });

  const { user, loading: authLoading } = useAuth();
  const [archiveError,setArchiveError]=useState(false);
  const [archiveLoaded,setArchiveLoaded]=useState(false);
  const [evals, setEvals] = useState<SavedValuation[]>([]);
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [linksFailed,setLinksFailed]=useState(false);
  const linkText=useTranslations("ownedLinks");
  const [business,setBusiness]=useState<BusinessDashboard>({mandates:null,activity:null,rentalLots:null});
  const [loading,setLoading]=useState(Boolean(user));
  const [attempt,setAttempt]=useState(0);
  const owner=user?.id;
  const [clock,setClock]=useState(()=>Date.now());
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(timer);},[]);

  useEffect(()=>{
    if(!owner)return;
    let active=true;
    listerEvaluationsAsync(owner).then(({items,cloudError})=>{if(active){setEvals(items);setArchiveError(cloudError);setArchiveLoaded(true);}}).catch(()=>{if(active){setArchiveError(true);setArchiveLoaded(true);}});
    return()=>{active=false;};
  },[owner,attempt]);

  useEffect(()=>{
    if(!owner)return;
    let active=true;
    Promise.all([
      listOwnedSharedLinks(owner).then(rows=>{if(active)setLinks(rows);}).catch(()=>{if(active)setLinksFailed(true);}),
      loadBusinessDashboard(owner).then(data=>{if(active)setBusiness(data);}).catch(()=>{if(active)setBusiness({mandates:null,activity:null,rentalLots:null});}),
    ]).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[owner,attempt]);

  function retry(){setLoading(true);setLinks([]);setLinksFailed(false);setBusiness({mandates:null,activity:null,rentalLots:null});setEvals([]);setArchiveLoaded(false);setArchiveError(false);setAttempt(n=>n+1);}
  const activeLinks=links.filter(l=>Date.parse(l.expires_at)>clock&&(l.max_views===null||l.view_count<l.max_views));
  const summary=summarizeMandates(business.mandates);
  const activeMandates=summary.active;
  const activity=business.activity;
  const businessFailed=business.mandates===null||activity===null||business.rentalLots===null;
  const linkViews=links.reduce((sum,l)=>sum+l.view_count,0);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
      {archiveError && <p role="alert" className="text-sm text-amber-800">{t("archiveError")}</p>}
        <div className="h-7 w-72 animate-pulse rounded bg-card-border/50" />
        <SkeletonText lines={1} className="mt-2 max-w-xl" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <SkeletonStat key={i} />)}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <SkeletonStat key={i} />)}
        </div>
        <div className="sr-only">{t("loading")}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="break-words text-2xl font-bold text-navy mb-3">{t("signInTitle")}</h1>
        <p className="text-sm text-muted">
          <Link href={`${lp}/connexion`} className="text-navy underline">{t("signInLink")}</Link>{" "}{t("signInIntro")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {archiveError && <p role="alert" className="text-sm text-amber-800">{t("archiveError")}</p>}
      {linksFailed && <p role="alert" className="text-sm text-amber-800">{linkText("error")}</p>}
      {businessFailed && <p role="alert" className="text-sm text-amber-800">{t("dataError")}</p>}
      {(archiveError||linksFailed||businessFailed) && <button type="button" onClick={retry} className="my-2 rounded border border-navy px-3 py-2 text-sm">{t("retry")}</button>}
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label={t("kpi.evaluations")} value={archiveLoaded && !archiveError ? evals.length : "—"} href={`${lp}/mes-evaluations`} />
        <KpiCard label={t("kpi.rentalLots")} value={business.rentalLots ?? "—"} href={`${lp}/gestion-locative/portefeuille`} />
        <KpiCard label={t("kpi.activeMandates")} value={activeMandates?.length ?? "—"} href={`${lp}/pro-agences/mandats`} />
        <KpiCard label={t("kpi.activeShareLinks")} value={linksFailed ? "—" : activeLinks.length} href={`${lp}/profil/liens-partages`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-5 text-white shadow-lg">
          <div className="text-xs text-white/70">{t("propertyEstimates")}</div>
          <div className="mt-1 text-2xl font-bold">{archiveLoaded && !archiveError ? propertyEstimateCount(evals) : "—"}</div>
          <p className="mt-2 text-xs text-white/80">{t("propertyEstimateNote")}</p>
          <Link href={`${lp}/mes-evaluations`} className="mt-2 inline-block text-[11px] text-white/70 hover:text-white">
            {t("sections.viewAll")}
          </Link>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="text-xs text-emerald-800">{t("kpi.commissions")}</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">{summary.commission === null ? "—" : money(summary.commission)}</div>
          <p className="mt-1 text-xs text-emerald-800">{t("commissionNote")}</p>
          <div className="mt-1 text-[10px] text-emerald-700">{summary.sold === null ? t("unavailable") : t("kpi.salesClosed", { n: summary.sold })}</div>
        </div>
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <div className="text-xs text-muted">{t("kpi.shareLinkViews")}</div>
          <div className="mt-1 text-2xl font-bold text-navy">
            {linksFailed || !Number.isSafeInteger(linkViews) ? "—" : linkViews}
          </div>
          <Link href={`${lp}/profil/liens-partages`} className="mt-1 inline-block text-[10px] text-navy/70 hover:text-navy">
            {t("kpi.viewAnalytics")}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-card-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy">{t("sections.recentEvals")}</h2>
            <Link href={`${lp}/mes-evaluations`} className="text-xs text-navy hover:underline">{t("sections.viewAll")}</Link>
          </div>
          {!archiveLoaded || archiveError ? <p role="status" className="text-xs text-muted">{t(archiveError ? "unavailable" : "loading")}</p> : evals.length === 0 ? (
            <p className="text-xs text-muted italic">
              {t("empty.evals")}{" "}<Link href={`${lp}/estimation`} className="text-navy underline">/estimation</Link>{" "}{t("empty.or")}{" "}<Link href={`${lp}/valorisation`} className="text-navy underline">/valorisation</Link>.
            </p>
          ) : (
            <ul className="space-y-2">
              {evals.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center justify-between text-xs border-b border-card-border/40 pb-2 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-navy truncate">{e.nom}</div>
                    <div className="text-[10px] text-muted font-mono">{e.type} · {fmtDate(e.date)}</div>
                  </div>
                  {e.valeurPrincipale != null && (
                    <div className="font-mono font-semibold">{money(e.valeurPrincipale)}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-card-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy">{t("sections.activeMandates")}</h2>
            <Link href={`${lp}/pro-agences/mandats`} className="text-xs text-navy hover:underline">{t("sections.viewAll")}</Link>
          </div>
          {activeMandates === null ? <p role="status" className="text-xs text-muted">{t("unavailable")}</p> : activeMandates.length === 0 ? (
            <p className="text-xs text-muted italic">{t("empty.mandates")}</p>
          ) : (
            <ul className="space-y-2">
              {activeMandates.slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center justify-between text-xs border-b border-card-border/40 pb-2 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-navy truncate">{m.property_address}</div>
                    <div className="text-[10px] text-muted">
                      {m.client_name ?? "—"} · {m.status}
                    </div>
                  </div>
                  {m.prix_demande != null && (
                    <div className="font-mono font-semibold">{money(m.prix_demande)}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-card-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy">{t("sections.recentActivity")}</h2>
            <Link href={`${lp}/profil/confidentialite`} className="text-xs text-navy hover:underline">{t("sections.viewAll")}</Link>
          </div>
          {activity === null ? <p role="status" className="text-xs text-muted">{t("unavailable")}</p> : activity.length === 0 ? (
            <p className="text-xs text-muted italic">{t("empty.activity")}</p>
          ) : (
            <ul className="space-y-1">
              {activity.slice(0, 10).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 break-words text-xs py-1 border-b border-card-border/30 last:border-0">
                  <span className="font-mono text-[10px] text-muted shrink-0 w-28">
                    {new Date(a.created_at).toLocaleString(dateLocale, { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span className="font-mono text-navy">{a.action}</span>
                  {a.entity_type && <span className="text-muted">· {a.entity_type}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-base font-semibold text-navy mb-3">{t("sections.shortcuts")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([
            ["estimation", "/estimation"],
            ["valorisation", "/valorisation"],
            ["gestionLocative", "/gestion-locative"],
            ["dcfMulti", "/dcf-multi"],
            ["syndic", "/syndic"],
            ["hotellerie", "/hotellerie"],
            ["str", "/str"],
            ["portfolio", "/portfolio"],
          ] as const).map(([key, href]) => (
            <Link
              key={href}
              href={`${lp}${href}`}
              className="rounded-lg border border-card-border bg-background px-3 py-2 text-xs font-medium text-slate hover:border-navy hover:text-navy transition-colors text-center"
            >
              {t(`shortcuts.${key}`)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-card-border bg-card p-4 hover:border-navy transition-colors">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-navy">{value}</div>
    </Link>
  );
}
