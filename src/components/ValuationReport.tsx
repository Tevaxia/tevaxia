"use client";

import { Document, Page, Text, View, StyleSheet, pdf, Font } from "@react-pdf/renderer";
import { formatEUR, formatPct } from "@/lib/calculations";

// Styles PDF
const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a2e" },
  header: { borderBottom: "2pt solid #1B2A4A", paddingBottom: 12, marginBottom: 20 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1B2A4A" },
  subtitle: { fontSize: 10, color: "#6B7280", marginTop: 4 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1B2A4A", marginTop: 16, marginBottom: 8, paddingBottom: 4, borderBottom: "1pt solid #e5e2db" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5pt solid #f0f0f0" },
  rowHighlight: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderTop: "1.5pt solid #C8A951", marginTop: 4, backgroundColor: "#FAFAF8" },
  label: { color: "#334155", flex: 1 },
  labelSub: { color: "#6B7280", flex: 1, paddingLeft: 12 },
  value: { fontFamily: "Helvetica-Bold", textAlign: "right" as const },
  valueLarge: { fontFamily: "Helvetica-Bold", fontSize: 12, textAlign: "right" as const, color: "#1B2A4A" },
  note: { fontSize: 8, color: "#6B7280", marginTop: 4, lineHeight: 1.4 },
  disclaimer: { fontSize: 7, color: "#9CA3AF", marginTop: 20, paddingTop: 8, borderTop: "0.5pt solid #e5e2db", lineHeight: 1.4 },
  footer: { position: "absolute" as const, bottom: 25, left: 40, right: 40, fontSize: 7, color: "#9CA3AF", textAlign: "center" as const },
  grid: { flexDirection: "row", gap: 8, marginTop: 4 },
  gridCell: { flex: 1, padding: 6, backgroundColor: "#F8F7F4", borderRadius: 4 },
  gridLabel: { fontSize: 7, color: "#6B7280" },
  gridValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1B2A4A", marginTop: 2 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: "row", backgroundColor: "#F8F7F4", paddingVertical: 4, paddingHorizontal: 6, borderBottom: "1pt solid #e5e2db" },
  tableRow: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 6, borderBottom: "0.5pt solid #f0f0f0" },
  tableCell: { flex: 1, fontSize: 8 },
  tableCellRight: { flex: 1, fontSize: 8, textAlign: "right" as const },
  tableCellBold: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold" },
});

interface ReportData {
  // Identification
  dateRapport: string;
  adresse?: string;
  commune?: string;
  assetType: string;
  evsType: string;
  surface: number;
  // Valeurs
  valeurComparaison?: number;
  valeurCapitalisation?: number;
  valeurDCF?: number;
  valeurReconciliee?: number;
  // Capitalisation détails
  noi?: number;
  tauxCap?: number;
  rendementInitial?: number;
  rendementReversionnaire?: number;
  // DCF détails
  irr?: number;
  tauxActualisation?: number;
  tauxCapSortie?: number;
  // MLV
  mlv?: number;
  ratioMLV?: number;
  // Sensibilité capitalisation
  sensibiliteCap?: { tauxCap: number; valeur: number }[];
  // Sensibilité DCF
  sensibiliteDCF?: { tauxActu: number; tauxCapSortie: number; valeur: number }[];
}

