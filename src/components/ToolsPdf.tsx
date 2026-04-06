"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Font } from "@react-pdf/renderer";
import {
  CoverPage,
  KpiGrid,
  PageHeader,
  Footer,
  generateRef,
  ConfidenceGauge,
  PriceRangeBar,
  MarketContext,
} from "@/components/energy/EnergyPdf";

// Register Inter font (Google Fonts CDN) — called once at module level
if (typeof window !== "undefined") {
  Font.register({
    family: "Inter",
    fonts: [
      { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf", fontWeight: 600 },
      { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf", fontWeight: 700 },
    ],
  });
}

export { PdfButton } from "@/components/energy/EnergyPdf";

/* ---------- Helpers ---------- */
const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number, d = 0) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d }).format(n);
const fmtPct = (n: number, d = 1) => `${n.toFixed(d)} %`;
const today = () => new Date().toLocaleDateString("fr-LU");

/* ---------- Styles ---------- */
const s = StyleSheet.create({
  page: { paddingTop: 50, paddingBottom: 60, paddingHorizontal: 40, fontSize: 9, fontFamily: "Inter", color: "#1a1a2e" },
  section: { fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: "#1B2A4A", marginTop: 16, marginBottom: 8, paddingBottom: 4, borderBottom: "1pt solid #e5e2db" },
  row: { flexDirection: "row" as const, justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5pt solid #f0f0f0" },
  rowHL: { flexDirection: "row" as const, justifyContent: "space-between", paddingVertical: 5, borderTop: "1.5pt solid #C8A951", marginTop: 4, backgroundColor: "#FAFAF8" },
  label: { color: "#334155", flex: 1 },
  value: { fontFamily: "Inter", fontWeight: 600, textAlign: "right" as const },
  valueLg: { fontFamily: "Inter", fontWeight: 600, fontSize: 12, textAlign: "right" as const, color: "#1B2A4A" },
  note: { fontSize: 8, color: "#6B7280", marginTop: 4, lineHeight: 1.4 },
  disclaimer: { fontSize: 7, color: "#9CA3AF", marginTop: 20, paddingTop: 8, borderTop: "0.5pt solid #e5e2db", lineHeight: 1.4 },
  grid: { flexDirection: "row" as const, gap: 8, marginTop: 4 },
  cell: { flex: 1, padding: 6, backgroundColor: "#F8F7F4", borderRadius: 4 },
  cellLabel: { fontSize: 7, color: "#6B7280" },
  cellValue: { fontSize: 11, fontFamily: "Inter", fontWeight: 600, color: "#1B2A4A", marginTop: 2 },
  tHead: { flexDirection: "row" as const, backgroundColor: "#F8F7F4", paddingVertical: 4, paddingHorizontal: 6, borderBottom: "1pt solid #e5e2db" },
  tRow: { flexDirection: "row" as const, paddingVertical: 3, paddingHorizontal: 6, borderBottom: "0.5pt solid #f0f0f0" },
  tCell: { flex: 1, fontSize: 8 },
  tCellR: { flex: 1, fontSize: 8, textAlign: "right" as const },
  tCellB: { flex: 1, fontSize: 8, fontFamily: "Inter", fontWeight: 600 },
});

/* ---------- Shared components ---------- */
function Disclaimer() {
  return (
    <Text style={s.disclaimer}>
      Ce document est produit automatiquement par tevaxia.lu a titre informatif. Les resultats dependent
      des parametres saisis et des hypotheses de calcul. Ils ne constituent ni une expertise certifiee ni
      un conseil financier, fiscal ou juridique. Pour toute decision engageante, consultez un professionnel agree.
    </Text>
  );
}
function DisclaimerPage({ reference }: { reference: string }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Avertissement" reference={reference} />
      <Text style={{ ...s.section, marginTop: 30 }}>Conditions d&apos;utilisation</Text>
      <Text style={{ fontSize: 9, color: "#334155", lineHeight: 1.6, marginTop: 8 }}>
        Ce document est genere automatiquement par la plateforme tevaxia.lu a titre purement informatif et indicatif.
        Il ne constitue en aucun cas une expertise certifiee, un conseil en evaluation immobiliere, un conseil
        financier, fiscal ou juridique.
      </Text>
      <Text style={{ fontSize: 9, color: "#334155", lineHeight: 1.6, marginTop: 12 }}>
        Les resultats presentes dependent des parametres saisis par l&apos;utilisateur et des hypotheses de calcul
        integrees dans les modeles. Ils peuvent differer significativement de la realite du marche.
      </Text>
      <Text style={{ fontSize: 9, color: "#334155", lineHeight: 1.6, marginTop: 12 }}>
        Pour toute decision engageante, consultez un professionnel agree : evaluateur REV/TEGOVA,
        notaire ou conseiller financier.
      </Text>
      <Text style={{ fontSize: 9, color: "#6B7280", lineHeight: 1.6, marginTop: 24 }}>
        tevaxia.lu — Plateforme immobiliere Luxembourg{"\n"}
        Rapport genere le {today()}  |  Ref. {reference}
      </Text>
      <Footer />
    </Page>
  );
}
function Row({ label, value: v }: { label: string; value: string }) {
  return <View style={s.row}><Text style={s.label}>{label}</Text><Text style={s.value}>{v}</Text></View>;
}
function RowHL({ label, value: v }: { label: string; value: string }) {
  return (
    <View style={s.rowHL}>
      <Text style={{ ...s.label, fontFamily: "Inter", fontWeight: 600 }}>{label}</Text>
      <Text style={s.valueLg}>{v}</Text>
    </View>
  );
}

