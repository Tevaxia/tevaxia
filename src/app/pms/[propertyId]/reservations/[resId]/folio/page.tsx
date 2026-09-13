"use client";

import { useEffect, useMemo, useState, use, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { getReservation } from "@/lib/pms/reservations";
import {
  getFolioByReservation, openFolio, autoPostRoomCharges,
  listFolioCharges, voidCharge, settleFolio,
  groupChargesByCategory, computeVatBreakdown,
} from "@/lib/pms/folios";
import type {
  PmsProperty, PmsReservation, PmsFolio, PmsFolioCharge, PmsChargeCategory,
} from "@/lib/pms/types";

import { errMsg } from "@/lib/pms/errors";
import { prepareFolioStatement } from "@/lib/pms/folio-statement";
import ChargeEntry from "@/components/pms/ChargeEntry";

const STATUS_COLORS: Record<PmsFolio["status"], string> = {
  open: "bg-blue-100 text-blue-900",
  pending_settlement: "bg-amber-100 text-amber-900",
  settled: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-rose-100 text-rose-900",
};

const STATUS_KEY: Record<PmsFolio["status"], string> = {
  open: "statusOpen",
  pending_settlement: "statusPending",
  settled: "statusSettled",
  cancelled: "statusCancelled",
};

const CATEGORY_KEY: Record<PmsChargeCategory, string> = {
  room: "catRoom",
  taxe_sejour: "catTouristTax",
  extra_bed: "catExtraBed",
  breakfast: "catBreakfast",
  lunch: "catLunch",
  dinner: "catDinner",
  bar: "catBar",
  minibar: "catMinibar",
  room_service: "catRoomService",
  meeting_room: "catMeetingRoom",
  parking: "catParking",
  laundry: "catLaundry",
  spa: "catSpa",
  phone: "catPhone",
  internet: "catInternet",
  transport: "catTransport",
  cancellation_fee: "catCancellationFee",
  damage: "catDamage",
  other: "catOther",
};

function FolioScreen(props: { params: Promise<{ propertyId: string; resId: string }> }) {
  const { propertyId, resId } = use(props.params);
  const router = useRouter();
  const t = useTranslations("pmsFolio");
  const te = useTranslations("pmsChargeEntry");
  const ts = useTranslations("pmsStatement");
  const locale = useLocale();
  const formatEUR = (n: number) => new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency: folio?.currency ?? reservation?.currency ?? property?.currency ?? "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const dateLocale = locale === "fr" ? "fr-FR" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";

  const fmtDateTime = useCallback((s: string | null | undefined): string => {
    if (!s) return t("dash");
    return new Date(s).toLocaleString(dateLocale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }, [dateLocale, t]);

  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [reservation, setReservation] = useState<PmsReservation | null>(null);
  const [folio, setFolio] = useState<PmsFolio | null>(null);
  const [charges, setCharges] = useState<PmsFolioCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVoided, setShowVoided] = useState(false);
  const exportLock = useRef(false);
  const [exporting, setExporting] = useState(false);
  const mutationLock = useRef(false);
  const [mutating, setMutating] = useState(false);

  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  const reload = useCallback(async () => {
    if (!propertyId || !resId) return;
    const current = ++request.current;
    setLoading(true); setError(null);
    try {
      const [p, r] = await Promise.all([getProperty(propertyId), getReservation(resId)]);
      if (!p || !r || r.property_id !== propertyId) throw new Error("Property or reservation unavailable");
      const f = await getFolioByReservation(resId);
      if (f && f.property_id !== propertyId) throw new Error("Folio mismatch");
      const cs = f ? await listFolioCharges(f.id, showVoided) : [];
      groupChargesByCategory(cs); computeVatBreakdown(cs);
      if (current !== request.current) return;
      setProperty(p); setReservation(r); setFolio(f); setCharges(cs);
    } catch (e) {
      if (current === request.current) setError(errMsg(e));
    }
    if (current === request.current) setLoading(false);
  }, [propertyId, resId, showVoided]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const handleOpenFolio = async () => {
    if (folio || mutationLock.current) return;
    mutationLock.current = true; setMutating(true);
    try {
      const f = await openFolio(propertyId, resId);
      if (f.status === "open") await autoPostRoomCharges(f.id);
      await reload();
    } catch (e) { setError(errMsg(e)); }
    finally { mutationLock.current = false; setMutating(false); }
  };
  const handleVoid = async (chargeId: string) => {
    if (mutationLock.current) return;
    const reason = prompt(t("voidPrompt"));
    if (!reason?.trim()) return;
    mutationLock.current = true; setMutating(true);
    try { await voidCharge(chargeId, reason.trim()); await reload(); }
    catch (e) { setError(errMsg(e)); }
    finally { mutationLock.current = false; setMutating(false); }
  };
  const handleSettle = async () => {
    if (!folio || mutationLock.current) return;
    if (!confirm(t("confirmSettle", { amount: formatEUR(folio.total_ttc) }))) return;
    mutationLock.current = true; setMutating(true);
    try {
      const invoiceId = await settleFolio(folio.id);
      alert(t("factureGenerated"));
      router.push(`${locale === "fr" ? "" : `/${locale}`}/pms/${propertyId}/factures?invoice=${invoiceId}`);
    } catch (e) { setError(errMsg(e)); }
    finally { mutationLock.current = false; setMutating(false); }
  };

  const handleStatement = async () => {
    if (!property || !reservation || !folio || exportLock.current) return;
    exportLock.current = true; setExporting(true);
    const current = request.current;
    try {
      const report = prepareFolioStatement(folio, charges);
      const [{ pdf }, { default: FolioStatementPdf }] = await Promise.all([import("@react-pdf/renderer"), import("@/components/pms/FolioStatementPdf")]);
      const labels = Object.fromEntries(["title", "scope", "amountScope", "status", "generated", "ht", "vat", "gross", "balance", "lines", "quantity", "unit", "rate", "reference", "missing"].map(k => [k, ts(k)]));
      const categories = Object.fromEntries(Object.entries(CATEGORY_KEY).map(([k, v]) => [k, t(v)]));
      const blob = await pdf(<FolioStatementPdf report={report} property={property.name} reservation={reservation.reservation_number} stay={`${reservation.check_in} - ${reservation.check_out}`} status={t(STATUS_KEY[folio.status])} generatedAt={new Date().toISOString()} labels={labels} categories={categories} locale={locale} />).toBlob();
      if (current !== request.current) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `folio-${folio.id.replace(/[^a-zA-Z0-9-]/g, "")}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      if (current === request.current) setError(ts("error"));
    } finally {
      exportLock.current = false;
      if (current === request.current) setExporting(false);
    }
  };

  const grouped = useMemo(() => groupChargesByCategory(charges), [charges]);
  const breakdown = useMemo(() => computeVatBreakdown(charges), [charges]);

  if (authLoading || loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (error && (!property || !reservation)) return <div className="p-6"><p role="alert">{te("error")}</p><button className="mt-3 underline" onClick={() => { void reload(); }}>{te("retry")}</button></div>;
  if (!user || !property || !reservation) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">
      <Link href="/connexion" className="text-navy underline">{t("signIn")}</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`${locale === "fr" ? "" : `/${locale}`}/pms/${propertyId}`} className="hover:text-navy">{property.name}</Link>
        <span>/</span>
        <Link href={`${locale === "fr" ? "" : `/${locale}`}/pms/${propertyId}/reservations/${resId}`} className="hover:text-navy">
          {t("breadcrumbReservation", { n: reservation.reservation_number })}
        </Link>
        <span>/</span>
        <span className="text-navy">{t("breadcrumbFolio")}</span>
      </div>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {t("title", { n: reservation.reservation_number })}
          </h1>
          <div className="mt-1 text-xs text-muted">
            {t("headerStay", {
              adults: reservation.nb_adults,
              children: reservation.nb_children,
              checkIn: new Date(reservation.check_in).toLocaleDateString(dateLocale),
              checkOut: new Date(reservation.check_out).toLocaleDateString(dateLocale),
              nights: reservation.nb_nights,
            })}
          </div>
        </div>
        {folio && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[folio.status]}`}>
              {t(STATUS_KEY[folio.status])}
            </span>
            {folio.status === "pending_settlement" && (
              <button disabled={mutating} onClick={handleSettle}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                {t("btnGenerate")}
              </button>
            )}
            {charges.filter((c) => !c.voided).length > 0 && (
              <button id="folio-statement" disabled={exporting} onClick={handleStatement}
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                title={ts("scope")}>
                {ts(exporting ? "exporting" : "download")}
              </button>
            )}
            {folio.status === "settled" && folio.invoice_id && (
              <Link href={`${locale === "fr" ? "" : `/${locale}`}/pms/${propertyId}/factures?invoice=${folio.invoice_id}`}
                className="rounded-lg border border-navy bg-white px-4 py-2 text-sm font-semibold text-navy">
                {t("btnSeeInvoice")}
              </Link>
            )}
          </div>
        )}
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* Pas encore de folio : call-to-action */}
      {!folio && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border p-8 text-center">
          <p className="text-sm text-muted">
            {reservation.status === "confirmed" ? t("pendingMessage") : t("noFolioMessage")}
          </p>
          {reservation.status === "confirmed" ? (
            <p className="mt-2 text-xs text-muted">
              {t("preChargeHint")}
            </p>
          ) : null}
          <button disabled={mutating} onClick={handleOpenFolio}
            className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {t("btnOpenFolio")}
          </button>
        </div>
      )}

      {folio && (
        <>
          {/* KPIs ventilation TVA */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <KpiCard currency={folio.currency} label={t("kpiAccommodation")} ht={breakdown.hebergement.ht} ttc={breakdown.hebergement.ttc} t={t} />
            <KpiCard currency={folio.currency} label={t("kpiFb")} ht={breakdown.fb.ht} ttc={breakdown.fb.ttc} t={t} />
            <KpiCard currency={folio.currency} label={t("kpiOther")} ht={breakdown.other.ht} ttc={breakdown.other.ttc} t={t} />
            <KpiCard currency={folio.currency} label={t("kpiTouristTax")} ht={breakdown.taxe_sejour} ttc={breakdown.taxe_sejour} sub={t("kpiTouristTaxSub")} t={t} />
            <KpiCard currency={folio.currency} label={t("kpiTotalDue")} ht={Number(folio.total_ttc)} ttc={Number(folio.balance_due)}
              highlight sub={folio.balance_due > 0 ? t("kpiBalanceRemaining") : t("kpiSettled")} t={t} />
          </div>

          {folio.status === "open" && <ChargeEntry key={folio.id} userId={user.id} folioId={folio.id} onPosted={() => { void reload(); }} />}

          {/* Charges table */}
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
              {t("folioLinesTitle", { count: charges.filter((c) => !c.voided).length })}
            </h2>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={showVoided}
                onChange={(e) => setShowVoided(e.target.checked)} />
              {t("showVoided")}
            </label>
          </div>

          {charges.length === 0 ? (
            <div className="mt-3 rounded-xl border-2 border-dashed border-card-border p-8 text-center text-sm text-muted">
              {t("noLines")}
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-background/60">
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colDate")}</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colCategory")}</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colDescription")}</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colQty")}</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colPuHt")}</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colTva")}</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colHt")}</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colTtc")}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((c) => (
                    <tr key={c.id} className={`border-b border-card-border/40 ${c.voided ? "opacity-40 line-through" : ""}`}>
                      <td className="px-3 py-2 text-xs text-muted">{fmtDateTime(c.posted_at)}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-navy">
                          {t(CATEGORY_KEY[c.category])}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{c.description}</div>
                        {c.notes && <div className="mt-1 max-w-sm whitespace-pre-wrap text-xs text-muted [overflow-wrap:anywhere]">{te("reference")} : {c.notes}</div>}
                        {c.source && c.source !== "manual" && (
                          <div className="text-[9px] text-muted uppercase">{c.source.replace("_", " ")}</div>
                        )}
                        {c.void_reason && <div className="text-[9px] text-rose-700">{t("voidLabel", { reason: c.void_reason })}</div>}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{Number(c.quantity).toLocaleString(dateLocale)}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{formatEUR(Number(c.unit_price_ht))}</td>
                      <td className="px-3 py-2 text-right text-xs text-muted">{c.tva_rate}%</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{formatEUR(Number(c.line_ht))}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-navy">{formatEUR(Number(c.line_ttc))}</td>
                      <td className="px-3 py-2 text-right">
                        {!c.voided && folio.status === "open" && (
                          <button disabled={mutating} onClick={() => handleVoid(c.id)}
                            className="text-[10px] text-rose-700 hover:underline">{t("btnVoid")}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-card-border bg-background font-semibold">
                    <td colSpan={6} className="px-3 py-3 text-right">{t("totalsRow")}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatEUR(breakdown.total_ht)}</td>
                    <td className="px-3 py-3 text-right font-mono text-navy">{formatEUR(breakdown.total_ttc)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Récap par catégorie */}
          {Object.keys(grouped).length > 0 && (
            <div tabIndex={0} role="region" aria-label={t("breakdownTitle")} className="mt-6 overflow-x-auto rounded-xl border border-card-border bg-card p-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">{t("breakdownTitle")}</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-[10px] uppercase tracking-wider text-muted">
                    <th className="px-2 py-1">{t("bdCol")}</th>
                    <th className="px-2 py-1 text-right">{t("bdNb")}</th>
                    <th className="px-2 py-1 text-right">{t("bdHt")}</th>
                    <th className="px-2 py-1 text-right">{t("bdTva")}</th>
                    <th className="px-2 py-1 text-right">{t("bdTtc")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.entries(grouped) as [PmsChargeCategory, { count: number; ht: number; tva: number; ttc: number }][]).map(([cat, tot]) => (
                    <tr key={cat} className="border-b border-card-border/40">
                      <td className="px-2 py-1.5">{t(CATEGORY_KEY[cat])}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs">{tot.count}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs">{formatEUR(tot.ht)}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs text-muted">{formatEUR(tot.tva)}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs font-semibold text-navy">{formatEUR(tot.ttc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
            <strong>{t("legalTitle")}</strong> {t("legalText")}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, ht, ttc, sub, highlight = false, t, currency }: {
  currency: string; label: string; ht: number; ttc: number; sub?: string; highlight?: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const locale = useLocale();
  const formatEUR = (n: number) => new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-navy bg-navy text-white" : "border-card-border bg-card"}`}>
      <div className={`text-[10px] uppercase tracking-wider ${highlight ? "text-white/70" : "text-muted"}`}>{label}</div>
      <div className={`mt-1 text-lg font-bold ${highlight ? "text-white" : "text-navy"}`}>{formatEUR(ttc)}</div>
      <div className={`text-[10px] ${highlight ? "text-white/60" : "text-muted"}`}>
        {sub ?? t("kpiHt", { amount: formatEUR(ht) })}
      </div>
    </div>
  );
}

export default function FolioPage(props: { params: Promise<{ propertyId: string; resId: string }> }) {
  const ids = use(props.params), { user, loading } = useAuth();
  const t = useTranslations("pmsFolio"), locale = useLocale();
  if (loading) return <p className="p-6">{t("loading")}</p>;
  if (!user) return <div className="p-6"><h1 className="text-2xl font-bold">{t("title")}</h1><Link className="mt-4 inline-block underline" href={`${locale === "fr" ? "" : `/${locale}`}/connexion`}>{t("signIn")}</Link></div>;
  return <FolioScreen key={`${user.id}:${ids.propertyId}:${ids.resId}`} {...props} />;
}
