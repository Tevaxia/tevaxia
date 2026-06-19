"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Hotel, HotelPeriod } from "@/lib/hotels";

interface Props {
  hotel: Hotel;
  period: HotelPeriod;
  groupName: string;
  previousPeriod?: HotelPeriod | null;
}

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4, color: "#0B2447" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingBottom: 10, borderBottom: "2 solid #7C3AED" },
  brand: { fontSize: 14, fontWeight: "bold", color: "#7C3AED" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6B7280", marginBottom: 16 },
  section: { marginTop: 14 },
  h2: { fontSize: 11, fontWeight: "bold", marginBottom: 6, color: "#1B2A4A", textTransform: "uppercase", borderBottom: "1 solid #E5E7EB", paddingBottom: 3 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  label: { color: "#334155", width: "55%" },
  value: { fontWeight: "bold", color: "#0B2447", width: "30%", textAlign: "right" },
  trend: { width: "15%", textAlign: "right", fontSize: 9 },
  kpiGrid: { flexDirection: "row", gap: 10, marginVertical: 10 },
  kpiCard: { flex: 1, padding: 10, borderRadius: 4, border: "1 solid #E5E7EB" },
  kpiLabel: { fontSize: 8, color: "#6B7280", textTransform: "uppercase" },
  kpiValue: { fontSize: 14, fontWeight: "bold", marginTop: 3 },
  flag: { backgroundColor: "#F3E8FF", color: "#7C3AED", paddingHorizontal: 6, paddingVertical: 2, fontSize: 8, fontWeight: "bold", borderRadius: 3, alignSelf: "flex-start", marginBottom: 6 },
});

const fmtEUR = (n: number | null | undefined) => {
  if (n == null) return "—";
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " EUR";
};

const fmtPct = (n: number | null | undefined, d = 1) => {
  if (n == null) return "—";
  return `${(n * 100).toFixed(d)} %`;
};

const fmtNum = (n: number | null | undefined, d = 1) => {
  if (n == null) return "—";
  return n.toFixed(d);
};

