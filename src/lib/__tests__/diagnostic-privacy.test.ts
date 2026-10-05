import { expect, it } from 'vitest';
import type { ErrorEvent, EventHint } from '@sentry/nextjs';
import { diagnosticCodeFile, sanitizeDiagnosticEvent, DIAGNOSTIC_PRIVACY_OPTIONS } from '../diagnostic-privacy';
it.each([
 ['https://tevaxia.lu/_next/static/immutable/chunks/408xcgw0l02-0.js?token=SECRET', 'https://tevaxia.lu/_next/static/immutable/chunks/408xcgw0l02-0.js'],
 ['https://private.example/_next/static/chunks/3tdt25a4xdico.js?token=SECRET#SECRET', 'https://tevaxia.lu/_next/static/chunks/3tdt25a4xdico.js'],
 ['https://tevaxia.lu/_next/static/chunks/1-fm6_-t8yrnh.js', 'https://tevaxia.lu/_next/static/chunks/1-fm6_-t8yrnh.js'],
 ['https://tevaxia.lu/_next/static/chunks/turbopack-17h_gthdpoyap.js', 'https://tevaxia.lu/_next/static/chunks/turbopack-17h_gthdpoyap.js'],
 ['/var/task/.next/server/chunks/[root-of-the-server]__01xc-v8._.js', 'app:///.next/server/chunks/[root-of-the-server]__01xc-v8._.js'],
 ['/var/task/.next/server/chunks/ssr/_0_vnd5v._.js', 'app:///.next/server/chunks/ssr/_0_vnd5v._.js'],
 ['D:\\private\\.next\\server\\chunks\\_next-internal_server_app_api_v1_propcalc_fees_route_actions_0y9rfnw.js', 'app:///.next/server/chunks/_next-internal_server_app_api_v1_propcalc_fees_route_actions_0y9rfnw.js'],
 ['/var/task/.next/server/edge/chunks/node_modules_@sentry_0bvr9ly._.js', 'app:///.next/server/edge/chunks/node_modules_@sentry_0bvr9ly._.js'],
 ['https://tevaxia.lu/_next/static/chunks/app/SECRET/page-abcd1234.js', 'https://tevaxia.lu/_next/static/chunks/page-abcd1234.js'],
])('retains generated build location %s', (input, expected) => {
 expect(diagnosticCodeFile(input)).toBe(expected);
 expect(diagnosticCodeFile(expected)).toBe(expected);
});
it.each([
 '/private/3tdt25a4xdico.js',
 '/.next/server/chunks/private-report.js',
 '/.next/server/chunks/SECRET/_0_vnd5v._.js',
 'https://tevaxia.lu/_next/static/chunks/private-report.js',
 'https://tevaxia.lu/_next/static/chunks/../3tdt25a4xdico.js',
])('does not treat arbitrary paths as Turbopack code: %s', input => {
 expect(diagnosticCodeFile(input)).toBeUndefined();
});
it.each(['chunks', 'immutable/chunks'])('keeps Turbopack frames and debug IDs aligned for %s while excluding private context', (directory) => {
 const codeFile = `https://private.example/_next/static/${directory}/3tdt25a4xdico.js?token=SECRET`;
 const debugId = '12345678-1234-1234-1234-123456789abc';
 const event: ErrorEvent = {
  type: undefined,
  exception: { values: [{ type: 'Error', value: 'SECRET', mechanism: { type: 'onerror', handled: false }, stacktrace: { frames: [
   { filename: '<anonymous>', abs_path: codeFile, lineno: 1, colno: 123, function: 'SECRET', vars: { token: 'SECRET' } },
  ] } }] },
  debug_meta: { images: [{ type: 'sourcemap', code_file: codeFile, debug_id: debugId }] },
 };
 const result = sanitizeDiagnosticEvent(event, {});
 const frame = result.exception!.values![0].stacktrace!.frames![0];
 expect(frame).toMatchObject({ filename: `https://tevaxia.lu/_next/static/${directory}/3tdt25a4xdico.js`, lineno: 1, colno: 123 });
 expect(result.debug_meta!.images).toEqual([{ type: 'sourcemap', code_file: frame.filename, debug_id: debugId }]);
 expect(result.exception!.values![0].mechanism!.handled).toBe(false);
 expect(JSON.stringify(result)).not.toContain('SECRET');
});
it('keeps a generated code location while removing the host, query and fragment',()=>{
 expect(diagnosticCodeFile('https://private.example/_next/static/chunks/app-abcd1234.js?token=SECRET#SECRET')).toBe('https://tevaxia.lu/_next/static/chunks/app-abcd1234.js');
 expect(diagnosticCodeFile('/app/.next/server/chunks/1234abcd.js')).toBe('app:///.next/server/chunks/1234abcd.js');
});
it.each(['/locataire/tnt_SECRET','https://tevaxia.lu/profil?email=SECRET','file:///Users/SECRET/document.js','data:text/plain,SECRET','webpack:///SECRET.tsx'])('drops private/noncompiled source %s',file=>expect(diagnosticCodeFile(file)).toBeUndefined());
it('removes private data from every event level and from attachment hints',()=>{
 const event:ErrorEvent={type:undefined,event_id:'a'.repeat(32),timestamp:1234,release:'abcd1234',environment:'production',message:'SECRET',user:{id:'SECRET',email:'SECRET'},request:{url:'https://tevaxia.lu/locataire/tnt_SECRET',headers:{authorization:'Bearer SECRET'},data:{name:'SECRET'}},extra:{tenant:'SECRET'},tags:{copro:'SECRET'},contexts:{trace:{trace_id:'SECRET',span_id:'SECRET'},private:{data:'SECRET'}},breadcrumbs:[{message:'SECRET'}],transaction:'SECRET',exception:{values:[{type:'TypeError',value:'SECRET',stacktrace:{frames:[{filename:'https://tevaxia.lu/_next/static/chunks/app-abcd1234.js?token=SECRET',lineno:15,colno:2,function:'SECRET',vars:{a:'SECRET'},context_line:'SECRET'}]},mechanism:{type:'SECRET',data:{tenant:'SECRET'}}}]}};
 const hint:EventHint={attachments:[{filename:'SECRET.txt',data:'SECRET'}]};const result=sanitizeDiagnosticEvent(event,hint);
 expect(JSON.stringify(result)).not.toContain('SECRET');expect(hint.attachments).toEqual([]);
 expect(result.exception?.values?.[0].stacktrace?.frames?.[0]).toMatchObject({lineno:15,colno:2,filename:'https://tevaxia.lu/_next/static/chunks/app-abcd1234.js'});
 expect(result.exception?.values?.[0].type).toBe('TypeError');expect(result.release).toBe('abcd1234');expect(result.request).toBeUndefined();expect(result.contexts).toBeUndefined();
});
it('does not accept custom exception names, arbitrary release metadata or invalid line numbers',()=>{
 const result=sanitizeDiagnosticEvent({type:undefined,event_id:'SECRET',release:'SECRET',environment:'SECRET',exception:{values:[{type:'SECRET',stacktrace:{frames:[{lineno:NaN,colno:-1}]}}]}},{});
 expect(JSON.stringify(result)).not.toContain('SECRET');expect(result.exception?.values?.[0].type).toBe('Error');
});
it('disables transaction/log/replay capture and automatic request data',()=>{
 expect(DIAGNOSTIC_PRIVACY_OPTIONS.tracesSampleRate).toBe(0);expect(DIAGNOSTIC_PRIVACY_OPTIONS.beforeSendTransaction()).toBeNull();expect(DIAGNOSTIC_PRIVACY_OPTIONS.beforeSendLog()).toBeNull();
 expect(DIAGNOSTIC_PRIVACY_OPTIONS.dataCollection.httpBodies).toEqual([]);expect(DIAGNOSTIC_PRIVACY_OPTIONS.maxBreadcrumbs).toBe(0);
});
it('preserves only generated source-map IDs and sanitized code filenames',()=>{
 const id='12345678-1234-1234-1234-123456789abc';
 const result=sanitizeDiagnosticEvent({type:undefined,debug_meta:{images:[{type:'sourcemap',code_file:'https://tevaxia.lu/_next/static/chunks/app-abcd1234.js?token=SECRET',debug_id:id},{type:'sourcemap',code_file:'/locataire/SECRET',debug_id:id},{type:'sourcemap',code_file:'https://tevaxia.lu/_next/static/chunks/app-abcd1234.js',debug_id:'SECRET'}]}},{});
 expect(result.debug_meta?.images).toEqual([{type:'sourcemap',code_file:'https://tevaxia.lu/_next/static/chunks/app-abcd1234.js',debug_id:id}]);
});

