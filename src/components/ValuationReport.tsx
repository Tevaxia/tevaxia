"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { formatEUR, formatPct } from "@/lib/calculations";
import {
  CoverPage,
  KpiGrid,
  Footer,
  PageHeader,
  ConfidenceGauge,
  PriceRangeBar,
  MarketContext,
  generateRef,
} from "@/components/energy/EnergyPdf";

// ============================================================
// Font registration — Inter (same as EnergyPdf)
// ============================================================
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

// ============================================================
// Formatting helpers
// ============================================================
const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number, d = 0) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d }).format(n);

const fmtPct2 = (n: number, d = 2) => `${n.toFixed(d)} %`;

const today = () => new Date().toLocaleDateString("fr-LU");

// ============================================================
// Styles
// ============================================================
const NAVY = "#1B2A4A";
const GOLD = "#C8A951";
const BEIGE = "#F8F7F4";
const SLATE = "#334155";
const MUTED = "#6B7280";
const LIGHT_MUTED = "#9CA3AF";
const BORDER = "#e5e2db";
const BORDER_LIGHT = "#f0f0f0";

const s = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Inter",
    color: "#1a1a2e",
  },
  section: {
    fontSize: 12,
    fontFamily: "Inter",
    fontWeight: 700,
    color: NAVY,
    marginTop: 18,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: `1pt solid ${BORDER}`,
  },
  sectionSm: {
    fontSize: 10,
    fontFamily: "Inter",
    fontWeight: 700,
    color: NAVY,
    marginTop: 14,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `1pt solid ${BORDER}`,
  },
  row: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 3,
    borderBottom: `0.5pt solid ${BORDER_LIGHT}`,
  },
  rowHL: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderTop: `1.5pt solid ${GOLD}`,
    marginTop: 6,
    backgroundColor: "#FAFAF8",
  },
  label: { color: SLATE, flex: 1 },
  labelBold: { color: SLATE, flex: 1, fontFamily: "Inter", fontWeight: 600 },
  labelSub: { color: MUTED, flex: 1, paddingLeft: 12 },
  value: { fontFamily: "Inter", fontWeight: 600, textAlign: "right" as const },
  valueLg: {
    fontFamily: "Inter",
    fontWeight: 700,
    fontSize: 14,
    textAlign: "right" as const,
    color: NAVY,
  },
  valueGold: {
    fontFamily: "Inter",
    fontWeight: 700,
    fontSize: 16,
    textAlign: "right" as const,
    color: GOLD,
  },
  note: { fontSize: 8, color: MUTED, marginTop: 4, lineHeight: 1.4 },
  // Grid
  grid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8, marginTop: 6 },
  cell: { flex: 1, minWidth: "28%" as unknown as number, padding: 8, backgroundColor: BEIGE, borderRadius: 4 },
  cellLabel: { fontSize: 7, color: MUTED },
  cellValue: { fontSize: 11, fontFamily: "Inter", fontWeight: 600, color: NAVY, marginTop: 2 },
  // Table
  tHead: {
    flexDirection: "row" as const,
    backgroundColor: BEIGE,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: `1pt solid ${BORDER}`,
  },
  tRow: {
    flexDirection: "row" as const,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottom: `0.5pt solid ${BORDER_LIGHT}`,
  },
  tRowHL: {
    flexDirection: "row" as const,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "#FAFAF8",
    borderTop: `1pt solid ${GOLD}`,
  },
  tCell: { flex: 1, fontSize: 8 },
  tCellR: { flex: 1, fontSize: 8, textAlign: "right" as const },
  tCellB: { flex: 1, fontSize: 8, fontFamily: "Inter", fontWeight: 600 },
  tCellBR: { flex: 1, fontSize: 8, fontFamily: "Inter", fontWeight: 600, textAlign: "right" as const },
  // Energy badge
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  badgeText: { fontSize: 16, fontFamily: "Inter", fontWeight: 700, color: "white" },
  // Spacer
  spacer: { height: 12 },
  spacerLg: { height: 20 },
  // Certification
  certStatement: {
    fontSize: 9,
    color: SLATE,
    lineHeight: 1.6,
    marginBottom: 6,
    paddingLeft: 16,
  },
  certBullet: {
    position: "absolute" as const,
    left: 0,
    fontSize: 9,
    color: GOLD,
  },
});

