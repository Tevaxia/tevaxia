"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { UsaliMonthlyReport } from "@/lib/pms/usali";

const s = StyleSheet.create({
  page: { padding: 30, fontSize: 8, fontFamily: "Helvetica", lineHeight: 1.3, color: "#0B2447" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    borderBottom: "2 solid #0B2447", paddingBottom: 8, marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "bold" },
  subtitle: { fontSize: 10, color: "#475569", marginTop: 2 },
  period: { fontSize: 9, color: "#334155", textAlign: "right" },
  sectionTitle: {
    fontSize: 9, fontWeight: "bold", textTransform: "uppercase",
    color: "white", backgroundColor: "#0B2447",
    padding: 4, marginTop: 10, marginBottom: 4, letterSpacing: 1,
  },
  kpiGrid: { flexDirection: "row", gap: 6, marginBottom: 10 },
  kpiCard: {
    flex: 1, padding: 6, backgroundColor: "#F8FAFC",
    border: "0.5 solid #CBD5E1", borderRadius: 2,
  },
  kpiLabel: { fontSize: 7, textTransform: "uppercase", color: "#64748B", letterSpacing: 0.5 },
  kpiValue: { fontSize: 13, fontWeight: "bold", color: "#0B2447", marginTop: 2 },
  kpiSub: { fontSize: 6, color: "#94A3B8", marginTop: 1 },
  kpiYoy: { fontSize: 7, marginTop: 2, fontWeight: "bold" },
  kpiYoyPositive: { color: "#047857" },
  kpiYoyNegative: { color: "#B91C1C" },
  thead: {
    flexDirection: "row", paddingVertical: 3, borderBottom: "1 solid #0B2447",
    fontSize: 7, fontWeight: "bold", textTransform: "uppercase",
    color: "#475569", marginTop: 2,
  },
  th: { flex: 1 },
  thLabel: { flex: 2 },
  row: { flexDirection: "row", paddingVertical: 2, fontSize: 8 },
  rowAlt: { flexDirection: "row", paddingVertical: 2, backgroundColor: "#F8FAFC", fontSize: 8 },
  rowBorder: { flexDirection: "row", paddingVertical: 3, borderTop: "0.5 solid #CBD5E1", fontWeight: "bold" },
  amount: { flex: 1, textAlign: "right", fontFamily: "Helvetica" },
  amountBold: { flex: 1, textAlign: "right", fontWeight: "bold" },
  totalBar: {
    flexDirection: "row", padding: 8, backgroundColor: "#EFF6FF",
    borderTop: "1 solid #0B2447", marginTop: 4,
    fontWeight: "bold", color: "#1E40AF",
  },
  footer: {
    position: "absolute", bottom: 18, left: 30, right: 30,
    fontSize: 6, color: "#94A3B8", textAlign: "center",
    borderTop: "0.5 solid #CBD5E1", paddingTop: 4,
  },
  note: {
    marginTop: 10, padding: 6, backgroundColor: "#FEF9C3",
    fontSize: 6, color: "#713F12",
  },
});

