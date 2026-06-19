"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Assembly, Resolution, MajorityType } from "@/lib/coownership-assemblies";

interface Props {
  coownership: {
    name: string;
    address: string | null;
    commune: string | null;
  };
  syndic: {
    name: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  assembly: Assembly;
  resolutions: Resolution[];
  recipient?: {
    owner_name: string | null;
    owner_address: string | null;
    lot_number: string;
    tantiemes: number;
  };
}

const MAJORITY_SHORT: Record<MajorityType, string> = {
  simple: "Majorité simple",
  absolute: "Majorité absolue",
  double: "Double majorité (2/3)",
  unanimity: "Unanimité",
};

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4, color: "#0B2447" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingBottom: 10, borderBottom: "1 solid #0B2447" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#475569", marginBottom: 16 },
  h2: { fontSize: 11, fontWeight: "bold", marginTop: 12, marginBottom: 6, color: "#1B2A4A", textTransform: "uppercase" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  label: { color: "#334155", width: "35%" },
  value: { fontWeight: "bold", color: "#0B2447", width: "65%" },
  highlight: { backgroundColor: "#EFF6FF", padding: 12, borderRadius: 4, marginVertical: 8 },
  resolutionBox: { border: "1 solid #E5E7EB", borderRadius: 4, padding: 10, marginBottom: 8 },
  resolutionNum: { fontSize: 11, fontWeight: "bold", color: "#1E40AF" },
  resolutionTitle: { fontSize: 10, fontWeight: "bold", marginTop: 2 },
  resolutionDesc: { fontSize: 9, color: "#475569", marginTop: 4 },
  majorityTag: { fontSize: 8, color: "#475569", marginTop: 4, fontStyle: "italic" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#6B7280", textAlign: "center" },
  legalBox: { backgroundColor: "#FFF7ED", padding: 10, borderRadius: 4, marginTop: 16, fontSize: 8, color: "#7C2D12" },
});

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function ConvocationPdf({ coownership, syndic, assembly, resolutions, recipient }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: "bold" }}>{syndic.name}</Text>
            {syndic.address && <Text style={{ fontSize: 9, color: "#334155" }}>{syndic.address}</Text>}
            {syndic.email && <Text style={{ fontSize: 9, color: "#334155" }}>{syndic.email}</Text>}
            {syndic.phone && <Text style={{ fontSize: 9, color: "#334155" }}>{syndic.phone}</Text>}
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={{ fontSize: 9, color: "#334155" }}>Émis le {new Date().toLocaleDateString("fr-FR")}</Text>
          </View>
        </View>

        <Text style={s.title}>Convocation — {assembly.assembly_type === "ordinary" ? "Assemblée générale ordinaire" : "Assemblée générale extraordinaire"}</Text>
        <Text style={s.subtitle}>Copropriété {coownership.name}</Text>

        {recipient && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 9, color: "#334155" }}>Destinataire :</Text>
            <Text style={{ fontSize: 10, fontWeight: "bold" }}>{recipient.owner_name ?? "Copropriétaire"}</Text>
            {recipient.owner_address && <Text style={{ fontSize: 9 }}>{recipient.owner_address}</Text>}
            <Text style={{ fontSize: 9, marginTop: 2, color: "#475569" }}>
              Lot {recipient.lot_number} · {recipient.tantiemes} tantièmes
            </Text>
          </View>
        )}

        <View style={s.highlight}>
          <View style={s.row}>
            <Text style={s.label}>Date &amp; heure</Text>
            <Text style={s.value}>{fmtDateTime(assembly.scheduled_at)}</Text>
          </View>
          {assembly.location && (
            <View style={s.row}>
              <Text style={s.label}>Lieu</Text>
              <Text style={s.value}>{assembly.location}</Text>
            </View>
          )}
          {assembly.virtual_url && (
            <View style={s.row}>
              <Text style={s.label}>Participation à distance</Text>
              <Text style={s.value}>{assembly.virtual_url}</Text>
            </View>
          )}
          <View style={s.row}>
            <Text style={s.label}>Quorum requis</Text>
            <Text style={s.value}>{assembly.quorum_pct} % des tantièmes</Text>
          </View>
        </View>

        <Text style={s.h2}>Ordre du jour</Text>
        {resolutions.length === 0 ? (
          <Text style={{ fontSize: 9, color: "#475569", fontStyle: "italic" }}>Aucune résolution inscrite à l&apos;ordre du jour.</Text>
        ) : (
          resolutions.map((r) => (
            <View key={r.id} style={s.resolutionBox} wrap={false}>
              <Text style={s.resolutionNum}>Résolution n° {r.number}</Text>
              <Text style={s.resolutionTitle}>{r.title}</Text>
              {r.description && <Text style={s.resolutionDesc}>{r.description}</Text>}
              <Text style={s.majorityTag}>Majorité requise : {MAJORITY_SHORT[r.majority_type]}</Text>
            </View>
          ))
        )}

        {assembly.notes && (
          <View style={{ marginTop: 12 }}>
            <Text style={s.h2}>Notes complémentaires</Text>
            <Text style={{ fontSize: 9, color: "#334155" }}>{assembly.notes}</Text>
          </View>
        )}

        <View style={s.legalBox}>
          <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Cadre légal</Text>
          <Text>
            Convocation conforme à la loi du 16 mai 1975 portant statut de la copropriété des immeubles bâtis.
            Le copropriétaire empêché peut donner mandat écrit à un autre copropriétaire ou à un tiers pour voter
            en son nom. Les résolutions adoptées obligent l&apos;ensemble des copropriétaires, présents ou absents.
          </Text>
        </View>

        <Text style={s.footer}>
          {syndic.name} — Convocation générée automatiquement · Document non signé (envoi numérique)
        </Text>
      </Page>
    </Document>
  );
}
