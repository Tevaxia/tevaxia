"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Assembly, Resolution, AssemblyVote, MajorityType } from "@/lib/coownership-assemblies";

interface Props {
  coownership: {
    name: string;
    address: string | null;
    total_tantiemes: number;
  };
  syndic: {
    name: string;
    email?: string | null;
  };
  assembly: Assembly;
  resolutions: Resolution[];
  votesByResolution: Record<string, AssemblyVote[]>;
}

const MAJORITY_SHORT: Record<MajorityType, string> = {
  simple: "Majorité simple",
  absolute: "Majorité absolue",
  double: "Double majorité (2/3)",
  unanimity: "Unanimité",
};

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4, color: "#0B2447" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18, paddingBottom: 10, borderBottom: "1 solid #0B2447" },
  title: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#475569", marginBottom: 12 },
  h2: { fontSize: 11, fontWeight: "bold", marginTop: 12, marginBottom: 6, color: "#1B2A4A", textTransform: "uppercase" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  label: { color: "#334155", width: "45%" },
  value: { fontWeight: "bold", color: "#0B2447", width: "55%" },
  resolutionBox: { border: "1 solid #E5E7EB", borderRadius: 4, padding: 10, marginBottom: 10 },
  resolutionTitle: { fontSize: 11, fontWeight: "bold" },
  voteTable: { marginTop: 6 },
  voteRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 9, paddingVertical: 1 },
  approved: { color: "#047857", fontWeight: "bold" },
  rejected: { color: "#B91C1C", fontWeight: "bold" },
  pending: { color: "#B45309", fontWeight: "bold" },
  tally: { flexDirection: "row", gap: 12, marginTop: 4, fontSize: 9 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#6B7280", textAlign: "center" },
});

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtPct = (num: number, total: number) => total > 0 ? `${((num / total) * 100).toFixed(1)} %` : "0 %";

export default function AssemblyMinutesPdf({ coownership, syndic, assembly, resolutions, votesByResolution }: Props) {
  const firstRes = resolutions[0];
  const expressedTantiemes = firstRes
    ? firstRes.votes_yes_tantiemes + firstRes.votes_no_tantiemes + firstRes.votes_abstain_tantiemes
    : 0;
  const attendancePct = coownership.total_tantiemes > 0 ? (expressedTantiemes / coownership.total_tantiemes) * 100 : 0;
  const quorumOk = attendancePct >= assembly.quorum_pct;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: "bold" }}>{syndic.name}</Text>
            {syndic.email && <Text style={{ fontSize: 9, color: "#334155" }}>{syndic.email}</Text>}
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={{ fontSize: 9, color: "#334155" }}>PV établi le {new Date().toLocaleDateString("fr-FR")}</Text>
          </View>
        </View>

        <Text style={s.title}>Procès-verbal — {assembly.title}</Text>
        <Text style={s.subtitle}>Copropriété {coownership.name}</Text>

        <View style={{ marginBottom: 10 }}>
          <View style={s.row}><Text style={s.label}>Type</Text><Text style={s.value}>{assembly.assembly_type === "ordinary" ? "AG ordinaire" : "AG extraordinaire"}</Text></View>
          <View style={s.row}><Text style={s.label}>Date</Text><Text style={s.value}>{fmtDateTime(assembly.scheduled_at)}</Text></View>
          {assembly.location && <View style={s.row}><Text style={s.label}>Lieu</Text><Text style={s.value}>{assembly.location}</Text></View>}
          <View style={s.row}><Text style={s.label}>Tantièmes exprimés</Text><Text style={s.value}>{expressedTantiemes} / {coownership.total_tantiemes} ({attendancePct.toFixed(1)} %)</Text></View>
          <View style={s.row}>
            <Text style={s.label}>Quorum</Text>
            <Text style={[s.value, quorumOk ? s.approved : s.rejected]}>
              {assembly.quorum_pct} % requis — {quorumOk ? "Atteint" : "NON atteint"}
            </Text>
          </View>
        </View>

        <Text style={s.h2}>Résolutions soumises au vote</Text>
        {resolutions.map((r) => {
          const votes = votesByResolution[r.id] ?? [];
          const expressed = r.votes_yes_tantiemes + r.votes_no_tantiemes + r.votes_abstain_tantiemes;
          return (
            <View key={r.id} style={s.resolutionBox} wrap={false}>
              <Text style={s.resolutionTitle}>Résolution n° {r.number} — {r.title}</Text>
              {r.description && <Text style={{ fontSize: 9, color: "#475569", marginTop: 4 }}>{r.description}</Text>}
              <Text style={{ fontSize: 8, color: "#475569", marginTop: 4, fontStyle: "italic" }}>
                Majorité requise : {MAJORITY_SHORT[r.majority_type]}
              </Text>

              <View style={s.tally}>
                <Text>Pour : <Text style={s.approved}>{r.votes_yes_tantiemes}</Text> ({fmtPct(r.votes_yes_tantiemes, expressed)})</Text>
                <Text>Contre : <Text style={s.rejected}>{r.votes_no_tantiemes}</Text> ({fmtPct(r.votes_no_tantiemes, expressed)})</Text>
                <Text>Abstention : {r.votes_abstain_tantiemes}</Text>
                <Text>Absents : {r.votes_absent_tantiemes}</Text>
              </View>

              <Text style={{ fontSize: 10, marginTop: 6 }}>
                Résultat :{" "}
                <Text style={r.result === "approved" ? s.approved : r.result === "rejected" ? s.rejected : s.pending}>
                  {r.result === "approved" ? "ADOPTÉE" : r.result === "rejected" ? "REJETÉE" : "En attente"}
                </Text>
              </Text>

              {votes.length > 0 && votes.length <= 30 && (
                <View style={s.voteTable}>
                  <Text style={{ fontSize: 8, color: "#475569", marginTop: 6, marginBottom: 2 }}>Détail nominatif :</Text>
                  {votes.map((v) => (
                    <View key={v.id} style={s.voteRow}>
                      <Text>{v.voter_name ?? "Copropriétaire"}</Text>
                      <Text>{v.tantiemes_at_vote} tant. · {
                        v.vote === "yes" ? "Pour"
                        : v.vote === "no" ? "Contre"
                        : v.vote === "abstain" ? "Abstention"
                        : "Absent"
                      }</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {assembly.notes && (
          <View style={{ marginTop: 8 }}>
            <Text style={s.h2}>Notes</Text>
            <Text style={{ fontSize: 9, color: "#334155" }}>{assembly.notes}</Text>
          </View>
        )}

        <View style={{ marginTop: 16, flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ width: "45%", borderTop: "1 solid #334155", paddingTop: 4 }}>
            <Text style={{ fontSize: 9 }}>Le président de séance</Text>
          </View>
          <View style={{ width: "45%", borderTop: "1 solid #334155", paddingTop: 4 }}>
            <Text style={{ fontSize: 9 }}>Le secrétaire / Syndic</Text>
          </View>
        </View>

        <Text style={s.footer}>
          Procès-verbal établi selon la loi du 16 mai 1975 · {syndic.name}
        </Text>
      </Page>
    </Document>
  );
}
