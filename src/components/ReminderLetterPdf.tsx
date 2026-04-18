"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

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
  owner: {
    lot_number: string;
    owner_name: string | null;
    owner_address: string | null;
    owner_email: string | null;
  };
  reminder: {
    palier: 1 | 2 | 3;
    palier_label: string;
    call_label: string;
    due_date: string;
    days_late: number;
    amount_outstanding: number;
    late_interest: number;
    penalty: number;
    total_claimed: number;
    letter_body: string;
    sent_at: string;
    is_registered: boolean;
  };
}

const s = StyleSheet.create({
  page: { padding: 50, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5, color: "#0B2447" },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    borderBottom: "1 solid #0B2447", paddingBottom: 8, marginBottom: 20,
  },
  syndicBlock: { fontSize: 10 },
  syndicName: { fontSize: 11, fontWeight: "bold" },
  coprop: { fontSize: 10, color: "#334155", textAlign: "right" },
  addressBlock: {
    marginTop: 30, marginBottom: 30, marginLeft: 250,
    padding: 8, borderLeft: "2 solid #0B2447",
  },
  dateLine: { textAlign: "right", fontSize: 10, marginBottom: 20 },
  objectLine: {
    marginVertical: 16, padding: 8, backgroundColor: "#F8FAFC",
    borderLeft: "3 solid #0B2447", fontSize: 10,
  },
  objectLabel: { fontWeight: "bold", marginRight: 4 },
  palierBadge: {
    display: "flex", alignSelf: "flex-start", padding: 4,
    marginBottom: 10, fontSize: 9, fontWeight: "bold",
    textTransform: "uppercase", letterSpacing: 1,
  },
  palier1: { backgroundColor: "#DBEAFE", color: "#1E40AF" },
  palier2: { backgroundColor: "#FEF3C7", color: "#92400E" },
  palier3: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  body: { fontSize: 11, marginVertical: 12, whiteSpace: "pre-wrap" },
  table: {
    marginTop: 12, marginBottom: 16,
    border: "0.5 solid #CBD5E1", borderRadius: 2,
  },
  tableRow: {
    flexDirection: "row", padding: 6,
    borderBottom: "0.5 solid #E2E8F0",
  },
  tableRowLast: { flexDirection: "row", padding: 6 },
  tableTotal: {
    flexDirection: "row", padding: 8, backgroundColor: "#EFF6FF",
    borderTop: "1 solid #0B2447", fontWeight: "bold", color: "#1E40AF",
  },
  tableLabel: { flex: 2 },
  tableAmount: { flex: 1, textAlign: "right", fontFamily: "Helvetica" },
  signature: {
    marginTop: 40, alignSelf: "flex-end", textAlign: "right",
    borderTop: "1 solid #64748B", paddingTop: 10, width: 180,
  },
  footer: {
    position: "absolute", bottom: 24, left: 50, right: 50,
    fontSize: 7, color: "#94A3B8", textAlign: "center",
    borderTop: "0.5 solid #CBD5E1", paddingTop: 6,
  },
  legal: {
    marginTop: 16, padding: 8, backgroundColor: "#FEF9C3",
    fontSize: 8, color: "#713F12",
  },
  registered: {
    position: "absolute", top: 50, right: 50,
    border: "1 solid #B91C1C", padding: 4,
    fontSize: 9, fontWeight: "bold", color: "#B91C1C",
  },
});

const fmtEUR = (n: number): string => {
  const rounded = Math.abs(n).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d,))/g, " ");
  return (n < 0 ? "-" : "") + rounded + " EUR";
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-LU", {
    year: "numeric", month: "long", day: "numeric",
  });
};

