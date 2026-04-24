"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getPortalData, type PortalData } from "@/lib/coownership-portal";
import { formatEUR } from "@/lib/calculations";

export default function CoproprieteurPortal() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("copropPortal");
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const token = String(params?.token ?? "");
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  const STATUS_LABELS: Record<string, string> = {
    draft: t("statusDraft"),
    convened: t("statusConvened"),
    in_progress: t("statusInProgress"),
    closed: t("statusClosed"),
    cancelled: t("statusCancelled"),
  };

  const UNIT_TYPE_LABELS: Record<string, string> = {
    apartment: t("unitApartment"),
    commercial: t("unitCommercial"),
    office: t("unitOffice"),
    parking: t("unitParking"),
    cellar: t("unitCellar"),
    other: t("unitOther"),
  };

  const OCCUPANCY_LABELS: Record<string, string> = {
    owner_occupied: t("occOwnerOccupied"),
    rented: t("occRented"),
    vacant: t("occVacant"),
    seasonal: t("occSeasonal"),
  };

  useEffect(() => {
    if (!token) return;
    getPortalData(token)
      .then((d) => setData(d))
      .catch((e) => setData({ error: e?.message ?? t("errGeneric") } as PortalData))
      .finally(() => setLoading(false));
  }, [token, t]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }

  if (!data || data.error || !data.coownership) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-navy mb-2">{t("invalidLinkTitle")}</h1>
        <p className="text-muted">{t("invalidLinkBody")}</p>
      </div>
    );
  }

  const { coownership: coown, unit, assemblies, fund_calls } = data;
  const unpaidCalls = fund_calls.filter((c) => !c.paid);
  const totalUnpaid = unpaidCalls.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 sm:p-8 text-white shadow-lg">
          <div className="text-xs uppercase tracking-wider text-white/60">{t("heroKicker")}</div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold">{coown.name}</h1>
          {coown.address && <p className="mt-1 text-sm text-white/80">{coown.address}{coown.commune ? `, ${coown.commune}` : ""}</p>}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1">{t("lots", { n: coown.nb_lots })}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{t("tantiemes", { n: coown.total_tantiemes })}</span>
            {coown.year_built && <span className="rounded-full bg-white/10 px-3 py-1">{t("builtIn", { year: coown.year_built })}</span>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`/copropriete/${token}/mon-compte`}
              className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/30">
              {t("myAccount")}
            </a>
            {assemblies.filter((a) => ["convened", "in_progress"].includes(a.status)).length > 0 && (
              <a href={`/copropriete/${token}/ag/${assemblies.find((a) => ["convened", "in_progress"].includes(a.status))?.id}`}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-amber-600">
                {t("voteAtAg")}
              </a>
            )}
            <a href={`/copropriete/${token}/assistant`}
              className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/30">
              {t("iaAssistant")}
            </a>
          </div>
        </div>

        {/* Mon lot */}
        {unit && (
          <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy">{t("myLotTitle")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><span className="text-xs text-muted">{t("myLotNumero")}</span><div className="font-semibold">{unit.lot_number}</div></div>
              <div><span className="text-xs text-muted">{t("myLotType")}</span><div className="font-semibold">{UNIT_TYPE_LABELS[unit.unit_type] ?? unit.unit_type}</div></div>
              <div><span className="text-xs text-muted">{t("myLotFloor")}</span><div className="font-semibold">{unit.floor ?? "—"}</div></div>
              <div><span className="text-xs text-muted">{t("myLotSurface")}</span><div className="font-semibold">{unit.surface_m2 ? `${unit.surface_m2} m²` : "—"}</div></div>
              <div><span className="text-xs text-muted">{t("myLotTantiemes")}</span><div className="font-semibold font-mono">{unit.tantiemes} / {coown.total_tantiemes}</div></div>
              <div><span className="text-xs text-muted">{t("myLotOccupancy")}</span><div className="font-semibold">{OCCUPANCY_LABELS[unit.occupancy] ?? unit.occupancy}</div></div>
            </div>
          </div>
        )}

        {/* Situation financière */}
        {fund_calls.length > 0 && (
          <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-navy">{t("fundCallsTitle")}</h2>
              {totalUnpaid > 0 && (
                <span className="rounded-full bg-rose-100 text-rose-800 px-2.5 py-1 text-xs font-bold">
                  {t("amountPending", { amount: formatEUR(totalUnpaid) })}
                </span>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {fund_calls.map((fc) => (
                <div key={fc.id} className={`rounded-lg border p-3 text-sm flex items-center justify-between ${fc.paid ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"}`}>
                  <div>
                    <div className="font-semibold text-navy">{fc.period}</div>
                    <div className="text-xs text-muted">{t("dueDate", { date: new Date(fc.due_date).toLocaleDateString(dateLocale) })}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-navy">{formatEUR(fc.amount)}</div>
                    <div className={`text-xs font-semibold ${fc.paid ? "text-emerald-700" : "text-rose-700"}`}>
                      {fc.paid ? t("fundPaid") : t("fundDue")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assemblées récentes */}
        {assemblies.length > 0 && (
          <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy">{t("assembliesTitle")}</h2>
            <div className="mt-4 space-y-2">
              {assemblies.map((a) => (
                <div key={a.id} className="rounded-lg border border-card-border p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-navy">{a.title}</div>
                      <div className="text-xs text-muted">
                        {a.type === "ordinary" ? t("agOrdinary") : t("agExtraordinary")} ·{" "}
                        {new Date(a.scheduled_at).toLocaleString(dateLocale, { dateStyle: "long", timeStyle: "short" })}
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-medium">
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fonds de travaux */}
        {coown.works_fund_balance !== null && coown.works_fund_balance > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-amber-900">{t("worksFundTitle")}</h2>
            <div className="mt-2 text-2xl font-bold text-amber-900">{formatEUR(coown.works_fund_balance)}</div>
            <p className="mt-1 text-xs text-amber-800">{t("worksFundExplain")}</p>
          </div>
        )}

        <div className="mt-8 rounded-lg border border-card-border bg-background p-4 text-xs text-muted text-center">
          {t("footer")}
        </div>
      </div>
    </div>
  );
}
