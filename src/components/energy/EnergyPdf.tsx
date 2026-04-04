"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type {
  ImpactResponse,
  ClasseImpact,
  RenovationResponse,
  CommunauteResponse,
  CommunauteRequest,
} from "@/lib/energy-api";

// ---------- Formatting helpers (French locale) ----------

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number, d = 0) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d }).format(n);

const fmtPct = (n: number, d = 1) => `${n.toFixed(d)} %`;

const today = () => new Date().toLocaleDateString("fr-LU");

// ---------- Shared styles (matches ValuationReport.tsx) ----------

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a2e" },
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
  footer: { position: "absolute" as const, bottom: 25, left: 40, right: 40, fontSize: 7, color: "#9CA3AF", textAlign: "center" as const },
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

// ---------- Shared pieces ----------

function Header({ title }: { title: string }) {
  return (
    <View style={s.header}>
      <View style={s.logoRow}>
        <View style={s.logoBox}><Text style={s.logoText}>E</Text></View>
        <Text style={s.logoName}>energy<Text style={s.logoGold}>.tevaxia.lu</Text></Text>
      </View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{today()} — Simulateur indicatif</Text>
    </View>
  );
}

function Disclaimer() {
  return (
    <Text style={s.disclaimer}>
      Ce document est généré automatiquement par energy.tevaxia.lu à titre informatif.
      Les résultats dépendent des paramètres saisis et des hypothèses de calcul. Les montants d'aides
      (Klimabonus, Klimaprêt) sont basés sur la réglementation luxembourgeoise en vigueur et peuvent évoluer.
      Pour un audit énergétique officiel, consultez un conseiller en énergie agréé.
    </Text>
  );
}

function Footer() {
  return <Text style={s.footer}>energy.tevaxia.lu — Simulateurs énergétiques Luxembourg — {today()}</Text>;
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
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Header title="Impact CPE sur la valeur" />

        <Text style={s.section}>Bien évalué</Text>
        <Row label="Valeur du bien" value={fmtEur(valeur)} />
        <Row label="Classe énergétique actuelle" value={classeActuelle} />

        <Text style={s.section}>Impact par classe énergétique</Text>
        <View style={s.tHead}>
          <Text style={s.tCellB}>Classe</Text>
          <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Ajustement</Text>
          <Text style={{ ...s.tCellB, textAlign: "right" as const }}>Valeur ajustée</Text>
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
          Méthodologie : {result.methodologie}
        </Text>
        {result.sources.length > 0 && (
          <Text style={s.note}>Sources : {result.sources.join(" ; ")}</Text>
        )}

        <Disclaimer />
        <Footer />
      </Page>
    </Document>
  );
}

export async function downloadImpactPdf(result: ImpactResponse, classeActuelle: string, valeur: number) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<ImpactDoc result={result} classeActuelle={classeActuelle} valeur={valeur} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-impact-cpe-${today()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- 2. Rénovation ROI ----------

interface RenovationParams {
  classeActuelle: string;
  classeCible: string;
  surface: number;
  anneeConstruction: number;
  valeurBien: number;
}

function RenovationDoc({ result, params }: { result: RenovationResponse; params: RenovationParams }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Header title="ROI Rénovation énergétique" />

        <Text style={s.section}>Paramètres du projet</Text>
        <Row label="Saut de classe" value={result.sautClasse} />
        <Row label="Surface" value={`${fmtNum(params.surface)} m²`} />
        <Row label="Année de construction" value={String(params.anneeConstruction)} />
        <Row label="Valeur du bien" value={fmtEur(params.valeurBien)} />

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

        <Text style={s.section}>Plus-value et ROI</Text>
        <View style={s.grid}>
          <View style={s.cell}><Text style={s.cellLabel}>Gain valeur</Text><Text style={s.cellValue}>{fmtEur(result.gainValeur)}</Text></View>
          <View style={s.cell}><Text style={s.cellLabel}>Gain %</Text><Text style={s.cellValue}>+{fmtPct(result.gainValeurPct)}</Text></View>
          <View style={s.cell}><Text style={s.cellLabel}>ROI</Text><Text style={s.cellValue}>{fmtPct(result.roiPct)}</Text></View>
        </View>

        <Text style={s.section}>Aides financières</Text>
        <Row label={`Klimabonus (${result.klimabonus.description})`} value={fmtEur(result.klimabonus.montant)} />
        <Row label={`Klimaprêt (${fmtPct(result.klimapret.taux)} sur ${result.klimapret.dureeMois} mois)`} value={`jusqu'à ${fmtEur(result.klimapret.montantMax)}`} />
        <Row label="Subvention conseil énergie" value={fmtEur(result.subventionConseil)} />
        <RowHL label="Total aides" value={fmtEur(result.totalAides)} />
        <RowHL label="Reste à charge" value={fmtEur(result.resteACharge)} />

        <Text style={s.section}>Rentabilité long terme</Text>
        <Row label="Économie annuelle" value={`${fmtNum(result.economieAnnuelleKwh)} kWh — ${fmtEur(result.economieAnnuelleEur)}`} />
        <Row label="Payback (retour sur investissement)" value={`${fmtNum(result.paybackAnnees, 1)} ans`} />
        <Row label="VAN sur 20 ans" value={fmtEur(result.van20ans)} />
        <Row label="TRI" value={fmtPct(result.triPct)} />

        <Disclaimer />
        <Footer />
      </Page>
    </Document>
  );
}

