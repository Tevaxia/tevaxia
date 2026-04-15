// ============================================================
// GESTION LOCATIVE LU — lots, baux, règle des 5 %, Klimabonus
// ============================================================
// Spécificités luxembourgeoises prises en compte :
// - plafond légal de loyer basé sur 5 % du capital investi réévalué
// - impact classe énergétique (Klimabonus en rénovation)
// - aides communales / Habitat Abordable

import { calculerCapitalInvesti } from "./calculations";
import { supabase } from "./supabase";

const STORAGE_KEY = "tevaxia_rental_properties";
const CLOUD_CAP = 500;

export type EnergyClass = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "NC";

export interface RentalLot {
  id: string;
  name: string;
  address?: string;
  commune?: string;

  // Caractéristiques
  surface: number; // m²
  nbChambres?: number;
  classeEnergie: EnergyClass;
  estMeuble: boolean;

  // Acquisition & travaux (règle 5%)
  prixAcquisition: number;
  anneeAcquisition: number;
  travauxMontant: number;
  travauxAnnee: number;

  // Location actuelle
  loyerMensuelActuel: number; // charges non comprises
  chargesMensuelles: number; // charges locatives mensuelles
  tenantName?: string;
  leaseStartDate?: string; // YYYY-MM
  leaseEndDate?: string; // YYYY-MM
  vacant: boolean;

  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface LotAnalysis {
  lot: RentalLot;
  loyerLegalMensuelMax: number;
  loyerLegalM2Mensuel: number;
  ecartLegalPct: number; // (loyerActuel - max) / max — négatif si sous le plafond
  depasseLegal: boolean;

  rendementBrutPct: number; // loyerAnnuel / prixAcquisition
  rendementNetApproximatif: number; // brut - 1.5% charges

  klimabonusEligible: boolean; // classes E/F/G éligibles à la rénovation
  klimabonusMessage?: string;
}

export interface PortfolioSummary {
  nbLots: number;
  nbVacants: number;
  loyerMensuelTotal: number;
  loyerAnnuelTotal: number;
  surfaceTotale: number;
  capitalTotal: number;
  rendementBrutMoyen: number;
  lotsHorsPlafond: number;
  lotsKlimabonus: number;
}

// ---------- Storage ----------

function load(): RentalLot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RentalLot[]) : [];
  } catch {
    return [];
  }
}

function persist(lots: RentalLot[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lots));
}

