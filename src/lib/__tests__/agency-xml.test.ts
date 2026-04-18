import { describe, it, expect } from "vitest";
import {
  xmlEscape,
  mandateToOpenImmoFragment,
  buildOpenImmoXml,
  buildPortalCsv,
  parseOpenImmoXml,
  openImmoToMandatePatch,
} from "../agency-xml";
import type { AgencyMandate } from "../agency-mandates";

function fakeMandate(overrides: Partial<AgencyMandate> = {}): AgencyMandate {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    user_id: "u1",
    org_id: null,
    reference: "REF-001",
    property_address: "15 rue de la Faïencerie",
    property_commune: "Luxembourg",
    property_type: "appartement",
    property_surface: 85,
    property_bedrooms: 2,
    property_bathrooms: 1,
    property_floor: 3,
    property_year_built: 2018,
    property_epc_class: "B",
    property_description: "Appartement lumineux au cœur de Limpertsberg.",
    prix_demande: 780000,
    client_name: "Mme Dupont",
    client_email: "dupont@example.com",
    client_phone: null,
    mandate_type: "exclusif",
    status: "mandat_signe",
    commission_pct: 3,
    commission_amount_estimee: null,
    commission_amount_percue: null,
    start_date: "2026-04-01",
    end_date: "2026-07-01",
    signed_at: "2026-04-01T10:00:00Z",
    sold_at: null,
    sold_price: null,
    notes: null,
    is_co_mandate: false,
    co_agency_name: null,
    co_agency_commission_pct: null,
    co_agency_contact: null,
    is_published: false,
    published_at: null,
    media_count: 0,
    days_to_sign: null,
    days_to_close: null,
    created_at: "2026-04-01T10:00:00Z",
    updated_at: "2026-04-01T10:00:00Z",
    ...overrides,
  };
}

describe("xmlEscape", () => {
  it("échappe les 5 caractères XML", () => {
    expect(xmlEscape(`<a & b>"c'd`)).toBe("&lt;a &amp; b&gt;&quot;c&apos;d");
  });
  it("gère null et undefined", () => {
    expect(xmlEscape(null)).toBe("");
    expect(xmlEscape(undefined)).toBe("");
  });
  it("gère les nombres", () => {
    expect(xmlEscape(42)).toBe("42");
  });
});

describe("mandateToOpenImmoFragment", () => {
  it("produit du XML bien formé avec les balises OpenImmo obligatoires", () => {
    const xml = mandateToOpenImmoFragment(fakeMandate());
    expect(xml).toContain("<immobilie>");
    expect(xml).toContain("</immobilie>");
    expect(xml).toContain("<objektkategorie>");
    expect(xml).toContain("<geo>");
    expect(xml).toContain("<preise>");
    expect(xml).toContain("<flaechen>");
    expect(xml).toContain("<verwaltung_techn>");
  });
  it("encode un appartement comme WOHNUNG", () => {
    const xml = mandateToOpenImmoFragment(fakeMandate({ property_type: "appartement" }));
    expect(xml).toContain("wohnung");
    expect(xml).toContain("WOHNEN=\"true\"");
  });
  it("encode un terrain comme GRUNDSTUECK", () => {
    const xml = mandateToOpenImmoFragment(fakeMandate({ property_type: "terrain" }));
    expect(xml).toContain("grundstueck");
  });
  it("inclut iso_land=LUX pour un bien luxembourgeois", () => {
    const xml = mandateToOpenImmoFragment(fakeMandate());
    expect(xml).toContain('iso_land="LUX"');
  });
  it("inclut la classe énergétique mappée correctement", () => {
    const xml = mandateToOpenImmoFragment(fakeMandate({ property_epc_class: "A+" }));
    expect(xml).toContain("A_PLUS");
  });
  it("inclut le prix demandé et la commission", () => {
    const xml = mandateToOpenImmoFragment(fakeMandate());
    expect(xml).toContain("<kaufpreis>780000</kaufpreis>");
    expect(xml).toContain("3 % TVA");
  });
  it("échappe les caractères spéciaux dans l'adresse", () => {
    const xml = mandateToOpenImmoFragment(fakeMandate({ property_address: "<script>alert('xss')</script>" }));
    expect(xml).not.toContain("<script>");
    expect(xml).toContain("&lt;script&gt;");
  });
});

