"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CoownershipAnnexesBundle } from "@/lib/coownership-annexes";

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", lineHeight: 1.35, color: "#0B2447" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    marginBottom: 14, paddingBottom: 8, borderBottom: "1 solid #0B2447",
  },
  syndicName: { fontSize: 11, fontWeight: "bold" },
  copropName: { fontSize: 9, color: "#334155" },
  annexeHeader: {
    backgroundColor: "#0B2447", color: "white", padding: 8, marginBottom: 10, borderRadius: 2,
  },
  annexeNumber: { fontSize: 8, textTransform: "uppercase", letterSpacing: 1 },
  annexeTitle: { fontSize: 14, fontWeight: "bold", marginTop: 2 },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 10, fontWeight: "bold", textTransform: "uppercase",
    color: "#1B2A4A", marginBottom: 6, paddingBottom: 3,
    borderBottom: "0.5 solid #CBD5E1",
  },
  row: { flexDirection: "row", paddingVertical: 2 },
  rowAlt: { flexDirection: "row", paddingVertical: 2, backgroundColor: "#F8FAFC" },
  rowBorder: { flexDirection: "row", paddingVertical: 3, borderTop: "0.5 solid #CBD5E1", fontWeight: "bold" },
  col: { flex: 1 },
  label: { flex: 2, color: "#334155" },
  amount: { flex: 1, textAlign: "right", fontFamily: "Helvetica" },
  amountBold: { flex: 1, textAlign: "right", fontWeight: "bold" },
  thead: {
    flexDirection: "row", paddingVertical: 4, borderBottom: "1 solid #0B2447",
    marginTop: 4, fontSize: 8, fontWeight: "bold", textTransform: "uppercase", color: "#475569",
  },
  th: { flex: 1 },
  thLabel: { flex: 2.5 },
  thSmall: { flex: 0.8 },
  td: { fontSize: 8, paddingVertical: 1 },
  footer: {
    position: "absolute", bottom: 20, left: 36, right: 36,
    fontSize: 7, color: "#94A3B8", textAlign: "center",
    borderTop: "0.5 solid #CBD5E1", paddingTop: 6,
  },
  pageNumber: { position: "absolute", bottom: 8, right: 36, fontSize: 7, color: "#94A3B8" },
  badge: {
    backgroundColor: "#EFF6FF", padding: 6, borderRadius: 2, marginTop: 6, fontSize: 8, color: "#1E40AF",
  },
  totalHighlight: {
    backgroundColor: "#EFF6FF", padding: 8, marginTop: 8, borderRadius: 2,
    flexDirection: "row", justifyContent: "space-between", fontWeight: "bold", color: "#1E40AF",
  },
  legalNote: {
    marginTop: 20, padding: 8, backgroundColor: "#FEF3C7",
    fontSize: 7, color: "#78350F",
  },
});

const fmtEUR = (n: number): string => {
  const abs = Math.abs(n);
  const rounded = abs.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d,))/g, " ");
  return (n < 0 ? "-" : "") + rounded + " EUR";
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-LU");
};

interface Props {
  bundle: CoownershipAnnexesBundle;
  syndic: { name: string; address?: string | null; email?: string | null; phone?: string | null };
}

function Header({ bundle, syndic }: Props) {
  return (
    <View style={s.header} fixed>
      <View>
        <Text style={s.syndicName}>{syndic.name}</Text>
        {syndic.address && <Text style={{ fontSize: 8, color: "#475569" }}>{syndic.address}</Text>}
        {(syndic.email || syndic.phone) && (
          <Text style={{ fontSize: 7, color: "#64748B" }}>
            {syndic.email}{syndic.email && syndic.phone ? " · " : ""}{syndic.phone}
          </Text>
        )}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={s.copropName}>{bundle.coownership.name}</Text>
        <Text style={{ fontSize: 8, color: "#64748B" }}>
          Exercice {bundle.year}
        </Text>
      </View>
    </View>
  );
}

