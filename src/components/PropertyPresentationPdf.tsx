"use client";

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

export interface PropertyPresentationProps {
  // Agency branding
  agencyName?: string;
  agencyLogo?: string;
  agentName?: string;
  agentContact?: string;
  // Property
  title: string;
  propertyType: string;
  address: string;
  commune: string;
  surface: number;
  nbRooms?: number;
  nbBedrooms?: number;
  energyClass?: string;
  parking?: boolean;
  yearBuilt?: number;
  description?: string;
  // Price & estimation
  askingPrice: number;
  estimatedValue?: number;
  estimationLow?: number;
  estimationHigh?: number;
  pricePerSqm?: number;
  // Financing
  downPayment?: number;
  loanAmount?: number;
  loanRate?: number;
  loanDuration?: number;
  monthlyPayment?: number;
  // Acquisition fees
  acquisitionFees?: number;
  registrationDuties?: number;
  notaryFees?: number;
  // Features / amenities (bullets)
  features?: string[];
}

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", lineHeight: 1.4, color: "#0B2447" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 16, paddingBottom: 10, borderBottom: "2 solid #0B2447",
  },
  headerTitle: { fontSize: 11, fontWeight: "bold", color: "#0B2447" },
  headerSubtitle: { fontSize: 8, color: "#64748B", marginTop: 2 },
  headerRight: { textAlign: "right" },
  heroTitle: { fontSize: 20, fontWeight: "bold", color: "#0B2447", marginBottom: 4 },
  heroAddress: { fontSize: 10, color: "#334155", marginBottom: 10 },
  heroPrice: {
    fontSize: 22, fontWeight: "bold", color: "#0B2447",
    padding: 12, backgroundColor: "#F1F5F9", borderRadius: 6, textAlign: "center",
  },
  heroPriceLabel: { fontSize: 8, color: "#64748B", textAlign: "center", marginBottom: 4 },
  grid2: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  card: { width: "48%", padding: 10, backgroundColor: "#F8FAFC", borderRadius: 4, marginBottom: 8 },
  cardTitle: { fontSize: 9, fontWeight: "bold", textTransform: "uppercase", color: "#1B2A4A", marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 2, fontSize: 9 },
  label: { width: "60%", color: "#64748B" },
  value: { width: "40%", textAlign: "right", fontWeight: "bold" },
  sectionTitle: {
    fontSize: 11, fontWeight: "bold", color: "#0B2447",
    textTransform: "uppercase", marginTop: 12, marginBottom: 6,
    borderBottom: "1 solid #CBD5E1", paddingBottom: 3,
  },
  description: { fontSize: 9, color: "#334155", lineHeight: 1.6, marginBottom: 8 },
  bulletList: { marginLeft: 8 },
  bullet: { fontSize: 9, color: "#334155", marginBottom: 2 },
  energyBadge: {
    padding: "4 8", borderRadius: 3, color: "#fff",
    fontSize: 10, fontWeight: "bold", textAlign: "center",
  },
  footer: {
    position: "absolute", bottom: 20, left: 36, right: 36,
    textAlign: "center", fontSize: 7, color: "#94A3B8",
    borderTop: "0.5 solid #CBD5E1", paddingTop: 4,
  },
  disclaimer: {
    marginTop: 12, padding: 8, backgroundColor: "#FEF3C7", borderRadius: 3,
    fontSize: 7, color: "#78350F",
  },
});

const ENERGY_CLASS_COLORS: Record<string, string> = {
  A: "#059669", B: "#10B981", C: "#84CC16",
  D: "#EAB308", E: "#F59E0B", F: "#F97316",
  G: "#DC2626", H: "#991B1B", I: "#7F1D1D",
};

const fmtEUR = (n: number | undefined) => {
  if (n == null || !isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n)) + " €";
};