// ============================================================
// ReportData interface
// ============================================================
export interface ReportData {
  // Identification
  dateRapport: string;
  adresse?: string;
  commune?: string;
  assetType: string;
  evsType: string;
  surface: number;
  // Valeurs
  valeurComparaison?: number;
  valeurCapitalisation?: number;
  valeurDCF?: number;
  valeurReconciliee?: number;
  // Capitalisation details
  noi?: number;
  tauxCap?: number;
  rendementInitial?: number;
  rendementReversionnaire?: number;
  // DCF details
  irr?: number;
  tauxActualisation?: number;
  tauxCapSortie?: number;
  // MLV
  mlv?: number;
  ratioMLV?: number;
  // Sensitivity
  sensibiliteCap?: { tauxCap: number; valeur: number }[];
  sensibiliteDCF?: { tauxActu: number; tauxCapSortie: number; valeur: number }[];
  // ESG
  esgScore?: number;
  esgNiveau?: string;
  esgImpact?: number;
  classeEnergie?: string;
  // Narrative
  narrative?: string;
  // Comparables
  comparables?: {
    adresse: string;
    prixVente: number;
    surface: number;
    prixM2: number;
    ajustement: number;
    prixAjuste: number;
  }[];
  prixM2Commune?: number;
  transactionsCommune?: number;
  // Demographics (auto-filled from commune)
  demographicsCommune?: {
    population?: number;
    croissancePct?: number;
    revenuMedian?: number;
    tauxChomage?: number;
    pctEtrangers?: number;
    densiteHabKm2?: number;
    canton?: string;
  };
  // Macro context
  tauxHypothecaire?: number;
  oat10y?: number;
  indiceConstruction?: number;
  // Fourchette
  fourchetteBas?: number;
  fourchetteHaut?: number;
  // Profile
  expertNom?: string;
  expertSociete?: string;
  expertQualifications?: string;
  logoUrl?: string;
}

// ============================================================
// Helpers
// ============================================================

/** Best available value */
function bestValue(d: ReportData): number | undefined {
  return d.valeurReconciliee || d.valeurComparaison || d.valeurCapitalisation || d.valeurDCF;
}

/** Count how many methods were used */
function methodCount(d: ReportData): number {
  let c = 0;
  if (d.valeurComparaison && d.valeurComparaison > 0) c++;
  if (d.valeurCapitalisation && d.valeurCapitalisation > 0) c++;
  if (d.valeurDCF && d.valeurDCF > 0) c++;
  return c;
}

/** Confidence level based on methods used */
function confidenceLevel(d: ReportData): "low" | "medium" | "high" {
  const mc = methodCount(d);
  if (mc >= 3) return "high";
  if (mc >= 2) return "medium";
  return "low";
}

/** Energy class color */
function energyColor(classe?: string): string {
  const colors: Record<string, string> = {
    A: "#16A34A", B: "#22C55E", C: "#84CC16", D: "#EAB308",
    E: "#F97316", F: "#EF4444", G: "#DC2626", H: "#991B1B", I: "#7F1D1D",
  };
  return colors[classe?.toUpperCase() || ""] || MUTED;
}

/** Prix/m² from best value */
function prixM2(d: ReportData): number | undefined {
  const v = bestValue(d);
  if (v && d.surface > 0) return v / d.surface;
  return undefined;
}

/** Has any demographics data */
function hasDemographics(d: ReportData): boolean {
  const demo = d.demographicsCommune;
  if (!demo) return false;
  return !!(demo.population || demo.revenuMedian || demo.canton);
}

/** Has any market/macro context */
function hasMarketContext(d: ReportData): boolean {
  return !!(d.prixM2Commune || d.transactionsCommune || d.tauxHypothecaire || d.oat10y || d.indiceConstruction);
}

/** Has ESG data */
function hasEsg(d: ReportData): boolean {
  return d.esgScore != null || d.classeEnergie != null;
}

// ============================================================
// Row helpers
// ============================================================

function Row({ label, value: v }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{v}</Text>
    </View>
  );
}

function RowHL({ label, value: v }: { label: string; value: string }) {
  return (
    <View style={s.rowHL}>
      <Text style={s.labelBold}>{label}</Text>
      <Text style={s.valueLg}>{v}</Text>
    </View>
  );
}

function RowGold({ label, value: v }: { label: string; value: string }) {
  return (
    <View style={s.rowHL}>
      <Text style={s.labelBold}>{label}</Text>
      <Text style={s.valueGold}>{v}</Text>
    </View>
  );
}

// ============================================================
// PAGE 2: Identification + KPIs
// ============================================================

