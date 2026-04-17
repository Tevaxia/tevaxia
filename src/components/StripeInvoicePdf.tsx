"use client";

/**
 * Facture PDF pour les abonnements Stripe.
 *
 * Génère un PDF conforme LU (mentions légales obligatoires) à partir
 * d'une souscription Stripe. Mentions légales LU (art. 61-63 loi TVA
 * du 12/02/1979 et règlement grand-ducal 24/03/2023) :
 *  - Date d'émission
 *  - Numéro séquentiel unique
 *  - Nom + adresse fournisseur + TVA intracommunautaire
 *  - Nom + adresse client
 *  - Description bien/service + quantité
 *  - Base imposable HT, taux TVA, montant TVA, total TTC
 *
 * Les variables d'entreprise viennent d'env vars (NEXT_PUBLIC_COMPANY_*)
 * pour permettre au site de rester générique.
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1f2937" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  companyBlock: { width: "50%" },
  companyName: { fontSize: 16, fontWeight: "bold", color: "#1e3a5f", marginBottom: 4 },
  invoiceBlock: { width: "40%", textAlign: "right" },
  invoiceTitle: { fontSize: 18, fontWeight: "bold", color: "#1e3a5f", marginBottom: 8 },
  label: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
  value: { fontSize: 10, marginBottom: 6 },
  clientBlock: { marginTop: 10, marginBottom: 20, padding: 12, backgroundColor: "#f8fafc", borderRadius: 4 },
  line: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 15 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1e3a5f", color: "#ffffff", paddingVertical: 6, paddingHorizontal: 8, fontSize: 9, fontWeight: "bold" },
  tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1.5, textAlign: "right" },
  totalsBlock: { alignSelf: "flex-end", width: "45%", marginTop: 15 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalRowBold: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1.5, borderTopColor: "#1e3a5f", marginTop: 5, fontWeight: "bold" },
  totalLabel: { color: "#4b5563" },
  totalValue: { fontFamily: "Courier", color: "#1e3a5f" },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#9ca3af", borderTopWidth: 0.5, borderTopColor: "#e5e7eb", paddingTop: 10 },
  notice: { fontSize: 9, color: "#6b7280", marginTop: 20, lineHeight: 1.4, padding: 10, backgroundColor: "#fef3c7", borderRadius: 4 },
});

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  paid: boolean;
  // Fournisseur (tevaxia)
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  companyVatNumber: string;
  companyRegistration: string;
  companyEmail: string;
  // Client
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  clientVatNumber?: string;
  clientCountry?: string;
  // Lignes
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  vatRate: number; // ex. 17 pour 17 %
  reverseCharge: boolean; // Autoliquidation (B2B intra-UE)
  currency: string;
  // Métadonnées Stripe
  stripeSubscriptionId?: string;
  stripeInvoiceId?: string;
}

function fmtEur(n: number, currency: string): string {
  return new Intl.NumberFormat("fr-LU", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

export function StripeInvoiceDocument({ data }: { data: InvoiceData }) {
  const totalHT = data.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const vat = data.reverseCharge ? 0 : totalHT * (data.vatRate / 100);
  const totalTTC = totalHT + vat;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header : société + facture */}
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{data.companyName}</Text>
            <Text style={styles.value}>{data.companyAddress}</Text>
            <Text style={styles.value}>{data.companyCity}, {data.companyCountry}</Text>
            <Text style={styles.value}>TVA : {data.companyVatNumber}</Text>
            <Text style={styles.value}>RCS : {data.companyRegistration}</Text>
            <Text style={styles.value}>{data.companyEmail}</Text>
          </View>
          <View style={styles.invoiceBlock}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.label}>N° facture</Text>
            <Text style={styles.value}>{data.invoiceNumber}</Text>
            <Text style={styles.label}>Date émission</Text>
            <Text style={styles.value}>{data.invoiceDate}</Text>
            {data.dueDate && (
              <>
                <Text style={styles.label}>Date échéance</Text>
                <Text style={styles.value}>{data.dueDate}</Text>
              </>
            )}
            <Text style={styles.label}>Statut</Text>
            <Text style={[styles.value, { color: data.paid ? "#059669" : "#dc2626", fontWeight: "bold" }]}>
              {data.paid ? "Payée" : "Due"}
            </Text>
          </View>
        </View>

        {/* Bloc client */}
        <View style={styles.clientBlock}>
          <Text style={styles.label}>Facturé à</Text>
          <Text style={[styles.value, { fontWeight: "bold", fontSize: 12 }]}>{data.clientName}</Text>
          {data.clientAddress && <Text style={styles.value}>{data.clientAddress}</Text>}
          {data.clientCountry && <Text style={styles.value}>{data.clientCountry}</Text>}
          <Text style={styles.value}>{data.clientEmail}</Text>
          {data.clientVatNumber && (
            <Text style={styles.value}>TVA client : {data.clientVatNumber}</Text>
          )}
        </View>

        {/* Table des lignes */}
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Description</Text>
          <Text style={styles.col2}>Qté</Text>
          <Text style={styles.col3}>Prix unitaire</Text>
          <Text style={styles.col3}>Total HT</Text>
        </View>
        {data.lines.map((l, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col1}>{l.description}</Text>
            <Text style={styles.col2}>{l.quantity}</Text>
            <Text style={styles.col3}>{fmtEur(l.unitPrice, data.currency)}</Text>
            <Text style={styles.col3}>{fmtEur(l.quantity * l.unitPrice, data.currency)}</Text>
          </View>
        ))}

        {/* Totaux */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{fmtEur(totalHT, data.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              TVA {data.reverseCharge ? "(autoliquidation)" : `${data.vatRate} %`}
            </Text>
            <Text style={styles.totalValue}>{fmtEur(vat, data.currency)}</Text>
          </View>
          <View style={styles.totalRowBold}>
            <Text style={{ fontWeight: "bold", color: "#1e3a5f" }}>TOTAL TTC</Text>
            <Text style={[styles.totalValue, { fontSize: 13, fontWeight: "bold" }]}>
              {fmtEur(totalTTC, data.currency)}
            </Text>
          </View>
        </View>

        {/* Mention autoliquidation */}
        {data.reverseCharge && (
          <View style={styles.notice}>
            <Text>
              Autoliquidation de la TVA — Art. 196 Directive 2006/112/CE. Le preneur
              assujetti doit autoliquider la TVA due dans son État membre de résidence.
              TVA client : {data.clientVatNumber || "(à renseigner)"}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            {data.companyName} · {data.companyAddress}, {data.companyCity} · TVA {data.companyVatNumber} · {data.companyEmail}
            {data.stripeInvoiceId && ` · Stripe #${data.stripeInvoiceId.slice(-10)}`}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoiceBlob(data: InvoiceData): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<StripeInvoiceDocument data={data} />).toBlob();
}
