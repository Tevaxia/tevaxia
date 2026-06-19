"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface Props {
  coownership: {
    name: string;
    address?: string | null;
    commune?: string | null;
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
    owner_address?: string | null;
    tantiemes: number;
  };
  period: {
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
  };
  items: Array<{
    date: string;
    type: "call" | "payment" | "interest" | "penalty" | "adjustment";
    label: string;
    debit: number;  // ce que doit le coproprietaire
    credit: number; // ce qu'il a payé
  }>;
  summary: {
    total_debit: number;
    total_credit: number;
    balance: number; // positif = doit au syndic
    nb_unpaid: number;
    oldest_unpaid_date: string | null;
  };
}

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4, color: "#0B2447" },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    borderBottom: "1 solid #0B2447", paddingBottom: 8, marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#475569", marginBottom: 16 },
  h2: {
    fontSize: 10, fontWeight: "bold", textTransform: "uppercase",
    color: "#1B2A4A", marginTop: 14, marginBottom: 6,
    borderBottom: "0.5 solid #CBD5E1", paddingBottom: 3,
  },
  addressBlock: {
    marginTop: 10, marginBottom: 10, marginLeft: 240,
    padding: 8, borderLeft: "2 solid #0B2447", fontSize: 9,
  },
  row: { flexDirection: "row", paddingVertical: 2 },
  rowBorder: { flexDirection: "row", paddingVertical: 3, borderTop: "0.5 solid #CBD5E1", fontWeight: "bold" },
  label: { flex: 2, color: "#334155" },
  small: { flex: 0.8 },
  amount: { flex: 1, textAlign: "right", fontFamily: "Helvetica" },
  thead: {
    flexDirection: "row", paddingVertical: 4, borderBottom: "1 solid #0B2447",
    fontSize: 8, fontWeight: "bold", textTransform: "uppercase", color: "#475569",
  },
  tr: { flexDirection: "row", paddingVertical: 2, fontSize: 9 },
  trAlt: { flexDirection: "row", paddingVertical: 2, fontSize: 9, backgroundColor: "#F8FAFC" },
  balance: {
    marginTop: 12, padding: 10, borderRadius: 4, flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceDue: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  balanceOk: { backgroundColor: "#D1FAE5", color: "#065F46" },
  balanceLabel: { fontSize: 11, fontWeight: "bold" },
  balanceValue: { fontSize: 14, fontWeight: "bold" },
  footer: {
    position: "absolute", bottom: 20, left: 40, right: 40,
    fontSize: 7, color: "#94A3B8", textAlign: "center",
    borderTop: "0.5 solid #CBD5E1", paddingTop: 6,
  },
  note: {
    marginTop: 16, padding: 8, backgroundColor: "#EFF6FF",
    fontSize: 8, color: "#1E40AF",
  },
});

const fmtEUR = (n: number): string => {
  const rounded = Math.abs(n).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d,))/g, " ");
  return (n < 0 ? "-" : "") + rounded + " EUR";
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR");
};

const TYPE_LABELS: Record<Props["items"][number]["type"], string> = {
  call: "Appel de fonds",
  payment: "Paiement",
  interest: "Intérêts de retard",
  penalty: "Pénalité recouvrement",
  adjustment: "Régularisation",
};

