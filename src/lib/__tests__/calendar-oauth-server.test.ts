import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';
const qa=vi.hoisted(()=>({owner:'00000000-0000-4000-8000-000000000001',session:'00000000-0000-4000-8000-000000000001',allowed:true,jar:new Map<string,string>(),upsert:vi.fn()}));
vi.mock('next/headers',()=>({cookies:async()=>({getAll:()=>[],get:(name:string)=>({value:qa.jar.get(name)})})}));
vi.mock('@supabase/ssr',async importOriginal=>{
  const actual=await importOriginal<typeof import('@supabase/ssr')>();
  return {...actual,createServerClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:'h.'+Buffer.from(JSON.stringify({sub:qa.owner,session_id:qa.session})).toString('base64url')+'.s'}},error:null})},from:()=>({upsert:qa.upsert})})};
});
vi.mock('../mfa-assurance',()=>({getAssuredUser:async()=>({data:{user:qa.allowed?{id:qa.owner}:null},error:null})}));
import { startCalendarOAuth,finishCalendarOAuth,encodeCalendarFlow,decodeCalendarFlow } from '../calendar-oauth-server';
beforeEach(()=>{
  qa.owner=qa.session='00000000-0000-4000-8000-000000000001';qa.allowed=true;qa.jar.clear();qa.upsert.mockReset().mockResolvedValue({error:null});
  for(const p of ['GOOGLE','MICROSOFT']){vi.stubEnv(p+'_OAUTH_CLIENT_ID','id');vi.stubEnv(p+'_OAUTH_CLIENT_SECRET','secret')}
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://qa.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','key');vi.stubEnv('NEXT_PUBLIC_BASE_URL','https://tevaxia.lu');
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(JSON.stringify(url.includes('/token')?{access_token:'provider-token',expires_in:3600,scope:'calendar'}:{sub:'external',id:'external',email:'qa@example.test',mail:'qa@example.test'}))));
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()});
const start=async(provider:'google'|'microsoft')=>{
  const response=await startCalendarOAuth(provider),url=new URL(response.headers.get('location')!);
  const cookie=response.cookies.get('__Host-tevaxia-calendar-'+provider)!;qa.jar.set(cookie.name,cookie.value);
  return{response,url,cookie};
};
describe.each(['google','microsoft'] as const)('%s Calendar OAuth',provider=>{
  it('requires a verified session before initiating provider consent',async()=>{
    qa.allowed=false;expect((await startCalendarOAuth(provider)).status).toBe(401);expect(fetch).not.toHaveBeenCalled();
  });
  it('binds consent to a signed, short-lived, HttpOnly cookie and sets no-store',async()=>{
    const {response,url,cookie}=await start(provider);
    expect(url.searchParams.get('state')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(response.headers.get('set-cookie')).toMatch(/HttpOnly/i);expect(response.headers.get('set-cookie')).toMatch(/Secure/i);expect(response.headers.get('set-cookie')).toContain('Max-Age=600');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const flow=decodeCalendarFlow(cookie.value,url.searchParams.get('state'),provider,'secret')!;
    expect(flow.owner).toBe(qa.owner);
    if(provider==='microsoft')expect(url.searchParams.get('code_challenge')).toBe(createHash('sha256').update(flow.verifier).digest('base64url'));
  });
  it('rejects a missing/mismatched state before exchanging any code',async()=>{
    await start(provider);const r=await finishCalendarOAuth(provider,new Request('https://tevaxia.lu/callback?code=private-code&state=wrong'));
    expect(r.headers.get('location')).toContain('invalid_state');expect(fetch).not.toHaveBeenCalled();expect(qa.upsert).not.toHaveBeenCalled();
  });
  it('rejects a callback after a change of user or session',async()=>{
    const {url}=await start(provider);qa.session='00000000-0000-4000-8000-000000000002';
    const r=await finishCalendarOAuth(provider,new Request('https://tevaxia.lu/callback?code=private-code&state='+url.searchParams.get('state')));
    expect(r.headers.get('location')).toContain('invalid_state');expect(fetch).not.toHaveBeenCalled();
  });
  it('stores only the bound owner and preserves an existing refresh token when omitted',async()=>{
    const {url}=await start(provider);const state=url.searchParams.get('state');
    const r=await finishCalendarOAuth(provider,new Request('https://tevaxia.lu/callback?code=private-code&state='+state));
    expect(r.headers.get('location')).toContain('status=success');expect(r.headers.get('set-cookie')).toContain('Max-Age=0');
    const row=qa.upsert.mock.calls[0][0];expect(row.user_id).toBe(qa.owner);expect(row).not.toHaveProperty('refresh_token');expect(row.access_token).toBe('provider-token');
    expect(r.headers.get('location')).not.toContain('private-code');expect(r.headers.get('referrer-policy')).toBe('no-referrer');
    if(provider==='microsoft')expect(vi.mocked(fetch).mock.calls[0][1]?.body?.toString()).toContain('code_verifier=');
  });
  it('does not claim success if the database write failed',async()=>{
    const {url}=await start(provider);qa.upsert.mockResolvedValue({error:{message:'PRIVATE_DB_DETAIL'}});
    const r=await finishCalendarOAuth(provider,new Request('https://tevaxia.lu/callback?code=x&state='+url.searchParams.get('state')));
    expect(r.headers.get('location')).toContain('db_save_failed');expect(r.headers.get('location')).not.toContain('PRIVATE');
  });
});
it('refuses expired, tampered, wrong-provider and future OAuth cookies',()=>{
  const flow={state:'a'.repeat(43),verifier:'b'.repeat(43),owner:'a',sessionId:'a',issued:1000};
  const encoded=encodeCalendarFlow(flow,'google','secret');
  expect(decodeCalendarFlow(encoded,flow.state,'google','secret',1001)).toEqual(flow);
  expect(decodeCalendarFlow(encoded,flow.state,'google','secret',601000)).toBeNull();
  expect(decodeCalendarFlow(encoded,flow.state,'google','secret',999)).toBeNull();
  expect(decodeCalendarFlow(encoded+'x',flow.state,'google','secret',1001)).toBeNull();
  expect(decodeCalendarFlow(encoded,flow.state,'microsoft','secret',1001)).toBeNull();
});
