/**
 * Client helper pour appeler /api/vies — lookup entreprise par n° TVA UE.
 */

export interface ViesLookupResult {
  valid: boolean;
  countryCode: string;
  vatNumber: string;
  name?: string;
  address?: string;
  requestDate?: string;
  source: "vies";
}

export interface ViesLookupError {
  error: string;
  code?: string;
  status?: number;
}

export async function lookupVies(country: string, vat: string): Promise<ViesLookupResult | ViesLookupError> {
  const params = new URLSearchParams({ country, vat });
  const resp = await fetch(`/api/vies?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  const data = await resp.json();
  if (!resp.ok) return data as ViesLookupError;
  return data as ViesLookupResult;
}

export const VIES_COUNTRIES: { code: string; label: string }[] = [
  { code: "LU", label: "Luxembourg" },
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" },
  { code: "DE", label: "Allemagne" },
  { code: "NL", label: "Pays-Bas" },
  { code: "AT", label: "Autriche" },
  { code: "IT", label: "Italie" },
  { code: "ES", label: "Espagne" },
  { code: "PT", label: "Portugal" },
  { code: "IE", label: "Irlande" },
  { code: "PL", label: "Pologne" },
  { code: "DK", label: "Danemark" },
  { code: "SE", label: "Suède" },
  { code: "FI", label: "Finlande" },
  { code: "EL", label: "Grèce" },
  { code: "CZ", label: "Tchéquie" },
  { code: "SK", label: "Slovaquie" },
  { code: "HU", label: "Hongrie" },
  { code: "RO", label: "Roumanie" },
  { code: "BG", label: "Bulgarie" },
  { code: "HR", label: "Croatie" },
  { code: "SI", label: "Slovénie" },
  { code: "EE", label: "Estonie" },
  { code: "LV", label: "Lettonie" },
  { code: "LT", label: "Lituanie" },
  { code: "MT", label: "Malte" },
  { code: "CY", label: "Chypre" },
];