export default function PropertyPresentationPdf(p: PropertyPresentationProps) {
  const pricePerSqm = p.pricePerSqm ?? (p.surface > 0 ? p.askingPrice / p.surface : 0);
  const totalCost = p.askingPrice + (p.acquisitionFees ?? 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            {p.agencyName && <Text style={s.headerTitle}>{p.agencyName}</Text>}
            {p.agentName && <Text style={s.headerSubtitle}>{p.agentName}</Text>}
            {p.agentContact && <Text style={s.headerSubtitle}>{p.agentContact}</Text>}
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerSubtitle}>Fiche bien</Text>
            <Text style={s.headerSubtitle}>Édité le {new Date().toLocaleDateString("fr-FR")}</Text>
          </View>
        </View>

        <Text style={s.heroTitle}>{p.title}</Text>
        <Text style={s.heroAddress}>
          {p.address}
          {p.commune && ` · ${p.commune}`}
        </Text>

        <View style={{ marginTop: 4, marginBottom: 10 }}>
          <Text style={s.heroPriceLabel}>Prix demandé</Text>
          <Text style={s.heroPrice}>{fmtEUR(p.askingPrice)}</Text>
          {p.surface > 0 && (
            <Text style={{ fontSize: 8, color: "#64748B", textAlign: "center", marginTop: 4 }}>
              {fmtEUR(pricePerSqm)} / m² · {p.surface} m²
            </Text>
          )}
        </View>

        <View style={s.grid2}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Caractéristiques</Text>
            <View style={s.row}><Text style={s.label}>Type</Text><Text style={s.value}>{p.propertyType}</Text></View>
            <View style={s.row}><Text style={s.label}>Surface</Text><Text style={s.value}>{p.surface} m²</Text></View>
            {p.nbRooms != null && <View style={s.row}><Text style={s.label}>Pièces</Text><Text style={s.value}>{p.nbRooms}</Text></View>}
            {p.nbBedrooms != null && <View style={s.row}><Text style={s.label}>Chambres</Text><Text style={s.value}>{p.nbBedrooms}</Text></View>}
            {p.yearBuilt && <View style={s.row}><Text style={s.label}>Année</Text><Text style={s.value}>{p.yearBuilt}</Text></View>}
            <View style={s.row}><Text style={s.label}>Parking</Text><Text style={s.value}>{p.parking ? "Oui" : "Non"}</Text></View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Performance énergétique</Text>
            {p.energyClass ? (
              <View style={{ alignItems: "flex-start" }}>
                <View style={{ ...s.energyBadge, backgroundColor: ENERGY_CLASS_COLORS[p.energyClass] ?? "#64748B" }}>
                  <Text>Classe {p.energyClass}</Text>
                </View>
                <Text style={{ fontSize: 8, color: "#64748B", marginTop: 6 }}>
                  CPE conforme RGD 30/11/2007 (arrêté performance énergétique)
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 8, color: "#64748B", fontStyle: "italic" }}>
                CPE non renseigné — à vérifier avant signature compromis
              </Text>
            )}
          </View>
        </View>

        {p.description && (
          <>
            <Text style={s.sectionTitle}>Description</Text>
            <Text style={s.description}>{p.description}</Text>
          </>
        )}

        {p.features && p.features.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Points forts</Text>
            <View style={s.bulletList}>
              {p.features.map((f, i) => (
                <Text key={i} style={s.bullet}>• {f}</Text>
              ))}
            </View>
          </>
        )}

        {(p.estimatedValue != null || p.estimationLow != null) && (
          <>
            <Text style={s.sectionTitle}>Estimation indépendante (modèle tevaxia.lu)</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
              {p.estimationLow != null && (
                <View style={{ flex: 1, padding: 8, backgroundColor: "#F1F5F9", borderRadius: 4 }}>
                  <Text style={{ fontSize: 7, color: "#64748B" }}>Basse</Text>
                  <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0B2447" }}>{fmtEUR(p.estimationLow)}</Text>
                </View>
              )}
              {p.estimatedValue != null && (
                <View style={{ flex: 1, padding: 8, backgroundColor: "#ECFDF5", borderRadius: 4, borderWidth: 1, borderColor: "#10B981" }}>
                  <Text style={{ fontSize: 7, color: "#065F46" }}>Centrale</Text>
                  <Text style={{ fontSize: 10, fontWeight: "bold", color: "#065F46" }}>{fmtEUR(p.estimatedValue)}</Text>
                </View>
              )}
              {p.estimationHigh != null && (
                <View style={{ flex: 1, padding: 8, backgroundColor: "#F1F5F9", borderRadius: 4 }}>
                  <Text style={{ fontSize: 7, color: "#64748B" }}>Haute</Text>
                  <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0B2447" }}>{fmtEUR(p.estimationHigh)}</Text>
                </View>
              )}
            </View>
          </>
        )}

        <Text style={s.sectionTitle}>Budget acquisition</Text>
        <View style={s.grid2}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Frais d&apos;acquisition</Text>
            <View style={s.row}><Text style={s.label}>Prix</Text><Text style={s.value}>{fmtEUR(p.askingPrice)}</Text></View>
            {p.registrationDuties != null && <View style={s.row}><Text style={s.label}>Droits enregistrement</Text><Text style={s.value}>{fmtEUR(p.registrationDuties)}</Text></View>}
            {p.notaryFees != null && <View style={s.row}><Text style={s.label}>Émoluments notaire</Text><Text style={s.value}>{fmtEUR(p.notaryFees)}</Text></View>}
            {p.acquisitionFees != null && <View style={s.row}><Text style={s.label}>Total frais</Text><Text style={{ ...s.value, color: "#0B2447" }}>{fmtEUR(p.acquisitionFees)}</Text></View>}
            <View style={{ marginTop: 4, paddingTop: 4, borderTop: "1 solid #CBD5E1" }}>
              <View style={s.row}>
                <Text style={{ ...s.label, fontWeight: "bold" }}>TOTAL</Text>
                <Text style={{ ...s.value, fontSize: 10, color: "#0B2447" }}>{fmtEUR(totalCost)}</Text>
              </View>
            </View>
          </View>

          {(p.monthlyPayment != null || p.loanAmount != null) && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Plan de financement</Text>
              {p.downPayment != null && <View style={s.row}><Text style={s.label}>Apport</Text><Text style={s.value}>{fmtEUR(p.downPayment)}</Text></View>}
              {p.loanAmount != null && <View style={s.row}><Text style={s.label}>Montant prêt</Text><Text style={s.value}>{fmtEUR(p.loanAmount)}</Text></View>}
              {p.loanRate != null && <View style={s.row}><Text style={s.label}>Taux</Text><Text style={s.value}>{p.loanRate.toFixed(2)} %</Text></View>}
              {p.loanDuration != null && <View style={s.row}><Text style={s.label}>Durée</Text><Text style={s.value}>{p.loanDuration} ans</Text></View>}
              {p.monthlyPayment != null && (
                <View style={{ marginTop: 4, paddingTop: 4, borderTop: "1 solid #CBD5E1" }}>
                  <View style={s.row}>
                    <Text style={{ ...s.label, fontWeight: "bold" }}>Mensualité</Text>
                    <Text style={{ ...s.value, fontSize: 10, color: "#0B2447" }}>{fmtEUR(p.monthlyPayment)}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={s.disclaimer}>
          <Text>
            Ce document est une fiche de présentation commerciale. Les montants sont indicatifs et
            sujets à vérification lors du compromis. Les estimations tevaxia.lu sont automatisées
            et ne remplacent pas un rapport d&apos;expertise par un évaluateur agréé (RICS / TEGOVA).
            Consultez votre notaire et banque pour un plan de financement personnalisé.
          </Text>
        </View>

        <Text style={s.footer}>
          Généré par tevaxia.lu · tevaxia.lu/estimation · tevaxia.lu/frais-acquisition · tevaxia.lu/outils-bancaires
        </Text>
      </Page>
    </Document>
  );
}

export async function generatePropertyPresentationPdfBlob(props: PropertyPresentationProps): Promise<Blob> {
  return pdf(<PropertyPresentationPdf {...props} />).toBlob();
}
