import { expect, it } from 'vitest';
import type { ErrorEvent, EventHint } from '@sentry/nextjs';
import { diagnosticCodeFile, sanitizeDiagnosticEvent, DIAGNOSTIC_PRIVACY_OPTIONS } from '../diagnostic-privacy';
it.each([
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
it('keeps Turbopack frames and debug IDs aligned while excluding private context', () => {
 const codeFile = 'https://private.example/_next/static/chunks/3tdt25a4xdico.js?token=SECRET';
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
 expect(frame).toMatchObject({ filename: 'https://tevaxia.lu/_next/static/chunks/3tdt25a4xdico.js', lineno: 1, colno: 123 });
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
