"use client";

import { useState } from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import type {
  ImpactResponse,
  ClasseImpact,
  RenovationResponse,
  CommunauteResponse,
} from "@/lib/energy-api";

// ---------- Formatting helpers (French locale) ----------

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number, d = 0) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d }).format(n);

const fmtPct = (n: number, d = 1) => `${n.toFixed(d)} %`;

const today = () => new Date().toLocaleDateString("fr-LU");

export const generateRef = () =>
  `TVX-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

// ---------- Shared styles ----------

const s = StyleSheet.create({
  page: { paddingTop: 50, paddingBottom: 60, paddingHorizontal: 40, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a2e" },
  // Cover page
  coverPage: { padding: 0 },
  coverTop: { backgroundColor: "#1B2A4A", height: "60%", padding: 50, justifyContent: "flex-end" as const },
  coverLogo: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, marginBottom: 30 },
  coverLogoBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#C8A951", display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const },
  coverLogoText: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#0F1B33" },
  coverLogoName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "white" },
  coverTitle: { fontSize: 28, color: "white", fontFamily: "Helvetica-Bold" },
  coverSubtitle: { fontSize: 13, color: "#9CA3AF", marginTop: 6 },
  coverValue: { fontSize: 36, color: "#C8A951", fontFamily: "Helvetica-Bold", marginTop: 12 },
  coverBottom: { padding: 50, flex: 1, justifyContent: "flex-end" as const },
  coverDate: { fontSize: 10, color: "#334155", marginBottom: 4 },
  coverRef: { fontSize: 9, color: "#6B7280", marginBottom: 12 },
  coverDisclaimer: { fontSize: 8, color: "#9CA3AF", lineHeight: 1.4 },
  // Page header (repeating)
  pageHeader: { flexDirection: "row" as const, justifyContent: "space-between" as const, borderBottom: "1.5pt solid #1B2A4A", paddingBottom: 8, marginBottom: 16 },
  pageHeaderTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1B2A4A" },
  pageHeaderRef: { fontSize: 8, color: "#6B7280" },
  // Legacy header (kept for compat)
  header: { borderBottom: "2pt solid #1B2A4A", paddingBottom: 12, marginBottom: 20 },
  logoRow: { flexDirection: "row" as const, alignItems: "center", gap: 8, marginBottom: 8 },
  logoBox: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#C8A951", display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const },
  logoText: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0F1B33" },
  logoName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1B2A4A" },
  logoGold: { color: "#C8A951" },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#1B2A4A" },
  subtitle: { fontSize: 9, color: "#6B7280", marginTop: 2 },
  section: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1B2A4A", marginTop: 16, marginBottom: 8, paddingBottom: 4, borderBottom: "1pt solid #e5e2db" },
  row: { flexDirection: "row" as const, justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5pt solid #f0f0f0" },
  rowHL: { flexDirection: "row" as const, justifyContent: "space-between", paddingVertical: 5, borderTop: "1.5pt solid #C8A951", marginTop: 4, backgroundColor: "#FAFAF8" },
  label: { color: "#334155", flex: 1 },
  value: { fontFamily: "Helvetica-Bold", textAlign: "right" as const },
  valueLg: { fontFamily: "Helvetica-Bold", fontSize: 12, textAlign: "right" as const, color: "#1B2A4A" },
  note: { fontSize: 8, color: "#6B7280", marginTop: 4, lineHeight: 1.4 },
  disclaimer: { fontSize: 7, color: "#9CA3AF", marginTop: 20, paddingTop: 8, borderTop: "0.5pt solid #e5e2db", lineHeight: 1.4 },
  // Footer with page numbers
  footer: { position: "absolute" as const, bottom: 20, left: 40, right: 40, flexDirection: "row" as const, justifyContent: "space-between" as const, borderTop: "0.5pt solid #e5e2db", paddingTop: 6 },
  footerLeft: { fontSize: 7, color: "#9CA3AF" },
  footerRight: { fontSize: 7, color: "#9CA3AF" },
  grid: { flexDirection: "row" as const, gap: 8, marginTop: 4 },
  cell: { flex: 1, padding: 6, backgroundColor: "#F8F7F4", borderRadius: 4 },
  cellLabel: { fontSize: 7, color: "#6B7280" },
  cellValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1B2A4A", marginTop: 2 },
  tHead: { flexDirection: "row" as const, backgroundColor: "#F8F7F4", paddingVertical: 4, paddingHorizontal: 6, borderBottom: "1pt solid #e5e2db" },
  tRow: { flexDirection: "row" as const, paddingVertical: 3, paddingHorizontal: 6, borderBottom: "0.5pt solid #f0f0f0" },
  tCell: { flex: 1, fontSize: 8 },
  tCellR: { flex: 1, fontSize: 8, textAlign: "right" as const },
  tCellB: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold" },
  check: { fontSize: 8, color: "#16a34a", marginRight: 4 },
});

// ---------- Shared exported components ----------

export function CoverPage({ title, subtitle, value, date, reference }: { title: string; subtitle?: string; value?: string; date: string; reference: string }) {
  return (
    <Page size="A4" style={s.coverPage}>
      <View style={s.coverTop}>
        <View style={s.coverLogo}>
          <View style={s.coverLogoBox}><Text style={s.coverLogoText}>T</Text></View>
          <Text style={s.coverLogoName}>tevaxia.lu</Text>
        </View>
        <Text style={s.coverTitle}>{title}</Text>
        {subtitle && <Text style={s.coverSubtitle}>{subtitle}</Text>}
        {value && <Text style={s.coverValue}>{value}</Text>}
      </View>
      <View style={s.coverBottom}>
        <Text style={s.coverDate}>{date}</Text>
        <Text style={s.coverRef}>Ref. {reference}</Text>
        <Text style={s.coverDisclaimer}>Rapport indicatif genere par tevaxia.lu — ne constitue pas un conseil en evaluation</Text>
      </View>
    </Page>
  );
}

export function KpiGrid({ items }: { items: { label: string; value: string; highlight?: boolean }[] }) {
  return (
    <View style={{ flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8, marginVertical: 8 }}>
      {items.map((item, i) => (
        <View key={i} style={{
          width: "30%", padding: 10, borderRadius: 4,
          backgroundColor: item.highlight ? "#1B2A4A" : "#F8F7F4",
          borderLeft: item.highlight ? "4pt solid #C8A951" : "none",
        }}>
          <Text style={{ fontSize: 7, color: item.highlight ? "#C8A951" : "#6B7280" }}>{item.label}</Text>
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: item.highlight ? "white" : "#1B2A4A", marginTop: 3 }}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function PageHeader({ title, reference }: { title: string; reference: string }) {
  return (
    <View style={s.pageHeader} fixed>
      <Text style={s.pageHeaderTitle}>{title}</Text>
      <Text style={s.pageHeaderRef}>{reference}</Text>
    </View>
  );
}

export function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerLeft}>tevaxia.lu — Simulateurs immobiliers Luxembourg</Text>
      <Text style={s.footerRight} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function Disclaimer() {
  return (
    <Text style={s.disclaimer}>
      Ce document est genere automatiquement par energy.tevaxia.lu a titre informatif.
      Les resultats dependent des parametres saisis et des hypotheses de calcul. Les montants d&apos;aides
      (Klimabonus, Klimapret) sont bases sur la reglementation luxembourgeoise en vigueur et peuvent evoluer.
      Pour un audit energetique officiel, consultez un conseiller en energie agree.
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
        Les montants d&apos;aides (Klimabonus, Klimapret, subventions) sont bases sur la reglementation
        luxembourgeoise en vigueur a la date de generation du rapport et peuvent evoluer.
      </Text>
      <Text style={{ fontSize: 9, color: "#334155", lineHeight: 1.6, marginTop: 12 }}>
        Pour toute decision engageante, consultez un professionnel agree : evaluateur REV/TEGOVA,
        conseiller en energie, notaire ou conseiller financier.
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
      <Text style={{ ...s.label, fontFamily: "Helvetica-Bold" }}>{label}</Text>
      <Text style={s.valueLg}>{v}</Text>
    </View>
  );
}

// ---------- 1. Impact CPE ----------

function ImpactDoc({ result, classeActuelle, valeur }: { result: ImpactResponse; classeActuelle: string; valeur: number }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Impact CPE sur la valeur"
        subtitle={`Classe ${classeActuelle} · ${fmtEur(valeur)}`}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Impact CPE sur la valeur" reference={ref} />

        <KpiGrid items={[
          { label: "Valeur du bien", value: fmtEur(valeur), highlight: true },
          { label: "Classe actuelle", value: classeActuelle },
          { label: "Classes analysees", value: String(result.classes.length) },
        ]} />

        <Text style={s.section}>Impact par classe energetique</Text>
        <View style={s.tHead}>
          <Text style={s.tCellB}>Classe</Text>
          <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Ajustement</Text>
          <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Valeur ajustee</Text>
          <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Delta</Text>
        </View>
        {result.classes.map((c: ClasseImpact) => (
          <View key={c.classe} style={c.classe === classeActuelle ? { ...s.tRow, backgroundColor: "#FAFAF8" } : s.tRow}>
            <Text style={c.classe === classeActuelle ? s.tCellB : s.tCell}>{c.classe}{c.classe === classeActuelle ? " (actuelle)" : ""}</Text>
            <Text style={s.tCellR}>{c.ajustementPct > 0 ? "+" : ""}{fmtPct(c.ajustementPct)}</Text>
            <Text style={s.tCellR}>{fmtEur(c.valeurAjustee)}</Text>
            <Text style={s.tCellR}>{c.delta > 0 ? "+" : ""}{fmtEur(c.delta)}</Text>
          </View>
        ))}

        <Text style={{ ...s.note, marginTop: 12 }}>
          Methodologie : {result.methodologie}
        </Text>
        {result.sources.length > 0 && (
          <Text style={s.note}>Sources : {result.sources.join(" ; ")}</Text>
        )}

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateImpactPdfBlob(result: ImpactResponse, classeActuelle: string, valeur: number): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<ImpactDoc result={result} classeActuelle={classeActuelle} valeur={valeur} />).toBlob();
}

export async function downloadImpactPdf(result: ImpactResponse, classeActuelle: string, valeur: number) {
  const blob = await generateImpactPdfBlob(result, classeActuelle, valeur);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-impact-cpe-${today()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- 2. Renovation ROI ----------

interface RenovationParams {
  classeActuelle: string;
  classeCible: string;
  surface: number;
  anneeConstruction: number;
  valeurBien: number;
}

function RenovationDoc({ result, params }: { result: RenovationResponse; params: RenovationParams }) {
  const ref = generateRef();
  return (
    <Document>
      {/* Page 1: Cover */}
      <CoverPage
        title="ROI Renovation energetique"
        subtitle={`${result.sautClasse} · ${fmtNum(params.surface)} m2 · ${params.anneeConstruction}`}
        value={fmtEur(result.totalProjet)}
        date={today()}
        reference={ref}
      />

      {/* Page 2: Synthese + KPIs */}
      <Page size="A4" style={s.page}>
        <PageHeader title="ROI Renovation energetique" reference={ref} />

        <Text style={s.section}>Synthese du projet</Text>
        <KpiGrid items={[
          { label: "Total projet", value: fmtEur(result.totalProjet), highlight: true },
          { label: "Gain valeur", value: fmtEur(result.gainValeur) },
          { label: "ROI", value: fmtPct(result.roiPct) },
          { label: "Duree retour", value: `${fmtNum(result.paybackAnnees, 1)} ans` },
          { label: "Economie/an", value: fmtEur(result.economieAnnuelleEur) },
          { label: "CO2 evite", value: `${fmtNum(result.economieAnnuelleKwh * 0.233)} kg/an` },
        ]} />

        <Text style={s.section}>Postes de travaux</Text>
        <View style={s.tHead}>
          <Text style={{ ...s.tCellB, flex: 2 }}>Poste</Text>
          <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Min</Text>
          <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Max</Text>
          <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Moyen</Text>
        </View>
        {result.postes.map((p) => (
          <View key={p.label} style={s.tRow}>
            <Text style={{ ...s.tCell, flex: 2 }}>{p.label}</Text>
            <Text style={s.tCellR}>{fmtEur(p.coutMin)}</Text>
            <Text style={s.tCellR}>{fmtEur(p.coutMax)}</Text>
            <Text style={s.tCellR}>{fmtEur(p.coutMoyen)}</Text>
          </View>
        ))}
        <RowHL label="Total projet (travaux + honoraires)" value={fmtEur(result.totalProjet)} />

        <Text style={{ ...s.note, marginTop: 8 }}>
          Fourchette de couts basee sur les prix moyens du marche luxembourgeois — {fmtNum(params.surface)} m2, construction {params.anneeConstruction}.
        </Text>

        <Footer />
      </Page>

      {/* Page 3: Aides & Rentabilite */}
      <Page size="A4" style={s.page}>
        <PageHeader title="ROI Renovation energetique" reference={ref} />

        <Text style={s.section}>Aides financieres</Text>
        <Row label={`Klimabonus (${result.klimabonus.description})`} value={fmtEur(result.klimabonus.montant)} />
        <Row label={`Klimapret (${fmtPct(result.klimapret.taux)} sur ${result.klimapret.dureeMois} mois)`} value={`jusqu'a ${fmtEur(result.klimapret.montantMax)}`} />
        <Row label="Subvention conseil energie" value={fmtEur(result.subventionConseil)} />

        <KpiGrid items={[
          { label: "Total aides", value: fmtEur(result.totalAides), highlight: true },
          { label: "Reste a charge", value: fmtEur(result.resteACharge), highlight: true },
        ]} />

        <Text style={s.section}>Rentabilite long terme</Text>
        <Row label="Economie annuelle" value={`${fmtNum(result.economieAnnuelleKwh)} kWh — ${fmtEur(result.economieAnnuelleEur)}`} />

        <KpiGrid items={[
          { label: "Payback", value: `${fmtNum(result.paybackAnnees, 1)} ans` },
          { label: "VAN sur 20 ans", value: fmtEur(result.van20ans) },
          { label: "TRI", value: fmtPct(result.triPct) },
        ]} />

        <Text style={s.section}>Plus-value et ROI</Text>
        <Row label="Gain valeur" value={fmtEur(result.gainValeur)} />
        <Row label="Gain en %" value={`+${fmtPct(result.gainValeurPct)}`} />
        <RowHL label="ROI global" value={fmtPct(result.roiPct)} />

        <Footer />
      </Page>

      {/* Page 4: Disclaimer */}
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateRenovationPdfBlob(result: RenovationResponse, params: RenovationParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<RenovationDoc result={result} params={params} />).toBlob();
}

