// Demandes de démonstration envoyées depuis les pages publiques des logiciels
// (syndic, PMS, gestion locative, CRM). Validation partagée par le formulaire
// et la route `/api/demo-request`.

export const DEMO_PRODUCTS = ["syndic", "pms", "rental", "crm"] as const;
export type DemoProduct = (typeof DEMO_PRODUCTS)[number];

export const DEMO_LOCALES = ["fr", "en", "de", "pt", "lb"] as const;
export type DemoLocale = (typeof DEMO_LOCALES)[number];

export interface DemoRequest {
  product: DemoProduct;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  /** Taille indicative : nombre de lots, de chambres, d'agents. Texte libre. */
  size: string | null;
  message: string | null;
  locale: DemoLocale;
  /** Chemin de la page d'où part la demande. */
  page: string | null;
}

export type DemoRequestField = "product" | "name" | "company" | "email" | "phone" | "size" | "message";

export type DemoRequestResult =
  /** `spam` : le champ piège a été rempli ; la demande est ignorée sans erreur. */
  | { ok: true; value: DemoRequest; spam: boolean }
  | { ok: false; field: DemoRequestField };

export const DEMO_LIMITS = { name: 120, company: 160, email: 254, phone: 40, size: 80, message: 2000, page: 200 } as const;

const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function text(raw: unknown, multiline = false): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw.replace(CONTROL, "").replace(/\r\n?/g, "\n");
  return (multiline ? cleaned.replace(/\n{3,}/g, "\n\n") : cleaned.replace(/\s+/g, " ")).trim();
}

function optional(raw: unknown, max: number, multiline = false): string | null | undefined {
  const value = text(raw, multiline);
  if (!value) return null;
  return value.length > max ? undefined : value;
}

export function parseDemoRequest(raw: unknown): DemoRequestResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, field: "product" };
  const body = raw as Record<string, unknown>;

  const product = DEMO_PRODUCTS.find(candidate => candidate === body.product);
  if (!product) return { ok: false, field: "product" };

  const name = text(body.name);
  if (name.length < 2 || name.length > DEMO_LIMITS.name) return { ok: false, field: "name" };

  const email = text(body.email).toLowerCase();
  if (email.length > DEMO_LIMITS.email || !EMAIL.test(email)) return { ok: false, field: "email" };

  const company = optional(body.company, DEMO_LIMITS.company);
  if (company === undefined) return { ok: false, field: "company" };
  const phone = optional(body.phone, DEMO_LIMITS.phone);
  if (phone === undefined || (phone !== null && !/^[+0-9 ().\/-]{6,}$/.test(phone))) return { ok: false, field: "phone" };
  const size = optional(body.size, DEMO_LIMITS.size);
  if (size === undefined) return { ok: false, field: "size" };
  const message = optional(body.message, DEMO_LIMITS.message, true);
  if (message === undefined) return { ok: false, field: "message" };

  const locale = DEMO_LOCALES.find(candidate => candidate === body.locale) ?? "fr";
  const pageRaw = text(body.page);
  const page = /^\/[A-Za-z0-9\-_/]*$/.test(pageRaw) && pageRaw.length <= DEMO_LIMITS.page ? pageRaw : null;

  // Champ piège : invisible pour un visiteur, rempli par les robots.
  const spam = typeof body.website === "string" && body.website.trim() !== "";

  return { ok: true, spam, value: { product, name, company, email, phone, size, message, locale, page } };
}