function IdentificationPage({ data, reference }: { data: ReportData; reference: string }) {
  const bv = bestValue(data);
  const pm2 = prixM2(data);
  const mc = methodCount(data);

  const kpis: { label: string; value: string; highlight?: boolean }[] = [];
  if (bv) kpis.push({ label: "Valeur estimee", value: fmtEur(bv), highlight: true });
  kpis.push({ label: "Surface", value: `${fmtNum(data.surface)} m2` });
  if (pm2) kpis.push({ label: "Prix / m2", value: fmtEur(pm2) });
  kpis.push({ label: "Type d'actif", value: data.assetType });
  kpis.push({ label: "Base de valeur", value: data.evsType });
  if (data.classeEnergie) kpis.push({ label: "Classe energie", value: data.classeEnergie });

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Rapport de valorisation" reference={reference} />

      <Text style={s.section}>Identification du bien</Text>
      {data.adresse && <Row label="Adresse" value={data.adresse} />}
      {data.commune && <Row label="Commune" value={data.commune} />}
      <Row label="Type d'actif" value={data.assetType} />
      <Row label="Base de valeur (EVS 2025)" value={data.evsType} />
      <Row label="Surface" value={`${fmtNum(data.surface)} m2`} />
      <Row label="Date du rapport" value={data.dateRapport} />

      <View style={s.spacerLg} />
      <Text style={s.section}>Indicateurs cles</Text>
      <KpiGrid items={kpis} />

      <View style={s.spacer} />
      <ConfidenceGauge level={confidenceLevel(data)} />
      <Text style={s.note}>
        Fiabilite basee sur {mc} methode{mc > 1 ? "s" : ""} d&apos;evaluation utilisee{mc > 1 ? "s" : ""}.
        Plus le nombre de methodes convergentes est eleve, plus l&apos;estimation est robuste.
      </Text>

      {data.fourchetteBas != null && data.fourchetteHaut != null && bv && (
        <>
          <View style={s.spacerLg} />
          <Text style={s.sectionSm}>Fourchette de valeur</Text>
          <PriceRangeBar
            min={data.fourchetteBas}
            mid={bv}
            max={data.fourchetteHaut}
            label="Valeur estimee dans la fourchette"
          />
        </>
      )}

      <Footer />
    </Page>
  );
}

// ============================================================
// PAGE 3: Situation geographique + Demographie + Macro
// ============================================================

function GeographyPage({ data, reference }: { data: ReportData; reference: string }) {
  const demo = data.demographicsCommune;
  const commune = data.commune || "Luxembourg";

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Rapport de valorisation" reference={reference} />

      {/* Demographics */}
      {demo && (
        <>
          <Text style={s.section}>Situation geographique et demographique</Text>
          {demo.canton && <Row label="Canton" value={demo.canton} />}
          {demo.population != null && <Row label="Population" value={fmtNum(demo.population)} />}
          {demo.croissancePct != null && <Row label="Croissance demographique (2015-2025)" value={fmtPct2(demo.croissancePct, 1)} />}
          {demo.densiteHabKm2 != null && <Row label="Densite" value={`${fmtNum(demo.densiteHabKm2)} hab/km2`} />}
          {demo.revenuMedian != null && <Row label="Revenu median annuel" value={fmtEur(demo.revenuMedian)} />}
          {demo.tauxChomage != null && <Row label="Taux de chomage" value={fmtPct2(demo.tauxChomage, 1)} />}
          {demo.pctEtrangers != null && <Row label="Part d'etrangers" value={fmtPct2(demo.pctEtrangers, 1)} />}
        </>
      )}

      {/* Market context */}
      {data.prixM2Commune != null && (
        <>
          <View style={s.spacerLg} />
          <MarketContext
            commune={commune}
            prixM2={data.prixM2Commune}
            transactions={data.transactionsCommune}
          />
        </>
      )}

      {/* Macro context */}
      {(data.tauxHypothecaire != null || data.oat10y != null || data.indiceConstruction != null) && (
        <>
          <View style={s.spacerLg} />
          <Text style={s.section}>Contexte macroeconomique</Text>
          <View style={{ flexDirection: "row" as const, gap: 8 }}>
            {data.tauxHypothecaire != null && (
              <View style={s.cell}>
                <Text style={s.cellLabel}>Taux hypothecaire moyen</Text>
                <Text style={s.cellValue}>{fmtPct2(data.tauxHypothecaire, 2)}</Text>
              </View>
            )}
            {data.oat10y != null && (
              <View style={s.cell}>
                <Text style={s.cellLabel}>OAT 10 ans</Text>
                <Text style={s.cellValue}>{fmtPct2(data.oat10y, 2)}</Text>
              </View>
            )}
            {data.indiceConstruction != null && (
              <View style={s.cell}>
                <Text style={s.cellLabel}>Indice construction</Text>
                <Text style={s.cellValue}>{fmtNum(data.indiceConstruction, 1)}</Text>
              </View>
            )}
          </View>
          <Text style={s.note}>
            Sources : BCL, STATEC, Eurostat. Donnees au {data.dateRapport}.
          </Text>
        </>
      )}

      <Footer />
    </Page>
  );
}

