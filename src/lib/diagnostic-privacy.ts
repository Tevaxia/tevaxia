import type { ErrorEvent, EventHint, StackFrame } from '@sentry/nextjs';

const ERROR_TYPES = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError', 'EvalError', 'AggregateError']);
const DEBUG_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const HEX_CHUNK = /^[a-zA-Z0-9_.-]*[a-f0-9]{8,64}(?:[._-][a-zA-Z0-9_-]+)?\.js$/;
// Turbopack uses 13-character browser hashes and 7-character server hashes,
// including letters beyond f, underscores and hyphens (Next.js 16.3).
const TURBOPACK_CLIENT_CHUNK = /^(?:turbopack-)?[a-z0-9_-]{13}\.js$/;
const TURBOPACK_SERVER_CHUNK = /^[a-zA-Z0-9_@.()[\]-]*_[a-z0-9_-]{7}(?:\._)?\.js$/;

/** Only generated code files; never a document URL, tenant route or uploaded filename. */
export function diagnosticCodeFile(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const path = value.split(/[?#]/, 1)[0].replaceAll('\\', '/');
  const client = path.match(/\/_next\/static\/(immutable\/)?chunks\/([^/]+)$/);
  if (client && (HEX_CHUNK.test(client[2]) || TURBOPACK_CLIENT_CHUNK.test(client[2]))) {
    return 'https://tevaxia.lu/_next/static/' + (client[1] ?? '') + 'chunks/' + client[2];
  }
  const server = path.match(/\/\.next\/server\/(edge\/)?chunks\/(ssr\/)?([^/]+)$/);
  if (server && (HEX_CHUNK.test(server[3]) || TURBOPACK_SERVER_CHUNK.test(server[3]))) {
    return 'app:///.next/server/' + (server[1] ?? '') + 'chunks/' + (server[2] ?? '') + server[3];
  }
  // Keep compatibility with legacy webpack subdirectories, without retaining
  // arbitrary directory names in the diagnostic event.
  const legacy = path.match(/(\/_next\/static\/(?:immutable\/)?chunks\/|\/\.next\/server\/chunks\/)(?:[^?#]*\/)?([^/]+)$/);
  if (legacy && HEX_CHUNK.test(legacy[2])) {
    return (legacy[1].startsWith('/_next/') ? 'https://tevaxia.lu' + legacy[1] : 'app:///.next/server/chunks/') + legacy[2];
  }
  return undefined;
}

function safeFrame(frame: StackFrame): StackFrame {
  return {
    filename: diagnosticCodeFile(frame.filename) ?? diagnosticCodeFile(frame.abs_path),
    lineno: Number.isSafeInteger(frame.lineno) && frame.lineno! > 0 ? frame.lineno : undefined,
    colno: Number.isSafeInteger(frame.colno) && frame.colno! > 0 ? frame.colno : undefined,
    in_app: frame.in_app === true,
  };
}

/** Last error-event filter shared by browser, Node and Edge. */
export function sanitizeDiagnosticEvent(event: ErrorEvent, hint: EventHint): ErrorEvent {
  hint.attachments = [];
  return {
    type: undefined,
    event_id: /^[a-f0-9]{32}$/.test(event.event_id ?? '') ? event.event_id : undefined,
    timestamp: typeof event.timestamp === 'number' && Number.isFinite(event.timestamp) ? event.timestamp : undefined,
    platform: 'javascript',
    level: event.level === 'fatal' ? 'fatal' : 'error',
    environment: ['production', 'development', 'test'].includes(event.environment ?? '') ? event.environment : undefined,
    release: /^(?:[a-f0-9]{7,64}|\d+\.\d+\.\d+)$/.test(event.release ?? '') ? event.release : undefined,
    // Build-generated IDs let uploaded source maps resolve code locations without
    // retaining the original event's arbitrary diagnostic metadata.
    debug_meta: { images: event.debug_meta?.images?.flatMap(image => {
      const codeFile = image.type === 'sourcemap' ? diagnosticCodeFile(image.code_file) : undefined;
      return codeFile && DEBUG_ID.test(image.debug_id) ? [{ type: 'sourcemap' as const, code_file: codeFile, debug_id: image.debug_id }] : [];
    }) ?? [] },
    message: 'Application error (private details omitted)',
    exception: event.exception ? { values: event.exception.values?.slice(-5).map(value => ({
      type: ERROR_TYPES.has(value.type ?? '') ? value.type : 'Error',
      value: 'Private details omitted',
      stacktrace: value.stacktrace ? { frames: value.stacktrace.frames?.slice(-50).map(safeFrame) } : undefined,
      mechanism: { type: 'generic', handled: value.mechanism?.handled !== false },
    })) } : undefined,
  };
}

export const DIAGNOSTIC_PRIVACY_OPTIONS = {
  beforeSend: sanitizeDiagnosticEvent,
  beforeSendTransaction: () => null,
  beforeSendLog: () => null,
  enableLogs: false,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  sendDefaultPii: false,
  maxBreadcrumbs: 0,
  dataCollection: {
    userInfo: false, cookies: false, httpHeaders: { request: false, response: false },
    httpBodies: [], urlQueryParams: false, graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false }, databaseQueryData: false,
    stackFrameVariables: false, frameContextLines: 0,
  },
};
