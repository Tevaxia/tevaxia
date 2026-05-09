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

/**
 * Capture une exception vers Sentry + log analytics simple.
 * Silent fail si Sentry pas configuré (DSN env var absent).
 *
 * Usage : captureError(err, { module: "facturation", action: "generate", ... })
 */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  // Toujours log en console — utile dev et fallback prod sans Sentry

  console.error("[tevaxia error]", err, context);

  if (typeof window === "undefined") return;
  // Track en analytics aussi pour stats funnel
  track("client_error", {
    message: err instanceof Error ? err.message : String(err),
    ...(context ?? {}),
  });
  // Sentry capture si dispo
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureException(err, { extra: context });
  }).catch(() => { /* sentry non chargé / non configuré */ });
}
