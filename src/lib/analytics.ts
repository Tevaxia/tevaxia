// ============================================================
// Analytics — wrapper PostHog côté client
// ============================================================
//
// `track(event, properties?)` capture un événement PostHog si :
//   1. PostHog est initialisé (clé d'env présente + consentement donné)
//   2. on est côté navigateur
//
// Ne throw jamais — silent fail si PostHog n'est pas dispo.
// Permet d'instrumenter sans casser les tests SSR / l'expérience visiteurs sans consent.

export function track(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  // Lazy-load posthog pour éviter un import côté SSR
  import("posthog-js").then((mod) => {
    const ph = mod.default;
    if (!ph?.__loaded) return;
    ph.capture(event, properties);
  }).catch(() => { /* silence */ });
}

/** Identifie un utilisateur connecté (à appeler après auth). */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  import("posthog-js").then((mod) => {
    const ph = mod.default;
    if (!ph?.__loaded) return;
    ph.identify(userId, traits);
  }).catch(() => { /* silence */ });
}

/** Reset à la déconnexion. */
export function reset(): void {
  if (typeof window === "undefined") return;
  import("posthog-js").then((mod) => {
    const ph = mod.default;
    if (!ph?.__loaded) return;
    ph.reset();
  }).catch(() => { /* silence */ });
}