// ============================================================
// PAGE 4: Comparables
// ============================================================

function ComparablesPage({ data, reference }: { data: ReportData; reference: string }) {
  const comps = data.comparables || [];
  if (comps.length === 0) return null;

  const avgPrixAjuste =
    comps.reduce((sum, c) => sum + c.prixAjuste, 0) / comps.length;

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Rapport de valorisation" reference={reference} />

      <Text style={s.section}>Comparables de marche</Text>
      <Text style={s.note}>
        {comps.length} transaction{comps.length > 1 ? "s" : ""} comparable{comps.length > 1 ? "s" : ""} identifiee{comps.length > 1 ? "s" : ""} et ajustee{comps.length > 1 ? "s" : ""}.
      </Text>

      <View style={{ marginTop: 10 }}>
        {/* Header */}
        <View style={s.tHead}>
          <Text style={{ ...s.tCellB, flex: 2 }}>Adresse</Text>
          <Text style={s.tCellBR}>Prix vente</Text>
          <Text style={s.tCellBR}>Surface</Text>
          <Text style={s.tCellBR}>Prix/m2</Text>
          <Text style={s.tCellBR}>Ajust.</Text>
          <Text style={s.tCellBR}>Prix ajuste</Text>
        </View>
        {/* Rows */}
        {comps.map((c, i) => (
          <View key={i} style={s.tRow}>
            <Text style={{ ...s.tCell, flex: 2 }}>{c.adresse}</Text>
            <Text style={s.tCellR}>{fmtEur(c.prixVente)}</Text>
            <Text style={s.tCellR}>{fmtNum(c.surface)} m2</Text>
            <Text style={s.tCellR}>{fmtEur(c.prixM2)}</Text>
            <Text style={s.tCellR}>{c.ajustement > 0 ? "+" : ""}{fmtPct2(c.ajustement, 1)}</Text>
            <Text style={s.tCellR}>{fmtEur(c.prixAjuste)}</Text>
          </View>
        ))}
        {/* Weighted average */}
        <View style={s.tRowHL}>
          <Text style={{ ...s.tCellB, flex: 2 }}>Moyenne ajustee</Text>
          <Text style={s.tCellBR} />
          <Text style={s.tCellBR} />
          <Text style={s.tCellBR}>{data.surface > 0 ? fmtEur(avgPrixAjuste / data.surface) : "—"}</Text>
          <Text style={s.tCellBR} />
          <Text style={s.tCellBR}>{fmtEur(avgPrixAjuste)}</Text>
        </View>
      </View>

      {data.valeurComparaison != null && data.valeurComparaison > 0 && (
        <>
          <View style={s.spacerLg} />
          <RowHL label="Valeur par comparaison" value={fmtEur(data.valeurComparaison)} />
          {data.surface > 0 && (
            <Row label="Prix unitaire" value={`${fmtEur(data.valeurComparaison / data.surface)} /m2`} />
          )}
        </>
      )}

      <Footer />
    </Page>
  );
}

// ============================================================
// PAGE 5: Methodes d'evaluation
// ============================================================

