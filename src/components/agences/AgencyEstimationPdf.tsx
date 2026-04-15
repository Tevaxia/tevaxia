import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

export interface AgencyPdfBranding {
  name: string;
  logo_url?: string | null;
  brand_color?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  vat_number?: string | null;
  legal_mention?: string | null;
}

export interface AgencyPdfEstimation {
  commune: string;
  type: string;
  surface: number;
  chambres?: number;
  classe_cpe?: string;
  valeur_centrale: number;
  fourchette_basse: number;
  fourchette_haute: number;
  prix_m2?: number;
  comparables_count?: number;
}

export interface AgencyPdfFees {
  total: number;
  enregistrement?: number;
  transcription?: number;
  notaire?: number;
  bellegen_akt_credit?: number;
}

export interface AgencyPdfAides {
  totalAides: number;
  details?: { name: string; amount: number }[];
}

export interface AgencyPdfProspect {
  name?: string;
  email?: string;
  reference?: string;
}

export interface AgencyPdfPayload {
  branding: AgencyPdfBranding;
  estimation: AgencyPdfEstimation;
  fees?: AgencyPdfFees;
  aides?: AgencyPdfAides;
  prospect?: AgencyPdfProspect;
  generated_at: string;
}

const formatEur = (n: number) => {
  if (!isFinite(n)) return "—";
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " EUR";
};

function styles(brandColor: string) {
  return StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: "Helvetica",
      color: "#1f2937",
    },
    headerBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 3,
      borderBottomColor: brandColor,
      paddingBottom: 12,
      marginBottom: 24,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    logo: { width: 60, height: 60, objectFit: "contain" },
    brandName: { fontSize: 16, fontWeight: 700, color: brandColor },
    brandSub: { fontSize: 9, color: "#6b7280", marginTop: 2 },
    headerRight: { textAlign: "right", fontSize: 9, color: "#6b7280" },
    title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
    subtitle: { fontSize: 11, color: "#6b7280", marginBottom: 24 },
    section: { marginBottom: 18 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: brandColor,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      paddingBottom: 4,
      marginBottom: 8,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: "#f3f4f6",
    },
    rowLabel: { color: "#374151" },
    rowValue: { fontWeight: 600 },
    bigValueBox: {
      backgroundColor: brandColor,
      color: "#ffffff",
      padding: 16,
      borderRadius: 6,
      marginBottom: 18,
    },
    bigValueLabel: { fontSize: 9, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1 },
    bigValueAmount: { fontSize: 28, fontWeight: 700, marginTop: 4 },
    bigValueRange: { fontSize: 10, color: "rgba(255,255,255,0.85)", marginTop: 4 },
    twoCol: { flexDirection: "row", gap: 16 },
    twoColCol: { flex: 1 },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 40,
      right: 40,
      borderTopWidth: 0.5,
      borderTopColor: "#e5e7eb",
      paddingTop: 8,
      fontSize: 8,
      color: "#9ca3af",
      textAlign: "center",
    },
    prospectBox: {
      backgroundColor: "#f9fafb",
      padding: 10,
      borderRadius: 4,
      marginBottom: 16,
    },
  });
}

