/**
 * Export / import XML pour portails immobiliers LU.
 *
 * Deux formats couverts :
 *  - **OpenImmo v1.2.7** — standard DE/AT/LU de facto, accepté par ImmoScout24,
 *    Immonet, et en import par la plupart des agrégateurs multilingues.
 *  - **ImmoStandard (FR)** — variante accepté par certains portails FR/BE
 *    (utile pour frontaliers via SeLoger/Immoweb).
 *
 * Implémentation sans dépendance XML externe (pas de xmlbuilder2) — on émet
 * du XML directement encodé. Pour l'import, un parseur DOM minimal basé sur
 * regex est suffisant pour les champs standardisés.
 */

import type { AgencyMandate } from "./agency-mandates";

/** Échappe les caractères XML (<, >, &, ", '). */
export function xmlEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ============================================================
// Mapping tevaxia → OpenImmo
// ============================================================

function openImmoCategory(m: Pick<AgencyMandate, "property_type" | "mandate_type">): {
  nutzungsart: string; vermarktungsart: string; objektart: string;
} {
  const vermarktungsart =
    m.mandate_type === "recherche" ? "MIETE_PACHT" : "KAUF";
  const nutzungsart = m.property_type === "commercial" ? "GEWERBE" : "WOHNEN";
  let objektart = "HAUS";
  switch ((m.property_type ?? "").toLowerCase()) {
    case "appartement": objektart = "WOHNUNG"; break;
    case "maison": objektart = "HAUS"; break;
    case "terrain": objektart = "GRUNDSTUECK"; break;
    case "commercial": objektart = "HANDEL_EINZELHANDEL"; break;
  }
  return { nutzungsart, vermarktungsart, objektart };
}

function openImmoObjekttyp(objektart: string): string {
  // Valeur obligatoire <wohnung>/<haus>/<grundstueck>/<gewerbe>
  switch (objektart) {
    case "WOHNUNG": return "<wohnung wohnungtyp=\"ETAGE\"/>";
    case "HAUS": return "<haus haustyp=\"EINFAMILIENHAUS\"/>";
    case "GRUNDSTUECK": return "<grundstueck grundst_typ=\"WOHNEN\"/>";
    case "HANDEL_EINZELHANDEL": return "<gewerbe gewerbe_typ=\"EINZELHANDEL\"/>";
    default: return "<haus haustyp=\"EINFAMILIENHAUS\"/>";
  }
}