/* ==================== 1. ESTIMATION ==================== */

export interface EstimationPdfParams {
  commune: string; typeBien: string; surface: number; chambres?: number;
  prixBas: number; prixMoyen: number; prixHaut: number; prixM2: number;
  adjustments?: { label: string; impact: string }[];
  comparables?: { adresse: string; prix: number; surface: number; prixM2: number; ecart: string }[];
  confidence?: "low" | "medium" | "high";
  transactions?: number;
  tendance?: string;
}

function EstimationDoc({ p }: { p: EstimationPdfParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Estimation immobiliere"
        subtitle={`${p.typeBien} · ${p.commune} · ${fmtNum(p.surface)} m2`}
        value={fmtEur(p.prixMoyen)}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Estimation immobiliere" reference={ref} />

        <KpiGrid items={[
          { label: "Estimation moyenne", value: fmtEur(p.prixMoyen), highlight: true },
          { label: "Fourchette basse", value: fmtEur(p.prixBas) },
          { label: "Fourchette haute", value: fmtEur(p.prixHaut) },
          { label: "Prix au m2", value: `${fmtEur(p.prixM2)}/m2` },
          { label: "Commune", value: p.commune },
          { label: "Surface", value: `${fmtNum(p.surface)} m2` },
        ]} />

        {p.confidence && <ConfidenceGauge level={p.confidence} />}

        <PriceRangeBar min={p.prixBas} mid={p.prixMoyen} max={p.prixHaut} label="Fourchette de prix estimee" />

        <Text style={s.section}>Bien evalue</Text>
        <Row label="Commune" value={p.commune} />
        <Row label="Type de bien" value={p.typeBien} />
        <Row label="Surface" value={`${fmtNum(p.surface)} m2`} />
        {p.chambres != null && <Row label="Chambres" value={String(p.chambres)} />}

        <Text style={s.section}>Fourchette de prix</Text>
        <Row label="Estimation basse" value={fmtEur(p.prixBas)} />
        <RowHL label="Estimation moyenne" value={fmtEur(p.prixMoyen)} />
        <Row label="Estimation haute" value={fmtEur(p.prixHaut)} />
        <Row label="Prix au m2" value={`${fmtEur(p.prixM2)}/m2`} />

        {p.adjustments && p.adjustments.length > 0 && <>
          <Text style={s.section}>Ajustements appliques</Text>
          {p.adjustments.map((a, i) => <Row key={i} label={a.label} value={a.impact} />)}
        </>}

        {p.comparables && p.comparables.length > 0 && <>
          <Text style={s.section}>Comparables</Text>
          <View style={s.tHead}>
            <Text style={{ ...s.tCellB, flex: 2 }}>Adresse</Text>
            <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Prix</Text>
            <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Surface</Text>
            <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Prix/m2</Text>
            <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Ecart</Text>
          </View>
          {p.comparables.map((c, i) => (
            <View key={i} style={s.tRow}>
              <Text style={{ ...s.tCell, flex: 2 }}>{c.adresse}</Text>
              <Text style={s.tCellR}>{fmtEur(c.prix)}</Text>
              <Text style={s.tCellR}>{fmtNum(c.surface)} m2</Text>
              <Text style={s.tCellR}>{fmtEur(c.prixM2)}</Text>
              <Text style={s.tCellR}>{c.ecart}</Text>
            </View>
          ))}
        </>}

        <MarketContext commune={p.commune} prixM2={p.prixM2} transactions={p.transactions} tendance={p.tendance} />

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateEstimationPdfBlob(params: EstimationPdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<EstimationDoc p={params} />).toBlob();
}

export async function downloadEstimationPdf(params: EstimationPdfParams) {
  const blob = await generateEstimationPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `estimation-${params.commune.toLowerCase()}-${today()}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 2. FRAIS D'ACQUISITION ==================== */

export interface FraisPdfParams {
  prixAchat: number; droitsEnregistrement: number; droitTranscription: number;
  tva?: number; fraisNotaire: number; fraisHypotheque?: number;
  totalFrais: number; totalAcquisition: number; isVEFA?: boolean;
}

function FraisDoc({ p }: { p: FraisPdfParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Frais d'acquisition"
        subtitle={`${p.isVEFA ? "VEFA (TVA 3 %)" : "Ancien"} · ${fmtEur(p.prixAchat)}`}
        value={fmtEur(p.totalFrais)}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Frais d'acquisition" reference={ref} />

        <KpiGrid items={[
          { label: "Prix d'achat", value: fmtEur(p.prixAchat) },
          { label: "Total frais", value: fmtEur(p.totalFrais), highlight: true },
          { label: "Cout total acquisition", value: fmtEur(p.totalAcquisition), highlight: true },
          { label: "Part des frais", value: fmtPct((p.totalFrais / p.prixAchat) * 100) },
          ...(p.isVEFA ? [{ label: "Regime", value: "VEFA" }] : []),
        ]} />

        <Text style={s.section}>Detail des frais</Text>
        <Row label="Droits d'enregistrement" value={fmtEur(p.droitsEnregistrement)} />
        <Row label="Droit de transcription" value={fmtEur(p.droitTranscription)} />
        {p.tva != null && <Row label="TVA" value={fmtEur(p.tva)} />}
        <Row label="Frais de notaire" value={fmtEur(p.fraisNotaire)} />
        {p.fraisHypotheque != null && <Row label="Frais d'hypotheque" value={fmtEur(p.fraisHypotheque)} />}
        <RowHL label="Total des frais" value={fmtEur(p.totalFrais)} />
        <RowHL label="Cout total d'acquisition" value={fmtEur(p.totalAcquisition)} />

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateFraisPdfBlob(params: FraisPdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<FraisDoc p={params} />).toBlob();
}

export async function downloadFraisPdf(params: FraisPdfParams) {
  const blob = await generateFraisPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `frais-acquisition-${today()}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 3. PLUS-VALUES ==================== */

export interface PlusValuesPdfParams {
  prixAcquisition: number; prixCession: number;
  anneeAcquisition: number; anneeCession: number; dureeDetention: number;
  coefficientReeval?: number; prixAcquisitionReevalue?: number;
  plusValueBrute: number; abattement?: number; plusValueImposable: number;
  tauxImposition: number; impot: number; isSpeculative: boolean;
}

function PlusValuesDoc({ p }: { p: PlusValuesPdfParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Plus-value immobiliere"
        subtitle={`${p.anneeAcquisition} - ${p.anneeCession} · ${p.dureeDetention} ans · ${p.isSpeculative ? "Speculation" : "Long terme"}`}
        value={fmtEur(p.plusValueImposable)}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Plus-value immobiliere" reference={ref} />

        <KpiGrid items={[
          { label: "Plus-value imposable", value: fmtEur(p.plusValueImposable), highlight: true },
          { label: "Impot estime", value: fmtEur(p.impot), highlight: true },
          { label: "Net de cession", value: fmtEur(p.prixCession - p.impot) },
          { label: "Duree detention", value: `${p.dureeDetention} ans` },
          { label: "Taux imposition", value: fmtPct(p.tauxImposition) },
          { label: "Type", value: p.isSpeculative ? "Speculation" : "Long terme" },
        ]} />

        <Text style={s.section}>Transaction</Text>
        <Row label="Prix d'acquisition" value={fmtEur(p.prixAcquisition)} />
        <Row label="Prix de cession" value={fmtEur(p.prixCession)} />
        <Row label="Duree de detention" value={`${p.dureeDetention} ans (${p.anneeAcquisition} - ${p.anneeCession})`} />

        <Text style={s.section}>Calcul</Text>
        {p.coefficientReeval != null && <Row label="Coefficient de reevaluation" value={fmtNum(p.coefficientReeval, 4)} />}
        {p.prixAcquisitionReevalue != null && <Row label="Prix reevalue" value={fmtEur(p.prixAcquisitionReevalue)} />}
        <Row label="Plus-value brute" value={fmtEur(p.plusValueBrute)} />
        {p.abattement != null && <Row label="Abattement" value={fmtEur(p.abattement)} />}
        <RowHL label="Plus-value imposable" value={fmtEur(p.plusValueImposable)} />

        <Text style={s.section}>Imposition</Text>
        <Row label="Taux d'imposition" value={fmtPct(p.tauxImposition)} />
        <RowHL label="Impot estime" value={fmtEur(p.impot)} />
        <Row label="Net de cession" value={fmtEur(p.prixCession - p.impot)} />

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generatePlusValuesPdfBlob(params: PlusValuesPdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<PlusValuesDoc p={params} />).toBlob();
}

export async function downloadPlusValuesPdf(params: PlusValuesPdfParams) {
  const blob = await generatePlusValuesPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `plus-values-${today()}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 4. CALCULATEUR DE LOYER ==================== */

export interface LoyerPdfParams {
  capitalInvesti: number; surface: number; plafondLoyer: number;
  loyerMensuel: number; loyerM2: number; rendementBrut: number; commune?: string;
}

function LoyerDoc({ p }: { p: LoyerPdfParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Plafonnement du loyer"
        subtitle={`${p.commune ? p.commune + " · " : ""}${fmtNum(p.surface)} m2 · Capital ${fmtEur(p.capitalInvesti)}`}
        value={`${fmtEur(p.loyerMensuel)}/mois`}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Plafonnement du loyer" reference={ref} />

        <KpiGrid items={[
          { label: "Loyer mensuel max", value: fmtEur(p.loyerMensuel), highlight: true },
          { label: "Loyer au m2", value: `${fmtNum(p.loyerM2, 2)} EUR/m2` },
          { label: "Rendement brut", value: fmtPct(p.rendementBrut) },
          { label: "Capital investi", value: fmtEur(p.capitalInvesti) },
          { label: "Surface", value: `${fmtNum(p.surface)} m2` },
          { label: "Plafond annuel", value: fmtEur(p.plafondLoyer) },
        ]} />

        <Text style={s.section}>Parametres</Text>
        {p.commune && <Row label="Commune" value={p.commune} />}
        <Row label="Capital investi" value={fmtEur(p.capitalInvesti)} />
        <Row label="Surface habitable" value={`${fmtNum(p.surface)} m2`} />

        <Text style={s.section}>Resultats</Text>
        <Row label="Plafond annuel (5 % capital)" value={fmtEur(p.plafondLoyer)} />
        <RowHL label="Loyer mensuel max" value={fmtEur(p.loyerMensuel)} />
        <Row label="Loyer au m2" value={`${fmtNum(p.loyerM2, 2)} EUR/m2`} />
        <Row label="Rendement brut" value={fmtPct(p.rendementBrut)} />

        <Text style={s.note}>
          Base legale : loi modifiee du 21 septembre 2006 sur le bail a usage d&apos;habitation (art. 3 — plafond 5 % du capital investi).
        </Text>
        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateLoyerPdfBlob(params: LoyerPdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<LoyerDoc p={params} />).toBlob();
}

export async function downloadLoyerPdf(params: LoyerPdfParams) {
  const blob = await generateLoyerPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `loyer-plafond-${today()}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 5. ACHAT VS LOCATION ==================== */

export interface AchatLocationPdfParams {
  verdict: string; prixAchat: number; loyerMensuel: number;
  dureeAns: number; tauxCredit: number;
  patrimoineAchat: number; patrimoineLocation: number;
  crossoverYear?: number; economieAchat?: number;
}

function AchatLocationDoc({ p }: { p: AchatLocationPdfParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Achat vs Location"
        subtitle={`${fmtEur(p.prixAchat)} · ${fmtEur(p.loyerMensuel)}/mois · ${p.dureeAns} ans`}
        value={p.verdict}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Achat vs Location" reference={ref} />

        <KpiGrid items={[
          { label: "Verdict", value: p.verdict, highlight: true },
          { label: "Patrimoine achat", value: fmtEur(p.patrimoineAchat) },
          { label: "Patrimoine location", value: fmtEur(p.patrimoineLocation) },
          ...(p.crossoverYear != null ? [{ label: "Annee basculement", value: `Annee ${p.crossoverYear}` }] : []),
          ...(p.economieAchat != null ? [{ label: "Avantage achat", value: fmtEur(p.economieAchat) }] : []),
        ]} />

        <Text style={s.section}>Hypotheses</Text>
        <Row label="Prix d'achat" value={fmtEur(p.prixAchat)} />
        <Row label="Loyer mensuel" value={fmtEur(p.loyerMensuel)} />
        <Row label="Duree de projection" value={`${p.dureeAns} ans`} />
        <Row label="Taux de credit" value={fmtPct(p.tauxCredit)} />

        <Text style={s.section}>Resultats</Text>
        <RowHL label="Verdict" value={p.verdict} />
        <Row label="Patrimoine achat" value={fmtEur(p.patrimoineAchat)} />
        <Row label="Patrimoine location" value={fmtEur(p.patrimoineLocation)} />
        {p.crossoverYear != null && <Row label="Annee de basculement" value={`Annee ${p.crossoverYear}`} />}
        {p.economieAchat != null && <Row label="Avantage achat sur la duree" value={fmtEur(p.economieAchat)} />}

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateAchatLocationPdfBlob(params: AchatLocationPdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<AchatLocationDoc p={params} />).toBlob();
}

export async function downloadAchatLocationPdf(params: AchatLocationPdfParams) {
  const blob = await generateAchatLocationPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `achat-vs-location-${today()}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 6. SIMULATEUR D'AIDES ==================== */

export interface AidesPdfParams {
  profil: string; revenus?: string;
  aides: { label: string; montant: number; description?: string }[];
  totalAides: number; economiesFiscales?: number; totalAvantage?: number;
}

function AidesDoc({ p }: { p: AidesPdfParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Simulateur d'aides au logement"
        subtitle={`Profil ${p.profil}${p.revenus ? " · " + p.revenus : ""}`}
        value={fmtEur(p.totalAides)}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Simulateur d'aides au logement" reference={ref} />

        <KpiGrid items={[
          { label: "Total aides directes", value: fmtEur(p.totalAides), highlight: true },
          ...(p.economiesFiscales != null ? [{ label: "Economies fiscales", value: fmtEur(p.economiesFiscales) }] : []),
          ...(p.totalAvantage != null ? [{ label: "Avantage total", value: fmtEur(p.totalAvantage), highlight: true }] : []),
          { label: "Profil", value: p.profil },
        ]} />

        <Text style={s.section}>Aides identifiees</Text>
        {p.aides.map((a, i) => (
          <View key={i}>
            <Row label={a.label} value={fmtEur(a.montant)} />
            {a.description && <Text style={s.note}>{a.description}</Text>}
          </View>
        ))}
        <RowHL label="Total aides directes" value={fmtEur(p.totalAides)} />
        {p.economiesFiscales != null && <Row label="Economies fiscales estimees" value={fmtEur(p.economiesFiscales)} />}
        {p.totalAvantage != null && <RowHL label="Avantage total" value={fmtEur(p.totalAvantage)} />}

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateAidesPdfBlob(params: AidesPdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<AidesDoc p={params} />).toBlob();
}

export async function downloadAidesPdf(params: AidesPdfParams) {
  const blob = await generateAidesPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `aides-logement-${today()}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 7. BILAN PROMOTEUR ==================== */

export interface BilanPromoteurPdfParams {
  nomProjet?: string; surfaceTerrain: number; surfacePlancher: number; prixVenteM2: number;
  recettesTotales: number; coutConstruction: number; coutHonoraires: number;
  coutFinancement: number; coutCommercialisation: number; totalCouts: number;
  margeBrute: number; margePct: number; chargeFonciere: number; chargeFonciereM2: number;
}

function BilanPromoteurDoc({ p }: { p: BilanPromoteurPdfParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Bilan promoteur"
        subtitle={`${p.nomProjet ? p.nomProjet + " · " : ""}${fmtNum(p.surfacePlancher)} m2 plancher`}
        value={fmtEur(p.margeBrute)}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Bilan promoteur" reference={ref} />

        <KpiGrid items={[
          { label: "Recettes totales", value: fmtEur(p.recettesTotales) },
          { label: "Total couts", value: fmtEur(p.totalCouts) },
          { label: "Marge brute", value: fmtEur(p.margeBrute), highlight: true },
          { label: "Marge %", value: fmtPct(p.margePct) },
          { label: "Charge fonciere", value: fmtEur(p.chargeFonciere), highlight: true },
          { label: "Charge fonciere/m2", value: `${fmtEur(p.chargeFonciereM2)}/m2` },
        ]} />

        <Text style={s.section}>Projet{p.nomProjet ? ` — ${p.nomProjet}` : ""}</Text>
        <Row label="Surface terrain" value={`${fmtNum(p.surfaceTerrain)} m2`} />
        <Row label="Surface plancher" value={`${fmtNum(p.surfacePlancher)} m2`} />
        <Row label="Prix de vente moyen" value={`${fmtEur(p.prixVenteM2)}/m2`} />

        <Text style={s.section}>Recettes</Text>
        <RowHL label="Recettes totales" value={fmtEur(p.recettesTotales)} />

        <Text style={s.section}>Couts</Text>
        <Row label="Construction" value={fmtEur(p.coutConstruction)} />
        <Row label="Honoraires et etudes" value={fmtEur(p.coutHonoraires)} />
        <Row label="Financement" value={fmtEur(p.coutFinancement)} />
        <Row label="Commercialisation" value={fmtEur(p.coutCommercialisation)} />
        <RowHL label="Total couts (hors foncier)" value={fmtEur(p.totalCouts)} />

        <Text style={s.section}>Resultat</Text>
        <RowHL label="Charge fonciere residuelle" value={fmtEur(p.chargeFonciere)} />
        <Row label="Charge fonciere au m2 terrain" value={`${fmtEur(p.chargeFonciereM2)}/m2`} />

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateBilanPromoteurPdfBlob(params: BilanPromoteurPdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<BilanPromoteurDoc p={params} />).toBlob();
}

export async function downloadBilanPromoteurPdf(params: BilanPromoteurPdfParams) {
  const blob = await generateBilanPromoteurPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `bilan-promoteur-${today()}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 8. OUTILS BANCAIRES ==================== */

export interface BancairePdfParams {
  prixBien: number; apport: number; montantCredit: number;
  dureeAns: number; tauxNominal: number; mensualite: number;
  coutTotal: number; coutInterets: number;
  ltv: number; tauxEndettement: number; capaciteMax?: number;
}

function BancaireDoc({ p }: { p: BancairePdfParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Simulation bancaire"
        subtitle={`${fmtEur(p.montantCredit)} · ${p.dureeAns} ans · ${fmtPct(p.tauxNominal, 2)}`}
        value={`${fmtEur(p.mensualite)}/mois`}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Simulation bancaire" reference={ref} />

        <KpiGrid items={[
          { label: "Mensualite", value: fmtEur(p.mensualite), highlight: true },
          { label: "Cout total credit", value: fmtEur(p.coutTotal) },
          { label: "Total interets", value: fmtEur(p.coutInterets) },
          { label: "LTV", value: fmtPct(p.ltv) },
          { label: "Taux endettement", value: fmtPct(p.tauxEndettement) },
          ...(p.capaciteMax != null ? [{ label: "Capacite max", value: fmtEur(p.capaciteMax) }] : []),
        ]} />

        <Text style={s.section}>Parametres du pret</Text>
        <Row label="Prix du bien" value={fmtEur(p.prixBien)} />
        <Row label="Apport personnel" value={fmtEur(p.apport)} />
        <Row label="Montant emprunte" value={fmtEur(p.montantCredit)} />
        <Row label="Duree" value={`${p.dureeAns} ans`} />
        <Row label="Taux nominal" value={fmtPct(p.tauxNominal, 2)} />

        <Text style={s.section}>Resultats</Text>
        <RowHL label="Mensualite" value={fmtEur(p.mensualite)} />
        <Row label="Cout total du credit" value={fmtEur(p.coutTotal)} />
        <Row label="Total interets payes" value={fmtEur(p.coutInterets)} />
        {p.capaciteMax != null && <RowHL label="Capacite d'emprunt max" value={fmtEur(p.capaciteMax)} />}

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateBancairePdfBlob(params: BancairePdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<BancaireDoc p={params} />).toBlob();
}

export async function downloadBancairePdf(params: BancairePdfParams) {
  const blob = await generateBancairePdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `simulation-bancaire-${today()}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 9. DCF MULTI-TENANT ==================== */

export interface DcfMultiPdfParams {
  nomBien?: string;
  baux: { locataire: string; loyer: number; echeance: string }[];
  loyerTotal: number; tauxActualisation: number;
  valeurDCF: number; valeurTerminale: number; valeurTotale: number;
  tri?: number; rendement?: number;
}

function DcfMultiDoc({ p }: { p: DcfMultiPdfParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="DCF Multi-locataires"
        subtitle={`${p.nomBien ? p.nomBien + " · " : ""}${p.baux.length} baux · Taux ${fmtPct(p.tauxActualisation, 2)}`}
        value={fmtEur(p.valeurTotale)}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="DCF Multi-locataires" reference={ref} />

        <KpiGrid items={[
          { label: "Valeur totale", value: fmtEur(p.valeurTotale), highlight: true },
          { label: "Valeur flux actualises", value: fmtEur(p.valeurDCF) },
          { label: "Valeur terminale", value: fmtEur(p.valeurTerminale) },
          { label: "Loyer total annuel", value: fmtEur(p.loyerTotal) },
          ...(p.tri != null ? [{ label: "TRI", value: fmtPct(p.tri, 2) }] : []),
          ...(p.rendement != null ? [{ label: "Rendement initial", value: fmtPct(p.rendement, 2) }] : []),
        ]} />

        {p.nomBien && <Row label="Bien" value={p.nomBien} />}

        <Text style={s.section}>Baux en cours</Text>
        {p.baux.map((b, i) => <Row key={i} label={`${b.locataire} (ech. ${b.echeance})`} value={`${fmtEur(b.loyer)}/an`} />)}
        <RowHL label="Loyer total annuel" value={fmtEur(p.loyerTotal)} />

        <Text style={s.section}>Valorisation DCF</Text>
        <Row label="Taux d'actualisation" value={fmtPct(p.tauxActualisation, 2)} />
        <Row label="Valeur flux actualises" value={fmtEur(p.valeurDCF)} />
        <Row label="Valeur terminale" value={fmtEur(p.valeurTerminale)} />
        <RowHL label="Valeur totale" value={fmtEur(p.valeurTotale)} />

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateDcfMultiPdfBlob(params: DcfMultiPdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<DcfMultiDoc p={params} />).toBlob();
}

export async function downloadDcfMultiPdf(params: DcfMultiPdfParams) {
  const blob = await generateDcfMultiPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `dcf-multi-${today()}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 10. DONNEES MARCHE ==================== */

export interface MarchePdfParams {
  commune: string; trimestre?: string;
  prixMedianAppart?: number; prixMedianMaison?: number;
  volumeTransactions?: number; evolutionPct?: number;
  prixM2Appart?: number; prixM2Maison?: number;
  indicateurs?: { label: string; value: string }[];
}

function MarcheDoc({ p }: { p: MarchePdfParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Donnees de marche"
        subtitle={`${p.commune}${p.trimestre ? " · " + p.trimestre : ""}`}
        value={p.prixMedianAppart != null ? `${fmtEur(p.prixMedianAppart)} median appt.` : undefined}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Donnees de marche" reference={ref} />

        <KpiGrid items={[
          ...(p.prixMedianAppart != null ? [{ label: "Prix median appart.", value: fmtEur(p.prixMedianAppart), highlight: true }] : []),
          ...(p.prixMedianMaison != null ? [{ label: "Prix median maison", value: fmtEur(p.prixMedianMaison) }] : []),
          ...(p.prixM2Appart != null ? [{ label: "Prix m2 appart.", value: `${fmtEur(p.prixM2Appart)}/m2` }] : []),
          ...(p.prixM2Maison != null ? [{ label: "Prix m2 maison", value: `${fmtEur(p.prixM2Maison)}/m2` }] : []),
          ...(p.volumeTransactions != null ? [{ label: "Transactions", value: fmtNum(p.volumeTransactions) }] : []),
          ...(p.evolutionPct != null ? [{ label: "Evolution annuelle", value: `${p.evolutionPct > 0 ? "+" : ""}${fmtPct(p.evolutionPct)}` }] : []),
        ]} />

        <Text style={s.section}>{p.commune}{p.trimestre ? ` — ${p.trimestre}` : ""}</Text>
        {p.prixMedianAppart != null && <Row label="Prix median appartement" value={fmtEur(p.prixMedianAppart)} />}
        {p.prixMedianMaison != null && <Row label="Prix median maison" value={fmtEur(p.prixMedianMaison)} />}
        {p.prixM2Appart != null && <Row label="Prix m2 appartement" value={`${fmtEur(p.prixM2Appart)}/m2`} />}
        {p.prixM2Maison != null && <Row label="Prix m2 maison" value={`${fmtEur(p.prixM2Maison)}/m2`} />}
        {p.volumeTransactions != null && <Row label="Volume de transactions" value={fmtNum(p.volumeTransactions)} />}
        {p.evolutionPct != null && <Row label="Evolution annuelle" value={`${p.evolutionPct > 0 ? "+" : ""}${fmtPct(p.evolutionPct)}`} />}

        {p.indicateurs && p.indicateurs.length > 0 && <>
          <Text style={s.section}>Indicateurs cles</Text>
          {p.indicateurs.map((ind, i) => <Row key={i} label={ind.label} value={ind.value} />)}
        </>}

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateMarchePdfBlob(params: MarchePdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<MarcheDoc p={params} />).toBlob();
}

export async function downloadMarchePdf(params: MarchePdfParams) {
  const blob = await generateMarchePdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `marche-${params.commune.toLowerCase()}-${today()}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 11. CARTE DES PRIX ==================== */

export interface CartePdfParams {
  commune: string; prixMoyenM2: number; prixMedianM2?: number;
  nbTransactions?: number; fourchetteBasse?: number; fourchetteHaute?: number;
  classement?: string; details?: { label: string; value: string }[];
}

function CarteDoc({ p }: { p: CartePdfParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Carte des prix"
        subtitle={`Fiche commune · ${p.commune}`}
        value={`${fmtEur(p.prixMoyenM2)}/m2`}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Carte des prix — Fiche commune" reference={ref} />

        <KpiGrid items={[
          { label: "Prix moyen au m2", value: `${fmtEur(p.prixMoyenM2)}/m2`, highlight: true },
          ...(p.prixMedianM2 != null ? [{ label: "Prix median au m2", value: `${fmtEur(p.prixMedianM2)}/m2` }] : []),
          ...(p.fourchetteBasse != null && p.fourchetteHaute != null ? [{ label: "Fourchette", value: `${fmtEur(p.fourchetteBasse)} - ${fmtEur(p.fourchetteHaute)}/m2` }] : []),
          ...(p.nbTransactions != null ? [{ label: "Transactions", value: fmtNum(p.nbTransactions) }] : []),
          ...(p.classement ? [{ label: "Classement national", value: p.classement }] : []),
        ]} />

        <Text style={s.section}>{p.commune}</Text>
        <RowHL label="Prix moyen au m2" value={`${fmtEur(p.prixMoyenM2)}/m2`} />
        {p.prixMedianM2 != null && <Row label="Prix median au m2" value={`${fmtEur(p.prixMedianM2)}/m2`} />}
        {p.fourchetteBasse != null && p.fourchetteHaute != null && (
          <Row label="Fourchette" value={`${fmtEur(p.fourchetteBasse)} - ${fmtEur(p.fourchetteHaute)}/m2`} />
        )}
        {p.nbTransactions != null && <Row label="Nombre de transactions" value={fmtNum(p.nbTransactions)} />}
        {p.classement && <Row label="Classement national" value={p.classement} />}

        {p.details && p.details.length > 0 && <>
          <Text style={s.section}>Details</Text>
          {p.details.map((d, i) => <Row key={i} label={d.label} value={d.value} />)}
        </>}

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateCartePdfBlob(params: CartePdfParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<CarteDoc p={params} />).toBlob();
}

export async function downloadCartePdf(params: CartePdfParams) {
  const blob = await generateCartePdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `carte-prix-${params.commune.toLowerCase()}-${today()}.pdf`; a.click();
  URL.revokeObjectURL(url);
}