describe("buildOpenImmoXml", () => {
  it("produit un document OpenImmo complet avec déclaration XML + anbieter", () => {
    const xml = buildOpenImmoXml([fakeMandate()], {
      firmenname: "Tevaxia Immo SARL",
      openimmo_anid: "LU-TEVAXIA-001",
      lang: "fr",
      email_zentrale: "contact@tevaxia.lu",
    });
    expect(xml).toMatch(/^<\?xml version="1\.0"/);
    expect(xml).toContain("<openimmo");
    expect(xml).toContain("version=\"1.2.7\"");
    expect(xml).toContain("<anbieter>");
    expect(xml).toContain("Tevaxia Immo SARL");
    expect(xml).toContain("LU-TEVAXIA-001");
    expect(xml).toContain("</openimmo>");
  });
  it("génère un fragment immobilie par mandat", () => {
    const xml = buildOpenImmoXml(
      [fakeMandate({ id: "id1" }), fakeMandate({ id: "id2", reference: "REF-002" })],
      { firmenname: "X", openimmo_anid: "Y", lang: "fr" },
    );
    const count = (xml.match(/<immobilie>/g) ?? []).length;
    expect(count).toBe(2);
  });
});

describe("buildPortalCsv", () => {
  it("génère un CSV avec BOM UTF-8", () => {
    const csv = buildPortalCsv([fakeMandate()]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
  });
  it("inclut les headers obligatoires", () => {
    const csv = buildPortalCsv([fakeMandate()]);
    expect(csv).toContain("\"reference\"");
    expect(csv).toContain("\"prix_demande\"");
    expect(csv).toContain("\"commune\"");
  });
  it("échappe les guillemets dans les champs", () => {
    const csv = buildPortalCsv([fakeMandate({ property_description: 'Un "vrai" bijou' })]);
    expect(csv).toContain('Un ""vrai"" bijou');
  });
});

describe("parseOpenImmoXml round-trip", () => {
  it("parse correctement un document qu'on vient de générer", () => {
    const original = fakeMandate();
    const xml = buildOpenImmoXml([original], {
      firmenname: "Test",
      openimmo_anid: "X",
      lang: "fr",
    });
    const parsed = parseOpenImmoXml(xml);
    expect(parsed).toHaveLength(1);
    const p = parsed[0];
    expect(p.commune).toBe("Luxembourg");
    expect(p.price_eur).toBe(780000);
    expect(p.surface_m2).toBe(85);
    expect(p.bedrooms).toBe(2);
    expect(p.bathrooms).toBe(1);
    expect(p.year_built).toBe(2018);
    expect(p.energy_class).toBe("B");
  });
  it("reconvertit un import en patch tevaxia complet", () => {
    const xml = buildOpenImmoXml([fakeMandate()], {
      firmenname: "X",
      openimmo_anid: "Y",
      lang: "fr",
    });
    const [p] = parseOpenImmoXml(xml);
    const patch = openImmoToMandatePatch(p);
    expect(patch.property_type).toBe("appartement");
    expect(patch.property_commune).toBe("Luxembourg");
    expect(patch.prix_demande).toBe(780000);
    expect(patch.property_surface).toBe(85);
  });
  it("parse plusieurs immobilies dans un document multi-biens", () => {
    const xml = buildOpenImmoXml(
      [
        fakeMandate({ id: "a", reference: "A" }),
        fakeMandate({ id: "b", reference: "B", property_type: "maison" }),
        fakeMandate({ id: "c", reference: "C", property_type: "terrain" }),
      ],
      { firmenname: "X", openimmo_anid: "Y", lang: "fr" },
    );
    const parsed = parseOpenImmoXml(xml);
    expect(parsed).toHaveLength(3);
    expect(parsed[1].objektart).toBe("HAUS");
    expect(parsed[2].objektart).toBe("GRUNDSTUECK");
  });
});