const fmt = (n: number, decimals = 0): string =>
  n.toLocaleString("fr-LU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtEUR = (n: number): string =>
  fmt(n, 2) + " €";

const fmtPct = (n: number): string =>
  n.toFixed(2).replace(".", ",") + "%";

interface Props {
  report: UsaliMonthlyReport;
  syndic?: { name?: string };
}

export default function UsaliReportPdf({ report, syndic }: Props) {
  const yoy = report.prev_year_same_month;
  const yoyPct = (cur: number, prev: number | undefined | null): { pct: number; sign: "+" | "-"; positive: boolean } | null => {
    if (prev == null || prev === 0) return null;
    const pct = Math.round((cur - prev) / prev * 1000) / 10;
    return { pct: Math.abs(pct), sign: pct >= 0 ? "+" : "-", positive: pct >= 0 };
  };

  return (
    <Document title={`USALI monthly — ${report.property_name} — ${report.month_label}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Rapport USALI mensuel</Text>
            <Text style={s.subtitle}>{report.property_name}</Text>
          </View>
          <View style={s.period}>
            <Text style={{ fontWeight: "bold", fontSize: 11 }}>{report.month_label}</Text>
            <Text>{report.period_start} → {report.period_end}</Text>
            <Text style={{ fontSize: 7, color: "#64748B" }}>{report.days_in_period} jours</Text>
          </View>
        </View>

        {/* KPIs principaux */}
        <Text style={s.sectionTitle}>Performance indicators</Text>
        <View style={s.kpiGrid}>
          <KpiCard label="Occupancy" value={fmtPct(report.occupancy_pct)}
            yoy={yoyPct(report.occupancy_pct, yoy?.occupancy_pct)} />
          <KpiCard label="ADR" value={fmtEUR(report.adr)}
            yoy={yoyPct(report.adr, yoy?.adr)} />
          <KpiCard label="RevPAR" value={fmtEUR(report.revpar)}
            yoy={yoyPct(report.revpar, yoy?.revpar)} />
          <KpiCard label="TRevPAR" value={fmtEUR(report.trevpar)} />
        </View>

        <View style={s.kpiGrid}>
          <KpiCard label="Rooms sold" value={fmt(report.rooms_sold)} sub="chambres vendues" />
          <KpiCard label="Rooms available" value={fmt(report.rooms_available)} sub="inventaire total" />
          <KpiCard label="Total revenue" value={fmtEUR(report.total_revenue_ttc)} sub="TTC" />
          <KpiCard label="YoY room rev"
            value={yoy ? `${yoyPct(report.room_revenue_ttc, yoy.room_revenue_ttc)?.sign}${yoyPct(report.room_revenue_ttc, yoy.room_revenue_ttc)?.pct.toFixed(1)}%` : "N/A"}
            sub={yoy ? `vs ${fmtEUR(yoy.room_revenue_ttc)}` : "pas d'historique N-1"} />
        </View>

        {/* Revenus USALI */}
        <Text style={s.sectionTitle}>Revenue breakdown (Uniform System of Accounts)</Text>
        <View style={s.thead}>
          <Text style={s.thLabel}>Department</Text>
          <Text style={[s.th, { textAlign: "right" }]}>Revenue HT</Text>
          <Text style={[s.th, { textAlign: "right" }]}>VAT</Text>
          <Text style={[s.th, { textAlign: "right" }]}>Revenue TTC</Text>
          <Text style={[s.th, { textAlign: "right" }]}>% Total</Text>
        </View>
        {[
          { label: "Rooms", ht: report.room_revenue_ht, tva: report.room_revenue_tva, ttc: report.room_revenue_ttc },
          { label: "Food & Beverage", ht: report.fb_revenue_ht, tva: report.fb_revenue_tva, ttc: report.fb_revenue_ttc },
          { label: "Other Operated Departments", ht: report.other_revenue_ht, tva: report.other_revenue_tva, ttc: report.other_revenue_ttc },
          { label: "City tax (non-TVA)", ht: report.taxe_sejour_collected, tva: 0, ttc: report.taxe_sejour_collected },
        ].map((line, i) => {
          const pct = report.total_revenue_ttc > 0 ? (line.ttc / report.total_revenue_ttc * 100) : 0;
          return (
            <View key={line.label} style={i % 2 === 0 ? s.row : s.rowAlt}>
              <Text style={s.thLabel}>{line.label}</Text>
              <Text style={s.amount}>{fmtEUR(line.ht)}</Text>
              <Text style={s.amount}>{fmtEUR(line.tva)}</Text>
              <Text style={s.amount}>{fmtEUR(line.ttc)}</Text>
              <Text style={s.amount}>{pct.toFixed(1)}%</Text>
            </View>
          );
        })}
        <View style={s.totalBar}>
          <Text style={s.thLabel}>Total Revenue</Text>
          <Text style={s.amount}>{fmtEUR(report.total_revenue_ht)}</Text>
          <Text style={s.amount}>{fmtEUR(report.total_revenue_tva)}</Text>
          <Text style={s.amount}>{fmtEUR(report.total_revenue_ttc)}</Text>
          <Text style={s.amount}>100%</Text>
        </View>

        {/* Ventilation catégories */}
        {report.categories.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Operated departments detail</Text>
            <View style={s.thead}>
              <Text style={s.thLabel}>Category</Text>
              <Text style={[s.th, { textAlign: "right" }]}>Transactions</Text>
              <Text style={[s.th, { textAlign: "right" }]}>HT</Text>
              <Text style={[s.th, { textAlign: "right" }]}>VAT</Text>
              <Text style={[s.th, { textAlign: "right" }]}>TTC</Text>
            </View>
            {report.categories.slice(0, 15).map((c, i) => (
              <View key={c.category} style={i % 2 === 0 ? s.row : s.rowAlt}>
                <Text style={s.thLabel}>{c.label}</Text>
                <Text style={s.amount}>{c.nb_transactions}</Text>
                <Text style={s.amount}>{fmtEUR(c.revenue_ht)}</Text>
                <Text style={s.amount}>{fmtEUR(c.tva)}</Text>
                <Text style={[s.amount, { fontWeight: "bold" }]}>{fmtEUR(c.revenue_ttc)}</Text>
              </View>
            ))}
          </>
        )}

        {/* Flash activité */}
        <Text style={s.sectionTitle}>Activity flash</Text>
        <View style={s.kpiGrid}>
          <KpiCard label="Arrivals" value={fmt(report.arrivals_total)} sub="arrivées du mois" />
          <KpiCard label="Departures" value={fmt(report.departures_total)} sub="départs du mois" />
          <KpiCard label="Stayovers" value={fmt(report.stayovers_total)} sub="nuits client in-house" />
          <KpiCard label="No-shows" value={fmt(report.no_shows_total)} sub="non-présentés" />
        </View>

        <View style={s.note}>
          <Text>
            Rapport conforme Uniform System of Accounts for the Lodging Industry (USALI) v11 —
            standard mondial AHLA/HOTREC. Revenue hébergement TVA 3% LU · F&B TVA 17% ·
            Taxe séjour hors TVA (art. 44 loi 12.02.1979). Généré par tevaxia PMS{syndic?.name ? ` — ${syndic.name}` : ""}.
          </Text>
        </View>

        <Text style={s.footer} fixed>
          {report.property_name} · {report.month_label} · USALI monthly report · généré le {new Date().toLocaleDateString("fr-LU")}
        </Text>
      </Page>
    </Document>
  );
}

function KpiCard({ label, value, sub, yoy }: {
  label: string; value: string; sub?: string;
  yoy?: { pct: number; sign: "+" | "-"; positive: boolean } | null;
}) {
  return (
    <View style={s.kpiCard}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={s.kpiValue}>{value}</Text>
      {yoy && (
        <Text style={[s.kpiYoy, yoy.positive ? s.kpiYoyPositive : s.kpiYoyNegative]}>
          {yoy.sign}{yoy.pct.toFixed(1)}% YoY
        </Text>
      )}
      {sub && !yoy && <Text style={s.kpiSub}>{sub}</Text>}
    </View>
  );
}
