export const ANALYTICS_CONSENT_KEY = "tevaxia_consent";
export const ANALYTICS_CONSENT_EVENT = "tevaxia:consent-changed";
export const OPEN_COOKIE_SETTINGS_EVENT = "tevaxia:cookie-settings";
export const GA_MEASUREMENT_ID = "G-4033901KHR";
export type AnalyticsConsent = "granted" | "denied";
export const ANALYTICS_CONSENT_VERSION = 2;
// Product renewal policy, not a universal statutory retention period.
export const ANALYTICS_CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
interface ConsentRecord { choice: AnalyticsConsent; version: number; decidedAt: number; expiresAt: number }
declare global { interface Window { gtag: (...args: unknown[]) => void } }
let temporaryChoice: ConsentRecord | undefined;

function validRecord(value: unknown): value is ConsentRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as ConsentRecord;
  const now = Date.now();
  return (record.choice === "granted" || record.choice === "denied") && record.version === ANALYTICS_CONSENT_VERSION
    && Number.isFinite(record.decidedAt) && record.decidedAt <= now
    && record.expiresAt === record.decidedAt + ANALYTICS_CONSENT_MAX_AGE_MS && now < record.expiresAt;
}

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (temporaryChoice) return validRecord(temporaryChoice) ? temporaryChoice.choice : null;
  try {
    const value = typeof window === "undefined" ? null : localStorage.getItem(ANALYTICS_CONSENT_KEY);
    // Undated legacy choices are renewed; a prior grant is never silently extended.
    const record: unknown = value ? JSON.parse(value) : null;
    return validRecord(record) ? record.choice : null;
  } catch { return null; }
}

export function applyGoogleConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = !granted;
  try {
    if (typeof window.gtag === "function") window.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    });
  } catch { /* A third-party SDK failure must not prevent withdrawal. */ }
  if (!granted) {
    try {
    const domains = ["", location.hostname, ...(location.hostname === "tevaxia.lu" || location.hostname.endsWith(".tevaxia.lu") ? [".tevaxia.lu"] : [])];
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0].trim();
      if (name !== "_ga" && !name.startsWith("_ga_")) continue;
      for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""}`;
    }
    } catch { /* Some browsers block cookie access; collection is disabled above. */ }
  }
}

/** Returns whether the explicit choice could be remembered beyond this page. */
export function setAnalyticsConsent(choice: AnalyticsConsent): boolean {
  if (choice !== "granted" && choice !== "denied") throw new Error("Invalid consent choice");
  let persisted = true;
  const decidedAt = Date.now();
  const record: ConsentRecord = { choice, version: ANALYTICS_CONSENT_VERSION, decidedAt, expiresAt: decidedAt + ANALYTICS_CONSENT_MAX_AGE_MS };
  try { localStorage.setItem(ANALYTICS_CONSENT_KEY, JSON.stringify(record)); temporaryChoice = undefined; }
  catch { temporaryChoice = record; persisted = false; }
  applyGoogleConsent(choice === "granted");
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
  return persisted;
}

export function listenAnalyticsConsent(handler: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ANALYTICS_CONSENT_KEY || event.key === null) { temporaryChoice = undefined; handler(); }
  };
  window.addEventListener(ANALYTICS_CONSENT_EVENT, handler);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", handler);
  // An open page also observes expiration. before_send independently checks consent.
  const interval = setInterval(handler, 60_000);
  return () => { clearInterval(interval); window.removeEventListener("focus", handler); window.removeEventListener(ANALYTICS_CONSENT_EVENT, handler); window.removeEventListener("storage", onStorage); };
}