function MethodesPage({ data, reference }: { data: ReportData; reference: string }) {
  const hasComp = data.valeurComparaison != null && data.valeurComparaison > 0;
  const hasCap = data.valeurCapitalisation != null && data.valeurCapitalisation > 0;
  const hasDCF = data.valeurDCF != null && data.valeurDCF > 0;

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Rapport de valorisation" reference={reference} />

      <Text style={s.section}>Methodes d&apos;evaluation</Text>

      {/* Comparaison */}
      {hasComp && (
        <>
          <Text style={s.sectionSm}>Approche par comparaison</Text>
          <Row label="Valeur par comparaison" value={fmtEur(data.valeurComparaison!)} />
          {data.surface > 0 && (
            <Row label="Prix unitaire" value={`${fmtEur(data.valeurComparaison! / data.surface)} /m2`} />
          )}
          {data.comparables && data.comparables.length > 0 && (
            <Row label="Nombre de comparables" value={String(data.comparables.length)} />
          )}
          <View style={s.spacer} />
        </>
      )}

      {/* Capitalisation */}
      {hasCap && (
        <>
          <Text style={s.sectionSm}>Capitalisation directe</Text>
          {data.noi != null && <Row label="Resultat net d'exploitation (NOI)" value={fmtEur(data.noi)} />}
          {data.tauxCap != null && <Row label="Taux de capitalisation" value={fmtPct2(data.tauxCap, 2)} />}
          <Row label="Valeur par capitalisation" value={fmtEur(data.valeurCapitalisation!)} />
          {data.rendementInitial != null && (
            <Row label="Rendement initial" value={formatPct(data.rendementInitial * 100)} />
          )}
          {data.rendementReversionnaire != null && (
            <Row label="Rendement reversionnaire (ERV)" value={formatPct(data.rendementReversionnaire * 100)} />
          )}
          {/* Sensitivity table */}
          {data.sensibiliteCap && data.sensibiliteCap.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 8, fontFamily: "Inter", fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                Sensibilite — Capitalisation
              </Text>
              <View style={s.tHead}>
                <Text style={s.tCellB}>Taux cap.</Text>
                <Text style={s.tCellBR}>Valeur</Text>
              </View>
              {data.sensibiliteCap.map((row) => (
                <View key={row.tauxCap} style={s.tRow}>
                  <Text style={s.tCell}>{fmtPct2(row.tauxCap, 2)}</Text>
                  <Text style={s.tCellR}>{fmtEur(row.valeur)}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={s.spacer} />
        </>
      )}

      {/* DCF */}
      {hasDCF && (
        <>
          <Text style={s.sectionSm}>Actualisation des flux futurs (DCF)</Text>
          {data.tauxActualisation != null && <Row label="Taux d'actualisation" value={fmtPct2(data.tauxActualisation, 2)} />}
          {data.tauxCapSortie != null && <Row label="Taux de capitalisation en sortie" value={fmtPct2(data.tauxCapSortie, 2)} />}
          <Row label="Valeur DCF" value={fmtEur(data.valeurDCF!)} />
          {data.irr != null && (
            <RowHL label="TRI (IRR)" value={fmtPct2(data.irr * 100, 2)} />
          )}
          {/* Sensitivity matrix */}
          {data.sensibiliteDCF && data.sensibiliteDCF.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 8, fontFamily: "Inter", fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                Matrice de sensibilite — DCF (Actualisation x Sortie)
              </Text>
              <View style={s.tHead}>
                <Text style={s.tCellB}>Actu.</Text>
                <Text style={s.tCellB}>Sortie</Text>
                <Text style={s.tCellBR}>Valeur</Text>
              </View>
              {data.sensibiliteDCF.map((row, i) => (
                <View key={i} style={s.tRow}>
                  <Text style={s.tCell}>{fmtPct2(row.tauxActu, 1)}</Text>
                  <Text style={s.tCell}>{fmtPct2(row.tauxCapSortie, 1)}</Text>
                  <Text style={s.tCellR}>{fmtEur(row.valeur)}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* No methods */}
      {!hasComp && !hasCap && !hasDCF && (
        <Text style={s.note}>Aucune methode d&apos;evaluation completee.</Text>
      )}

      <Footer />
    </Page>
  );
}

// ============================================================
// PAGE 6: Reconciliation
// ============================================================

function ReconciliationPage({ data, reference }: { data: ReportData; reference: string }) {
  const bv = bestValue(data);
  if (!bv) return null;

  const methods: { name: string; value: number }[] = [];
  if (data.valeurComparaison && data.valeurComparaison > 0)
    methods.push({ name: "Comparaison", value: data.valeurComparaison });
  if (data.valeurCapitalisation && data.valeurCapitalisation > 0)
    methods.push({ name: "Capitalisation", value: data.valeurCapitalisation });
  if (data.valeurDCF && data.valeurDCF > 0)
    methods.push({ name: "DCF", value: data.valeurDCF });

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Rapport de valorisation" reference={reference} />

      <Text style={s.section}>Reconciliation des valeurs</Text>

      {methods.length > 0 && (
        <View style={{ marginTop: 6 }}>
          <View style={s.tHead}>
            <Text style={s.tCellB}>Methode</Text>
            <Text style={s.tCellBR}>Valeur</Text>
            <Text style={s.tCellBR}>Ecart / reconciliee</Text>
          </View>
          {methods.map((m) => {
            const ecart = data.valeurReconciliee
              ? ((m.value - data.valeurReconciliee) / data.valeurReconciliee) * 100
              : 0;
            return (
              <View key={m.name} style={s.tRow}>
                <Text style={s.tCell}>{m.name}</Text>
                <Text style={s.tCellR}>{fmtEur(m.value)}</Text>
                <Text style={s.tCellR}>
                  {data.valeurReconciliee ? `${ecart > 0 ? "+" : ""}${ecart.toFixed(1)} %` : "—"}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={s.spacerLg} />
      <RowGold label="Valeur reconciliee" value={fmtEur(bv)} />

      {data.surface > 0 && (
        <Row label="Prix unitaire" value={`${fmtEur(bv / data.surface)} /m2`} />
      )}

      {data.fourchetteBas != null && data.fourchetteHaut != null && (
        <>
          <View style={s.spacerLg} />
          <Text style={s.sectionSm}>Fourchette d&apos;estimation</Text>
          <Row label="Borne basse" value={fmtEur(data.fourchetteBas)} />
          <Row label="Borne haute" value={fmtEur(data.fourchetteHaut)} />
          <PriceRangeBar
            min={data.fourchetteBas}
            mid={bv}
            max={data.fourchetteHaut}
          />
        </>
      )}

      {/* MLV */}
      {data.mlv != null && data.mlv > 0 && (
        <>
          <View style={s.spacerLg} />
          <Text style={s.sectionSm}>Valeur hypothecaire (MLV)</Text>
          <RowHL label="Mortgage Lending Value" value={fmtEur(data.mlv)} />
          {data.ratioMLV != null && (
            <Row label="Ratio MLV / Valeur de marche" value={fmtPct2(data.ratioMLV * 100, 1)} />
          )}
          {data.mlv > 0 && bv > 0 && (
            <>
              <View style={s.spacer} />
              <Text style={{ fontSize: 8, fontFamily: "Inter", fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                Indicateurs LTV
              </Text>
              <Row label="LTV 80 % — Emprunt max." value={fmtEur(data.mlv * 0.8)} />
              <Row label="LTV 90 % — Emprunt max." value={fmtEur(data.mlv * 0.9)} />
            </>
          )}
        </>
      )}

      <Footer />
    </Page>
  );
}

// ============================================================
// PAGE 7: ESG & Energie
// ============================================================

function EsgPage({ data, reference }: { data: ReportData; reference: string }) {
  if (!hasEsg(data)) return null;

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Rapport de valorisation" reference={reference} />

      <Text style={s.section}>ESG et performance energetique</Text>

      {/* Energy class badge */}
      {data.classeEnergie && (
        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 12, marginTop: 8, marginBottom: 12 }}>
          <View style={{ ...s.badge, backgroundColor: energyColor(data.classeEnergie) }}>
            <Text style={s.badgeText}>{data.classeEnergie.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, fontFamily: "Inter", fontWeight: 600, color: NAVY }}>
              Classe energetique {data.classeEnergie.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>
              Certificat de performance energetique (CPE)
            </Text>
          </View>
        </View>
      )}

      {data.classeEnergie && <Row label="Classe energie" value={data.classeEnergie.toUpperCase()} />}

      {data.esgScore != null && (
        <>
          <Row label="Score ESG" value={`${data.esgScore} / 100`} />
          {data.esgNiveau && <Row label="Niveau" value={data.esgNiveau} />}
        </>
      )}

      {data.esgImpact != null && (
        <RowHL
          label="Impact estime sur la valeur"
          value={`${data.esgImpact > 0 ? "+" : ""}${fmtPct2(data.esgImpact, 1)}`}
        />
      )}

      <View style={s.spacerLg} />
      <Text style={s.sectionSm}>Reference green premium / brown discount</Text>
      <Text style={{ fontSize: 8, color: SLATE, lineHeight: 1.6, marginTop: 4 }}>
        Les etudes recentes (RICS 2024, JLL Luxembourg) montrent qu&apos;un bien classe A-B beneficie
        d&apos;une prime de 5 a 15 % par rapport a la moyenne du marche, tandis qu&apos;un bien classe F-G
        subit une decote de 10 a 25 %. Ces ecarts tendent a s&apos;amplifier avec le durcissement
        des exigences reglementaires europeennes (EPBD, taxonomie).
      </Text>

      <View style={s.spacerLg} />
      <View style={{ flexDirection: "row" as const, gap: 8 }}>
        <View style={{ ...s.cell, borderLeft: "3pt solid #16A34A" }}>
          <Text style={s.cellLabel}>Green premium (A-B)</Text>
          <Text style={s.cellValue}>+5 a +15 %</Text>
        </View>
        <View style={{ ...s.cell, borderLeft: "3pt solid #EAB308" }}>
          <Text style={s.cellLabel}>Neutre (C-D)</Text>
          <Text style={s.cellValue}>0 %</Text>
        </View>
        <View style={{ ...s.cell, borderLeft: "3pt solid #DC2626" }}>
          <Text style={s.cellLabel}>Brown discount (F-I)</Text>
          <Text style={s.cellValue}>-10 a -25 %</Text>
        </View>
      </View>

      <Footer />
    </Page>
  );
}

// ============================================================
// PAGE 8: Analyse narrative
// ============================================================

function NarrativePage({ data, reference }: { data: ReportData; reference: string }) {
  if (!data.narrative) return null;

  // Split narrative into paragraphs for better layout
  const paragraphs = data.narrative.split(/\n\n|\n/).filter((p) => p.trim().length > 0);

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Rapport de valorisation" reference={reference} />

      <Text style={s.section}>Analyse narrative</Text>

      {paragraphs.map((para, i) => (
        <Text key={i} style={{ fontSize: 9, color: SLATE, lineHeight: 1.7, marginTop: i > 0 ? 10 : 4 }}>
          {para}
        </Text>
      ))}

      <View style={s.spacerLg} />
      <Text style={s.sectionSm}>Commentaires de l&apos;expert</Text>
      <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.7, marginTop: 4 }}>
        L&apos;analyse ci-dessus est generee automatiquement a partir des donnees saisies et des
        resultats des differentes methodes d&apos;evaluation. Elle synthetise les principaux
        facteurs ayant influence la valorisation : localisation, contexte de marche, parametres
        de rendement et facteurs ESG.
      </Text>

      <Footer />
    </Page>
  );
}

// ============================================================
// PAGE 9: Certification
// ============================================================

function CertificationPage({ data, reference }: { data: ReportData; reference: string }) {
  const statements = [
    "Les analyses et opinions contenues dans ce rapport sont basees sur les informations fournies et les donnees de marche disponibles a la date du rapport.",
    "L'evaluation a ete menee conformement aux principes des European Valuation Standards (EVS 2025, 10e edition, TEGOVA).",
    "L'evaluateur n'a aucun interet financier actuel ou futur dans le bien evalue.",
    "Les valeurs indiquees sont exprimees en euros et s'entendent hors droits d'enregistrement, TVA et frais de mutation, sauf mention contraire.",
    "Ce rapport est destine exclusivement a l'usage du mandant et ne peut etre communique a des tiers sans l'accord prealable de l'evaluateur.",
    "Les resultats de cette simulation indicative ne sauraient se substituer a une expertise certifiee par un evaluateur REV/TEGOVA.",
  ];

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Rapport de valorisation" reference={reference} />

      <Text style={s.section}>Certification</Text>

      {(data.expertNom || data.expertSociete) && (
        <View style={{ marginTop: 8, marginBottom: 16 }}>
          {data.expertNom && <Row label="Expert" value={data.expertNom} />}
          {data.expertSociete && <Row label="Societe" value={data.expertSociete} />}
          {data.expertQualifications && <Row label="Qualifications" value={data.expertQualifications} />}
        </View>
      )}

      <Text style={s.sectionSm}>Declarations</Text>
      {statements.map((stmt, i) => (
        <View key={i} style={{ flexDirection: "row" as const, marginBottom: 8, paddingLeft: 4 }}>
          <Text style={{ fontSize: 9, color: GOLD, marginRight: 8 }}>{i + 1}.</Text>
          <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.6, flex: 1 }}>{stmt}</Text>
        </View>
      ))}

      <View style={s.spacerLg} />
      <View style={{ borderTop: `1pt solid ${BORDER}`, paddingTop: 12 }}>
        <Row label="Date" value={data.dateRapport} />
        <Row label="Reference" value={reference} />
      </View>

      {(data.expertNom || data.expertSociete) && (
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 9, color: MUTED }}>Signature :</Text>
          <View style={{ marginTop: 30, borderBottom: `1pt solid ${SLATE}`, width: 200 }} />
          <Text style={{ fontSize: 8, color: MUTED, marginTop: 4 }}>
            {data.expertNom || ""}{data.expertSociete ? ` — ${data.expertSociete}` : ""}
          </Text>
        </View>
      )}

      <Footer />
    </Page>
  );
}

// ============================================================
// PAGE 10: Disclaimer
// ============================================================

function ValuationDisclaimerPage({ reference }: { reference: string }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Avertissement" reference={reference} />

      <Text style={{ ...s.section, marginTop: 30 }}>Conditions d&apos;utilisation</Text>

      <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.6, marginTop: 8 }}>
        Ce document est genere automatiquement par la plateforme tevaxia.lu a titre purement
        informatif et indicatif. Il ne constitue en aucun cas une expertise certifiee, un conseil
        en evaluation immobiliere, un conseil financier, fiscal ou juridique.
      </Text>

      <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.6, marginTop: 12 }}>
        Les resultats presentes dependent des parametres saisis par l&apos;utilisateur et des
        hypotheses de calcul integrees dans les modeles. Ils peuvent differer significativement
        de la realite du marche.
      </Text>

      <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.6, marginTop: 12 }}>
        Les valeurs sont exprimees en euros courants a la date du rapport. Elles ne tiennent pas
        compte de l&apos;inflation future, des evolutions reglementaires ou des variations de marche
        posterieures a cette date.
      </Text>

      <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.6, marginTop: 12 }}>
        Les donnees demographiques et macroeconomiques proviennent de sources publiques (STATEC,
        BCL, Eurostat, Observatoire de l&apos;Habitat) et sont susceptibles de revision.
      </Text>

      <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.6, marginTop: 12 }}>
        Pour toute decision engageante, consultez un professionnel agree : evaluateur REV/TEGOVA,
        notaire, conseiller financier ou conseiller en energie.
      </Text>

      <Text style={{ fontSize: 9, color: MUTED, lineHeight: 1.6, marginTop: 30 }}>
        tevaxia.lu — Plateforme immobiliere Luxembourg{"\n"}
        European Valuation Standards 2025 (TEGOVA, 10e edition){"\n"}
        Rapport genere le {today()} | Ref. {reference}
      </Text>

      <Footer />
    </Page>
  );
}