export default function CoownershipAnnexesPdf({ bundle, syndic }: Props) {
  const { annexe1, annexe2, annexe3, annexe4, annexe5 } = bundle;

  return (
    <Document title={`Annexes comptables ${bundle.coownership.name} ${bundle.year}`}>
      {/* Cover */}
      <Page size="A4" style={s.page}>
        <Header bundle={bundle} syndic={syndic} />
        <View style={{ marginTop: 80, alignItems: "center" }}>
          <Text style={{ fontSize: 10, color: "#64748B", letterSpacing: 2, textTransform: "uppercase" }}>
            Assemblée générale
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginTop: 8, textAlign: "center" }}>
            Annexes comptables
          </Text>
          <Text style={{ fontSize: 14, color: "#475569", marginTop: 4 }}>
            Exercice {bundle.year}
          </Text>
          <Text style={{ fontSize: 12, color: "#0B2447", marginTop: 40, fontWeight: "bold" }}>
            {bundle.coownership.name}
          </Text>
          {bundle.coownership.address && (
            <Text style={{ fontSize: 9, color: "#64748B", marginTop: 2 }}>
              {bundle.coownership.address}
            </Text>
          )}
        </View>
        <View style={{ marginTop: 60 }}>
          <Text style={[s.sectionTitle, { textAlign: "center" }]}>Sommaire</Text>
          <View style={{ marginTop: 10 }}>
            {[
              "Annexe 1 — État financier (bilan)",
              "Annexe 2 — Compte de gestion général",
              "Annexe 3 — Compte de gestion travaux",
              "Annexe 4 — État des dettes et créances",
              "Annexe 5 — État détaillé des dépenses",
            ].map((line, i) => (
              <Text key={i} style={{ fontSize: 10, color: "#334155", marginVertical: 2 }}>
                {line}
              </Text>
            ))}
          </View>
        </View>
        <Text style={s.footer} fixed>
          Annexes comptables préparées par {syndic.name} — conforme pratique copropriété LU (loi 1988 + loi 10.06.1999).
          Document soumis au vote de l&apos;AG annuelle.
        </Text>
        <Text style={s.pageNumber} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>

      {/* Annexe 1 */}
      <Page size="A4" style={s.page}>
        <Header bundle={bundle} syndic={syndic} />
        <View style={s.annexeHeader}>
          <Text style={s.annexeNumber}>Annexe 1</Text>
          <Text style={s.annexeTitle}>État financier au 31 décembre {bundle.year}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>I. Disponibilités (actifs liquides)</Text>
          <View style={s.row}>
            <Text style={s.label}>Compte bancaire opérationnel (512)</Text>
            <Text style={s.amount}>{fmtEUR(annexe1.items.banque_operationnelle)}</Text>
          </View>
          <View style={s.rowAlt}>
            <Text style={s.label}>Compte bancaire fonds travaux (513)</Text>
            <Text style={s.amount}>{fmtEUR(annexe1.items.banque_fonds_travaux)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Caisse (530)</Text>
            <Text style={s.amount}>{fmtEUR(annexe1.items.caisse)}</Text>
          </View>
          <View style={s.rowBorder}>
            <Text style={s.label}>Total disponibilités</Text>
            <Text style={s.amountBold}>{fmtEUR(annexe1.items.total_disponibilites)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>II. Capitaux permanents</Text>
          <View style={s.row}>
            <Text style={s.label}>Fonds de copropriété (100)</Text>
            <Text style={s.amount}>{fmtEUR(annexe1.items.fonds_copropriete)}</Text>
          </View>
          <View style={s.rowAlt}>
            <Text style={s.label}>Provisions pour travaux (150)</Text>
            <Text style={s.amount}>{fmtEUR(annexe1.items.provisions_travaux)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Résultat de l&apos;exercice {bundle.year} (120)</Text>
            <Text style={s.amount}>{fmtEUR(annexe1.items.resultat_exercice)}</Text>
          </View>
          <View style={s.rowBorder}>
            <Text style={s.label}>Total capitaux</Text>
            <Text style={s.amountBold}>{fmtEUR(annexe1.items.total_capitaux)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>III. Tiers</Text>
          <View style={s.row}>
            <Text style={s.label}>Créances sur copropriétaires (411)</Text>
            <Text style={s.amount}>{fmtEUR(annexe1.items.creances_coproprietaires)}</Text>
          </View>
          <View style={s.rowAlt}>
            <Text style={s.label}>Dettes envers fournisseurs (401)</Text>
            <Text style={s.amount}>{fmtEUR(annexe1.items.dettes_fournisseurs)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Avances copropriétaires (455)</Text>
            <Text style={s.amount}>{fmtEUR(annexe1.items.dettes_coproprietaires)}</Text>
          </View>
        </View>

        <View style={s.badge}>
          <Text>
            Cet état financier constitue la photographie patrimoniale du syndicat au 31 décembre {bundle.year}.
            Les comptes sont tenus en partie double conformément aux règles comptables applicables à la copropriété LU.
          </Text>
        </View>
        <Text style={s.pageNumber} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>

      {/* Annexe 2 */}
      <Page size="A4" style={s.page}>
        <Header bundle={bundle} syndic={syndic} />
        <View style={s.annexeHeader}>
          <Text style={s.annexeNumber}>Annexe 2</Text>
          <Text style={s.annexeTitle}>Compte de gestion général — charges courantes {bundle.year}</Text>
        </View>

        <View style={s.thead}>
          <Text style={s.thSmall}>Compte</Text>
          <Text style={s.thLabel}>Libellé</Text>
          <Text style={[s.th, { textAlign: "right" }]}>Budget</Text>
          <Text style={[s.th, { textAlign: "right" }]}>Réalisé</Text>
          <Text style={[s.th, { textAlign: "right" }]}>Écart</Text>
        </View>

        {annexe2.rows.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#94A3B8", marginTop: 30, fontSize: 9 }}>
            Aucune charge enregistrée sur l&apos;exercice.
          </Text>
        ) : annexe2.rows.map((r, i) => (
          <View key={r.code} style={i % 2 === 0 ? s.row : s.rowAlt}>
            <Text style={[s.thSmall, s.td, { fontFamily: "Helvetica-Bold" }]}>{r.code}</Text>
            <Text style={[s.thLabel, s.td]}>{r.label}</Text>
            <Text style={[s.th, s.td, { textAlign: "right" }]}>{fmtEUR(r.budgeted)}</Text>
            <Text style={[s.th, s.td, { textAlign: "right" }]}>{fmtEUR(r.actual)}</Text>
            <Text style={[s.th, s.td, { textAlign: "right", color: r.variance >= 0 ? "#047857" : "#B91C1C" }]}>
              {r.variance >= 0 ? "+" : ""}{fmtEUR(r.variance)}
            </Text>
          </View>
        ))}

        <View style={s.totalHighlight}>
          <Text>Totaux charges courantes</Text>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <Text>{fmtEUR(annexe2.totals.budgeted)}</Text>
            <Text>{fmtEUR(annexe2.totals.actual)}</Text>
            <Text>{annexe2.totals.variance >= 0 ? "+" : ""}{fmtEUR(annexe2.totals.variance)}</Text>
          </View>
        </View>
        <Text style={s.pageNumber} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>

      {/* Annexe 3 */}
      <Page size="A4" style={s.page}>
        <Header bundle={bundle} syndic={syndic} />
        <View style={s.annexeHeader}>
          <Text style={s.annexeNumber}>Annexe 3</Text>
          <Text style={s.annexeTitle}>Compte de gestion travaux {bundle.year}</Text>
        </View>

        <View style={s.thead}>
          <Text style={s.thSmall}>Compte</Text>
          <Text style={s.thLabel}>Libellé</Text>
          <Text style={[s.th, { textAlign: "right" }]}>Budget</Text>
          <Text style={[s.th, { textAlign: "right" }]}>Réalisé</Text>
          <Text style={[s.th, { textAlign: "right" }]}>Écart</Text>
        </View>

        {annexe3.rows.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#94A3B8", marginTop: 30, fontSize: 9 }}>
            Aucune dépense de travaux sur l&apos;exercice.
          </Text>
        ) : annexe3.rows.map((r, i) => (
          <View key={r.code} style={i % 2 === 0 ? s.row : s.rowAlt}>
            <Text style={[s.thSmall, s.td, { fontFamily: "Helvetica-Bold" }]}>{r.code}</Text>
            <Text style={[s.thLabel, s.td]}>{r.label}</Text>
            <Text style={[s.th, s.td, { textAlign: "right" }]}>{fmtEUR(r.budgeted)}</Text>
            <Text style={[s.th, s.td, { textAlign: "right" }]}>{fmtEUR(r.actual)}</Text>
            <Text style={[s.th, s.td, { textAlign: "right", color: r.variance >= 0 ? "#047857" : "#B91C1C" }]}>
              {r.variance >= 0 ? "+" : ""}{fmtEUR(r.variance)}
            </Text>
          </View>
        ))}

        <View style={s.totalHighlight}>
          <Text>Totaux travaux</Text>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <Text>{fmtEUR(annexe3.totals.budgeted)}</Text>
            <Text>{fmtEUR(annexe3.totals.actual)}</Text>
            <Text>{annexe3.totals.variance >= 0 ? "+" : ""}{fmtEUR(annexe3.totals.variance)}</Text>
          </View>
        </View>

        <View style={[s.badge, { backgroundColor: "#ECFDF5", color: "#065F46", marginTop: 12 }]}>
          <Text>
            Fonds de travaux (loi 10 juin 1999) : solde au 31.12.{bundle.year} ={" "}
            <Text style={{ fontWeight: "bold" }}>{fmtEUR(annexe3.fonds_travaux_balance)}</Text>.
            La provision est obligatoire pour les copropriétés de plus de 10 lots.
          </Text>
        </View>
        <Text style={s.pageNumber} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>

      {/* Annexe 4 */}
      <Page size="A4" style={s.page}>
        <Header bundle={bundle} syndic={syndic} />
        <View style={s.annexeHeader}>
          <Text style={s.annexeNumber}>Annexe 4</Text>
          <Text style={s.annexeTitle}>État des dettes et créances au 31.12.{bundle.year}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Synthèse</Text>
          <View style={s.row}>
            <Text style={s.label}>Créances sur copropriétaires (impayés)</Text>
            <Text style={s.amount}>{fmtEUR(annexe4.creances_coproprietaires)}</Text>
          </View>
          <View style={s.rowAlt}>
            <Text style={s.label}>Dettes envers fournisseurs</Text>
            <Text style={s.amount}>{fmtEUR(annexe4.dettes_fournisseurs)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Avances de copropriétaires</Text>
            <Text style={s.amount}>{fmtEUR(annexe4.dettes_coproprietaires)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Détail impayés par copropriétaire</Text>
          {annexe4.owners.length === 0 ? (
            <Text style={{ color: "#94A3B8", fontSize: 9, fontStyle: "italic" }}>
              Aucun impayé à signaler — tous les copropriétaires sont à jour.
            </Text>
          ) : (
            <>
              <View style={s.thead}>
                <Text style={s.thSmall}>Lot</Text>
                <Text style={s.thLabel}>Propriétaire</Text>
                <Text style={[s.th, { textAlign: "right" }]}>Appelé</Text>
                <Text style={[s.th, { textAlign: "right" }]}>Payé</Text>
                <Text style={[s.th, { textAlign: "right" }]}>Reste dû</Text>
                <Text style={[s.th, { textAlign: "right", fontSize: 7 }]}>Plus ancien</Text>
              </View>
              {annexe4.owners.map((o, i) => (
                <View key={o.unit_id} style={i % 2 === 0 ? s.row : s.rowAlt}>
                  <Text style={[s.thSmall, s.td, { fontFamily: "Helvetica-Bold" }]}>{o.lot_number}</Text>
                  <Text style={[s.thLabel, s.td]}>{o.owner_name ?? "—"}</Text>
                  <Text style={[s.th, s.td, { textAlign: "right" }]}>{fmtEUR(o.total_due)}</Text>
                  <Text style={[s.th, s.td, { textAlign: "right" }]}>{fmtEUR(o.total_paid)}</Text>
                  <Text style={[s.th, s.td, { textAlign: "right", color: o.balance_outstanding > 0 ? "#B91C1C" : "#0B2447", fontWeight: o.balance_outstanding > 0 ? "bold" : "normal" }]}>
                    {fmtEUR(o.balance_outstanding)}
                  </Text>
                  <Text style={[s.th, s.td, { textAlign: "right", fontSize: 7 }]}>
                    {o.oldest_unpaid ? fmtDate(o.oldest_unpaid) : "—"}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
        <Text style={s.pageNumber} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>

      {/* Annexe 5 */}
      <Page size="A4" style={s.page}>
        <Header bundle={bundle} syndic={syndic} />
        <View style={s.annexeHeader}>
          <Text style={s.annexeNumber}>Annexe 5</Text>
          <Text style={s.annexeTitle}>État détaillé des dépenses {bundle.year}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Récapitulatif par compte</Text>
          {Object.entries(annexe5.totalByAccount)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([code, v], i) => (
              <View key={code} style={i % 2 === 0 ? s.row : s.rowAlt}>
                <Text style={[s.thSmall, s.td, { fontFamily: "Helvetica-Bold" }]}>{code}</Text>
                <Text style={[s.thLabel, s.td]}>{v.label}</Text>
                <Text style={[s.th, s.td, { textAlign: "right" }]}>{fmtEUR(v.total)}</Text>
              </View>
            ))}
          <View style={s.rowBorder}>
            <Text style={[s.thSmall]}></Text>
            <Text style={[s.thLabel]}>Total général</Text>
            <Text style={[s.th, { textAlign: "right" }]}>{fmtEUR(annexe5.grandTotal)}</Text>
          </View>
        </View>

        <View style={[s.section, { marginTop: 16 }]}>
          <Text style={s.sectionTitle}>Journal chronologique</Text>
          <View style={s.thead}>
            <Text style={[s.thSmall, { fontSize: 7 }]}>Date</Text>
            <Text style={[s.thSmall, { fontSize: 7 }]}>Pièce</Text>
            <Text style={[s.thSmall, { fontSize: 7 }]}>Jrnl</Text>
            <Text style={[s.thLabel, { fontSize: 7 }]}>Libellé</Text>
            <Text style={[s.thSmall, { fontSize: 7 }]}>Compte</Text>
            <Text style={[s.th, { textAlign: "right", fontSize: 7 }]}>Débit</Text>
          </View>
          {annexe5.rows.length === 0 ? (
            <Text style={{ color: "#94A3B8", fontStyle: "italic", marginTop: 6, fontSize: 8 }}>
              Aucune écriture sur l&apos;exercice.
            </Text>
          ) : annexe5.rows.map((e, i) => (
            <View key={i} style={i % 2 === 0 ? s.row : s.rowAlt} wrap={false}>
              <Text style={[s.thSmall, s.td, { fontSize: 7 }]}>{fmtDate(e.entry_date)}</Text>
              <Text style={[s.thSmall, s.td, { fontSize: 7 }]}>{e.reference ?? "—"}</Text>
              <Text style={[s.thSmall, s.td, { fontSize: 7 }]}>{e.journal_code}</Text>
              <Text style={[s.thLabel, s.td, { fontSize: 7 }]}>{e.label}</Text>
              <Text style={[s.thSmall, s.td, { fontSize: 7 }]}>{e.account_code}</Text>
              <Text style={[s.th, s.td, { textAlign: "right", fontSize: 7 }]}>{fmtEUR(e.debit)}</Text>
            </View>
          ))}
        </View>

        <View style={s.legalNote}>
          <Text>
            Conformément à la loi du 16 mai 1975 et à la pratique LU en matière de copropriété, cet état détaillé
            des dépenses est consultable sur simple demande par tout copropriétaire au siège du syndicat pendant
            les 15 jours précédant l&apos;assemblée générale.
          </Text>
        </View>
        <Text style={s.pageNumber} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>
    </Document>
  );
}