it.each([
 ["Cannot read properties of null (reading 'parentNode')", 'DOM null reference (parentNode)'],
 ["Cannot read properties of undefined (reading 'nextSibling')", 'DOM undefined reference (nextSibling)'],
 ["Cannot read properties of null (reading 'removeChild')", 'DOM null reference (removeChild)'],
 ["Cannot read property 'parentNode' of null", 'DOM null reference (parentNode)'],
 ['can\'t access property "nextSibling", SECRET is undefined', 'DOM undefined reference (nextSibling)'],
 ["null is not an object (evaluating 'SECRET.parentNode')", 'DOM null reference (parentNode)'],
 ["undefined is not an object (evaluating 'SECRET.removeChild(SECRET)')", 'DOM undefined reference (removeChild)'],
 ["Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.", 'DOM removeChild node is not a child'],
 ['Node.removeChild: The node to be removed is not a child of this node', 'DOM removeChild node is not a child'],
 ["Failed to execute 'removeChild' on 'Node': parameter 1 is not of type 'Node'.", 'DOM removeChild invalid node'],
 ['Node.removeChild: Argument 1 is not an object.', 'DOM removeChild invalid node'],
 ['Minified React error #418; visit https://react.dev/errors/418?args[]=SECRET for the full message.', 'React hydration mismatch (418)'],
 ['Minified React error #419; visit https://react.dev/errors/419?args[]=SECRET', 'React Suspense hydration incomplete (419)'],
 ['Minified React error #422; visit https://react.dev/errors/422?args[]=SECRET', 'React hydration recovered at Suspense boundary (422)'],
 ['Minified React error #423; visit https://react.dev/errors/423?args[]=SECRET', 'React hydration recovered at root (423)'],
 ['Minified React error #424; visit https://react.dev/errors/424?args[]=SECRET', 'React root updated before hydration (424)'],
 ["Hydration failed because the server rendered HTML didn't match the client.\n+SECRET\n-SECRET", 'React hydration mismatch (418)'],
 ["Hydration failed because the server rendered text didn't match the client.\nSECRET", 'React hydration mismatch (418)'],
 ['The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.', 'React Suspense hydration incomplete (419)'],
 ['There was an error while hydrating but React was able to recover by instead client rendering from the nearest Suspense boundary.', 'React hydration recovered at Suspense boundary (422)'],
 ['There was an error while hydrating but React was able to recover by instead client rendering the entire root.', 'React hydration recovered at root (423)'],
 ['This root received an early update, before anything was able hydrate. Switched the entire root to client rendering.', 'React root updated before hydration (424)'],
 ['Loading chunk SECRET failed.\n(error: https://private.example/SECRET.js?token=SECRET)', 'Client chunk load failed'],
 ['Loading CSS chunk SECRET failed.\nhttps://private.example/SECRET.css', 'Client chunk load failed'],
 ['Failed to load chunk /_next/static/chunks/SECRET.js from module SECRET', 'Client chunk load failed'],
 ['Failed to fetch dynamically imported module: https://private.example/SECRET.js', 'Client chunk load failed'],
 ['error loading dynamically imported module: https://private.example/SECRET.js', 'Client chunk load failed'],
 ['Importing a module script failed.', 'Client chunk load failed'],
 ['Locale message bundle failed to load', 'Locale message bundle failed to load'],
])('keeps only an allowlisted technical classification for %s', (value, expected) => {
 const result = sanitizeDiagnosticEvent({type: undefined, message: 'SECRET', exception: {values: [{type: 'TypeError', value}]}}, {});
 expect(result.exception?.values?.[0].value).toBe(expected);
 expect(JSON.stringify(result)).not.toContain('SECRET');
 expect(result.message).toBe('Application error (private details omitted)');
 expect(result.tags).toBeUndefined();
 expect(result.contexts).toBeUndefined();
});

