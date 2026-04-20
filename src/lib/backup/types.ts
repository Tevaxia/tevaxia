/**
 * Types partagés pour le système de sauvegarde utilisateur.
 *
 * Principe : chaque module (syndic, CRM, PMS…) implémente ExportProvider.
 * Le composant <BackupButton /> orchestre download ZIP + upload Drive.
 *
 * Tout est client-side (les libs Supabase utilisent déjà RLS + browser client),
 * donc aucun token serveur, conforme RGPD par design.
 */

export type BackupModule =
  | "syndic"
  | "gestion-locative"
  | "pms"
  | "crm-agences"
  | "evaluations"
  | "facturation"
  | "inspection"
  | "profil";

export interface BackupManifest {
  schemaVersion: 1;
  module: BackupModule;
  userId: string;
  exportedAt: string; // ISO 8601
  counts: Record<string, number>; // e.g. { coownerships: 3, units: 45, assemblies: 12 }
  tevaxiaVersion?: string;
}

export interface BackupBundle {
  /** Fichiers texte (JSON, CSV, markdown). */
  files: Record<string, string>;
  /** Fichiers binaires (PDF déjà générés, images, etc.). */
  binaries?: Record<string, Uint8Array>;
  /** Compteurs affichés dans le manifest. */
  counts: Record<string, number>;
}

export interface ExportProvider {
  module: BackupModule;
  /**
   * Récupère toutes les données de l'utilisateur pour ce module.
   * Appelé côté navigateur, utilise le supabase client avec RLS.
   */
  collect: (ctx: ExportContext) => Promise<BackupBundle>;
}

export interface ExportContext {
  userId: string;
  orgId: string | null;
  /** Fonction i18n pour traduire certains libellés dans le README du ZIP. */
  t: (key: string) => string;
}