function openImmoEnergyClass(cls: string | null): string {
  if (!cls) return "";
  const c = cls.toUpperCase().trim();
  const valid = ["A_PLUS", "A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const mapped = c === "A+" ? "A_PLUS" : c;
  return valid.includes(mapped) ? mapped : "";
}

// ============================================================
// Export OpenImmo — mandat → immobilie XML
// ============================================================

export interface OpenImmoProviderInfo {
  firmenname: string;
  openimmo_anid: string; // identifiant provider (RPI-OpenImmo)
  lang: "fr" | "de" | "en" | "lb" | "pt";
  email_zentrale?: string;
  telefon_zentrale?: string;
}

export function mandateToOpenImmoFragment(
  m: AgencyMandate,
  opts: { referenceAgency?: string; referenceTransfer?: string } = {},
): string {
  const { nutzungsart, vermarktungsart, objektart } = openImmoCategory(m);
  const ref = opts.referenceAgency ?? m.reference ?? m.id.slice(0, 8);
  const refTransfer = opts.referenceTransfer ?? m.id;
  const addr = m.property_address ?? "";
  const commune = m.property_commune ?? "";
  const surface = m.property_surface ?? "";
  const rooms = (m.property_bedrooms ?? 0) + (m.property_bathrooms ?? 0);
  const energyCls = openImmoEnergyClass(m.property_epc_class);
  const desc = m.property_description ?? "";
  return `  <immobilie>
    <uebertragung umfang="TEIL" art="ONLINE" modus="NEW" version="1.2.7"/>
    <objektkategorie>
      <nutzungsart ${nutzungsart === "WOHNEN" ? "WOHNEN=\"true\"" : "GEWERBE=\"true\""}/>
      <vermarktungsart ${vermarktungsart === "KAUF" ? "KAUF=\"true\"" : "MIETE_PACHT=\"true\""}/>
      <objektart>${openImmoObjekttyp(objektart)}</objektart>
    </objektkategorie>
    <geo>
      <plz>${xmlEscape("")}</plz>
      <ort>${xmlEscape(commune)}</ort>
      <strasse>${xmlEscape(addr)}</strasse>
      <land iso_land="LUX"/>
    </geo>
    <preise>
      <kaufpreis>${m.prix_demande ?? ""}</kaufpreis>
      <waehrung iso_waehrung="EUR"/>
      ${m.commission_pct != null ? `<aussen_courtage>${m.commission_pct} % TVA incluse</aussen_courtage>` : ""}
    </preise>
    <flaechen>
      ${surface !== "" ? `<wohnflaeche>${surface}</wohnflaeche>` : ""}
      ${m.property_bedrooms != null ? `<anzahl_schlafzimmer>${m.property_bedrooms}</anzahl_schlafzimmer>` : ""}
      ${m.property_bathrooms != null ? `<anzahl_badezimmer>${m.property_bathrooms}</anzahl_badezimmer>` : ""}
      ${rooms > 0 ? `<anzahl_zimmer>${rooms}</anzahl_zimmer>` : ""}
    </flaechen>
    <ausstattung>
      ${m.property_year_built ? `<baujahr>${m.property_year_built}</baujahr>` : ""}
      ${m.property_floor != null ? `<etage>${m.property_floor}</etage>` : ""}
    </ausstattung>
    ${energyCls ? `<zustand_angaben>
      <energiepass epart="BEDARF" epasstext_gebaeude="${energyCls}"/>
    </zustand_angaben>` : ""}
    <freitexte>
      <objekttitel>${xmlEscape(addr)}</objekttitel>
      <objektbeschreibung>${xmlEscape(desc)}</objektbeschreibung>
    </freitexte>
    <verwaltung_techn>
      <objektnr_intern>${xmlEscape(refTransfer)}</objektnr_intern>
      <objektnr_extern>${xmlEscape(ref)}</objektnr_extern>
      <stand_vom>${new Date().toISOString().slice(0, 10)}</stand_vom>
      <aktion aktionart="CHANGE"/>
    </verwaltung_techn>
    <verwaltung_objekt>
      <verfuegbar_ab>${m.start_date ?? ""}</verfuegbar_ab>
    </verwaltung_objekt>
${
  m.virtual_tour_url || m.video_url
    ? `    <anhaenge>
${
  m.virtual_tour_url
    ? `      <anhang location="REMOTE" gruppe="LINK">
        <anhangtitel>Visite virtuelle 360</anhangtitel>
        <format>html</format>
        <daten><pfad>${xmlEscape(m.virtual_tour_url)}</pfad></daten>
        <check_url><pfad>${xmlEscape(m.virtual_tour_url)}</pfad></check_url>
      </anhang>`
    : ""
}
${
  m.video_url
    ? `      <anhang location="REMOTE" gruppe="VIDEO">
        <anhangtitel>Vidéo de présentation</anhangtitel>
        <format>video</format>
        <daten><pfad>${xmlEscape(m.video_url)}</pfad></daten>
      </anhang>`
    : ""
}
    </anhaenge>`
    : ""
}
  </immobilie>`;
}

export function buildOpenImmoXml(mandates: AgencyMandate[], provider: OpenImmoProviderInfo): string {
  const now = new Date().toISOString();
  const immos = mandates.map((m) => mandateToOpenImmoFragment(m)).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<openimmo xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="openimmo_127.xsd">
  <uebertragung sendersoftware="tevaxia" senderversion="1.0" art="ONLINE" umfang="TEIL" modus="NEW" version="1.2.7" techn_email="${xmlEscape(provider.email_zentrale ?? "")}" timestamp="${now}"/>
  <anbieter>
    <anbieternr>${xmlEscape(provider.openimmo_anid)}</anbieternr>
    <firma>${xmlEscape(provider.firmenname)}</firma>
    <openimmo_anid>${xmlEscape(provider.openimmo_anid)}</openimmo_anid>
    <lang>${xmlEscape(provider.lang)}</lang>
${immos}
  </anbieter>
</openimmo>
`;
}

// ============================================================
// Export CSV spécifique portail (athome, Immotop — format simple)
// ============================================================

export interface PortalCsvRow {
  reference: string;
  type_bien: string;
  commune: string;
  adresse: string;
  surface_m2: string;
  chambres: string;
  prix_demande: string;
  commission_pct: string;
  classe_energie: string;
  statut: string;
  date_debut: string;
  date_fin: string;
  client_nom: string;
  client_email: string;
  client_telephone: string;
  description: string;
}

export function mandateToPortalCsvRow(m: AgencyMandate): PortalCsvRow {
  return {
    reference: m.reference ?? m.id.slice(0, 8),
    type_bien: m.property_type ?? "",
    commune: m.property_commune ?? "",
    adresse: m.property_address,
    surface_m2: m.property_surface != null ? String(m.property_surface) : "",
    chambres: m.property_bedrooms != null ? String(m.property_bedrooms) : "",
    prix_demande: m.prix_demande != null ? String(m.prix_demande) : "",
    commission_pct: m.commission_pct != null ? String(m.commission_pct) : "",
    classe_energie: m.property_epc_class ?? "",
    statut: m.status,
    date_debut: m.start_date ?? "",
    date_fin: m.end_date ?? "",
    client_nom: m.client_name ?? "",
    client_email: m.client_email ?? "",
    client_telephone: m.client_phone ?? "",
    description: (m.property_description ?? "").replace(/[\r\n]+/g, " "),
  };
}

export function buildPortalCsv(mandates: AgencyMandate[]): string {
  const rows = mandates.map(mandateToPortalCsvRow);
  const header: (keyof PortalCsvRow)[] = [
    "reference", "type_bien", "commune", "adresse", "surface_m2", "chambres",
    "prix_demande", "commission_pct", "classe_energie", "statut",
    "date_debut", "date_fin", "client_nom", "client_email", "client_telephone", "description",
  ];
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [
    `# Export CSV — format portails immobiliers LU (athome / Immotop / Immoweb compatible)`,
    `# Généré le ${new Date().toLocaleDateString("fr-LU")} · ${rows.length} biens`,
    "",
    header.map(esc).join(";"),
    ...rows.map((r) => header.map((h) => esc(r[h])).join(";")),
  ];
  return "\uFEFF" + lines.join("\n");
}

