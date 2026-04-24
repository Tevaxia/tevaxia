"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

interface CoownershipSummary {
  id: string;
  name: string;
  address: string | null;
  commune: string | null;
  nb_lots: number;
  total_tantiemes: number;
  total_outstanding: number;
  nb_unpaid: number;
  next_assembly: { title: string; scheduled_at: string } | null;
  last_closed_year: number | null;
}

export default function SyndicPortefeuillePage() {
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations("syndicPortefeuille");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const [coowns, setCoowns] = useState<CoownershipSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: list } = await supabase
        .from("coownerships")
        .select("id, name, address, commune, total_tantiemes");
      const rows = (list ?? []) as Array<{
        id: string; name: string; address: string | null;
        commune: string | null; total_tantiemes: number;
      }>;

      const out: CoownershipSummary[] = [];
      for (const c of rows) {
        const [unitsRes, unpaidRes, assemblyRes, yearRes] = await Promise.all([
          supabase.from("coownership_units").select("id", { count: "exact", head: true })
            .eq("coownership_id", c.id),
          supabase.from("coownership_unpaid_charges").select("amount_outstanding")
            .eq("coownership_id", c.id),
          supabase.from("coownership_assemblies").select("title, scheduled_at")
            .eq("coownership_id", c.id)
            .in("status", ["convened", "in_progress"])
            .order("scheduled_at", { ascending: true })
            .limit(1).maybeSingle(),
          supabase.from("coownership_accounting_years").select("year")
            .eq("coownership_id", c.id).eq("status", "closed")
            .order("year", { ascending: false })
            .limit(1).maybeSingle(),
        ]);

        const unpaid = (unpaidRes.data ?? []) as { amount_outstanding: number }[];
        const totalOutstanding = unpaid.reduce((s, u) => s + Number(u.amount_outstanding), 0);

        out.push({
          id: c.id, name: c.name,
          address: c.address, commune: c.commune,
          nb_lots: unitsRes.count ?? 0,
          total_tantiemes: c.total_tantiemes,
          total_outstanding: totalOutstanding,
          nb_unpaid: unpaid.length,
          next_assembly: assemblyRes.data as { title: string; scheduled_at: string } | null,
          last_closed_year: (yearRes.data as { year: number } | null)?.year ?? null,
        });
      }

      out.sort((a, b) => b.total_outstanding - a.total_outstanding);
      setCoowns(out);
    } catch (e) { setError(errMsg(e)); }
    setLoading(false);
  }, [user]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">{t("signIn")}</Link></div>;

  const totals = {
    nbCoowns: coowns.length,
    nbLots: coowns.reduce((s, c) => s + c.nb_lots, 0),
    totalOutstanding: coowns.reduce((s, c) => s + c.total_outstanding, 0),
    nbUnpaid: coowns.reduce((s, c) => s + c.nb_unpaid, 0),
    nbAssemblies: coowns.filter((c) => c.next_assembly).length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/syndic" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>

      <div className="mt-3">
        <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("pageSubtitle")}</p>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        <Kpi label={t("kpiCoowns")} value={String(totals.nbCoowns)} />
        <Kpi label={t("kpiLots")} value={String(totals.nbLots)} />
        <Kpi label={t("kpiOutstanding")} value={formatEUR(totals.totalOutstanding)} tone="rose" />
        <Kpi label={t("kpiUnpaid")} value={String(totals.nbUnpaid)} tone="amber" />
        <Kpi label={t("kpiAssemblies")} value={String(totals.nbAssemblies)} tone="blue" />
      </div>

      {coowns.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("emptyState")}{" "}
          <Link href="/syndic/coproprietes" className="text-navy underline">{t("createLink")}</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coowns.map((c) => {
            const hasUrgent = c.total_outstanding > 5000 || c.nb_unpaid > 10;
            return (
              <div key={c.id} className={`rounded-xl border p-5 transition-colors ${
                hasUrgent ? "border-rose-200 bg-rose-50/30" : "border-card-border bg-card"
              }`}>
                <Link href={`/syndic/coproprietes/${c.id}`}
                  className="text-base font-bold text-navy hover:underline block truncate">
                  {c.name}
                </Link>
                {c.address && (
                  <div className="mt-1 text-[11px] text-muted truncate">
                    {c.address}{c.commune ? `, ${c.commune}` : ""}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Stat label={t("statLots")} value={String(c.nb_lots)} />
                  <Stat label={t("statTantiemes")} value={c.total_tantiemes.toLocaleString(dateLocale)} />
                </div>

                {c.total_outstanding > 0 ? (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-100/50 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-rose-700 font-semibold">
                      {t("outstandingLabel")}
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between">
                      <span className="text-lg font-bold text-rose-900">{formatEUR(c.total_outstanding)}</span>
                      <span className="text-[10px] text-rose-700">
                        {t("chargesCount", { n: c.nb_unpaid })}
                      </span>
                    </div>
                    <Link href={`/syndic/coproprietes/${c.id}/relances`}
                      className="mt-1 block text-[11px] text-rose-700 underline">
                      {t("sendReminders")}
                    </Link>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-center text-xs text-emerald-800">
                    {t("noUnpaid")}
                  </div>
                )}

                {c.next_assembly && (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs">
                    <div className="font-semibold text-blue-900">{t("agPrefix", { title: c.next_assembly.title })}</div>
                    <div className="mt-0.5 text-[10px] text-blue-700">
                      {new Date(c.next_assembly.scheduled_at).toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" })}
                    </div>
                  </div>
                )}

                {c.last_closed_year && (
                  <div className="mt-3 text-[10px] text-muted">
                    {t("lastClosedYear", { year: c.last_closed_year })}
                    <Link href={`/syndic/coproprietes/${c.id}/annexes`} className="ml-1 text-navy underline">
                      {t("agAnnexes")}
                    </Link>
                  </div>
                )}

                <div className="mt-3 flex gap-1 text-[10px]">
                  <Link href={`/syndic/coproprietes/${c.id}/comptabilite`}
                    className="flex-1 rounded border border-card-border bg-white px-2 py-1 text-center text-slate hover:bg-background">
                    {t("btnAccounting")}
                  </Link>
                  <Link href={`/syndic/coproprietes/${c.id}/appels`}
                    className="flex-1 rounded border border-card-border bg-white px-2 py-1 text-center text-slate hover:bg-background">
                    {t("btnCalls")}
                  </Link>
                  <Link href={`/syndic/coproprietes/${c.id}/assemblees`}
                    className="flex-1 rounded border border-card-border bg-white px-2 py-1 text-center text-slate hover:bg-background">
                    {t("btnAgm")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("routineStrong")}</strong> {t("routineBody")}
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "rose" | "amber" | "blue" }) {
  const bg = tone === "rose" ? "bg-rose-50 border-rose-200" :
    tone === "amber" ? "bg-amber-50 border-amber-200" :
    tone === "blue" ? "bg-blue-50 border-blue-200" : "bg-card border-card-border";
  const txt = tone === "rose" ? "text-rose-900" :
    tone === "amber" ? "text-amber-900" :
    tone === "blue" ? "text-blue-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-xl font-bold ${txt}`}>{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-sm font-semibold text-navy">{value}</div>
    </div>
  );
}
