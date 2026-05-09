// Configuration Sentry côté navigateur
// Init uniquement si le DSN est défini — sinon aucun impact runtime.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    debug: false,
    integrations: [],
  });
}
