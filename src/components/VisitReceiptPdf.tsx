"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface VisitReceiptLabels {
  docTitle: string; // "Bon de visite — {address} — {name}"
  title: string; // "BON DE VISITE"
  subtitle: string;
  refPrefix: string; // "Réf. {ref}"
  sectionVisitor: string;
  labelName: string;
  labelEmail: string;
  labelPhone: string;
  labelId: string;
  sectionProperty: string;
  labelAddress: string;
  labelCommune: string;
  labelType: string;
  labelSurface: string;
  labelPrice: string;
  sectionVisit: string;
  labelDate: string;
  labelTime: string;
  timeFormat: string; // "{time} ({duration} minutes)"
  labelAgent: string;
  labelObservations: string;
  legal: string;
  sigVisitor: string;
  sigVisitorRead: string;
  sigAgent: string;
  sigLabel: string;
  footer: string; // "{agency} · ... le {date} · ..."
  dateLocale: string; // "fr-LU" / "en-GB" etc.
}

interface Props {
  agency: {
    name: string;
    address?: string | null;
    agent_name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  buyer: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    id_number?: string;
  };
  property: {
    address: string;
    commune?: string | null;
    type?: string | null;
    surface_m2?: number | null;
    reference?: string | null;
    price?: number | null;
  };
  visit: {
    date: string;
    time: string;
    duration_minutes: number;
    notes?: string;
  };
  labels: VisitReceiptLabels;
}

const s = StyleSheet.create({
  page: { padding: 50, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.6, color: "#0B2447" },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    borderBottom: "1 solid #0B2447", paddingBottom: 10, marginBottom: 20,
  },
  agencyName: { fontSize: 13, fontWeight: "bold" },
  agencyMeta: { fontSize: 9, color: "#475569", marginTop: 2 },
  title: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginVertical: 20 },
  subtitle: { fontSize: 10, textAlign: "center", color: "#475569", marginBottom: 30 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 10, fontWeight: "bold", textTransform: "uppercase",
    color: "#1B2A4A", paddingBottom: 3, marginBottom: 8,
    borderBottom: "0.5 solid #CBD5E1",
  },
  row: { flexDirection: "row", paddingVertical: 2 },
  label: { width: "40%", color: "#64748B" },
  value: { flex: 1, fontWeight: "bold" },
  box: {
    border: "0.5 solid #CBD5E1", padding: 12, borderRadius: 2,
    marginTop: 5, marginBottom: 12, backgroundColor: "#F8FAFC",
  },
  legal: {
    marginTop: 16, padding: 10, backgroundColor: "#FEF9C3",
    fontSize: 9, color: "#713F12", lineHeight: 1.5,
  },
  signatures: {
    flexDirection: "row", justifyContent: "space-between",
    marginTop: 30, gap: 40,
  },
  signatureBlock: {
    flex: 1, borderTop: "1 solid #94A3B8", paddingTop: 6,
    fontSize: 9, color: "#475569",
  },
  signatureBold: { fontSize: 11, fontWeight: "bold", color: "#0B2447", marginBottom: 4 },
  footer: {
    position: "absolute", bottom: 30, left: 50, right: 50,
    fontSize: 7, color: "#94A3B8", textAlign: "center",
  },
});

