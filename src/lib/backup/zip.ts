/**
 * ZIP bundler — wrappe fflate pour exporter un BackupBundle en Blob.
 *
 * Structure produite :
 *   manifest.json           ← BackupManifest
 *   README.txt              ← notice pour l'utilisateur
 *   data/{file}.json        ← entités du module (contenu de bundle.files)
 *   pdfs/{file}.pdf         ← PDFs joints (contenu de bundle.binaries)
 */

import { zipSync, type Zippable } from "fflate";
import type { BackupBundle, BackupManifest } from "./types";

const README = `Sauvegarde Tevaxia.lu
=====================

Ce ZIP contient une copie de vos données stockées sur tevaxia.lu pour le module
indiqué dans manifest.json.

Format :
- manifest.json : métadonnées (module, date, compteurs, version du schéma)
- data/*.json : entités exportées (JSON UTF-8, réimportable si nécessaire)
- pdfs/*.pdf : PDFs générés (convocations AG, appels de fonds, factures…)

Cette sauvegarde est fournie au titre du droit à la portabilité des données
(Article 20 RGPD). Conservez-la en lieu sûr — elle contient des données
personnelles (copropriétaires, tenants, contacts, etc.).

Pour restaurer : contactez contact@tevaxia.lu.
`;

export interface BuildZipOptions {
  manifest: BackupManifest;
  bundle: BackupBundle;
}

export function buildZip(opts: BuildZipOptions): Blob {
  const encoder = new TextEncoder();
  const entries: Zippable = {};

  entries["manifest.json"] = encoder.encode(JSON.stringify(opts.manifest, null, 2));
  entries["README.txt"] = encoder.encode(README);

  for (const [name, content] of Object.entries(opts.bundle.files)) {
    entries[`data/${name}`] = encoder.encode(content);
  }

  if (opts.bundle.binaries) {
    for (const [name, bytes] of Object.entries(opts.bundle.binaries)) {
      entries[`pdfs/${name}`] = bytes;
    }
  }

  const zipped = zipSync(entries, { level: 6 });
  return new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" });
}

/** Nom de fichier par défaut : tevaxia-<module>-YYYY-MM-DD.zip */
export function defaultZipFilename(module: string): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `tevaxia-${module}-${y}-${m}-${day}.zip`;
}
