// Configuration Sentry côté navigateur
// Init uniquement si le DSN est défini — sinon aucun impact runtime.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
    // 0 = no perf tracing on the client. Saves the tracing instrumentation
    // from running on every nav. Default integrations (breadcrumbs,
    // global error handlers) are kept so window.onerror is still captured.
    tracesSampleRate: 0,
    debug: false,
    integrations: [],
  });
}
