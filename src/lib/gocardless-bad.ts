/**
 * GoCardless Bank Account Data (ex-Nordigen) PSD2 wrapper.
 *
 * Cadre réglementaire: PSD2 (Directive UE 2015/2366) + DORA + SCA.
 * Free tier: 100 requisitions/jour (EU).
 *
 * Activation: définir GOCARDLESS_BAD_SECRET_ID + GOCARDLESS_BAD_SECRET_KEY
 * côté serveur (env vars Vercel). Sans ces vars, les endpoints renvoient 501.
 *
 * Doc API: https://bankaccountdata.gocardless.com/api/v2/
 */

export const GC_BAD_BASE = "https://bankaccountdata.gocardless.com/api/v2";

export interface GcInstitution {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
}

export interface GcRequisition {
  id: string;
  created: string;
  redirect: string;
  status: string;
  institution_id: string;
  agreement: string;
  reference: string;
  accounts: string[];
  link: string;
}

export interface GcAccount {
  id: string;
  created: string;
  last_accessed: string | null;
  iban: string;
  institution_id: string;
  status: string;
  owner_name: string;
}

export interface GcTransaction {
  transactionId?: string;
  bookingDate?: string;
  valueDate?: string;
  transactionAmount: { amount: string; currency: string };
  remittanceInformationUnstructured?: string;
  creditorName?: string;
  debtorName?: string;
  bankTransactionCode?: string;
}

interface TokenCache {
  access: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export function isConfigured(): boolean {
  return Boolean(process.env.GOCARDLESS_BAD_SECRET_ID && process.env.GOCARDLESS_BAD_SECRET_KEY);
}

export async function getAccessToken(): Promise<string> {
  if (!isConfigured()) throw new Error("GoCardless BAD not configured");
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.access;

  const res = await fetch(`${GC_BAD_BASE}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      secret_id: process.env.GOCARDLESS_BAD_SECRET_ID,
      secret_key: process.env.GOCARDLESS_BAD_SECRET_KEY,
    }),
  });
  if (!res.ok) throw new Error(`GC token HTTP ${res.status}`);
  const data = await res.json();
  tokenCache = {
    access: data.access,
    expiresAt: Date.now() + (data.access_expires ?? 3600) * 1000,
  };
  return tokenCache.access;
}

async function gcFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${GC_BAD_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GC ${path} HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export function listInstitutions(country = "LU"): Promise<GcInstitution[]> {
  return gcFetch<GcInstitution[]>(`/institutions/?country=${country}`);
}

export function createRequisition(params: {
  institutionId: string;
  redirect: string;
  reference: string;
  userLanguage?: string;
}): Promise<GcRequisition> {
  return gcFetch<GcRequisition>(`/requisitions/`, {
    method: "POST",
    body: JSON.stringify({
      redirect: params.redirect,
      institution_id: params.institutionId,
      reference: params.reference,
      user_language: params.userLanguage ?? "FR",
    }),
  });
}

export function getRequisition(id: string): Promise<GcRequisition> {
  return gcFetch<GcRequisition>(`/requisitions/${id}/`);
}

export async function getAccountTransactions(accountId: string): Promise<{
  booked: GcTransaction[];
  pending: GcTransaction[];
}> {
  const data = await gcFetch<{ transactions: { booked: GcTransaction[]; pending: GcTransaction[] } }>(
    `/accounts/${accountId}/transactions/`,
  );
  return data.transactions;
}
