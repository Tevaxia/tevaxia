"use client";

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

export interface ProcurationProps {
  coownershipName: string;
  coownershipAddress?: string;
  unitLabel?: string;
  unitTantiemes?: number;
  ownerName: string;
  ownerAddress?: string;
  mandataireName: string;
  mandataireAddress?: string;
  assemblyDate: string; // YYYY-MM-DD
  assemblyType: string; // "ordinaire", "extraordinaire"
  assemblyLocation: string;
  issuedDate: string;
}

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.5, color: "#0B2447" },
  header: { marginBottom: 20, paddingBottom: 10, borderBottom: "2 solid #0B2447" },
  title: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 10, textAlign: "center", color: "#64748B" },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 6, textTransform: "uppercase", color: "#1B2A4A" },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: "35%", color: "#64748B" },
  value: { width: "65%", fontWeight: "bold" },
  blank: { borderBottom: "1 solid #CBD5E1", width: "65%", minHeight: 12 },
  body: { marginTop: 16, marginBottom: 16, lineHeight: 1.6 },
  bold: { fontWeight: "bold" },
  signatureBox: { marginTop: 40, flexDirection: "row", justifyContent: "space-between" },
  signatureLine: { width: "45%" },
  signatureLabel: { fontSize: 9, color: "#64748B", marginBottom: 30 },
  signatureValue: { borderTop: "1 solid #0B2447", paddingTop: 4, fontSize: 9 },
  footer: { position: "absolute", bottom: 30, left: 48, right: 48, textAlign: "center", fontSize: 7, color: "#94A3B8", borderTop: "0.5 solid #CBD5E1", paddingTop: 6 },
  legal: { marginTop: 16, padding: 10, backgroundColor: "#F1F5F9", fontSize: 8, color: "#64748B" },
});

export default function ProcurationPdf(p: ProcurationProps) {
  const assemblyDateFormatted = new Date(p.assemblyDate).toLocaleDateString("fr-FR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
  const issuedDateFormatted = new Date(p.issuedDate).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>Procuration pour assemblée générale de copropriété</Text>
          <Text style={s.subtitle}>
            Conforme à la loi modifiée du 16 mai 1975 (articles 7 et 11) — Luxembourg
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Mandant (copropriétaire)</Text>
          <View style={s.row}>
            <Text style={s.label}>Nom, prénom</Text>
            <Text style={s.value}>{p.ownerName}</Text>
          </View>
          {p.ownerAddress && (
            <View style={s.row}>
              <Text style={s.label}>Adresse</Text>
              <Text style={s.value}>{p.ownerAddress}</Text>
            </View>
          )}
          <View style={s.row}>
            <Text style={s.label}>Lot</Text>
            {p.unitLabel ? <Text style={s.value}>{p.unitLabel}</Text> : <View style={s.blank} />}
          </View>
          <View style={s.row}>
            <Text style={s.label}>Tantièmes</Text>
            {p.unitTantiemes ? <Text style={s.value}>{p.unitTantiemes.toLocaleString("fr-FR")} millièmes</Text> : <View style={s.blank} />}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Mandataire (représentant)</Text>
          <View style={s.row}>
            <Text style={s.label}>Nom, prénom</Text>
            <Text style={s.value}>{p.mandataireName}</Text>
          </View>
          {p.mandataireAddress && (
            <View style={s.row}>
              <Text style={s.label}>Adresse</Text>
              <Text style={s.value}>{p.mandataireAddress}</Text>
            </View>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Copropriété concernée</Text>
          <View style={s.row}>
            <Text style={s.label}>Nom / référence</Text>
            <Text style={s.value}>{p.coownershipName}</Text>
          </View>
          {p.coownershipAddress && (
            <View style={s.row}>
              <Text style={s.label}>Adresse</Text>
              <Text style={s.value}>{p.coownershipAddress}</Text>
            </View>
          )}
        </View>

        <View style={s.body}>
          <Text>
            Je soussigné(e) <Text style={s.bold}>{p.ownerName}</Text>, en ma qualité de
            copropriétaire de la copropriété <Text style={s.bold}>{p.coownershipName}</Text>,
            donne par la présente procuration à <Text style={s.bold}>{p.mandataireName}</Text>
            {" "}pour me représenter et voter en mon nom lors de l&apos;assemblée générale{" "}
            <Text style={s.bold}>{p.assemblyType}</Text> qui se tiendra le{" "}
            <Text style={s.bold}>{assemblyDateFormatted}</Text> à{" "}
            <Text style={s.bold}>{p.assemblyLocation}</Text>.
          </Text>
          <Text style={{ marginTop: 10 }}>
            Le mandataire pourra délibérer et voter sur tous les points inscrits à l&apos;ordre
            du jour de cette assemblée, dans les mêmes conditions que si j&apos;étais présent(e).
          </Text>
          <Text style={{ marginTop: 10 }}>
            La présente procuration est donnée exclusivement pour cette assemblée. Elle prendra
            fin à l&apos;issue de ladite assemblée.
          </Text>
        </View>

        <View style={s.signatureBox}>
          <View style={s.signatureLine}>
            <Text style={s.signatureLabel}>Fait à ________________, le {issuedDateFormatted}</Text>
            <Text style={s.signatureValue}>Signature du mandant (préciser &quot;bon pour pouvoir&quot;)</Text>
          </View>
          <View style={s.signatureLine}>
            <Text style={s.signatureLabel}>Acceptation du mandataire</Text>
            <Text style={s.signatureValue}>Signature du mandataire</Text>
          </View>
        </View>

        <View style={s.legal}>
          <Text style={{ fontWeight: "bold", marginBottom: 3 }}>Cadre légal :</Text>
          <Text>
            Loi modifiée du 16 mai 1975 portant statut de la copropriété des immeubles bâtis,
            articles 7 et 11. Selon l&apos;article 11, un copropriétaire peut donner procuration
            à toute personne de son choix (autre que le syndic lui-même sauf autorisation
            expresse). Un mandataire ne peut représenter qu&apos;un nombre limité de tantièmes
            défini par le règlement de copropriété (généralement 5 %).
          </Text>
        </View>

        <Text style={s.footer}>
          Document généré via tevaxia.lu · Modèle indicatif · Vérifiez avec votre syndic les exigences particulières de votre règlement de copropriété
        </Text>
      </Page>
    </Document>
  );
}

export async function generateProcurationPdfBlob(props: ProcurationProps): Promise<Blob> {
  return pdf(<ProcurationPdf {...props} />).toBlob();
}