export default function OwnerStatementPdf({ coownership, syndic, owner, period, items, summary }: Props) {
  const balanceStyle = summary.balance > 0 ? s.balanceDue : s.balanceOk;

  return (
    <Document title={`Relevé de compte — ${coownership.name} — lot ${owner.lot_number}`}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>{syndic.name}</Text>
            {syndic.address && <Text style={{ fontSize: 8, color: "#475569" }}>{syndic.address}</Text>}
            {(syndic.email || syndic.phone) && (
              <Text style={{ fontSize: 7, color: "#64748B" }}>
                {syndic.email}{syndic.email && syndic.phone ? " · " : ""}{syndic.phone}
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>{coownership.name}</Text>
            {coownership.address && <Text style={{ fontSize: 8, color: "#334155" }}>{coownership.address}</Text>}
            {coownership.commune && <Text style={{ fontSize: 8, color: "#334155" }}>{coownership.commune}</Text>}
          </View>
        </View>

        <Text style={s.title}>Relevé de compte copropriétaire</Text>
        <Text style={s.subtitle}>
          Période : {fmtDate(period.from)} au {fmtDate(period.to)}
        </Text>

        {/* Destinataire */}
        <View style={s.addressBlock}>
          <Text style={{ fontWeight: "bold" }}>{owner.owner_name ?? "Copropriétaire"}</Text>
          <Text>Lot n° {owner.lot_number} · {owner.tantiemes} tantièmes</Text>
          {owner.owner_address && <Text>{owner.owner_address}</Text>}
        </View>

        {/* Détail mouvements */}
        <Text style={s.h2}>Détail des mouvements</Text>
        <View style={s.thead}>
          <Text style={s.small}>Date</Text>
          <Text style={[s.small, { flex: 1 }]}>Type</Text>
          <Text style={s.label}>Libellé</Text>
          <Text style={[s.amount]}>Débit</Text>
          <Text style={[s.amount]}>Crédit</Text>
          <Text style={[s.amount]}>Solde</Text>
        </View>
        {items.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#94A3B8", marginTop: 20, fontSize: 9 }}>
            Aucun mouvement sur la période.
          </Text>
        ) : (
          (() => {
            let running = 0;
            return items.map((it, i) => {
              running += it.debit - it.credit;
              return (
                <View key={i} style={i % 2 === 0 ? s.tr : s.trAlt}>
                  <Text style={s.small}>{fmtDate(it.date)}</Text>
                  <Text style={[s.small, { flex: 1, fontSize: 8 }]}>{TYPE_LABELS[it.type]}</Text>
                  <Text style={s.label}>{it.label}</Text>
                  <Text style={s.amount}>{it.debit > 0 ? fmtEUR(it.debit) : "—"}</Text>
                  <Text style={s.amount}>{it.credit > 0 ? fmtEUR(it.credit) : "—"}</Text>
                  <Text style={[s.amount, { fontWeight: "bold", color: running > 0 ? "#B91C1C" : "#065F46" }]}>
                    {fmtEUR(running)}
                  </Text>
                </View>
              );
            });
          })()
        )}

        {/* Totaux */}
        <View style={s.rowBorder}>
          <Text style={s.small}></Text>
          <Text style={[s.small, { flex: 1 }]}></Text>
          <Text style={s.label}>Totaux</Text>
          <Text style={s.amount}>{fmtEUR(summary.total_debit)}</Text>
          <Text style={s.amount}>{fmtEUR(summary.total_credit)}</Text>
          <Text style={s.amount}></Text>
        </View>

        {/* Solde */}
        <View style={[s.balance, balanceStyle]}>
          <Text style={s.balanceLabel}>
            {summary.balance > 0 ? "Solde dû au syndicat" : summary.balance < 0 ? "Solde en votre faveur" : "Compte à jour"}
          </Text>
          <Text style={s.balanceValue}>{fmtEUR(Math.abs(summary.balance))}</Text>
        </View>

        {summary.balance > 0 && (
          <View style={s.note}>
            <Text>
              Pour régler le solde dû, effectuez un virement à l&apos;ordre du syndicat en
              utilisant la référence bancaire communiquée avec chaque appel de fonds.
              {summary.oldest_unpaid_date && (
                ` L'appel impayé le plus ancien date du ${fmtDate(summary.oldest_unpaid_date)}.`
              )}
              {summary.nb_unpaid > 0 && ` Nombre d'appels impayés : ${summary.nb_unpaid}.`}
            </Text>
          </View>
        )}

        <Text style={s.footer} fixed>
          Relevé généré le {new Date().toLocaleString("fr-FR")} par {syndic.name}
          · Document à valeur informative (à faire confirmer par le syndic en cas de contestation)
        </Text>
      </Page>
    </Document>
  );
}
