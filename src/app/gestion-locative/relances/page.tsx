"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { formatEUR } from "@/lib/calculations";

interface UnpaidRow {
  payment_id: string;
  lot_id: string;
  lot_name: string;
  tenant_name: string | null;
  period: string;
  amount_total: number;
  due_date: string;
  days_overdue: number;
  level_sent: number;
  last_sent_at: string | null;
}

const pdfStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  body: { fontSize: 10, lineHeight: 1.4, marginBottom: 8 },
  footer: { position: "absolute", bottom: 30, left: 36, right: 36, fontSize: 8, color: "#6B7280" },
});

interface DunningPdfProps {
  level: 1 | 2 | 3;
  tenant: string;
  amount: number;
  period: string;
  lotName: string;
  landlordName: string;
  labels: {
    title: string;
    sender: string;
    recipient: string;
    property: string;
    amountDue: string;
    periodLine: string;
    dateLine: string;
    salutation: string;
    body: string;
    closing: string;
    footer: string;
  };
}

function DunningPdf({ level, tenant, amount, period, lotName, landlordName, labels }: DunningPdfProps) {
  void level; void tenant; void amount; void period; void lotName; // referenced via labels
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{labels.title}</Text>
        <Text style={pdfStyles.body}>{labels.sender}</Text>
        <Text style={pdfStyles.body}>{labels.recipient}</Text>
        <Text style={pdfStyles.body}>{labels.property}</Text>
        <Text style={pdfStyles.body}>{labels.amountDue}</Text>
        <Text style={pdfStyles.body}>{labels.periodLine}</Text>
        <Text style={pdfStyles.body}>{labels.dateLine}</Text>
        <Text style={{ marginTop: 12, fontSize: 10, lineHeight: 1.5 }}>{labels.salutation}</Text>
        <Text style={{ marginTop: 6, fontSize: 10, lineHeight: 1.5 }}>{labels.body}</Text>
        <Text style={{ marginTop: 12, fontSize: 10 }}>{labels.closing}</Text>
        <Text style={{ marginTop: 20, fontSize: 10 }}>{landlordName}</Text>
        <Text style={pdfStyles.footer}>{labels.footer}</Text>
      </Page>
    </Document>
  );
}