const fmtEUR = (n: number): string =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " EUR";

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export default function VisitReceiptPdf({ agency, buyer, property, visit, labels }: Props) {
  const fmtDate = (iso: string): string => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString(labels.dateLocale, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  };

  return (
    <Document title={fillTemplate(labels.docTitle, { address: property.address, name: buyer.last_name })}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.agencyName}>{agency.name}</Text>
            {agency.address && <Text style={s.agencyMeta}>{agency.address}</Text>}
            {(agency.email || agency.phone) && (
              <Text style={s.agencyMeta}>
                {agency.email}{agency.email && agency.phone ? " · " : ""}{agency.phone}
              </Text>
            )}
          </View>
          <View>
            <Text style={{ fontSize: 9, color: "#64748B", textAlign: "right" }}>
              {fmtDate(visit.date)}
            </Text>
            {property.reference && (
              <Text style={{ fontSize: 9, color: "#64748B", textAlign: "right", marginTop: 2 }}>
                {fillTemplate(labels.refPrefix, { ref: property.reference })}
              </Text>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>{labels.title}</Text>
        <Text style={s.subtitle}>{labels.subtitle}</Text>

        {/* Acquéreur */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{labels.sectionVisitor}</Text>
          <View style={s.box}>
            <View style={s.row}>
              <Text style={s.label}>{labels.labelName}</Text>
              <Text style={s.value}>{buyer.last_name.toUpperCase()}, {buyer.first_name}</Text>
            </View>
            {buyer.email && (
              <View style={s.row}>
                <Text style={s.label}>{labels.labelEmail}</Text>
                <Text style={s.value}>{buyer.email}</Text>
              </View>
            )}
            {buyer.phone && (
              <View style={s.row}>
                <Text style={s.label}>{labels.labelPhone}</Text>
                <Text style={s.value}>{buyer.phone}</Text>
              </View>
            )}
            {buyer.id_number && (
              <View style={s.row}>
                <Text style={s.label}>{labels.labelId}</Text>
                <Text style={s.value}>{buyer.id_number}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bien visité */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{labels.sectionProperty}</Text>
          <View style={s.box}>
            <View style={s.row}>
              <Text style={s.label}>{labels.labelAddress}</Text>
              <Text style={s.value}>{property.address}</Text>
            </View>
            {property.commune && (
              <View style={s.row}>
                <Text style={s.label}>{labels.labelCommune}</Text>
                <Text style={s.value}>{property.commune}</Text>
              </View>
            )}
            {property.type && (
              <View style={s.row}>
                <Text style={s.label}>{labels.labelType}</Text>
                <Text style={s.value}>{property.type}</Text>
              </View>
            )}
            {property.surface_m2 != null && (
              <View style={s.row}>
                <Text style={s.label}>{labels.labelSurface}</Text>
                <Text style={s.value}>{property.surface_m2} m²</Text>
              </View>
            )}
            {property.price != null && (
              <View style={s.row}>
                <Text style={s.label}>{labels.labelPrice}</Text>
                <Text style={s.value}>{fmtEUR(property.price)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Visite */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{labels.sectionVisit}</Text>
          <View style={s.box}>
            <View style={s.row}>
              <Text style={s.label}>{labels.labelDate}</Text>
              <Text style={s.value}>{fmtDate(visit.date)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>{labels.labelTime}</Text>
              <Text style={s.value}>{fillTemplate(labels.timeFormat, { time: visit.time, duration: visit.duration_minutes })}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>{labels.labelAgent}</Text>
              <Text style={s.value}>{agency.agent_name ?? agency.name}</Text>
            </View>
            {visit.notes && (
              <View style={[s.row, { marginTop: 4 }]}>
                <Text style={s.label}>{labels.labelObservations}</Text>
                <Text style={s.value}>{visit.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Mention légale */}
        <View style={s.legal}>
          <Text>{labels.legal}</Text>
        </View>

        {/* Signatures */}
        <View style={s.signatures}>
          <View style={s.signatureBlock}>
            <Text style={s.signatureBold}>{labels.sigVisitor}</Text>
            <Text>{labels.sigVisitorRead}</Text>
            <Text style={{ marginTop: 30, fontStyle: "italic" }}>
              {labels.sigLabel}
            </Text>
          </View>
          <View style={s.signatureBlock}>
            <Text style={s.signatureBold}>{labels.sigAgent}</Text>
            <Text>{agency.agent_name ?? agency.name}</Text>
            <Text style={{ marginTop: 30, fontStyle: "italic" }}>
              {labels.sigLabel}
            </Text>
          </View>
        </View>

        <Text style={s.footer}>
          {fillTemplate(labels.footer, {
            agency: agency.name,
            date: new Date().toLocaleString(labels.dateLocale),
          })}
        </Text>
      </Page>
    </Document>
  );
}
