// Sérialisation légère des paramètres dans l'URL pour partage/sauvegarde
// Encode les valeurs en base64 compressé dans le hash de l'URL

export function encodeStateToHash(state: Record<string, unknown>): string {
  try {
    const json = JSON.stringify(state);
    return btoa(encodeURIComponent(json));
  } catch {
    return "";
  }
}

export function decodeStateFromHash(hash: string): Record<string, unknown> | null {
  try {
    if (!hash || hash.length < 2) return null;
    const clean = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!clean) return null;
    const json = decodeURIComponent(atob(clean));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function updateUrlHash(state: Record<string, unknown>) {
  const hash = encodeStateToHash(state);
  if (hash && typeof window !== "undefined") {
    window.history.replaceState(null, "", `#${hash}`);
  }
}

export function readUrlHash(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  return decodeStateFromHash(window.location.hash);
}
