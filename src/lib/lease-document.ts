/** New Luxembourg residential lease drafts, concluded from 1 August 2024. */
export interface LeaseDraftInput {
  landlordName: string;
  landlordAddress: string;
  tenantName: string;
  tenantAddress: string;
  propertyAddress: string;
  cadastralReference: string;
  premisesDescription: string;
  conclusionDate: string;
  leaseStart: string;
  leaseEnd: string;
  duration: string;
  monthlyRent: number;
  monthlyCharges: number;
  deposit: number;
  furnished: boolean;
  furnitureSupplement: number;
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function validateLeaseDraft(input: LeaseDraftInput): string[] {
  const errors: string[] = [];
  if (![input.landlordName, input.landlordAddress, input.tenantName, input.tenantAddress, input.propertyAddress, input.cadastralReference, input.premisesDescription].every(value => value.trim())) {
    errors.push("Complétez l’identité et l’adresse des parties, l’adresse du logement, sa référence cadastrale et la désignation des pièces et annexes.");
  }
  if (!validDate(input.conclusionDate) || input.conclusionDate < "2024-08-01") errors.push("Ce modèle concerne les nouveaux baux conclus à partir du 1er août 2024. Vérifiez la date de conclusion.");
  if (!validDate(input.leaseStart) || (input.leaseEnd && (!validDate(input.leaseEnd) || input.leaseEnd <= input.leaseStart)) || (!input.leaseEnd && !input.duration.trim())) errors.push("Vérifiez les dates et la durée du bail.");
  if (!Number.isFinite(input.monthlyRent) || input.monthlyRent <= 0 || !Number.isFinite(input.monthlyCharges) || input.monthlyCharges < 0) errors.push("Le loyer doit être positif et les charges ne peuvent pas être négatives.");
  if (!Number.isFinite(input.deposit) || input.deposit < 0 || input.deposit > 2 * input.monthlyRent) errors.push("La garantie doit être comprise entre 0 et deux mois de loyer hors charges.");
  if (!Number.isFinite(input.furnitureSupplement) || input.furnitureSupplement < 0 || input.furnitureSupplement > input.monthlyRent || (!input.furnished && input.furnitureSupplement !== 0)) errors.push("Vérifiez le supplément mobilier : il est inclus dans le loyer hors charges et doit être nul pour un logement non meublé.");
  return errors;
}

/** The checksum is external: it hashes the final, unchanged PDF bytes. */
export async function leaseChecksum(blob: Blob, fileName: string): Promise<string> {
  if (!/^[a-z0-9_.-]+\.pdf$/i.test(fileName)) throw new Error("Invalid PDF filename");
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hash}  ${fileName}\n`;
}