export function listLots(): RentalLot[] {
  return load().sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export function getLot(id: string): RentalLot | null {
  return load().find((l) => l.id === id) ?? null;
}

export function saveLot(lot: Omit<RentalLot, "id" | "createdAt" | "updatedAt"> & { id?: string }): RentalLot {
  const lots = load();
  const now = new Date().toISOString();
  let result: RentalLot;
  if (lot.id) {
    const idx = lots.findIndex((l) => l.id === lot.id);
    const existing = idx >= 0 ? lots[idx] : null;
    result = {
      ...(existing ?? { createdAt: now }),
      ...lot,
      id: lot.id,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
    } as RentalLot;
    if (idx >= 0) lots[idx] = result;
    else lots.push(result);
  } else {
    result = {
      ...lot,
      id: `lot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    lots.push(result);
  }
  if (lots.length > CLOUD_CAP) lots.length = CLOUD_CAP;
  persist(lots);
  void cloudUpsertLot(result);
  return result;
}

export function deleteLot(id: string): void {
  persist(load().filter((l) => l.id !== id));
  void cloudDeleteLot(id);
}

// ---------- Cloud sync (Supabase) ----------

async function cloudUpsertLot(l: RentalLot): Promise<void> {
  if (!supabase) return;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;
    await supabase.from("rental_lots").upsert(
      {
        user_id: user.id,
        local_id: l.id,
        name: l.name,
        address: l.address ?? null,
        commune: l.commune ?? null,
        surface: l.surface,
        nb_chambres: l.nbChambres ?? null,
        classe_energie: l.classeEnergie,
        est_meuble: l.estMeuble,
        prix_acquisition: l.prixAcquisition,
        annee_acquisition: l.anneeAcquisition,
        travaux_montant: l.travauxMontant,
        travaux_annee: l.travauxAnnee,
        loyer_mensuel_actuel: l.loyerMensuelActuel,
        charges_mensuelles: l.chargesMensuelles,
        tenant_name: l.tenantName ?? null,
        lease_start_date: l.leaseStartDate ?? null,
        lease_end_date: l.leaseEndDate ?? null,
        vacant: l.vacant,
      },
      { onConflict: "user_id,local_id" }
    );
  } catch (e) {
    console.warn("cloudUpsertLot failed:", e);
  }
}

async function cloudDeleteLot(localId: string): Promise<void> {
  if (!supabase) return;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;
    await supabase.from("rental_lots").delete().eq("user_id", user.id).eq("local_id", localId);
  } catch (e) {
    console.warn("cloudDeleteLot failed:", e);
  }
}

async function cloudListLots(): Promise<RentalLot[]> {
  if (!supabase) return [];
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return [];
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("rental_lots")
      .select("*")
      .eq("user_id", user.id)
      .gt("expires_at", nowIso)
      .order("updated_at", { ascending: false })
      .limit(CLOUD_CAP);
    if (error || !data) return [];
    return data.map((d) => ({
      id: (d.local_id as string) || (d.id as string),
      name: d.name as string,
      address: (d.address as string | null) ?? undefined,
      commune: (d.commune as string | null) ?? undefined,
      surface: Number(d.surface),
      nbChambres: (d.nb_chambres as number | null) ?? undefined,
      classeEnergie: (d.classe_energie as EnergyClass) ?? "NC",
      estMeuble: Boolean(d.est_meuble),
      prixAcquisition: Number(d.prix_acquisition),
      anneeAcquisition: Number(d.annee_acquisition),
      travauxMontant: Number(d.travaux_montant),
      travauxAnnee: Number(d.travaux_annee),
      loyerMensuelActuel: Number(d.loyer_mensuel_actuel),
      chargesMensuelles: Number(d.charges_mensuelles),
      tenantName: (d.tenant_name as string | null) ?? undefined,
      leaseStartDate: (d.lease_start_date as string | null) ?? undefined,
      leaseEndDate: (d.lease_end_date as string | null) ?? undefined,
      vacant: Boolean(d.vacant),
      createdAt: (d.created_at as string) || new Date().toISOString(),
      updatedAt: (d.updated_at as string) || new Date().toISOString(),
    }));
  } catch (e) {
    console.warn("cloudListLots failed:", e);
    return [];
  }
}

/**
 * Liste asynchrone mergée local + cloud. Met à jour le localStorage
 * avec le résultat fusionné.
 */
export async function listLotsAsync(): Promise<{ items: RentalLot[]; cloud: boolean }> {
  const local = load();
  const cloud = await cloudListLots();
  if (cloud.length === 0) {
    return { items: local.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), cloud: false };
  }
  const byId = new Map<string, RentalLot>();
  for (const l of local) byId.set(l.id, l);
  for (const l of cloud) {
    const existing = byId.get(l.id);
    if (!existing || existing.updatedAt < l.updatedAt) byId.set(l.id, l);
  }
  const merged = Array.from(byId.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const capped = merged.slice(0, CLOUD_CAP);
  persist(capped);
  return { items: capped, cloud: true };
}

/** À la connexion : pousse tous les lots locaux vers le cloud. */
export async function syncLocalLotsToCloud(): Promise<number> {
  const local = load();
  if (local.length === 0) return 0;
  await Promise.all(local.map((l) => cloudUpsertLot(l)));
  return local.length;
}

// ---------- Calculs ----------

export function analyzeLot(lot: RentalLot): LotAnalysis {
  const currentYear = new Date().getFullYear();
  const capital = calculerCapitalInvesti({
    prixAcquisition: lot.prixAcquisition,
    anneeAcquisition: lot.anneeAcquisition,
    travauxMontant: lot.travauxMontant,
    travauxAnnee: lot.travauxAnnee || lot.anneeAcquisition,
    anneeBail: currentYear,
    surfaceHabitable: lot.surface,
    appliquerVetuste: true,
    tauxVetusteAnnuel: 1,
    estMeuble: lot.estMeuble,
  });

  const loyerAnnuelActuel = lot.loyerMensuelActuel * 12;
  const ecartLegalPct = capital.loyerMensuelMax > 0
    ? (lot.loyerMensuelActuel - capital.loyerMensuelMax) / capital.loyerMensuelMax
    : 0;

  const rendementBrutPct = lot.prixAcquisition > 0
    ? loyerAnnuelActuel / lot.prixAcquisition
    : 0;

  const klimabonusEligible = ["E", "F", "G"].includes(lot.classeEnergie);
  const klimabonusMessage = klimabonusEligible
    ? "Classe énergie E/F/G — rénovation énergétique éligible Klimabonus (jusqu'à 65 % des travaux + prime CO₂)."
    : undefined;

  return {
    lot,
    loyerLegalMensuelMax: capital.loyerMensuelMax,
    loyerLegalM2Mensuel: capital.loyerM2Mensuel,
    ecartLegalPct,
    depasseLegal: lot.loyerMensuelActuel > capital.loyerMensuelMax && capital.loyerMensuelMax > 0,
    rendementBrutPct,
    rendementNetApproximatif: Math.max(0, rendementBrutPct - 0.015),
    klimabonusEligible,
    klimabonusMessage,
  };
}

export function summarize(lots: RentalLot[]): PortfolioSummary {
  const analyses = lots.map(analyzeLot);
  const loyerMensuelTotal = lots.filter((l) => !l.vacant).reduce((s, l) => s + l.loyerMensuelActuel, 0);
  const capitalTotal = lots.reduce((s, l) => s + l.prixAcquisition, 0);
  const loyerAnnuelTotal = loyerMensuelTotal * 12;
  const rendementBrutMoyen = capitalTotal > 0 ? loyerAnnuelTotal / capitalTotal : 0;

  return {
    nbLots: lots.length,
    nbVacants: lots.filter((l) => l.vacant).length,
    loyerMensuelTotal,
    loyerAnnuelTotal,
    surfaceTotale: lots.reduce((s, l) => s + l.surface, 0),
    capitalTotal,
    rendementBrutMoyen,
    lotsHorsPlafond: analyses.filter((a) => a.depasseLegal).length,
    lotsKlimabonus: analyses.filter((a) => a.klimabonusEligible).length,
  };
}
