/**
 * Registre des providers de sauvegarde.
 * Ajoute un provider ici pour qu'il soit disponible via <BackupButton />.
 */

import type { ExportProvider, BackupModule } from "./types";
import { syndicProvider } from "./providers/syndic";

const PROVIDERS: Record<string, ExportProvider> = {
  syndic: syndicProvider,
};

export function getProvider(module: BackupModule): ExportProvider | null {
  return PROVIDERS[module] ?? null;
}

export function availableModules(): BackupModule[] {
  return Object.keys(PROVIDERS) as BackupModule[];
}

export type { BackupModule, BackupBundle, BackupManifest, ExportProvider, ExportContext } from "./types";
export { buildZip, defaultZipFilename } from "./zip";