function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.header}>
          <Text style={s.title}>RAPPORT DE VALORISATION</Text>
          <Text style={s.subtitle}>tevaxia.lu — {data.dateRapport}</Text>
        </View>

        {/* Identification */}
        <View>
          <Text style={s.sectionTitle}>1. Identification</Text>
          {data.adresse && <View style={s.row}><Text style={s.label}>Adresse</Text><Text style={s.value}>{data.adresse}</Text></View>}
          {data.commune && <View style={s.row}><Text style={s.label}>Commune</Text><Text style={s.value}>{data.commune}</Text></View>}
          <View style={s.row}><Text style={s.label}>Type d'actif</Text><Text style={s.value}>{data.assetType}</Text></View>
          <View style={s.row}><Text style={s.label}>Base de valeur</Text><Text style={s.value}>{data.evsType}</Text></View>
          <View style={s.row}><Text style={s.label}>Surface</Text><Text style={s.value}>{data.surface} m²</Text></View>
        </View>

        {/* Synthèse des valeurs */}
        <View>
          <Text style={s.sectionTitle}>2. Synthèse des méthodes</Text>
          <View style={s.grid}>
            {data.valeurComparaison !== undefined && data.valeurComparaison > 0 && (
              <View style={s.gridCell}>
                <Text style={s.gridLabel}>Comparaison</Text>
                <Text style={s.gridValue}>{formatEUR(data.valeurComparaison)}</Text>
              </View>
            )}
            {data.valeurCapitalisation !== undefined && data.valeurCapitalisation > 0 && (
              <View style={s.gridCell}>
                <Text style={s.gridLabel}>Capitalisation</Text>
                <Text style={s.gridValue}>{formatEUR(data.valeurCapitalisation)}</Text>
              </View>
            )}
            {data.valeurDCF !== undefined && data.valeurDCF > 0 && (
              <View style={s.gridCell}>
                <Text style={s.gridLabel}>DCF</Text>
                <Text style={s.gridValue}>{formatEUR(data.valeurDCF)}</Text>
              </View>
            )}
          </View>
          {data.valeurReconciliee !== undefined && data.valeurReconciliee > 0 && (
            <View style={s.rowHighlight}>
              <Text style={{ ...s.label, fontFamily: "Helvetica-Bold" }}>Valeur réconciliée</Text>
              <Text style={s.valueLarge}>{formatEUR(data.valeurReconciliee)}</Text>
            </View>
          )}
        </View>

        {/* Capitalisation */}
        {data.noi !== undefined && (
          <View>
            <Text style={s.sectionTitle}>3. Capitalisation directe</Text>
            <View style={s.row}><Text style={s.label}>Résultat net d'exploitation (NOI)</Text><Text style={s.value}>{formatEUR(data.noi)}</Text></View>
            {data.tauxCap !== undefined && <View style={s.row}><Text style={s.label}>Taux de capitalisation</Text><Text style={s.value}>{data.tauxCap.toFixed(2)}%</Text></View>}
            {data.rendementInitial !== undefined && <View style={s.row}><Text style={s.label}>Rendement initial</Text><Text style={s.value}>{(data.rendementInitial * 100).toFixed(2)}%</Text></View>}
            {data.rendementReversionnaire !== undefined && <View style={s.row}><Text style={s.label}>Rendement réversionnaire (ERV)</Text><Text style={s.value}>{(data.rendementReversionnaire * 100).toFixed(2)}%</Text></View>}
            {data.sensibiliteCap && (
              <View style={s.table}>
                <Text style={{ ...s.note, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>Analyse de sensibilité</Text>
                <View style={s.tableHeader}>
                  <Text style={s.tableCellBold}>Taux cap.</Text>
                  <Text style={{ ...s.tableCellBold, textAlign: "right" as const }}>Valeur</Text>
                </View>
                {data.sensibiliteCap.map((row) => (
                  <View key={row.tauxCap} style={s.tableRow}>
                    <Text style={s.tableCell}>{row.tauxCap.toFixed(2)}%</Text>
                    <Text style={s.tableCellRight}>{formatEUR(row.valeur)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* DCF */}
        {data.irr !== undefined && (
          <View>
            <Text style={s.sectionTitle}>4. Actualisation des flux futurs (DCF)</Text>
            <View style={s.row}><Text style={s.label}>Taux d'actualisation</Text><Text style={s.value}>{data.tauxActualisation?.toFixed(2)}%</Text></View>
            <View style={s.row}><Text style={s.label}>Taux de sortie</Text><Text style={s.value}>{data.tauxCapSortie?.toFixed(2)}%</Text></View>
            <View style={s.rowHighlight}><Text style={{ ...s.label, fontFamily: "Helvetica-Bold" }}>TRI (IRR)</Text><Text style={s.valueLarge}>{(data.irr * 100).toFixed(2)}%</Text></View>
            {data.sensibiliteDCF && (
              <View style={s.table}>
                <Text style={{ ...s.note, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>Matrice de sensibilité (Actualisation × Sortie)</Text>
                <View style={s.tableHeader}>
                  <Text style={s.tableCellBold}>Actu.</Text>
                  <Text style={s.tableCellBold}>Sortie</Text>
                  <Text style={{ ...s.tableCellBold, textAlign: "right" as const }}>Valeur</Text>
                </View>
                {data.sensibiliteDCF.map((row, i) => (
                  <View key={i} style={s.tableRow}>
                    <Text style={s.tableCell}>{row.tauxActu.toFixed(1)}%</Text>
                    <Text style={s.tableCell}>{row.tauxCapSortie.toFixed(1)}%</Text>
                    <Text style={s.tableCellRight}>{formatEUR(row.valeur)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* MLV */}
        {data.mlv !== undefined && data.mlv > 0 && (
          <View>
            <Text style={s.sectionTitle}>5. Valeur hypothécaire (MLV)</Text>
            <View style={s.rowHighlight}><Text style={{ ...s.label, fontFamily: "Helvetica-Bold" }}>Valeur hypothécaire</Text><Text style={s.valueLarge}>{formatEUR(data.mlv)}</Text></View>
            {data.ratioMLV !== undefined && <View style={s.row}><Text style={s.label}>Ratio MLV / Valeur de marché</Text><Text style={s.value}>{(data.ratioMLV * 100).toFixed(1)}%</Text></View>}
          </View>
        )}

        {/* Disclaimer */}
        <Text style={s.disclaimer}>
          Ce rapport est généré automatiquement par tevaxia.lu à titre informatif. Il ne constitue pas une expertise
          en évaluation immobilière au sens des European Valuation Standards (EVS 2025) ni de la Charte de l'expertise.
          Les résultats dépendent des paramètres saisis par l'utilisateur et des données de marché disponibles.
          Pour une évaluation officielle, consultez un évaluateur certifié TEGOVA (REV/TRV).
        </Text>

        <Text style={s.footer}>tevaxia.lu — Outils immobiliers Luxembourg — {data.dateRapport}</Text>
      </Page>
    </Document>
  );
}

export async function generateReport(data: ReportData): Promise<Blob> {
  const blob = await pdf(<ReportDocument data={data} />).toBlob();
  return blob;
}

export function downloadReport(data: ReportData) {
  generateReport(data).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tevaxia-rapport-${data.dateRapport}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
