import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const auth=vi.hoisted(()=>({getSession:vi.fn(),getUser:vi.fn()}));
vi.mock('../supabase',()=>({supabase:{auth}}));
import {loadBusinessDashboard,summarizeMandates,propertyEstimateCount,type DashboardMandate} from '../business-dashboard';
import type {SavedValuation} from '../storage';
const owner='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
const row=(n=1):DashboardMandate=>({id:`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`,user_id:owner,property_address:'Synthetic',client_name:null,status:'vendu',prix_demande:123.45,commission_amount_percue:0.1,created_at:'2026-09-01T00:00:00Z'});
const json=(x:unknown,total?:number)=>new Response(JSON.stringify(x),{headers:total===undefined?{}:{'content-range':`0-9/${total}`}});
beforeEach(()=>{
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://qa.example.test');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','test');
 auth.getSession.mockReset().mockResolvedValue({data:{session:{user:{id:owner},access_token:'token-a'}}});auth.getUser.mockReset().mockResolvedValue({data:{user:{id:owner}}});
 vi.stubGlobal('fetch',vi.fn(async()=>json([],0)));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('captures a verified account and requests only necessary owned fields',async()=>{
 const result=await loadBusinessDashboard(owner);expect(result).toEqual({mandates:[],activity:[],rentalLots:0});
 expect(auth.getUser).toHaveBeenCalledWith('token-a');
 for(const [url,opts] of vi.mocked(fetch).mock.calls){expect(new URL(String(url)).searchParams.get('user_id')).toBe('eq.'+owner);expect(opts?.headers).toMatchObject({Authorization:'Bearer token-a'});expect(opts?.signal).toBeDefined();expect(new URL(String(url)).searchParams.get('select')).not.toContain('*');}
 expect(JSON.stringify(vi.mocked(fetch).mock.calls)).not.toMatch(/client_email|client_phone|metadata|tenant_name/);
});
it('does not turn unavailable results or missing exact counts into zero',async()=>{
 vi.mocked(fetch).mockResolvedValue(new Response('{}',{status:503}));expect(await loadBusinessDashboard(owner)).toEqual({mandates:null,activity:null,rentalLots:null});
 vi.mocked(fetch).mockImplementation(async()=>json([]));const data=await loadBusinessDashboard(owner);expect(data.rentalLots).toBeNull();expect(data.activity).toBeNull();expect(data.mandates).toEqual([]);
});
it('continues beyond short server pages and sums cents without floating point residue',async()=>{
 vi.mocked(fetch).mockImplementation(async url=>{const u=new URL(String(url));if(!u.pathname.includes('agency_mandates'))return json([],0);const cursor=u.searchParams.get('id');return json(cursor===null?[{...row(),commission_amount_percue:'0.10'}]:cursor==='gt.'+row().id?[{...row(2),commission_amount_percue:'0.20'}]:[]);});
 const data=await loadBusinessDashboard(owner);expect(data.mandates).toHaveLength(2);expect(summarizeMandates(data.mandates).commission).toBe(0.3);
});
it('fails the whole aggregate when a later page fails, preserving independent counts',async()=>{
 let page=0;vi.mocked(fetch).mockImplementation(async url=>String(url).includes('agency_mandates')?(++page===1?json([row()]):new Response('{}',{status:503})):json([],0));
 expect(await loadBusinessDashboard(owner)).toEqual({mandates:null,activity:[],rentalLots:0});
});
it.each([{...row(),user_id:other},{...row(),commission_amount_percue:''},{...row(),commission_amount_percue:'NaN'},{...row(),commission_amount_percue:'1.001'},{...row(),status:'unknown'},{...row(),created_at:'bad'}])('rejects a foreign or malformed mandate',async invalid=>{
 vi.mocked(fetch).mockImplementation(async url=>String(url).includes('agency_mandates')?json([invalid]):json([],0));expect((await loadBusinessDashboard(owner)).mandates).toBeNull();
});
it('rejects repeated pages rather than counting rows twice',async()=>{
 vi.mocked(fetch).mockImplementation(async url=>String(url).includes('agency_mandates')?json([row()]):json([],0));expect((await loadBusinessDashboard(owner)).mandates).toBeNull();
});
it('keeps missing commission unknown, and treats a declared zero as zero',()=>{
 expect(summarizeMandates([{...row(),commission_amount_percue:null}]).commission).toBeNull();expect(summarizeMandates([{...row(),commission_amount_percue:0}]).commission).toBe(0);
 expect(summarizeMandates([])).toEqual({active:[],sold:0,commission:0});expect(summarizeMandates(null)).toEqual({active:null,sold:null,commission:null});
});
it('counts all five ongoing mandate statuses and excludes terminal/prospect statuses',()=>{
 const statuses=['prospect','mandat_signe','diffuse','en_visite','offre_recue','sous_compromis','vendu','abandonne','expire'];
 expect(summarizeMandates(statuses.map((status,i)=>({...row(i+1),status}))).active).toHaveLength(5);
});
it('never presents mixed calculation values as a property wealth total',()=>{
 const values=['estimation','valorisation','capitalisation','dcf','dcf-multi','frais','loyer','aides','bilan-promoteur'].map(type=>({type,valeurPrincipale:1e9} as SavedValuation));expect(propertyEstimateCount(values)).toBe(5);
});
const activity={id:1,user_id:owner,action:'saved',entity_type:null,created_at:'2026-09-01T00:00:00Z'};
it.each([[{...activity,user_id:other}],[{...activity,id:1e20}],[{...activity,created_at:'bad'}],[activity,activity]].map(rows=>({rows})))('rejects foreign, duplicate or malformed activity',async ({rows})=>{
 vi.mocked(fetch).mockImplementation(async url=>String(url).includes('user_activity_log')?json(rows,rows.length):json([],0));expect((await loadBusinessDashboard(owner)).activity).toBeNull();
});
it('rejects truncated activity and accepts a valid limited list',async()=>{
 vi.mocked(fetch).mockImplementation(async url=>String(url).includes('user_activity_log')?json([activity],20):json([],0));expect((await loadBusinessDashboard(owner)).activity).toBeNull();
 const rows=Array.from({length:10},(_,i)=>({...activity,id:10-i}));vi.mocked(fetch).mockImplementation(async url=>String(url).includes('user_activity_log')?json(rows,20):json([],0));expect((await loadBusinessDashboard(owner)).activity).toHaveLength(10);
});
it('rejects out of order activity',async()=>{
 vi.mocked(fetch).mockImplementation(async url=>String(url).includes('user_activity_log')?json([activity,{...activity,id:2}],2):json([],0));expect((await loadBusinessDashboard(owner)).activity).toBeNull();
});
it('refuses reads before a switched or unverified account',async()=>{
 await expect(loadBusinessDashboard(other)).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();auth.getUser.mockResolvedValue({data:{user:{id:other}}});await expect(loadBusinessDashboard(owner)).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
});
it('rejects a late result after an account switch',async()=>{
 vi.mocked(fetch).mockImplementation(async()=>{auth.getSession.mockResolvedValue({data:{session:{user:{id:other},access_token:'token-b'}}});return json([],0);});await expect(loadBusinessDashboard(owner)).rejects.toThrow('changed');
});