// ============================================================
// Import OpenImmo — parse XML entrant
// ============================================================

export interface ImportedProperty {
  ref_intern: string;
  ref_extern: string;
  objektart: string; // WOHNUNG / HAUS / GRUNDSTUECK / GEWERBE
  commune: string;
  postal_code: string;
  street: string;
  surface_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  price_eur: number | null;
  energy_class: string | null;
  title: string;
  description: string;
  year_built: number | null;
}

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : null;
}

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\b${attr}=\\"([^\\"]*)\\"`, "i"));
  return m ? m[1] : null;
}

function numOrNull(s: string | null): number | null {
  if (!s) return null;
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function parseOpenImmoXml(xml: string): ImportedProperty[] {
  const results: ImportedProperty[] = [];
  const re = /<immobilie>([\s\S]*?)<\/immobilie>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    const block = match[1];
    const refIntern = extractTag(block, "objektnr_intern") ?? "";
    const refExtern = extractTag(block, "objektnr_extern") ?? "";
    const objektart = (() => {
      if (/<wohnung/i.test(block)) return "WOHNUNG";
      if (/<haus/i.test(block)) return "HAUS";
      if (/<grundstueck/i.test(block)) return "GRUNDSTUECK";
      if (/<gewerbe/i.test(block)) return "GEWERBE";
      return "HAUS";
    })();
    results.push({
      ref_intern: refIntern,
      ref_extern: refExtern,
      objektart,
      commune: extractTag(block, "ort") ?? "",
      postal_code: extractTag(block, "plz") ?? "",
      street: extractTag(block, "strasse") ?? "",
      surface_m2: numOrNull(extractTag(block, "wohnflaeche")),
      bedrooms: numOrNull(extractTag(block, "anzahl_schlafzimmer")),
      bathrooms: numOrNull(extractTag(block, "anzahl_badezimmer")),
      price_eur: numOrNull(extractTag(block, "kaufpreis")),
      energy_class: extractAttr(block, "energiepass", "epasstext_gebaeude"),
      title: extractTag(block, "objekttitel") ?? "",
      description: extractTag(block, "objektbeschreibung") ?? "",
      year_built: numOrNull(extractTag(block, "baujahr")),
    });
  }
  return results;
}

export function openImmoToMandatePatch(p: ImportedProperty): Partial<AgencyMandate> {
  const objToType: Record<string, string> = {
    WOHNUNG: "appartement",
    HAUS: "maison",
    GRUNDSTUECK: "terrain",
    GEWERBE: "commercial",
  };
  return {
    reference: p.ref_extern || p.ref_intern || null,
    property_address: [p.street, p.postal_code, p.commune].filter(Boolean).join(", ") || p.commune,
    property_commune: p.commune || null,
    property_type: objToType[p.objektart] ?? "maison",
    property_surface: p.surface_m2,
    property_bedrooms: p.bedrooms,
    property_bathrooms: p.bathrooms,
    property_year_built: p.year_built,
    property_epc_class: p.energy_class,
    property_description: p.description || null,
    prix_demande: p.price_eur,
  };
}

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
