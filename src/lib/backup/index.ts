/**
 * Registre des providers de sauvegarde.
 * Ajoute un provider ici pour qu'il soit disponible via <BackupButton />.
 */

import type { ExportProvider, BackupModule } from "./types";
import { syndicProvider } from "./providers/syndic";
import { evaluationsProvider } from "./providers/evaluations";
import { gestionLocativeProvider } from "./providers/gestion-locative";
import { pmsProvider } from "./providers/pms";
import { crmAgencesProvider } from "./providers/crm-agences";
import { facturationProvider } from "./providers/facturation";
import { inspectionProvider } from "./providers/inspection";
import { profilProvider } from "./providers/profil";

const PROVIDERS: Record<string, ExportProvider> = {
  syndic: syndicProvider,
  "gestion-locative": gestionLocativeProvider,
  pms: pmsProvider,
  "crm-agences": crmAgencesProvider,
  evaluations: evaluationsProvider,
  facturation: facturationProvider,
  inspection: inspectionProvider,
  profil: profilProvider,
};

export function getProvider(module: BackupModule): ExportProvider | null {
  return PROVIDERS[module] ?? null;
}

export function availableModules(): BackupModule[] {
  return Object.keys(PROVIDERS) as BackupModule[];
}

export type { BackupModule, BackupBundle, BackupManifest, ExportProvider, ExportContext } from "./types";
export { buildZip, defaultZipFilename } from "./zip";