export default function ReminderLetterPdf({ coownership, syndic, owner, reminder }: Props) {
  const palierStyle = reminder.palier === 3 ? s.palier3 : reminder.palier === 2 ? s.palier2 : s.palier1;
  const hasSurcharges = reminder.late_interest > 0 || reminder.penalty > 0;

  return (
    <Document title={`Relance palier ${reminder.palier} — ${coownership.name} — lot ${owner.lot_number}`}>
      <Page size="A4" style={s.page}>
        {/* Mention recommandé si applicable */}
        {reminder.is_registered && (
          <Text style={s.registered}>RECOMMANDÉ AVEC A.R.</Text>
        )}

        {/* Header */}
        <View style={s.header}>
          <View style={s.syndicBlock}>
            <Text style={s.syndicName}>{syndic.name}</Text>
            {syndic.address && <Text>{syndic.address}</Text>}
            {syndic.email && <Text>{syndic.email}</Text>}
            {syndic.phone && <Text>{syndic.phone}</Text>}
          </View>
          <View style={s.coprop}>
            <Text style={{ fontWeight: "bold" }}>{coownership.name}</Text>
            {coownership.address && <Text>{coownership.address}</Text>}
            {coownership.commune && <Text>{coownership.commune}</Text>}
          </View>
        </View>

        {/* Destinataire */}
        <View style={s.addressBlock}>
          <Text style={{ fontWeight: "bold" }}>{owner.owner_name ?? "Copropriétaire"}</Text>
          <Text>Lot n° {owner.lot_number}</Text>
          {owner.owner_address && <Text>{owner.owner_address}</Text>}
        </View>

        <View style={s.dateLine}>
          <Text>
            {coownership.commune ?? "Luxembourg"}, le {fmtDate(reminder.sent_at)}
          </Text>
        </View>

        {/* Objet */}
        <View style={s.objectLine}>
          <Text>
            <Text style={s.objectLabel}>Objet :</Text>
            {reminder.palier_label} — impayé au titre de &laquo; {reminder.call_label} &raquo;
          </Text>
        </View>

        <View style={[s.palierBadge, palierStyle]}>
          <Text>Palier {reminder.palier} / 3</Text>
        </View>

        {/* Corps de la lettre */}
        <Text style={s.body}>{reminder.letter_body}</Text>

        {/* Récapitulatif montants */}
        <View style={s.table}>
          <View style={s.tableRow}>
            <Text style={s.tableLabel}>Montant dû au {fmtDate(reminder.due_date)}</Text>
            <Text style={s.tableAmount}>{fmtEUR(reminder.amount_outstanding)}</Text>
          </View>
          {reminder.late_interest > 0 && (
            <View style={s.tableRow}>
              <Text style={s.tableLabel}>
                Intérêts de retard ({reminder.days_late} jours)
              </Text>
              <Text style={s.tableAmount}>{fmtEUR(reminder.late_interest)}</Text>
            </View>
          )}
          {reminder.penalty > 0 && (
            <View style={s.tableRowLast}>
              <Text style={s.tableLabel}>Frais de recouvrement</Text>
              <Text style={s.tableAmount}>{fmtEUR(reminder.penalty)}</Text>
            </View>
          )}
          <View style={s.tableTotal}>
            <Text style={s.tableLabel}>TOTAL RÉCLAMÉ</Text>
            <Text style={s.tableAmount}>{fmtEUR(reminder.total_claimed)}</Text>
          </View>
        </View>

        {/* Signature */}
        <View style={s.signature}>
          <Text style={{ fontSize: 9 }}>Le syndic</Text>
          <Text style={{ fontSize: 11, fontWeight: "bold", marginTop: 2 }}>{syndic.name}</Text>
        </View>

        {/* Note légale selon palier */}
        {hasSurcharges && (
          <View style={s.legal}>
            <Text>
              Base légale : loi du 18 avril 2004 fixant le taux d&apos;intérêt légal, loi du 16 mai 1975
              portant statut de la copropriété des immeubles bâtis. Le présent courrier a valeur de mise
              en demeure au sens des articles 1153 et suivants du Code civil.
              {reminder.palier === 3 && (
                " En cas de non-paiement dans les huit (8) jours, le dossier sera transmis au conseil du syndicat " +
                "pour procédure en recouvrement devant le Juge de Paix territorialement compétent."
              )}
            </Text>
          </View>
        )}

        <Text style={s.footer} fixed>
          Lettre générée par {syndic.name} · Horodatage : {new Date(reminder.sent_at).toLocaleString("fr-LU")}
          · Preuve archivée (durée légale 30 ans / prescription action civile copropriété).
        </Text>
      </Page>
    </Document>
  );
}
