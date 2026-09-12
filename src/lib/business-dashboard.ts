import { supabase } from './supabase';
import { exactDashboardCount } from './account-dashboard';
import type { SavedValuation } from './storage';

export interface DashboardMandate {
  id: string; user_id: string; property_address: string; client_name: string | null;
  status: string; prix_demande: number | null; commission_amount_percue: number | null; created_at: string;
}
export interface DashboardActivity { id: number; user_id: string; action: string; entity_type: string | null; created_at: string }
export interface BusinessDashboard { mandates: DashboardMandate[] | null; activity: DashboardActivity[] | null; rentalLots: number | null }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const statuses = ['prospect','mandat_signe','diffuse','en_visite','offre_recue','sous_compromis','vendu','abandonne','expire'];
const activeStatuses = new Set(['mandat_signe','diffuse','en_visite','offre_recue','sous_compromis']);
const mandateColumns = 'id,user_id,property_address,client_name,status,prix_demande,commission_amount_percue,created_at';
const activityColumns = 'id,user_id,action,entity_type,created_at';
const validDate = (s: unknown): s is string => typeof s === 'string' && Number.isFinite(Date.parse(s));
function money(value: unknown): number | null {
  if (value === null) return null;
  if ((typeof value !== 'number' && typeof value !== 'string') || !/^-?\d+(\.\d{1,2})?$/.test(String(value))) throw new Error('Invalid amount');
  const amount = Number(value);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(Math.round(amount * 100))) throw new Error('Invalid amount');
  return amount;
}
function mandate(value: unknown, owner: string): DashboardMandate {
  if (!value || typeof value !== 'object') throw new Error('Invalid mandate');
  const r = value as DashboardMandate;
  if (!uuid.test(r.id) || r.user_id !== owner || typeof r.property_address !== 'string' || (r.client_name !== null && typeof r.client_name !== 'string') || !statuses.includes(r.status) || !validDate(r.created_at)) throw new Error('Invalid mandate');
  return { id:r.id, user_id:r.user_id, property_address:r.property_address, client_name:r.client_name, status:r.status, created_at:r.created_at, prix_demande:money(r.prix_demande), commission_amount_percue:money(r.commission_amount_percue) };
}
async function tokenFor(owner: string): Promise<string> {
  if (!supabase || !uuid.test(owner)) throw new Error('Dashboard unavailable');
  const { data, error } = await supabase.auth.getSession();
  if (error || data.session?.user.id !== owner || !data.session.access_token) throw new Error('Dashboard account changed');
  return data.session.access_token;
}
export async function loadBusinessDashboard(owner: string): Promise<BusinessDashboard> {
  const token = await tokenFor(owner), verified = await supabase!.auth.getUser(token);
  if (verified.error || verified.data.user?.id !== owner) throw new Error('Dashboard account changed');
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error('Dashboard unavailable');
  const headers = { apikey:key, Authorization:`Bearer ${token}`, Prefer:'count=exact' };
  const endpoint = (table: string, select: string) => { const u = new URL(base+'/rest/v1/'+table); u.searchParams.set('select',select); u.searchParams.set('user_id','eq.'+owner); return u; };
  const read = async (u: URL, signal: AbortSignal, method='GET') => {
    await tokenFor(owner);
    const response = await fetch(u.toString(), { method, headers, signal, cache:'no-store' });
    if (!response.ok) throw new Error('Dashboard read failed');
    return response;
  };
  const mandates = async () => {
    const u=endpoint('agency_mandates',mandateColumns), rows: DashboardMandate[]=[];
    u.searchParams.set('order','id.asc');u.searchParams.set('limit','100');
    const signal=AbortSignal.timeout(60000);let last='';
    for(let page=0;page<=100;page++) {
      const data: unknown=await (await read(u,signal)).json();
      if(!Array.isArray(data)||data.length>100)throw new Error('Invalid mandate page');
      if(!data.length)return rows.sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id));
      if(page===100)throw new Error('Incomplete mandates');
      for(const value of data){const r=mandate(value,owner);if(r.id<=last)throw new Error('Invalid mandate order');last=r.id;rows.push(r);}
      u.searchParams.set('id','gt.'+last);
    }
    throw new Error('Incomplete mandates');
  };
  const activity = async () => {
    const u=endpoint('user_activity_log',activityColumns);u.searchParams.set('order','created_at.desc,id.desc');u.searchParams.set('limit','10');
    const response=await read(u,AbortSignal.timeout(15000)), data:unknown=await response.json();
    if(!Array.isArray(data)||data.length!==Math.min(10,exactDashboardCount(response.headers.get('content-range'))))throw new Error('Incomplete activity');
    const rows: DashboardActivity[]=[],ids=new Set<number>();
    for(const r of data){
      if(!r||!Number.isSafeInteger(r.id)||r.id<1||ids.has(r.id)||r.user_id!==owner||typeof r.action!=='string'||!r.action||(r.entity_type!==null&&typeof r.entity_type!=='string')||!validDate(r.created_at))throw new Error('Invalid activity');
      const previous=rows.at(-1);if(previous&&(Date.parse(r.created_at)>Date.parse(previous.created_at)||(Date.parse(r.created_at)===Date.parse(previous.created_at)&&r.id>=previous.id)))throw new Error('Invalid activity order');
      ids.add(r.id);rows.push({id:r.id,user_id:r.user_id,action:r.action,entity_type:r.entity_type,created_at:r.created_at});
    }
    return rows;
  };
  const rentalLots = async () => {const u=endpoint('rental_lots','id');u.searchParams.set('limit','1');return exactDashboardCount((await read(u,AbortSignal.timeout(15000),'HEAD')).headers.get('content-range'));};
  const [m,a,r]=await Promise.all([mandates().catch(()=>null),activity().catch(()=>null),rentalLots().catch(()=>null)]);
  await tokenFor(owner);
  return {mandates:m,activity:a,rentalLots:r};
}
export function summarizeMandates(rows: DashboardMandate[] | null) {
  if(rows===null)return {active:null,sold:null,commission:null};
  const active=rows.filter(r=>activeStatuses.has(r.status)),sold=rows.filter(r=>r.status==='vendu');
  let cents=0;
  for(const r of sold){if(r.commission_amount_percue===null)return {active,sold:sold.length,commission:null};cents+=Math.round(r.commission_amount_percue*100);if(!Number.isSafeInteger(cents))return {active,sold:sold.length,commission:null};}
  return {active,sold:sold.length,commission:cents/100};
}
// These are saved calculation records; several records may concern the same asset.
export function propertyEstimateCount(rows: SavedValuation[]): number {
  return rows.filter(r=>['estimation','valorisation','capitalisation','dcf','dcf-multi'].includes(r.type)).length;
}
