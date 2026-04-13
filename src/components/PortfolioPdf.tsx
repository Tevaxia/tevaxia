"use client";

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import {
  CoverPage,
  KpiGrid,
  PageHeader,
  Footer,
  generateRef,
} from "@/components/energy/EnergyPdf";

// Register Inter font (Google Fonts CDN)
try {
  if (typeof window !== "undefined") {
    Font.register({
      family: "Inter",
      fonts: [
        { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf", fontWeight: 400 },
        { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf", fontWeight: 600 },
        { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf", fontWeight: 700 },
      ],
    });
  }
} catch { /* Font already registered */ }

/* ---------- Formatting helpers ---------- */

const fmtEur = (n: number) => {
  const str = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${str} EUR`;
};

const fmtNum = (n: number, d = 0) => {
  const fixed = d > 0 ? n.toFixed(d) : Math.round(n).toString();
  return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const today = () => new Date().toLocaleDateString("fr-LU");

/* ---------- Styles ---------- */

const s = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Inter",
    color: "#1a1a2e",
  },
  section: {
    fontSize: 12,
    fontFamily: "Inter",
    fontWeight: 700,
    color: "#1B2A4A",
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1pt solid #e5e2db",
  },
  tHead: {
    flexDirection: "row" as const,
    backgroundColor: "#F8F7F4",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: "1pt solid #e5e2db",
  },
  tRow: {
    flexDirection: "row" as const,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottom: "0.5pt solid #f0f0f0",
  },
  tRowHL: {
    flexDirection: "row" as const,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottom: "0.5pt solid #f0f0f0",
    backgroundColor: "#F0FDF4",
  },
  tRowWarn: {
    flexDirection: "row" as const,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottom: "0.5pt solid #f0f0f0",
    backgroundColor: "#FEF2F2",
  },
  tCell: { flex: 1, fontSize: 8 },
  tCellR: { flex: 1, fontSize: 8, textAlign: "right" as const },
  tCellB: { flex: 1, fontSize: 8, fontFamily: "Inter", fontWeight: 600 },
  tCellC: { width: 40, fontSize: 8, textAlign: "center" as const },
  disclaimer: {
    fontSize: 7,
    color: "#9CA3AF",
    marginTop: 20,
    paddingTop: 8,
    borderTop: "0.5pt solid #e5e2db",
    lineHeight: 1.4,
  },
});

/* ---------- Types ---------- */

interface PdfProperty {
  id: string;
  nom: string;
  commune: string;
  valeur: number;
  surface: number;
  prixM2: number;
  energyClass?: string;
  type: string;
  date: string;
}

interface PdfStats {
  valeurTotale: number;
  avgPrixM2: number;
  nbProperties: number;
  avgEnergyClass: string | null;
  surfaceTotale: number;
}

export interface PortfolioPdfParams {
  properties: PdfProperty[];
  stats: PdfStats;
}

/* ---------- PDF Document ---------- */

export function PortfolioPdfDocument({ params }: { params: PortfolioPdfParams }) {
  const { properties, stats } = params;
  const ref = generateRef();

  // Best / worst by prix/m2
  const withPrix = properties.filter((p) => p.prixM2 > 0);
  const bestId = withPrix.length > 2
    ? withPrix.reduce((b, p) => p.prixM2 > b.prixM2 ? p : b, withPrix[0]).id
    : null;
  const worstId = withPrix.length > 2
    ? withPrix.reduce((w, p) => p.prixM2 < w.prixM2 ? p : w, withPrix[0]).id
    : null;

  return (
    <Document>
      {/* Cover page */}
      <CoverPage
        title="Portfolio Immobilier"
        subtitle={`${stats.nbProperties} bien${stats.nbProperties > 1 ? "s" : ""} — Synthese au ${today()}`}
        value={fmtEur(stats.valeurTotale)}
        date={today()}
        reference={ref}
      />

      {/* Summary + Table page */}
      <Page size="A4" style={s.page}>
        <PageHeader title="Synthese du portfolio" reference={ref} />
        <Footer />

        {/* KPI grid */}
        <KpiGrid items={[
          { label: "Valeur totale", value: fmtEur(stats.valeurTotale), highlight: true },
          { label: "Prix moyen / m2", value: stats.avgPrixM2 > 0 ? fmtEur(stats.avgPrixM2) : "--" },
          { label: "Nombre de biens", value: String(stats.nbProperties) },
          { label: "Surface totale", value: stats.surfaceTotale > 0 ? `${fmtNum(stats.surfaceTotale)} m2` : "--" },
          { label: "Classe CPE moyenne", value: stats.avgEnergyClass || "--" },
        ]} />

        {/* Property list table */}
        <Text style={s.section}>Liste des biens</Text>

        <View style={s.tHead}>
          <Text style={{ ...s.tCellB, flex: 2 }}>Nom</Text>
          <Text style={s.tCell}>Commune</Text>
          <Text style={s.tCellR}>Valeur</Text>
          <Text style={s.tCellR}>Surface</Text>
          <Text style={s.tCellR}>Prix/m2</Text>
          <Text style={s.tCellC}>CPE</Text>
          <Text style={s.tCell}>Date</Text>
        </View>

        {properties.map((p) => {
          const rowStyle = p.id === bestId ? s.tRowHL : p.id === worstId ? s.tRowWarn : s.tRow;
          return (
            <View key={p.id} style={rowStyle}>
              <Text style={{ ...s.tCellB, flex: 2 }}>{p.nom}</Text>
              <Text style={s.tCell}>{p.commune || "--"}</Text>
              <Text style={s.tCellR}>{fmtEur(p.valeur)}</Text>
              <Text style={s.tCellR}>{p.surface > 0 ? `${fmtNum(p.surface)} m2` : "--"}</Text>
              <Text style={s.tCellR}>{p.prixM2 > 0 ? fmtEur(p.prixM2) : "--"}</Text>
              <Text style={s.tCellC}>{p.energyClass || "--"}</Text>
              <Text style={s.tCell}>{p.date ? new Date(p.date).toLocaleDateString("fr-LU") : "--"}</Text>
            </View>
          );
        })}

        {/* Disclaimer */}
        <Text style={s.disclaimer}>
          Ce document est genere automatiquement par tevaxia.lu a titre informatif. Les resultats
          dependent des parametres saisis et des hypotheses de calcul. Ils ne constituent ni une
          expertise certifiee ni un conseil financier, fiscal ou juridique. Pour toute decision
          engageante, consultez un professionnel agree. Donnees au {today()}.
        </Text>
      </Page>
    </Document>
  );
}

/* ---------- Blob generator (for dynamic import) ---------- */

export async function generatePortfolioDashboardPdfBlob(params: PortfolioPdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<PortfolioPdfDocument params={params} />).toBlob();
}
