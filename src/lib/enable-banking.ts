/**
 * Enable Banking API wrapper — PSD2 Account Information Service (AIS).
 *
 * Auth: JWT RS256 signé avec une clé privée RSA. L'App ID (kid) et la clé
 * privée PEM sont définis par env vars côté serveur :
 *   - ENABLE_BANKING_APP_ID
 *   - ENABLE_BANKING_PRIVATE_KEY (PEM, lignes séparées par \n littéral)
 *
 * Doc API: https://enablebanking.com/docs/api/
 * Cadre légal: PSD2 Directive UE 2015/2366, SCA obligatoire via banque.
 */

import crypto from "node:crypto";

export const EB_BASE = "https://api.enablebanking.com";

export interface EbAspsp {
  name: string;
  country: string;
  logo?: string;
  psu_types?: string[];
  auth_methods?: Array<{ name: string; title?: string }>;
}

export interface EbAuthResponse {
  url: string;
  authorization_id: string;
  psu_id_hash?: string;
}

export interface EbSession {
  session_id: string;
  accounts: Array<{ uid: string }>;
  accounts_data?: Array<{
    uid: string;
    account_id?: { iban?: string };
    name?: string;
    currency?: string;
  }>;
  access: { valid_until: string };
  aspsp: { name: string; country: string };
  psu_type: string;
}

export interface EbTransaction {
  entry_reference?: string;
  transaction_amount: { amount: string; currency: string };
  credit_debit_indicator: "CRDT" | "DBIT";
  status: "BOOK" | "PDNG" | "INFO";
  booking_date?: string;
  value_date?: string;
  transaction_date?: string;
  remittance_information?: string[];
  creditor?: { name?: string };
  debtor?: { name?: string };
}

export function isConfigured(): boolean {
  return Boolean(process.env.ENABLE_BANKING_APP_ID && process.env.ENABLE_BANKING_PRIVATE_KEY);
}

function base64url(input: Buffer | string): string {
  const b = typeof input === "string" ? Buffer.from(input) : input;
  return b.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

let cachedJwt: { token: string; expiresAt: number } | null = null;

export function buildJwt(): string {
  if (!isConfigured()) throw new Error("Enable Banking not configured");
  if (cachedJwt && cachedJwt.expiresAt > Date.now() + 60_000) return cachedJwt.token;

  const appId = process.env.ENABLE_BANKING_APP_ID!;
  // Env vars Vercel stockent les \n en littéral, on les restaure
  const privateKey = process.env.ENABLE_BANKING_PRIVATE_KEY!.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 h

  const header = { typ: "JWT", alg: "RS256", kid: appId };
  const payload = {
    iss: "enablebanking.com",
    aud: "api.enablebanking.com",
    iat: now,
    exp,
  };

  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encHeader}.${encPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKey);

  const token = `${signingInput}.${base64url(signature)}`;
  cachedJwt = { token, expiresAt: exp * 1000 };
  return token;
}

async function ebFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = buildJwt();
  const res = await fetch(`${EB_BASE}${path}`, {
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
    throw new Error(`EnableBanking ${path} HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function listAspsps(country = "LU"): Promise<EbAspsp[]> {
  const data = await ebFetch<{ aspsps: EbAspsp[] }>(`/aspsps?country=${country}`);
  return data.aspsps ?? [];
}

export function startAuth(params: {
  aspsp: { name: string; country: string };
  redirectUrl: string;
  validUntil: string; // ISO datetime
  state: string;
  psuType?: "personal" | "business";
}): Promise<EbAuthResponse> {
  return ebFetch<EbAuthResponse>(`/auth`, {
    method: "POST",
    body: JSON.stringify({
      access: { valid_until: params.validUntil },
      aspsp: params.aspsp,
      redirect_url: params.redirectUrl,
      state: params.state,
      psu_type: params.psuType ?? "personal",
    }),
  });
}

export function createSession(code: string): Promise<EbSession> {
  return ebFetch<EbSession>(`/sessions`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function getSession(sessionId: string): Promise<EbSession> {
  return ebFetch<EbSession>(`/sessions/${sessionId}`);
}

export async function getAccountTransactions(accountUid: string, dateFrom?: string): Promise<EbTransaction[]> {
  const q = dateFrom ? `?date_from=${dateFrom}` : "";
  const data = await ebFetch<{ transactions: EbTransaction[] }>(`/accounts/${accountUid}/transactions${q}`);
  return data.transactions ?? [];
}