// ============================================================
// Document assembly
// ============================================================

function ReportDocument({ data }: { data: ReportData }) {
  const reference = generateRef();
  const bv = bestValue(data);
  const showGeography = hasDemographics(data) || hasMarketContext(data);
  const showComparables = data.comparables && data.comparables.length > 0;
  const showEsg = hasEsg(data);
  const showNarrative = !!data.narrative;
  const showCertification = !!(data.expertNom || data.expertSociete || data.expertQualifications);

  return (
    <Document>
      {/* Page 1: Cover */}
      <CoverPage
        title="RAPPORT DE VALORISATION"
        subtitle={[data.commune, data.assetType].filter(Boolean).join(" — ")}
        value={bv ? fmtEur(bv) : undefined}
        date={data.dateRapport}
        reference={reference}
      />

      {/* Page 2: Identification + KPIs */}
      <IdentificationPage data={data} reference={reference} />

      {/* Page 3: Geography + Demographics + Macro (conditional) */}
      {showGeography && <GeographyPage data={data} reference={reference} />}

      {/* Page 4: Comparables (conditional) */}
      {showComparables && <ComparablesPage data={data} reference={reference} />}

      {/* Page 5: Methods */}
      <MethodesPage data={data} reference={reference} />

      {/* Page 6: Reconciliation (conditional — needs at least one value) */}
      {bv && <ReconciliationPage data={data} reference={reference} />}

      {/* Page 7: ESG & Energy (conditional) */}
      {showEsg && <EsgPage data={data} reference={reference} />}

      {/* Page 8: Narrative (conditional) */}
      {showNarrative && <NarrativePage data={data} reference={reference} />}

      {/* Page 9: Certification (conditional) */}
      {showCertification && <CertificationPage data={data} reference={reference} />}

      {/* Page 10: Disclaimer (always) */}
      <ValuationDisclaimerPage reference={reference} />
    </Document>
  );
}

// ============================================================
// Exports (same signature as before)
// ============================================================

export async function generateReportBlob(data: ReportData): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<ReportDocument data={data} />).toBlob();
}

export async function downloadReport(data: ReportData) {
  const blob = await generateReportBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tevaxia-rapport-${data.dateRapport}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
