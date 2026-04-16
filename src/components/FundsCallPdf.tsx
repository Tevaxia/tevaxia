"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface Props {
  coownership: {
    name: string;
    address: string | null;
    commune: string | null;
    total_tantiemes: number;
  };
  syndic: {
    name: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    vat?: string | null;
  };
  call: {
    label: string;
    period_start: string;
    period_end: string;
    due_date: string;
    total_amount: number;
    bank_iban: string | null;
    bank_bic: string | null;
    bank_account_holder: string | null;
  };
  unit: {
    lot_number: string;
    unit_type: string;
    floor: number | null;
    surface_m2: number | null;
    tantiemes: number;
    owner_name: string | null;
    owner_address: string | null;
  };
  charge: {
    amount_due: number;
    payment_reference: string | null;
  };
}

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4, color: "#0B2447" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingBottom: 10, borderBottom: "1 solid #0B2447" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 16 },
  h2: { fontSize: 11, fontWeight: "bold", marginTop: 12, marginBottom: 6, color: "#1B2A4A", textTransform: "uppercase" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  label: { color: "#334155", width: "40%" },
  value: { fontWeight: "bold", color: "#0B2447", width: "60%" },
  highlight: { backgroundColor: "#EFF6FF", padding: 12, borderRadius: 4, marginVertical: 12 },
  highlightAmount: { fontSize: 20, fontWeight: "bold", color: "#1E40AF", textAlign: "center" },
  bankBox: { border: "1 solid #E5E7EB", padding: 10, marginTop: 8, borderRadius: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#6B7280", textAlign: "center" },
});

const fmtEUR = (n: number) => {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " EUR";
};

const fmtEUR2 = (n: number) => {
  return n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d,))/g, " ") + " EUR";
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-LU");
};

export default function FundsCallPdf({ coownership, syndic, call, unit, charge }: Props) {
  const tantiemePct = coownership.total_tantiemes > 0 ? (unit.tantiemes / coownership.total_tantiemes) * 100 : 0;

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
            <Text style={{ fontSize: 9, color: "#6B7280" }}>Émis le {new Date().toLocaleDateString("fr-LU")}</Text>
            <Text style={{ fontSize: 9, color: "#6B7280" }}>Échéance : {fmtDate(call.due_date)}</Text>
          </View>
        </View>

        <Text style={s.title}>Appel de fonds — {call.label}</Text>

        {/* Destinataire */}
        <View>
          <Text style={s.h2}>Destinataire</Text>
          <Text style={{ fontWeight: "bold" }}>{unit.owner_name || "—"}</Text>
          {unit.owner_address && <Text style={{ fontSize: 9 }}>{unit.owner_address}</Text>}
        </View>

        {/* Copropriété + Lot */}
        <View>
          <Text style={s.h2}>Copropriété &amp; lot</Text>
          <View style={s.row}><Text style={s.label}>Copropriété</Text><Text style={s.value}>{coownership.name}</Text></View>
          {coownership.address && <View style={s.row}><Text style={s.label}>Adresse</Text><Text style={s.value}>{coownership.address}</Text></View>}
          <View style={s.row}><Text style={s.label}>Lot</Text><Text style={s.value}>{unit.lot_number} ({unit.unit_type}{unit.floor !== null ? `, étage ${unit.floor}` : ""})</Text></View>
          {unit.surface_m2 && <View style={s.row}><Text style={s.label}>Surface</Text><Text style={s.value}>{unit.surface_m2} m²</Text></View>}
          <View style={s.row}>
            <Text style={s.label}>Tantièmes</Text>
            <Text style={s.value}>
              {unit.tantiemes.toLocaleString("fr-LU")} / {coownership.total_tantiemes.toLocaleString("fr-LU")} ({tantiemePct.toFixed(2)} %)
            </Text>
          </View>
        </View>

        {/* Détail du calcul */}
        <View>
          <Text style={s.h2}>Détail de l&apos;appel</Text>
          <View style={s.row}><Text style={s.label}>Libellé</Text><Text style={s.value}>{call.label}</Text></View>
          <View style={s.row}><Text style={s.label}>Période</Text><Text style={s.value}>du {fmtDate(call.period_start)} au {fmtDate(call.period_end)}</Text></View>
          <View style={s.row}><Text style={s.label}>Montant total (copropriété)</Text><Text style={s.value}>{fmtEUR(call.total_amount)}</Text></View>
          <View style={s.row}><Text style={s.label}>Votre quote-part</Text><Text style={s.value}>{tantiemePct.toFixed(4)} %</Text></View>
        </View>

        {/* Montant à payer */}
        <View style={s.highlight}>
          <Text style={{ fontSize: 9, color: "#1E40AF", textAlign: "center", marginBottom: 4 }}>
            Montant dû à payer au plus tard le {fmtDate(call.due_date)}
          </Text>
          <Text style={s.highlightAmount}>{fmtEUR2(charge.amount_due)}</Text>
        </View>

        {/* Coordonnées bancaires */}
        {(call.bank_iban || call.bank_bic || call.bank_account_holder) && (
          <View>
            <Text style={s.h2}>Coordonnées bancaires</Text>
            <View style={s.bankBox}>
              {call.bank_account_holder && <View style={s.row}><Text style={s.label}>Titulaire</Text><Text style={s.value}>{call.bank_account_holder}</Text></View>}
              {call.bank_iban && <View style={s.row}><Text style={s.label}>IBAN</Text><Text style={s.value}>{call.bank_iban}</Text></View>}
              {call.bank_bic && <View style={s.row}><Text style={s.label}>BIC/SWIFT</Text><Text style={s.value}>{call.bank_bic}</Text></View>}
              {charge.payment_reference && (
                <View style={{ ...s.row, marginTop: 4 }}>
                  <Text style={s.label}>Communication</Text>
                  <Text style={{ ...s.value, color: "#DC2626", fontWeight: "bold" }}>{charge.payment_reference}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Mentions */}
        <Text style={{ fontSize: 8, color: "#6B7280", marginTop: 16, lineHeight: 1.4 }}>
          Appel de fonds émis par le syndic en application du règlement de copropriété et du vote de l&apos;assemblée générale.
          Tout retard de paiement peut entraîner l&apos;application d&apos;intérêts moratoires et de frais de relance (art. 1146 Code civil LU).
          En cas de contestation, contacter le syndic par écrit dans les 30 jours suivant réception.
        </Text>

        <Text style={s.footer}>
          Document généré via tevaxia.lu — Ne constitue pas une facture fiscale. {syndic.vat ? `TVA ${syndic.vat}.` : ""}
        </Text>
      </Page>
    </Document>
  );
}
