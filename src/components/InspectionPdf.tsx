"use client";

/**
 * Rapport d'inspection PDF conforme standards TEGOVA EVS 2025.
 * Structure : header référence + identité + status progression + sections
 * checklist avec statut OK/NC/NA par item + notes générales + page de
 * signature.
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InspectionData, CheckSection } from "@/app/inspection/client";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1f2937" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, borderBottom: "2 solid #1e3a5f", paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: "bold", color: "#1e3a5f" },
  subtitle: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  meta: { textAlign: "right", fontSize: 9 },
  metaLabel: { color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, fontSize: 7 },
  metaValue: { color: "#1e3a5f", fontWeight: "bold", marginBottom: 4 },

  identityBlock: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 4, marginBottom: 16 },
  row: { flexDirection: "row", marginBottom: 4 },
  rowLabel: { width: 90, fontSize: 8, color: "#6b7280" },
  rowValue: { flex: 1, fontSize: 9, color: "#1e3a5f" },

  progressRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  progressChip: { flex: 1, padding: 8, borderRadius: 4, textAlign: "center" },
  progressChipOk: { backgroundColor: "#d1fae5", color: "#065f46" },
  progressChipNc: { backgroundColor: "#fee2e2", color: "#991b1b" },
  progressChipNa: { backgroundColor: "#e5e7eb", color: "#374151" },
  progressChipPending: { backgroundColor: "#fef3c7", color: "#92400e" },
  progressValue: { fontSize: 14, fontWeight: "bold" },
  progressLabel: { fontSize: 7, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },

  sectionTitle: { fontSize: 11, fontWeight: "bold", color: "#1e3a5f", marginTop: 10, marginBottom: 6, borderBottom: "1 solid #e5e7eb", paddingBottom: 3 },
  itemRow: { flexDirection: "row", paddingVertical: 4, borderBottom: "0.5 solid #f3f4f6", gap: 6 },
  statusBadge: { width: 36, textAlign: "center", paddingVertical: 2, borderRadius: 2, fontSize: 7, fontWeight: "bold" },
  statusOk: { backgroundColor: "#10b981", color: "#fff" },
  statusNc: { backgroundColor: "#ef4444", color: "#fff" },
  statusNa: { backgroundColor: "#9ca3af", color: "#fff" },
  statusPending: { backgroundColor: "#fbbf24", color: "#78350f" },
  itemLabel: { flex: 1, fontSize: 9, color: "#1f2937" },
  itemNote: { fontSize: 8, fontStyle: "italic", color: "#6b7280", marginTop: 2, marginLeft: 42 },

  notesBlock: { marginTop: 14, padding: 10, backgroundColor: "#fefce8", borderRadius: 4, borderLeft: "3 solid #ca8a04" },
  notesTitle: { fontSize: 9, fontWeight: "bold", color: "#713f12", marginBottom: 4 },
  notesBody: { fontSize: 9, color: "#1f2937", lineHeight: 1.5 },

  signatureBlock: { marginTop: 30, flexDirection: "row", gap: 20 },
  signatureBox: { flex: 1, borderTop: "1 solid #1e3a5f", paddingTop: 4 },
  signatureLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
  signatureValue: { fontSize: 9, fontWeight: "bold", color: "#1e3a5f", marginTop: 2 },

  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 7, color: "#9ca3af", borderTop: "0.5 solid #e5e7eb", paddingTop: 6 },
});

const STATUS_STYLES: Record<string, [ReturnType<typeof StyleSheet.create>[string], string]> = {
  ok: [styles.statusOk, "OK"],
  nc: [styles.statusNc, "NC"],
  na: [styles.statusNa, "N/A"],
  pending: [styles.statusPending, "—"],
};

export interface InspectionReportInput {
  data: InspectionData;
  checklist: CheckSection[];
  translations: {
    title: string;
    subtitle: string;
    reference: string;
    address: string;
    inspector: string;
    date: string;
    timeRange: string;
    progress: {
      ok: string;
      nc: string;
      na: string;
      pending: string;
    };
    generalNotes: string;
    signatureInspector: string;
    signatureClient: string;
    footer: string;
    sectionTitles: Record<string, string>;
    itemLabels: Record<string, string>;
  };
}

export function InspectionDocument({ data, checklist, translations: t }: InspectionReportInput) {
  const counts = { ok: 0, nc: 0, na: 0, pending: 0 };
  for (const section of checklist) {
    for (const item of section.items) {
      const status = data.items[item.id]?.status ?? "pending";
      counts[status]++;
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>{t.reference}</Text>
            <Text style={styles.metaValue}>{data.id}</Text>
            <Text style={styles.metaLabel}>{t.date}</Text>
            <Text style={styles.metaValue}>{data.date}</Text>
          </View>
        </View>

        {/* Identité */}
        <View style={styles.identityBlock}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t.address}</Text>
            <Text style={styles.rowValue}>{data.address || "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t.inspector}</Text>
            <Text style={styles.rowValue}>{data.inspector || "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t.timeRange}</Text>
            <Text style={styles.rowValue}>
              {data.startTime || "—"} → {data.endTime || "—"}
            </Text>
          </View>
        </View>

        {/* Progression */}
        <View style={styles.progressRow}>
          <View style={[styles.progressChip, styles.progressChipOk]}>
            <Text style={styles.progressValue}>{counts.ok}</Text>
            <Text style={styles.progressLabel}>{t.progress.ok}</Text>
          </View>
          <View style={[styles.progressChip, styles.progressChipNc]}>
            <Text style={styles.progressValue}>{counts.nc}</Text>
            <Text style={styles.progressLabel}>{t.progress.nc}</Text>
          </View>
          <View style={[styles.progressChip, styles.progressChipNa]}>
            <Text style={styles.progressValue}>{counts.na}</Text>
            <Text style={styles.progressLabel}>{t.progress.na}</Text>
          </View>
          <View style={[styles.progressChip, styles.progressChipPending]}>
            <Text style={styles.progressValue}>{counts.pending}</Text>
            <Text style={styles.progressLabel}>{t.progress.pending}</Text>
          </View>
        </View>

        {/* Sections checklist */}
        {checklist.map((section) => (
          <View key={section.id} wrap={false}>
            <Text style={styles.sectionTitle}>{t.sectionTitles[section.titleKey] ?? section.titleKey}</Text>
            {section.items.map((item) => {
              const d = data.items[item.id];
              const status = d?.status ?? "pending";
              const [badgeStyle, badgeText] = STATUS_STYLES[status];
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={[styles.statusBadge, badgeStyle]}>
                    <Text>{badgeText}</Text>
                  </View>
                  <Text style={styles.itemLabel}>{t.itemLabels[item.labelKey] ?? item.labelKey}</Text>
                </View>
              );
            })}
            {section.items.filter((i) => data.items[i.id]?.note).map((item) => (
              <Text key={`${item.id}-note`} style={styles.itemNote}>
                {t.itemLabels[item.labelKey] ?? item.labelKey} : {data.items[item.id]?.note}
              </Text>
            ))}
          </View>
        ))}

        {/* Notes générales */}
        {data.generalNotes && (
          <View style={styles.notesBlock} wrap={false}>
            <Text style={styles.notesTitle}>{t.generalNotes}</Text>
            <Text style={styles.notesBody}>{data.generalNotes}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureBlock} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>{t.signatureInspector}</Text>
            <Text style={styles.signatureValue}>{data.inspector || "—"}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>{t.signatureClient}</Text>
            <Text style={styles.signatureValue}> </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{t.footer} · Réf. {data.id} · Généré par tevaxia.lu</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInspectionPdfBlob(input: InspectionReportInput): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<InspectionDocument {...input} />).toBlob();
}
