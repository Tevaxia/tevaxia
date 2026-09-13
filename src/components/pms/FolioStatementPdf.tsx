"use client";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { FolioStatement } from "@/lib/pms/folio-statement";
const s = StyleSheet.create({
  page: { padding: 36, paddingBottom: 65, fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.45, color: "#152744" },
  title: { fontSize: 21, fontWeight: "bold", marginBottom: 10 },
  section: { fontSize: 13, fontWeight: "bold", marginTop: 16, marginBottom: 8 },
  scope: { padding: 10, backgroundColor: "#edf2f7", marginVertical: 12 },
  row: { flexDirection: "row", borderBottom: "0.5 solid #d8dee8", paddingVertical: 6 },
  cell: { width: "25%", paddingRight: 6 },
  detail: { marginTop: 5, marginBottom: 10 },
  footer: { position: "absolute", bottom: 22, left: 36, right: 36, fontSize: 7, color: "#526174", borderTop: "0.5 solid #d8dee8", paddingTop: 5 },
});
const clean = (v: string) => v.replace(/[\u2011\u2013\u2014]/g, "-").replace(/[\u00a0\u202f]/g, " ");
export default function FolioStatementPdf({ report, property, reservation, stay, status, generatedAt, labels, categories, locale }: { report: FolioStatement; property: string; reservation: string; stay: string; status: string; generatedAt: string; labels: Record<string, string>; categories: Record<string, string>; locale: string }) {
  const t = (k: string) => clean(labels[k] ?? k);
  const nf = new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { maximumFractionDigits: 2 });
  const mf = new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency: report.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (v: number) => clean(mf.format(v));
  const footer = <Text fixed style={s.footer}>{t("title")} · {clean(reservation)} · UTC</Text>;
  return <Document title={`${t("title")} - ${clean(reservation)}`} language={locale}>
    <Page size="A4" style={s.page}>
      <Text style={s.title}>{t("title")}</Text><Text>{clean(property)}</Text><Text>{clean(reservation)} · {clean(stay)}</Text><Text>{t("status")}: {clean(status)}</Text><Text>{t("generated")}: {generatedAt} · UTC</Text>
      <Text style={s.scope}>{t("scope")}</Text>
      <View style={s.row}>{["ht", "vat", "gross", "balance"].map(k => <Text key={k} style={s.cell}>{t(k)}</Text>)}</View>
      <View style={s.row}>{[report.ht, report.vat, report.gross, report.balance].map((v,i) => <Text key={i} style={s.cell}>{money(v)}</Text>)}</View>
      <Text style={s.scope}>{t("amountScope")}</Text>
      <Text style={s.section}>{t("lines")} ({report.lines.length})</Text>
      {report.lines.map((c, i) => <View key={c.id}>
        <View wrap={false}>
        <Text style={s.section}>{i + 1}. {clean(categories[c.category] ?? c.category)}</Text>
        <Text>{clean(c.description)}</Text>
        <Text>{new Date(c.posted_at).toISOString()} · UTC</Text>
        <View style={s.row} wrap={false}><Text style={s.cell}>{t("quantity")}: {nf.format(c.quantity)}</Text><Text style={s.cell}>{t("unit")}: {money(c.unit_price_ht)}</Text><Text style={s.cell}>{t("rate")}: {nf.format(c.tva_rate)} %</Text></View>
        <View style={s.row} wrap={false}><Text style={s.cell}>{t("ht")}: {money(c.line_ht)}</Text><Text style={s.cell}>{t("vat")}: {money(c.line_tva)}</Text><Text style={s.cell}>{t("gross")}: {money(c.line_ttc)}</Text></View>
        </View>
        <Text style={s.detail}>{t("reference")}: {clean(c.notes || t("missing"))}</Text>
      </View>)}
      {footer}
    </Page>
  </Document>;
}
