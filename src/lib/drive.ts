/**
 * Helpers Google Drive — upload d'un Blob depuis le navigateur via l'access
 * token stocké dans la session Supabase (provider_token).
 *
 * Scope requis : https://www.googleapis.com/auth/drive.file — permet de
 * créer des fichiers dans le Drive de l'utilisateur, limités à ceux créés
 * par notre app. Pas d'accès aux autres fichiers → respect RGPD / moindre
 * privilège.
 *
 * L'utilisateur doit s'être connecté via Google OAuth avec ce scope.
 * Si le scope est manquant, driveUpload() renverra 'scope_missing' et
 * le composant UI demandera un re-consent.
 */

const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
const DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files";

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
  mimeType: string;
  createdTime: string;
}

export type DriveError =
  | { error: "no_session" }
  | { error: "scope_missing" }
  | { error: "unauthorized" }
  | { error: "network"; message: string }
  | { error: "upstream"; status: number; message: string };

/**
 * Upload un Blob sur le Drive de l'utilisateur.
 * Retourne le fichier créé ou une erreur structurée.
 */
export async function driveUpload(args: {
  accessToken: string;
  blob: Blob;
  filename: string;
  mimeType?: string;
  folderId?: string;
  description?: string;
}): Promise<DriveUploadResult | DriveError> {
  const metadata = {
    name: args.filename,
    mimeType: args.mimeType ?? args.blob.type ?? "application/octet-stream",
    ...(args.folderId ? { parents: [args.folderId] } : {}),
    ...(args.description ? { description: args.description } : {}),
  };

  // Multipart body manuel (Drive API v3 sans SDK)
  const boundary = `tevaxia-${Math.random().toString(36).slice(2)}`;
  const delim = `--${boundary}`;
  const close = `--${boundary}--`;

  // Drive API accepte le body comme un FormData multipart/related,
  // mais l'implémentation standard fetch exige multipart/related exact.
  // Solution : construire manuellement le corps à partir d'un Blob mixte.
  const encoder = new TextEncoder();
  const metaPart = encoder.encode(
    `${delim}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
  );
  const bodyPart = encoder.encode(
    `${delim}\r\nContent-Type: ${metadata.mimeType}\r\n\r\n`,
  );
  const closePart = encoder.encode(`\r\n${close}`);

  const fullBody = new Blob([metaPart, bodyPart, args.blob, closePart], {
    type: `multipart/related; boundary=${boundary}`,
  });

  try {
    const resp = await fetch(DRIVE_UPLOAD_URL + "&fields=id,name,webViewLink,mimeType,createdTime", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: fullBody,
    });

    if (resp.status === 401) return { error: "unauthorized" };
    if (resp.status === 403) {
      const txt = await resp.text().catch(() => "");
      if (txt.includes("insufficientScopes") || txt.includes("insufficient authentication scopes")) {
        return { error: "scope_missing" };
      }
      return { error: "upstream", status: 403, message: txt.slice(0, 300) };
    }
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      return { error: "upstream", status: resp.status, message: txt.slice(0, 300) };
    }

    const json = (await resp.json()) as DriveUploadResult;
    return json;
  } catch (e) {
    return { error: "network", message: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Vérifie si un dossier "tevaxia" existe dans le Drive, sinon le crée.
 * Optionnel — l'upload fonctionne dans la racine si aucun folderId fourni.
 */
export async function ensureTevaxiaFolder(accessToken: string): Promise<string | null> {
  try {
    const q = encodeURIComponent("name='tevaxia' and mimeType='application/vnd.google-apps.folder' and trashed=false");
    const searchResp = await fetch(`${DRIVE_API_URL}?q=${q}&fields=files(id,name)&pageSize=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!searchResp.ok) return null;
    const { files } = (await searchResp.json()) as { files?: Array<{ id: string; name: string }> };
    if (files?.[0]?.id) return files[0].id;

    // Crée le dossier
    const createResp = await fetch(DRIVE_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "tevaxia", mimeType: "application/vnd.google-apps.folder" }),
    });
    if (!createResp.ok) return null;
    const created = (await createResp.json()) as { id: string };
    return created.id;
  } catch {
    return null;
  }
}
