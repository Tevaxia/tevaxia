"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { listMySharedLinks, type SharedLink } from "@/lib/shared-links";
import { listMyMandates, type AgencyMandate } from "@/lib/agency-mandates";
import { listMyActivity, type ActivityEntry } from "@/lib/activity-log";
import { listerEvaluations, type SavedValuation } from "@/lib/storage";
import { formatEUR } from "@/lib/calculations";

export default function DashboardPage() {
  const t = useTranslations("dashboardPage");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-LU" : locale;

  const fmtDate = (s: string): string =>
    new Date(s).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" });

  const { user, loading: authLoading } = useAuth();
  const [evals, setEvals] = useState<SavedValuation[]>([]);
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [mandates, setMandates] = useState<AgencyMandate[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [rentalLotsCount, setRentalLotsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEvals(listerEvaluations());
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const [l, m, a] = await Promise.all([
          isSupabaseConfigured ? listMySharedLinks() : Promise.resolve([]),
          isSupabaseConfigured ? listMyMandates() : Promise.resolve([]),
          isSupabaseConfigured ? listMyActivity(10) : Promise.resolve([]),
        ]);
        if (cancel) return;
        setLinks(l);
        setMandates(m);
        setActivity(a);

        if (isSupabaseConfigured && supabase) {
          const { count } = await supabase.from("rental_lots").select("id", { count: "exact", head: true }).eq("user_id", user.id);
          if (!cancel) setRentalLotsCount(count ?? 0);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [user, authLoading]);

  const activeLinks = links.filter((l) => new Date(l.expires_at) > new Date());
  const activeMandates = mandates.filter((m) => ["mandat_signe", "sous_compromis"].includes(m.status));
  const soldMandates = mandates.filter((m) => m.status === "vendu");
  const totalCommission = soldMandates.reduce((s, m) => s + (Number(m.commission_amount_percue) || 0), 0);
  const patrimoineCalcule = evals.reduce((s, e) => s + (e.valeurPrincipale ?? 0), 0);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-navy mb-3">{t("signInTitle")}</h1>
        <p className="text-sm text-muted">
          <Link href={`${lp}/connexion`} className="text-navy underline">{t("signInLink")}</Link>{" "}{t("signInIntro")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label={t("kpi.evaluations")} value={evals.length} href={`${lp}/mes-evaluations`} />
        <KpiCard label={t("kpi.rentalLots")} value={rentalLotsCount} href={`${lp}/gestion-locative/portefeuille`} />
        <KpiCard label={t("kpi.activeMandates")} value={activeMandates.length} href={`${lp}/pro-agences/mandats`} />
        <KpiCard label={t("kpi.activeShareLinks")} value={activeLinks.length} href={`${lp}/profil/liens-partages`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-5 text-white shadow-lg">
          <div className="text-xs text-white/70">{t("kpi.patrimoine")}</div>
          <div className="mt-1 text-2xl font-bold">{formatEUR(patrimoineCalcule)}</div>
          <Link href={`${lp}/portfolio`} className="mt-2 inline-block text-[11px] text-white/70 hover:text-white">
            {t("kpi.viewPortfolio")}
          </Link>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="text-xs text-emerald-800">{t("kpi.commissions")}</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">{formatEUR(totalCommission)}</div>
          <div className="mt-1 text-[10px] text-emerald-700">{t("kpi.salesClosed", { n: soldMandates.length })}</div>
        </div>
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <div className="text-xs text-muted">{t("kpi.shareLinkViews")}</div>
          <div className="mt-1 text-2xl font-bold text-navy">
            {links.reduce((s, l) => s + l.view_count, 0)}
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
          {evals.length === 0 ? (
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
                    <div className="font-mono font-semibold">{formatEUR(e.valeurPrincipale)}</div>
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
          {activeMandates.length === 0 ? (
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
                    <div className="font-mono font-semibold">{formatEUR(m.prix_demande)}</div>
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
          {activity.length === 0 ? (
            <p className="text-xs text-muted italic">{t("empty.activity")}</p>
          ) : (
            <ul className="space-y-1">
              {activity.slice(0, 10).map((a) => (
                <li key={a.id} className="flex items-center gap-3 text-xs py-1 border-b border-card-border/30 last:border-0">
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

function KpiCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-card-border bg-card p-4 hover:border-navy transition-colors">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-navy">{value}</div>
    </Link>
  );
}
