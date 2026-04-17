"use client";

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

export interface KlimabonusDossierLigne {
  label: string;
  coutTravaux: number;
  klimabonus: number;
  bonusEco: number;
}

export interface KlimabonusDossierProps {
  lignes: KlimabonusDossierLigne[];
  totalTravaux: number;
  totalKlima: number;
  totalBonusEco: number;
  topupSocial: boolean;
  adresse?: string;
  labels: {
    title: string;
    subtitle: string;
    dateLabel: string;
    applicantTitle: string;
    applicantName: string;
    applicantNif: string;
    applicantAddress: string;
    applicantEmail: string;
    applicantPhone: string;
    workTitle: string;
    propertyAddress: string;
    propertyArea: string;
    propertyYear: string;
    propertyCpe: string;
    measuresTitle: string;
    colMeasure: string;
    colCost: string;
    colSubsidy: string;
    colBonusEco: string;
    totalLabel: string;
    bonusEcoLabel: string;
    socialTopup: string;
    socialTopupActive: string;
    checklistTitle: string;
    checklistIntro: string;
    checklist: string[];
    nextSteps: string;
    nextStepsBody: string;
    disclaimer: string;
    footer: string;
  };
}

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", lineHeight: 1.4, color: "#0B2447" },
  header: { marginBottom: 16, paddingBottom: 10, borderBottom: "2 solid #0B2447" },
  title: { fontSize: 16, fontWeight: "bold", color: "#0B2447" },
  subtitle: { fontSize: 10, color: "#334155", marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: "#0B2447", marginTop: 12, marginBottom: 4, textTransform: "uppercase", borderBottom: "1 solid #CBD5E1", paddingBottom: 2 },
  row: { flexDirection: "row", marginBottom: 2 },
  labelCol: { width: "40%", color: "#64748B" },
  valueCol: { width: "60%", fontWeight: "bold" },
  blank: { borderBottom: "1 solid #CBD5E1", width: "60%" },
  table: { marginTop: 6 },
  th: { flexDirection: "row", backgroundColor: "#F1F5F9", paddingVertical: 4, paddingHorizontal: 3, fontWeight: "bold", fontSize: 8 },
  tr: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 3, borderBottom: "0.5 solid #E2E8F0", fontSize: 9 },
  trTotal: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 3, borderTop: "1 solid #0B2447", fontWeight: "bold", backgroundColor: "#ECFDF5" },
  colM: { width: "40%" },
  colC: { width: "22%", textAlign: "right" },
  colS: { width: "22%", textAlign: "right", color: "#047857" },
  colB: { width: "16%", textAlign: "right", color: "#065F46" },
  checklistItem: { flexDirection: "row", marginBottom: 3, fontSize: 9 },
  checkbox: { width: 10, height: 10, border: "1 solid #0B2447", marginRight: 6, marginTop: 1 },
  disclaimer: { marginTop: 16, padding: 8, backgroundColor: "#FEF3C7", borderRadius: 3, fontSize: 8, color: "#78350F" },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, textAlign: "center", fontSize: 7, color: "#94A3B8" },
});

const fmtEUR = (n: number) => Math.round(n).toLocaleString("fr-LU") + " €";