const fmtDelta = (curr: number | null | undefined, prev: number | null | undefined) => {
  if (curr == null || prev == null || prev === 0) return "";
  const diff = ((curr - prev) / prev) * 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)} %`;
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

export default function HotelOwnerReportPdf({ hotel, period, groupName, previousPeriod }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>{groupName}</Text>
            <Text style={{ fontSize: 8, color: "#6B7280" }}>Owner Report</Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={{ fontSize: 9, color: "#6B7280" }}>Émis le {new Date().toLocaleDateString("fr-FR")}</Text>
          </View>
        </View>

        <Text style={s.flag}>{hotel.category.toUpperCase()} · {hotel.nb_chambres} CHAMBRES</Text>
        <Text style={s.title}>{hotel.name}</Text>
        <Text style={s.subtitle}>
          {period.period_label || `${fmtDate(period.period_start)} → ${fmtDate(period.period_end)}`}
          {hotel.commune ? ` · ${hotel.commune}` : ""}
        </Text>

        {/* KPI commerciaux — cards */}
        <Text style={s.h2}>Performance commerciale</Text>
        <View style={s.kpiGrid}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>RevPAR</Text>
            <Text style={s.kpiValue}>{fmtEUR(period.revpar)}</Text>
            {previousPeriod && <Text style={{ fontSize: 8, color: "#6B7280", marginTop: 2 }}>vs période précédente : {fmtDelta(period.revpar, previousPeriod.revpar)}</Text>}
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>ADR moyen</Text>
            <Text style={s.kpiValue}>{fmtEUR(period.adr)}</Text>
            {previousPeriod && <Text style={{ fontSize: 8, color: "#6B7280", marginTop: 2 }}>{fmtDelta(period.adr, previousPeriod.adr)}</Text>}
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Occupation</Text>
            <Text style={s.kpiValue}>{fmtPct(period.occupancy)}</Text>
            {previousPeriod && <Text style={{ fontSize: 8, color: "#6B7280", marginTop: 2 }}>{fmtDelta(period.occupancy, previousPeriod.occupancy)}</Text>}
          </View>
        </View>

        {/* Revenus par département — USALI */}
        <Text style={s.h2}>Revenus par département (USALI)</Text>
        {period.revenue_rooms != null && (
          <View style={s.row}>
            <Text style={s.label}>Rooms</Text>
            <Text style={s.value}>{fmtEUR(period.revenue_rooms)}</Text>
            <Text style={s.trend}>{previousPeriod ? fmtDelta(period.revenue_rooms, previousPeriod.revenue_rooms) : ""}</Text>
          </View>
        )}
        {period.revenue_fb != null && (
          <View style={s.row}>
            <Text style={s.label}>Food &amp; Beverage</Text>
            <Text style={s.value}>{fmtEUR(period.revenue_fb)}</Text>
            <Text style={s.trend}>{previousPeriod ? fmtDelta(period.revenue_fb, previousPeriod.revenue_fb) : ""}</Text>
          </View>
        )}
        {period.revenue_mice != null && (
          <View style={s.row}>
            <Text style={s.label}>MICE / séminaires</Text>
            <Text style={s.value}>{fmtEUR(period.revenue_mice)}</Text>
            <Text style={s.trend}>{previousPeriod ? fmtDelta(period.revenue_mice, previousPeriod.revenue_mice) : ""}</Text>
          </View>
        )}
        {period.revenue_other != null && (
          <View style={s.row}>
            <Text style={s.label}>Autres</Text>
            <Text style={s.value}>{fmtEUR(period.revenue_other)}</Text>
            <Text style={s.trend}>{previousPeriod ? fmtDelta(period.revenue_other, previousPeriod.revenue_other) : ""}</Text>
          </View>
        )}
        <View style={{ ...s.row, marginTop: 4, borderTop: "1 solid #E5E7EB", paddingTop: 4 }}>
          <Text style={{ ...s.label, fontWeight: "bold" }}>Revenu total</Text>
          <Text style={{ ...s.value, color: "#7C3AED" }}>{fmtEUR(period.revenue_total)}</Text>
          <Text style={s.trend}>{previousPeriod ? fmtDelta(period.revenue_total, previousPeriod.revenue_total) : ""}</Text>
        </View>

        {/* Charges */}
        {(period.staff_cost != null || period.energy_cost != null || period.other_opex != null) && (
          <View style={s.section}>
            <Text style={s.h2}>Charges d&apos;exploitation</Text>
            {period.staff_cost != null && (
              <View style={s.row}>
                <Text style={s.label}>Personnel</Text>
                <Text style={s.value}>{fmtEUR(-period.staff_cost)}</Text>
                <Text style={s.trend}></Text>
              </View>
            )}
            {period.energy_cost != null && (
              <View style={s.row}>
                <Text style={s.label}>Énergie</Text>
                <Text style={s.value}>{fmtEUR(-period.energy_cost)}</Text>
                <Text style={s.trend}></Text>
              </View>
            )}
            {period.other_opex != null && (
              <View style={s.row}>
                <Text style={s.label}>Autres opex (A&amp;G, marketing, maintenance)</Text>
                <Text style={s.value}>{fmtEUR(-period.other_opex)}</Text>
                <Text style={s.trend}></Text>
              </View>
            )}
            {period.ffe_reserve != null && (
              <View style={s.row}>
                <Text style={s.label}>Réserve FF&amp;E (4 %)</Text>
                <Text style={s.value}>{fmtEUR(-period.ffe_reserve)}</Text>
                <Text style={s.trend}></Text>
              </View>
            )}
          </View>
        )}

        {/* Profitabilité */}
        {(period.gop != null || period.ebitda != null) && (
          <View style={s.section}>
            <Text style={s.h2}>Profitabilité</Text>
            <View style={s.kpiGrid}>
              <View style={s.kpiCard}>
                <Text style={s.kpiLabel}>GOP ({fmtPct(period.gop_margin)})</Text>
                <Text style={{ ...s.kpiValue, color: "#059669" }}>{fmtEUR(period.gop)}</Text>
              </View>
              <View style={s.kpiCard}>
                <Text style={s.kpiLabel}>EBITDA ({fmtPct(period.ebitda_margin)})</Text>
                <Text style={{ ...s.kpiValue, color: "#7C3AED" }}>{fmtEUR(period.ebitda)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Compset benchmark */}
        {(period.mpi != null || period.ari != null || period.rgi != null) && (
          <View style={s.section}>
            <Text style={s.h2}>Benchmark compset (STR-like)</Text>
            <View style={s.kpiGrid}>
              <View style={s.kpiCard}>
                <Text style={s.kpiLabel}>MPI — occupation</Text>
                <Text style={{ ...s.kpiValue, fontSize: 12, color: (period.mpi ?? 100) >= 100 ? "#059669" : "#DC2626" }}>{fmtNum(period.mpi)}</Text>
              </View>
              <View style={s.kpiCard}>
                <Text style={s.kpiLabel}>ARI — pricing</Text>
                <Text style={{ ...s.kpiValue, fontSize: 12, color: (period.ari ?? 100) >= 100 ? "#059669" : "#DC2626" }}>{fmtNum(period.ari)}</Text>
              </View>
              <View style={s.kpiCard}>
                <Text style={s.kpiLabel}>RGI — revenu global</Text>
                <Text style={{ ...s.kpiValue, fontSize: 12, color: (period.rgi ?? 100) >= 100 ? "#059669" : "#DC2626" }}>{fmtNum(period.rgi)}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 8, color: "#6B7280" }}>
              Indices ≥ 100 = sur-performance vs compset ; &lt; 100 = sous-performance. Référence 100 = moyenne marché.
            </Text>
          </View>
        )}

        {/* Notes */}
        {period.notes && (
          <View style={s.section}>
            <Text style={s.h2}>Commentaires de la direction</Text>
            <Text style={{ fontSize: 9, color: "#334155" }}>{period.notes}</Text>
          </View>
        )}

        <Text style={{ position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 7, color: "#6B7280", textAlign: "center" }}>
          Owner report généré via tevaxia.lu — Standards USALI 11e éd. + compset STR-like. Document confidentiel destiné au(x) propriétaire(s) de l&apos;établissement.
        </Text>
      </Page>
    </Document>
  );
}