export function AgencyEstimationPdf({ payload }: { payload: AgencyPdfPayload }) {
  const color = payload.branding.brand_color || "#0B2447";
  const s = styles(color);

  return (
    <Document title={`Estimation ${payload.estimation.commune} — ${payload.branding.name}`}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerBar}>
          <View style={s.headerLeft}>
            {payload.branding.logo_url && <Image src={payload.branding.logo_url} style={s.logo} />}
            <View>
              <Text style={s.brandName}>{payload.branding.name}</Text>
              {payload.branding.contact_phone && <Text style={s.brandSub}>{payload.branding.contact_phone}</Text>}
              {payload.branding.contact_email && <Text style={s.brandSub}>{payload.branding.contact_email}</Text>}
            </View>
          </View>
          <View style={s.headerRight}>
            <Text>Rapport d&apos;estimation</Text>
            <Text>{new Date(payload.generated_at).toLocaleDateString("fr-FR")}</Text>
            {payload.prospect?.reference && <Text>Réf. {payload.prospect.reference}</Text>}
          </View>
        </View>

        <Text style={s.title}>Estimation immobilière</Text>
        <Text style={s.subtitle}>
          {payload.estimation.type} — {payload.estimation.surface} m² — {payload.estimation.commune}
        </Text>

        {payload.prospect?.name && (
          <View style={s.prospectBox}>
            <Text style={{ fontSize: 9, color: "#6b7280" }}>Établi pour</Text>
            <Text style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{payload.prospect.name}</Text>
            {payload.prospect.email && <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{payload.prospect.email}</Text>}
          </View>
        )}

        {/* Big value */}
        <View style={s.bigValueBox}>
          <Text style={s.bigValueLabel}>Valeur de marché estimée</Text>
          <Text style={s.bigValueAmount}>{formatEur(payload.estimation.valeur_centrale)}</Text>
          <Text style={s.bigValueRange}>
            Fourchette : {formatEur(payload.estimation.fourchette_basse)} – {formatEur(payload.estimation.fourchette_haute)}
          </Text>
        </View>

        <View style={s.twoCol}>
          {/* Caractéristiques */}
          <View style={[s.section, s.twoColCol]}>
            <Text style={s.sectionTitle}>Caractéristiques du bien</Text>
            <View style={s.row}><Text style={s.rowLabel}>Commune</Text><Text style={s.rowValue}>{payload.estimation.commune}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>Type</Text><Text style={s.rowValue}>{payload.estimation.type}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>Surface</Text><Text style={s.rowValue}>{payload.estimation.surface} m²</Text></View>
            {payload.estimation.chambres != null && (
              <View style={s.row}><Text style={s.rowLabel}>Chambres</Text><Text style={s.rowValue}>{payload.estimation.chambres}</Text></View>
            )}
            {payload.estimation.classe_cpe && (
              <View style={s.row}><Text style={s.rowLabel}>Classe CPE</Text><Text style={s.rowValue}>{payload.estimation.classe_cpe}</Text></View>
            )}
            {payload.estimation.prix_m2 != null && (
              <View style={s.row}><Text style={s.rowLabel}>Prix au m²</Text><Text style={s.rowValue}>{formatEur(payload.estimation.prix_m2)}/m²</Text></View>
            )}
            {payload.estimation.comparables_count != null && (
              <View style={s.row}><Text style={s.rowLabel}>Comparables retenus</Text><Text style={s.rowValue}>{payload.estimation.comparables_count}</Text></View>
            )}
          </View>

          {/* Frais d'acquisition */}
          {payload.fees && (
            <View style={[s.section, s.twoColCol]}>
              <Text style={s.sectionTitle}>Frais d&apos;acquisition</Text>
              {payload.fees.enregistrement != null && (
                <View style={s.row}><Text style={s.rowLabel}>Droit d&apos;enregistrement</Text><Text style={s.rowValue}>{formatEur(payload.fees.enregistrement)}</Text></View>
              )}
              {payload.fees.transcription != null && (
                <View style={s.row}><Text style={s.rowLabel}>Droit de transcription</Text><Text style={s.rowValue}>{formatEur(payload.fees.transcription)}</Text></View>
              )}
              {payload.fees.notaire != null && (
                <View style={s.row}><Text style={s.rowLabel}>Honoraires notaire</Text><Text style={s.rowValue}>{formatEur(payload.fees.notaire)}</Text></View>
              )}
              {payload.fees.bellegen_akt_credit != null && payload.fees.bellegen_akt_credit > 0 && (
                <View style={s.row}><Text style={s.rowLabel}>Crédit Bëllegen Akt</Text><Text style={s.rowValue}>- {formatEur(payload.fees.bellegen_akt_credit)}</Text></View>
              )}
              <View style={[s.row, { borderBottomWidth: 0, marginTop: 4 }]}>
                <Text style={[s.rowLabel, { fontWeight: 700 }]}>Total frais</Text>
                <Text style={[s.rowValue, { fontWeight: 700, color: color }]}>{formatEur(payload.fees.total)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Aides */}
        {payload.aides && payload.aides.totalAides > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Aides applicables</Text>
            {payload.aides.details && payload.aides.details.map((d, i) => (
              <View key={i} style={s.row}>
                <Text style={s.rowLabel}>{d.name}</Text>
                <Text style={s.rowValue}>{formatEur(d.amount)}</Text>
              </View>
            ))}
            <View style={[s.row, { borderBottomWidth: 0, marginTop: 4 }]}>
              <Text style={[s.rowLabel, { fontWeight: 700 }]}>Total aides</Text>
              <Text style={[s.rowValue, { fontWeight: 700, color: "#059669" }]}>{formatEur(payload.aides.totalAides)}</Text>
            </View>
          </View>
        )}

        {/* Synthèse */}
        {payload.fees && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Synthèse budget acheteur</Text>
            <View style={s.row}>
              <Text style={s.rowLabel}>Prix d&apos;achat</Text>
              <Text style={s.rowValue}>{formatEur(payload.estimation.valeur_centrale)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>+ Frais d&apos;acquisition</Text>
              <Text style={s.rowValue}>{formatEur(payload.fees.total)}</Text>
            </View>
            {payload.aides && payload.aides.totalAides > 0 && (
              <View style={s.row}>
                <Text style={s.rowLabel}>- Aides</Text>
                <Text style={s.rowValue}>- {formatEur(payload.aides.totalAides)}</Text>
              </View>
            )}
            <View style={[s.row, { borderBottomWidth: 0, marginTop: 4 }]}>
              <Text style={[s.rowLabel, { fontWeight: 700 }]}>Coût total acheteur</Text>
              <Text style={[s.rowValue, { fontWeight: 700, fontSize: 12, color: color }]}>
                {formatEur(payload.estimation.valeur_centrale + payload.fees.total - (payload.aides?.totalAides ?? 0))}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text>
            {payload.branding.legal_mention || "Estimation indicative basée sur les données publiques luxembourgeoises (Observatoire de l'Habitat, STATEC). Ne constitue ni un engagement ni une expertise certifiée TEGOVA."}
          </Text>
          {payload.branding.vat_number && <Text style={{ marginTop: 2 }}>TVA : {payload.branding.vat_number}</Text>}
          <Text style={{ marginTop: 2 }}>Généré via tevaxia.lu</Text>
        </View>
      </Page>
    </Document>
  );
}
