"use client";

/**
 * Facture PMS hôtel/motel conforme LU :
 *   art. 61-63 loi TVA du 12.02.1979
 *   règlement grand-ducal 24.03.2023 (facturation électronique)
 *   TVA 3 % hébergement (annexe B) + 17 % F&B (standard)
 *   Taxe séjour communale (hors TVA)
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { PmsInvoice, PmsProperty } from "@/lib/pms/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1f2937" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25 },
  companyBlock: { width: "55%" },
  companyName: { fontSize: 16, fontWeight: "bold", color: "#1e3a5f", marginBottom: 4 },
  invoiceBlock: { width: "40%", textAlign: "right" },
  invoiceTitle: { fontSize: 18, fontWeight: "bold", color: "#1e3a5f", marginBottom: 8 },
  label: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
  value: { fontSize: 10, marginBottom: 4 },
  clientBlock: { marginTop: 10, marginBottom: 20, padding: 12, backgroundColor: "#f8fafc", borderRadius: 4 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: "#1e3a5f", marginTop: 15, marginBottom: 6 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1e3a5f", color: "#ffffff", paddingVertical: 6, paddingHorizontal: 8, fontSize: 9, fontWeight: "bold" },
  tableRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  col1: { flex: 3 },
  col2: { flex: 1.2, textAlign: "right" },
  col3: { flex: 1.2, textAlign: "right" },
  col4: { flex: 1.5, textAlign: "right" },
  totalsBlock: { alignSelf: "flex-end", width: "50%", marginTop: 18 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalRowBold: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1.5, borderTopColor: "#1e3a5f", marginTop: 5 },
  totalLabel: { color: "#4b5563" },
  totalValue: { fontFamily: "Courier", color: "#1e3a5f" },
  notice: { fontSize: 9, color: "#6b7280", marginTop: 20, lineHeight: 1.4, padding: 10, backgroundColor: "#fef3c7", borderRadius: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#9ca3af", borderTopWidth: 0.5, borderTopColor: "#e5e7eb", paddingTop: 10 },
});

function fmtEur(n: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-LU", { style: "currency", currency, minimumFractionDigits: 2 }).format(n);
}

export function PmsInvoiceDocument({ invoice, property }: { invoice: PmsInvoice; property: PmsProperty }) {
  const hasFb = Number(invoice.fb_ht) > 0;
  const hasOther = Number(invoice.other_ht) > 0;
  const hasTaxeSejour = Number(invoice.taxe_sejour) > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{property.name}</Text>
            {property.address && <Text style={styles.value}>{property.address}</Text>}
            {(property.postal_code || property.commune) && (
              <Text style={styles.value}>{property.postal_code ?? ""} {property.commune ?? ""}</Text>
            )}
            <Text style={styles.value}>{property.country ?? "LU"}</Text>
            {property.vat_number && <Text style={styles.value}>TVA : {property.vat_number}</Text>}
            {property.registration_number && <Text style={styles.value}>RCS : {property.registration_number}</Text>}
            {property.email && <Text style={styles.value}>{property.email}</Text>}
            {property.phone && <Text style={styles.value}>{property.phone}</Text>}
          </View>
          <View style={styles.invoiceBlock}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.label}>N° facture</Text>
            <Text style={styles.value}>{invoice.invoice_number}</Text>
            <Text style={styles.label}>Date émission</Text>
            <Text style={styles.value}>{invoice.issue_date}</Text>
            {invoice.due_date && (
              <>
                <Text style={styles.label}>Date échéance</Text>
                <Text style={styles.value}>{invoice.due_date}</Text>
              </>
            )}
            <Text style={styles.label}>Statut</Text>
            <Text style={[styles.value, { color: invoice.paid ? "#059669" : "#dc2626", fontWeight: "bold" }]}>
              {invoice.paid ? "Payée" : "Due"}
            </Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.clientBlock}>
          <Text style={styles.label}>Facturé à</Text>
          <Text style={[styles.value, { fontWeight: "bold", fontSize: 12 }]}>{invoice.customer_name}</Text>
          {invoice.customer_address && <Text style={styles.value}>{invoice.customer_address}</Text>}
          {invoice.customer_vat_number && <Text style={styles.value}>TVA client : {invoice.customer_vat_number}</Text>}
        </View>

        {/* Lignes */}
        <Text style={styles.sectionTitle}>Détail prestations</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Description</Text>
          <Text style={styles.col2}>HT</Text>
          <Text style={styles.col3}>TVA %</Text>
          <Text style={styles.col4}>TTC</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.col1}>Hébergement (séjour)</Text>
          <Text style={styles.col2}>{fmtEur(Number(invoice.hebergement_ht), invoice.currency)}</Text>
          <Text style={styles.col3}>{Number(invoice.hebergement_tva_rate)} %</Text>
          <Text style={styles.col4}>{fmtEur(Number(invoice.hebergement_ht) + Number(invoice.hebergement_tva), invoice.currency)}</Text>
        </View>
        {hasFb && (
          <View style={styles.tableRow}>
            <Text style={styles.col1}>Restauration / Bar</Text>
            <Text style={styles.col2}>{fmtEur(Number(invoice.fb_ht), invoice.currency)}</Text>
            <Text style={styles.col3}>{Number(invoice.fb_tva_rate)} %</Text>
            <Text style={styles.col4}>{fmtEur(Number(invoice.fb_ht) + Number(invoice.fb_tva), invoice.currency)}</Text>
          </View>
        )}
        {hasOther && (
          <View style={styles.tableRow}>
            <Text style={styles.col1}>Autres services</Text>
            <Text style={styles.col2}>{fmtEur(Number(invoice.other_ht), invoice.currency)}</Text>
            <Text style={styles.col3}>{Number(invoice.other_tva_rate)} %</Text>
            <Text style={styles.col4}>{fmtEur(Number(invoice.other_ht) + Number(invoice.other_tva), invoice.currency)}</Text>
          </View>
        )}
        {hasTaxeSejour && (
          <View style={styles.tableRow}>
            <Text style={styles.col1}>Taxe de séjour communale</Text>
            <Text style={styles.col2}>—</Text>
            <Text style={styles.col3}>HT</Text>
            <Text style={styles.col4}>{fmtEur(Number(invoice.taxe_sejour), invoice.currency)}</Text>
          </View>
        )}

        {/* Totaux */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{fmtEur(Number(invoice.total_ht), invoice.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total TVA</Text>
            <Text style={styles.totalValue}>{fmtEur(Number(invoice.total_tva), invoice.currency)}</Text>
          </View>
          {hasTaxeSejour && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Taxe de séjour</Text>
              <Text style={styles.totalValue}>{fmtEur(Number(invoice.taxe_sejour), invoice.currency)}</Text>
            </View>
          )}
          <View style={styles.totalRowBold}>
            <Text style={{ fontWeight: "bold", color: "#1e3a5f" }}>TOTAL TTC</Text>
            <Text style={[styles.totalValue, { fontSize: 13, fontWeight: "bold" }]}>
              {fmtEur(Number(invoice.total_ttc), invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Mentions légales */}
        <View style={styles.notice}>
          <Text>
            Facture conforme loi TVA LU du 12.02.1979 (art. 61-63) et règlement grand-ducal
            du 24.03.2023. TVA hébergement : {Number(invoice.hebergement_tva_rate)} %
            (art. 40 + annexe B). La taxe de séjour communale n&apos;est pas soumise à la TVA.
          </Text>
          {invoice.notes && <Text style={{ marginTop: 6 }}>{invoice.notes}</Text>}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            {property.name} · {property.address ?? ""} · {property.vat_number ?? ""} · {property.email ?? ""}
          </Text>
          {invoice.legal_footer && <Text style={{ marginTop: 3 }}>{invoice.legal_footer}</Text>}
        </View>
      </Page>
    </Document>
  );
}

export async function generatePmsInvoiceBlob(invoice: PmsInvoice, property: PmsProperty): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<PmsInvoiceDocument invoice={invoice} property={property} />).toBlob();
}