export default function KlimabonusDossierPdf(props: KlimabonusDossierProps) {
  const { lignes, totalTravaux, totalKlima, totalBonusEco, topupSocial, adresse, labels } = props;
  const resteACharge = totalTravaux - totalKlima;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>{labels.title}</Text>
          <Text style={s.subtitle}>{labels.subtitle}</Text>
          <Text style={{ fontSize: 8, color: "#94A3B8", marginTop: 3 }}>
            {labels.dateLabel} : {new Date().toLocaleDateString("fr-LU", { day: "2-digit", month: "long", year: "numeric" })}
          </Text>
        </View>

        {/* Demandeur */}
        <Text style={s.sectionTitle}>{labels.applicantTitle}</Text>
        <View style={s.row}><Text style={s.labelCol}>{labels.applicantName}</Text><Text style={s.blank}> </Text></View>
        <View style={s.row}><Text style={s.labelCol}>{labels.applicantNif}</Text><Text style={s.blank}> </Text></View>
        <View style={s.row}><Text style={s.labelCol}>{labels.applicantAddress}</Text><Text style={s.blank}> </Text></View>
        <View style={s.row}><Text style={s.labelCol}>{labels.applicantEmail}</Text><Text style={s.blank}> </Text></View>
        <View style={s.row}><Text style={s.labelCol}>{labels.applicantPhone}</Text><Text style={s.blank}> </Text></View>

        {/* Bien concerné */}
        <Text style={s.sectionTitle}>{labels.workTitle}</Text>
        <View style={s.row}>
          <Text style={s.labelCol}>{labels.propertyAddress}</Text>
          {adresse ? <Text style={s.valueCol}>{adresse}</Text> : <Text style={s.blank}> </Text>}
        </View>
        <View style={s.row}><Text style={s.labelCol}>{labels.propertyArea}</Text><Text style={s.blank}> </Text></View>
        <View style={s.row}><Text style={s.labelCol}>{labels.propertyYear}</Text><Text style={s.blank}> </Text></View>
        <View style={s.row}><Text style={s.labelCol}>{labels.propertyCpe}</Text><Text style={s.blank}> </Text></View>

        {/* Mesures + montants */}
        <Text style={s.sectionTitle}>{labels.measuresTitle}</Text>
        {topupSocial && (
          <Text style={{ fontSize: 8, color: "#047857", marginBottom: 4 }}>
            ★ {labels.socialTopupActive}
          </Text>
        )}
        <View style={s.table}>
          <View style={s.th}>
            <Text style={s.colM}>{labels.colMeasure}</Text>
            <Text style={s.colC}>{labels.colCost}</Text>
            <Text style={s.colS}>{labels.colSubsidy}</Text>
            <Text style={s.colB}>{labels.colBonusEco}</Text>
          </View>
          {lignes.map((l, i) => (
            <View key={i} style={s.tr}>
              <Text style={s.colM}>{l.label}</Text>
              <Text style={s.colC}>{fmtEUR(l.coutTravaux)}</Text>
              <Text style={s.colS}>{fmtEUR(l.klimabonus - l.bonusEco)}</Text>
              <Text style={s.colB}>{l.bonusEco > 0 ? fmtEUR(l.bonusEco) : "—"}</Text>
            </View>
          ))}
          <View style={s.trTotal}>
            <Text style={s.colM}>{labels.totalLabel}</Text>
            <Text style={s.colC}>{fmtEUR(totalTravaux)}</Text>
            <Text style={s.colS}>{fmtEUR(totalKlima)}</Text>
            <Text style={s.colB}>{totalBonusEco > 0 ? fmtEUR(totalBonusEco) : "—"}</Text>
          </View>
        </View>
        <View style={{ marginTop: 6, flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
          <Text style={{ fontSize: 9, color: "#64748B" }}>Reste à charge estimé : </Text>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0B2447" }}>{fmtEUR(resteACharge)}</Text>
        </View>

        {/* Checklist documents */}
        <Text style={s.sectionTitle}>{labels.checklistTitle}</Text>
        <Text style={{ fontSize: 8, color: "#64748B", marginBottom: 4 }}>{labels.checklistIntro}</Text>
        {labels.checklist.map((item, i) => (
          <View key={i} style={s.checklistItem}>
            <View style={s.checkbox} />
            <Text style={{ flex: 1 }}>{item}</Text>
          </View>
        ))}

        {/* Next steps */}
        <Text style={s.sectionTitle}>{labels.nextSteps}</Text>
        <Text style={{ fontSize: 9 }}>{labels.nextStepsBody}</Text>

        {/* Disclaimer */}
        <View style={s.disclaimer}>
          <Text>{labels.disclaimer}</Text>
        </View>

        <Text style={s.footer}>{labels.footer}</Text>
      </Page>
    </Document>
  );
}

export async function generateKlimabonusDossierPdfBlob(props: KlimabonusDossierProps): Promise<Blob> {
  return pdf(<KlimabonusDossierPdf {...props} />).toBlob();
}