export async function downloadRenovationPdf(result: RenovationResponse, params: RenovationParams) {
  const blob = await generateRenovationPdfBlob(result, params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-renovation-roi-${today()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- 3. Communaute d'energie ----------

interface CommunauteParams {
  nbParticipants: number;
  puissancePV: number;
  consoMoyenneParParticipant: number;
  tarifReseau: number;
  tarifPartage: number;
}

function CommunauteDoc({ result, params }: { result: CommunauteResponse; params: CommunauteParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Communaute d'energie"
        subtitle={`${params.nbParticipants} participants · ${fmtNum(params.puissancePV)} kWc`}
        value={fmtEur(result.economieTotale)}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Communaute d'energie" reference={ref} />

        <Text style={s.section}>Parametres</Text>
        <Row label="Participants" value={String(params.nbParticipants)} />
        <Row label="Puissance PV installee" value={`${fmtNum(params.puissancePV)} kWc`} />
        <Row label="Consommation moyenne / participant" value={`${fmtNum(params.consoMoyenneParParticipant)} kWh/an`} />
        <Row label="Tarif reseau" value={`${fmtNum(params.tarifReseau, 4)} EUR/kWh`} />
        <Row label="Tarif partage" value={`${fmtNum(params.tarifPartage, 4)} EUR/kWh`} />

        <Text style={s.section}>Resultats cles</Text>
        <KpiGrid items={[
          { label: "Production annuelle", value: `${fmtNum(result.productionAnnuelle)} kWh` },
          { label: "Autoconsommation", value: fmtPct(result.tauxAutoConsoPct) },
          { label: "Couverture", value: fmtPct(result.tauxCouverturePct) },
          { label: "Economie totale", value: fmtEur(result.economieTotale), highlight: true },
          { label: "Economie / participant", value: fmtEur(result.economieParParticipant) },
          { label: "CO2 evite", value: `${fmtNum(result.co2EviteKg)} kg/an` },
        ]} />

        <Row label="Energie autoconsommee" value={`${fmtNum(result.energieAutoconsommee)} kWh`} />
        <Row label="Surplus injecte" value={`${fmtNum(result.surplus)} kWh`} />
        <Row label="Revenu surplus" value={fmtEur(result.revenuSurplus)} />

        <Text style={s.section}>Investissement</Text>
        <Row label="Cout installation HTVA" value={fmtEur(result.coutInstallationHTVA)} />
        <Row label="TVA" value={fmtEur(result.coutInstallationTVA)} />
        <RowHL label="Cout TTC" value={fmtEur(result.coutInstallationTTC)} />
        <Row label="Cout par participant" value={fmtEur(result.coutParParticipant)} />
        <Row label="Payback global" value={`${fmtNum(result.paybackGlobalAnnees, 1)} ans`} />

        <Text style={s.section}>Conformite reglementaire</Text>
        <Row label="Statut juridique" value={result.conformite.statutJuridique} />
        <Row label="Perimetre" value={result.conformite.perimetre} />
        <Row label="Contrat de repartition" value={result.conformite.contratRepartition} />
        <Row label="Declaration ILR" value={result.conformite.declarationILR} />
        <Text style={{ ...s.note, marginTop: 6 }}>
          Base legale : {result.conformite.loiReference} — {result.conformite.reglementILR}
        </Text>

        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateCommunautePdfBlob(result: CommunauteResponse, params: CommunauteParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<CommunauteDoc result={result} params={params} />).toBlob();
}

export async function downloadCommunautePdf(result: CommunauteResponse, params: CommunauteParams) {
  const blob = await generateCommunautePdfBlob(result, params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-communaute-${today()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- EPBD PDF ----------

interface EpbdParams {
  classe: string;
  riskLevel: string;
  riskDescription: string;
  nonComplianceYear: string;
  actions: string[];
  valueImpact: string;
}

function EpbdDoc({ params }: { params: EpbdParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Directive EPBD"
        subtitle={`Risque de stranding · Classe ${params.classe}`}
        value={params.riskLevel}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="EPBD — Risque de stranding" reference={ref} />

        <KpiGrid items={[
          { label: "Classe energetique", value: params.classe, highlight: true },
          { label: "Niveau de risque", value: params.riskLevel },
          { label: "Echeance", value: params.nonComplianceYear },
        ]} />

        <Text style={s.section}>Profil de risque</Text>
        <View style={s.row}><Text style={s.label}>{params.riskDescription}</Text></View>

        <Text style={s.section}>Actions recommandees</Text>
        {params.actions.map((a, i) => (
          <View key={i} style={s.row}><Text style={s.label}>{i + 1}. {a}</Text></View>
        ))}

        <Text style={s.section}>Impact estime sur la valeur</Text>
        <View style={s.row}><Text style={s.label}>{params.valueImpact}</Text></View>

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateEpbdPdfBlob(params: EpbdParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<EpbdDoc params={params} />).toBlob();
}

export async function downloadEpbdPdf(params: EpbdParams) {
  const blob = await generateEpbdPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-epbd-classe-${params.classe}-${today()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- LENOZ PDF ----------

interface LenozParams {
  totalScore: number;
  maxScore: number;
  rating: string;
  categories: { title: string; score: number; max: number }[];
}

function LenozDoc({ params }: { params: LenozParams }) {
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Scoring LENOZ simplifie"
        subtitle={`Notation ${params.rating}`}
        value={`${params.totalScore} / ${params.maxScore}`}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Scoring LENOZ simplifie" reference={ref} />

        <KpiGrid items={[
          { label: "Score global", value: `${params.totalScore} / ${params.maxScore}`, highlight: true },
          { label: "Notation", value: params.rating },
          { label: "Pourcentage", value: fmtPct((params.totalScore / params.maxScore) * 100) },
        ]} />

        <Text style={s.section}>Detail par categorie</Text>
        {params.categories.map((cat) => (
          <Row key={cat.title} label={cat.title} value={`${cat.score} / ${cat.max}`} />
        ))}

        <Text style={s.note}>
          Estimation simplifiee — la certification LENOZ officielle requiert un audit complet par un organisme agree (143 criteres).
        </Text>
        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generateLenozPdfBlob(params: LenozParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<LenozDoc params={params} />).toBlob();
}

export async function downloadLenozPdf(params: LenozParams) {
  const blob = await generateLenozPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-lenoz-${params.rating.toLowerCase()}-${today()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Portfolio PDF ----------

interface PortfolioProperty {
  nom: string;
  classe: string;
  surface: number;
  valeur: number;
}

interface PortfolioParams {
  properties: PortfolioProperty[];
  averageScore: string;
  totalValeur: number;
  totalConso: number;
  totalCO2: number;
  worstCount: number;
}

function PortfolioDoc({ params }: { params: PortfolioParams }) {
  const IMPACT: Record<string, number> = { A: 8, B: 5, C: 2, D: 0, E: -3, F: -7, G: -12, H: -18, I: -25 };
  const ref = generateRef();
  return (
    <Document>
      <CoverPage
        title="Portfolio energetique"
        subtitle={`${params.properties.length} biens · Score moyen ${params.averageScore}`}
        value={fmtEur(params.totalValeur)}
        date={today()}
        reference={ref}
      />
      <Page size="A4" style={s.page}>
        <PageHeader title="Portfolio energetique" reference={ref} />

        <KpiGrid items={[
          { label: "Biens", value: String(params.properties.length) },
          { label: "Score moyen", value: params.averageScore, highlight: true },
          { label: "Valeur totale", value: fmtEur(params.totalValeur) },
          { label: "CO2 total", value: `${fmtNum(params.totalCO2)} kg/an` },
          { label: "Conso totale", value: `${fmtNum(params.totalConso)} kWh` },
          { label: "Worst performers", value: String(params.worstCount) },
        ]} />

        {params.worstCount > 0 && (
          <Text style={{ fontSize: 8, color: "#dc2626", marginTop: 8 }}>
            {params.worstCount} bien(s) classe(s) worst performers (F-I) — renovation requise avant 2033 (directive EPBD).
          </Text>
        )}

        <Text style={s.section}>Detail des biens</Text>
        <View style={s.tHead}>
          <Text style={{ ...s.tCellB, flex: 2 }}>Nom</Text>
          <Text style={s.tCellB}>Classe</Text>
          <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Surface</Text>
          <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Valeur</Text>
          <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Impact</Text>
        </View>
        {params.properties.map((p, i) => (
          <View key={i} style={s.tRow}>
            <Text style={{ ...s.tCell, flex: 2 }}>{p.nom}</Text>
            <Text style={s.tCell}>{p.classe}</Text>
            <Text style={s.tCellR}>{fmtNum(p.surface)} m2</Text>
            <Text style={s.tCellR}>{fmtEur(p.valeur)}</Text>
            <Text style={s.tCellR}>{IMPACT[p.classe] !== undefined ? `${IMPACT[p.classe] > 0 ? "+" : ""}${IMPACT[p.classe]}%` : "—"}</Text>
          </View>
        ))}

        <Disclaimer />
        <Footer />
      </Page>
      <DisclaimerPage reference={ref} />
    </Document>
  );
}

export async function generatePortfolioPdfBlob(params: PortfolioParams): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<PortfolioDoc params={params} />).toBlob();
}

export async function downloadPortfolioPdf(params: PortfolioParams) {
  const blob = await generatePortfolioPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-portfolio-${today()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- PdfButton component (gated behind auth) ----------

export function PdfButton({ onClick, label, generateBlob, filename }: { onClick?: () => void; label: string; generateBlob?: () => Promise<Blob>; filename?: string }) {
  const { user } = useAuth();
  const [showGate, setShowGate] = useState(false);

  const gatedAction = (action: () => void) => {
    if (user) {
      action();
    } else {
      setShowGate(true);
    }
  };

  const handlePreview = async () => {
    if (!generateBlob) return;
    const blob = await generateBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownload = async () => {
    if (generateBlob && filename) {
      const blob = await generateBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else if (onClick) {
      onClick();
    }
  };

  // New dual-button mode when generateBlob is provided
  if (generateBlob) {
    return (
      <>
        <div className="inline-flex items-center rounded-lg border border-card-border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => gatedAction(handlePreview)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-navy-800 bg-white transition hover:bg-gray-50 active:scale-95 border-r border-card-border"
            title="Previsualiser"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Previsualiser
          </button>
          <button
            type="button"
            onClick={() => gatedAction(handleDownload)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-navy-800 transition hover:bg-navy-700 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {label}
          </button>
        </div>

        {showGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-xl border border-card-border bg-card p-6 shadow-xl">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <p className="text-sm text-muted">
                  Creez un compte gratuit pour telecharger vos rapports PDF
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <a
                  href="/connexion"
                  className="block w-full rounded-lg bg-navy-800 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-navy-700"
                >
                  Creer un compte
                </a>
                <button
                  type="button"
                  onClick={() => setShowGate(false)}
                  className="w-full rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-background"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Legacy single-button mode (backward compat)
  return (
    <>
      <button
        type="button"
        onClick={() => gatedAction(() => onClick?.())}
        className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        {label}
      </button>

      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-card-border bg-card p-6 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <p className="text-sm text-muted">
                Creez un compte gratuit pour telecharger vos rapports PDF
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href="/connexion"
                className="block w-full rounded-lg bg-navy-800 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-navy-700"
              >
                Creer un compte
              </a>
              <button
                type="button"
                onClick={() => setShowGate(false)}
                className="w-full rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-background"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