export default function RelancesPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations("glRelances");
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const [rows, setRows] = useState<UnpaidRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState(t("defaultLandlord"));

  const LEVEL_CONFIG: Record<1 | 2 | 3, { label: string; days: number; color: string }> = {
    1: { label: t("level1Label"), days: 15, color: "bg-amber-100 text-amber-800" },
    2: { label: t("level2Label"), days: 30, color: "bg-orange-100 text-orange-800" },
    3: { label: t("level3Label"), days: 60, color: "bg-rose-100 text-rose-800" },
  };

  const refresh = async () => {
    if (!user || !supabase) return;
    const { data: prof } = await supabase.from("user_profiles").select("nom_complet").eq("user_id", user.id).maybeSingle();
    if (prof && (prof as { nom_complet?: string }).nom_complet) setProfileName((prof as { nom_complet: string }).nom_complet);

    const { data: unpaid } = await supabase.from("rental_payments")
      .select("id, lot_id, period_year, period_month, amount_total, status, paid_at, rental_lots(id,name)")
      .eq("user_id", user.id)
      .in("status", ["due", "late", "partial"]);

    const list: UnpaidRow[] = [];
    const now = Date.now();
    type PaymentJoined = { id: string; lot_id: string; period_year: number; period_month: number; amount_total: number; rental_lots: { name: string } | { name: string }[] | null };
    for (const p of (unpaid ?? []) as unknown as PaymentJoined[]) {
      const dueDate = new Date(p.period_year, p.period_month - 1, 5);
      const daysOverdue = Math.max(0, Math.floor((now - dueDate.getTime()) / 86400000));
      if (daysOverdue < 15) continue;
      const { data: events } = await supabase.from("rental_dunning_events")
        .select("level, sent_at").eq("payment_id", p.id).order("sent_at", { ascending: false });
      const lastLevel = events && events.length > 0 ? (events[0] as { level: number }).level : 0;
      const lastSent = events && events.length > 0 ? (events[0] as { sent_at: string }).sent_at : null;
      const lotName = Array.isArray(p.rental_lots) ? (p.rental_lots[0]?.name ?? "—") : (p.rental_lots?.name ?? "—");
      list.push({
        payment_id: p.id,
        lot_id: p.lot_id,
        lot_name: lotName,
        tenant_name: null,
        period: `${p.period_year}-${String(p.period_month).padStart(2, "0")}`,
        amount_total: p.amount_total,
        due_date: dueDate.toISOString().slice(0, 10),
        days_overdue: daysOverdue,
        level_sent: lastLevel,
        last_sent_at: lastSent,
      });
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendDunning = async (row: UnpaidRow, level: 1 | 2 | 3) => {
    if (!user || !supabase) return;
    const tenant = row.tenant_name ?? t("defaultTenant");
    const amountStr = row.amount_total.toLocaleString(dateLocale, { minimumFractionDigits: 2 });
    const bodyKey = level === 1 ? "pdfLevel1Body" : level === 2 ? "pdfLevel2Body" : "pdfLevel3Body";
    const mode = level === 3 ? t("pdfModeRegistered") : t("pdfModeSimple");
    const labels = {
      title: LEVEL_CONFIG[level].label,
      sender: t("pdfSender", { name: profileName }),
      recipient: t("pdfRecipient", { name: tenant }),
      property: t("pdfProperty", { name: row.lot_name }),
      amountDue: t("pdfAmountDue", { amount: amountStr }),
      periodLine: t("pdfPeriod", { period: row.period }),
      dateLine: t("pdfDate", { date: new Date().toLocaleDateString(dateLocale) }),
      salutation: t("pdfSalutation"),
      body: t(bodyKey, { amount: amountStr, period: row.period }),
      closing: t("pdfClosing"),
      footer: t("pdfFooter", { mode }),
    };
    const blob = await pdf(<DunningPdf level={level} tenant={tenant} amount={row.amount_total} period={row.period} lotName={row.lot_name} landlordName={profileName} labels={labels} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relance-${LEVEL_CONFIG[level].label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${row.lot_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${row.period}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);

    await supabase.from("rental_dunning_events").insert({
      payment_id: row.payment_id,
      user_id: user.id,
      level,
      method: "pdf",
    });
    await refresh();
  };

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;

  const totalDue = rows.reduce((s, r) => s + r.amount_total, 0);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/gestion-locative" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 text-muted">{t("pageSubtitle")}</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
            <div className="text-xs text-rose-700">{t("kpiTotalUnpaid")}</div>
            <div className="mt-1 text-2xl font-bold text-rose-900">{formatEUR(totalDue)}</div>
          </div>
          <div className="rounded-xl bg-card border border-card-border p-4">
            <div className="text-xs text-muted">{t("kpiCount")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{rows.length}</div>
          </div>
          <div className="rounded-xl bg-card border border-card-border p-4">
            <div className="text-xs text-muted">{t("kpiAvgDelay")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.days_overdue, 0) / rows.length) : 0} {t("daysSuffix")}</div>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left">
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("thLot")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("thPeriod")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("thAmount")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("thDelay")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("thLastReminder")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("thAction")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted">{t("noUnpaid")}</td></tr>
              ) : rows.map((r) => {
                const nextLevel = (r.level_sent + 1) as 1 | 2 | 3;
                const canSend = r.level_sent < 3 && r.days_overdue >= LEVEL_CONFIG[nextLevel].days;
                return (
                  <tr key={r.payment_id} className="border-b border-card-border/50">
                    <td className="px-4 py-2 font-medium text-navy">{r.lot_name}</td>
                    <td className="px-4 py-2 font-mono">{r.period}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold text-rose-700">{formatEUR(r.amount_total)}</td>
                    <td className="px-4 py-2 text-right font-mono">{r.days_overdue} {t("daysSuffix")}</td>
                    <td className="px-4 py-2">
                      {r.level_sent === 0 ? (
                        <span className="text-xs text-muted">{t("noReminderYet")}</span>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${LEVEL_CONFIG[r.level_sent as 1|2|3].color}`}>
                          {LEVEL_CONFIG[r.level_sent as 1|2|3].label}
                          {r.last_sent_at && <span className="ml-1 opacity-70">· {new Date(r.last_sent_at).toLocaleDateString(dateLocale)}</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {canSend ? (
                        <button onClick={() => sendDunning(r, nextLevel)}
                          className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700">
                          {t("sendLevel", { level: nextLevel })}
                        </button>
                      ) : (
                        <span className="text-xs text-muted">{t("tooEarly")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>{t("legalStrong")}</strong> {t("legalBody")}
        </div>
      </div>
    </div>
  );
}