it('classifies a named chunk failure without preserving its arbitrary message or custom error type', () => {
 const result = sanitizeDiagnosticEvent({type: undefined, exception: {values: [{type: 'ChunkLoadError', value: 'SECRET'}]}}, {});
 expect(result.exception?.values?.[0]).toMatchObject({type: 'Error', value: 'Client chunk load failed'});
 expect(JSON.stringify(result)).not.toContain('SECRET');
});

it.each([
 undefined,
 'SECRET',
 "Cannot read properties of null (reading 'SECRET')",
 "Cannot read properties of SECRET (reading 'parentNode')",
 "Cannot read properties of null (reading 'parentNode') SECRET",
 "SECRET Cannot read properties of null (reading 'parentNode')",
 'Minified React error #4180; SECRET',
 'Minified React error #999; SECRET',
 'Minified React error #418SECRET; SECRET',
 'Minified React error #418;SECRET',
 'Hydration failed SECRET',
 "Hydration failed because the server rendered SECRET didn't match the client.",
 'Loading SECRET failed.',
 'Locale message bundle failed to load: SECRET',
])('continues censoring unknown or malformed diagnostics: %s', value => {
 const result = sanitizeDiagnosticEvent({type: undefined, exception: {values: [{type: 'Error', value}]}}, {});
 expect(result.exception?.values?.[0].value).toBe('Private details omitted');
 expect(JSON.stringify(result)).not.toContain('SECRET');
});

it('classifies each chained exception without adding any session, route or replay context', () => {
 const result = sanitizeDiagnosticEvent({type: undefined, user: {id: 'SECRET'}, tags: {route: '/locataire/SECRET'}, contexts: {browser: {name: 'SECRET', version: 'SECRET'}}, breadcrumbs: [{message: 'SECRET'}], exception: {values: [
  {type: 'Error', value: 'Minified React error #423; SECRET'},
  {type: 'TypeError', value: "Cannot read properties of null (reading 'parentNode')"},
  {type: 'Error', value: 'SECRET'},
 ]}}, {});
 expect(result.exception?.values?.map(value => value.value)).toEqual(['React hydration recovered at root (423)', 'DOM null reference (parentNode)', 'Private details omitted']);
 expect(JSON.stringify(result)).not.toContain('SECRET');
 expect(result.user).toBeUndefined();
 expect(result.tags).toBeUndefined();
 expect(result.contexts).toBeUndefined();
 expect(result.breadcrumbs).toBeUndefined();
 expect(DIAGNOSTIC_PRIVACY_OPTIONS.replaysSessionSampleRate).toBe(0);
 expect(DIAGNOSTIC_PRIVACY_OPTIONS.replaysOnErrorSampleRate).toBe(0);
 expect(DIAGNOSTIC_PRIVACY_OPTIONS.sendDefaultPii).toBe(false);
});