export async function downloadRenovationPdf(result: RenovationResponse, params: RenovationParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<RenovationDoc result={result} params={params} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-renovation-roi-${today()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- 3. Communauté d'énergie ----------

interface CommunauteParams {
  nbParticipants: number;
  puissancePV: number;
  consoMoyenneParParticipant: number;
  tarifReseau: number;
  tarifPartage: number;
}

function CommunauteDoc({ result, params }: { result: CommunauteResponse; params: CommunauteParams }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Header title="Communauté d'énergie" />

        <Text style={s.section}>Paramètres</Text>
        <Row label="Participants" value={String(params.nbParticipants)} />
        <Row label="Puissance PV installée" value={`${fmtNum(params.puissancePV)} kWc`} />
        <Row label="Consommation moyenne / participant" value={`${fmtNum(params.consoMoyenneParParticipant)} kWh/an`} />
        <Row label="Tarif réseau" value={`${fmtNum(params.tarifReseau, 4)} EUR/kWh`} />
        <Row label="Tarif partage" value={`${fmtNum(params.tarifPartage, 4)} EUR/kWh`} />

        <Text style={s.section}>Résultats clés</Text>
        <View style={s.grid}>
          <View style={s.cell}><Text style={s.cellLabel}>Production annuelle</Text><Text style={s.cellValue}>{fmtNum(result.productionAnnuelle)} kWh</Text></View>
          <View style={s.cell}><Text style={s.cellLabel}>Autoconsommation</Text><Text style={s.cellValue}>{fmtPct(result.tauxAutoConsoPct)}</Text></View>
          <View style={s.cell}><Text style={s.cellLabel}>Couverture</Text><Text style={s.cellValue}>{fmtPct(result.tauxCouverturePct)}</Text></View>
        </View>
        <Row label="Énergie autoconsommée" value={`${fmtNum(result.energieAutoconsommee)} kWh`} />
        <Row label="Surplus injecté" value={`${fmtNum(result.surplus)} kWh`} />
        <RowHL label="Économie totale" value={fmtEur(result.economieTotale)} />
        <Row label="Économie par participant" value={fmtEur(result.economieParParticipant)} />
        <Row label="Revenu surplus" value={fmtEur(result.revenuSurplus)} />
        <Row label="CO₂ évité" value={`${fmtNum(result.co2EviteKg)} kg/an`} />

        <Text style={s.section}>Investissement</Text>
        <Row label="Coût installation HTVA" value={fmtEur(result.coutInstallationHTVA)} />
        <Row label="TVA" value={fmtEur(result.coutInstallationTVA)} />
        <RowHL label="Coût TTC" value={fmtEur(result.coutInstallationTTC)} />
        <Row label="Coût par participant" value={fmtEur(result.coutParParticipant)} />
        <Row label="Payback global" value={`${fmtNum(result.paybackGlobalAnnees, 1)} ans`} />

        <Text style={s.section}>Conformité réglementaire</Text>
        <Row label="Statut juridique" value={result.conformite.statutJuridique} />
        <Row label="Périmètre" value={result.conformite.perimetre} />
        <Row label="Contrat de répartition" value={result.conformite.contratRepartition} />
        <Row label="Déclaration ILR" value={result.conformite.declarationILR} />
        <Text style={{ ...s.note, marginTop: 6 }}>
          Base légale : {result.conformite.loiReference} — {result.conformite.reglementILR}
        </Text>

        <Disclaimer />
        <Footer />
      </Page>
    </Document>
  );
}

export async function downloadCommunautePdf(result: CommunauteResponse, params: CommunauteParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<CommunauteDoc result={result} params={params} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-communaute-${today()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- PdfButton component ----------

export function PdfButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700 active:scale-95"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      {label}
    </button>
  );
}
