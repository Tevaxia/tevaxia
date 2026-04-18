import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/vies?country=LU&vat=12345678
 *
 * Interroge VIES (VAT Information Exchange System, DG TAXUD Commission UE)
 * pour valider et récupérer le nom / adresse d'une entreprise à partir de
 * son numéro de TVA intracommunautaire. Gratuit, sans authentification.
 *
 * Pays supportés : les 27 États membres UE + XI (Irlande du Nord).
 * Endpoint REST officiel (2024+) :
 *   POST https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number
 *
 * Rate-limit côté serveur (pas sur nous) : ~5 req/min par IP, fair-use.
 * Nous appelons en SSR pour éviter CORS et logguer les requêtes si besoin.
 */

interface ViesResult {
  valid: boolean;
  countryCode: string;
  vatNumber: string;
  name?: string;
  address?: string;
  requestDate?: string;
  source: "vies";
}

const EU_CODES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "EL", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE", "XI",
]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const country = (url.searchParams.get("country") ?? "").toUpperCase().trim();
  const vatRaw = (url.searchParams.get("vat") ?? "").replace(/[^0-9A-Z]/gi, "").toUpperCase();

  if (!country || !EU_CODES.has(country)) {
    return NextResponse.json({ error: "invalid_country" }, { status: 400 });
  }
  // Le numéro ne contient parfois pas le préfixe pays : on accepte les 2 formats.
  const vatNumber = vatRaw.startsWith(country) ? vatRaw.slice(country.length) : vatRaw;
  if (!vatNumber || vatNumber.length < 4 || vatNumber.length > 14) {
    return NextResponse.json({ error: "invalid_vat" }, { status: 400 });
  }

  try {
    const resp = await fetch(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ countryCode: country, vatNumber }),
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: "vies_upstream_error", status: resp.status, detail: txt.slice(0, 200) },
        { status: 502 },
      );
    }

    const data = (await resp.json()) as {
      valid?: boolean;
      name?: string | null;
      address?: string | null;
      requestDate?: string;
      userError?: string;
    };

    if (data.userError && data.userError !== "VALID") {
      return NextResponse.json(
        { error: "vies_user_error", code: data.userError },
        { status: 404 },
      );
    }

    const result: ViesResult = {
      valid: !!data.valid,
      countryCode: country,
      vatNumber,
      name: data.name && data.name !== "---" ? data.name : undefined,
      address: data.address && data.address !== "---" ? data.address : undefined,
      requestDate: data.requestDate,
      source: "vies",
    };
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "vies_network_error", message: e instanceof Error ? e.message : String(e) },
      { status: 503 },
    );
  }
}
