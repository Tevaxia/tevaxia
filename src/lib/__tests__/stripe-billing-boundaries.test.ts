import { beforeEach, afterEach, it, expect, vi } from 'vitest';
const qa=vi.hoisted(()=>({upsert:vi.fn(),lookup:vi.fn(),create:vi.fn(),retrieve:vi.fn(),event:{} as {type?:string;data?:{object:unknown}},auth:true}));
vi.mock('@/lib/stripe',()=>({isStripeConfigured:true,STRIPE_PRICE_PRO:'price_pro',stripe:{checkout:{sessions:{create:qa.create}},subscriptions:{retrieve:qa.retrieve},webhooks:{constructEvent:()=>qa.event}}}));
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({from:()=>{const q={select:()=>q,eq:()=>q,in:()=>q,limit:()=>q,maybeSingle:qa.lookup,upsert:qa.upsert,then:(resolve:(v:unknown)=>unknown)=>qa.lookup().then(resolve)};return q}})}));
vi.mock('@/lib/mfa-assurance',()=>({getAssuredUser:async()=>({data:{user:qa.auth?{id:'owner',email:'owner@example.test'}:null},error:null})}));
import { POST as checkout } from '@/app/api/stripe/checkout/route';
import { POST as webhook } from '@/app/api/stripe/webhook/route';
const request=(body:unknown={})=>new Request('https://tevaxia.lu/api/stripe/checkout',{method:'POST',headers:{authorization:'Bearer jwt','stripe-signature':'verified-signature','content-type':'application/json'},body:JSON.stringify(body)});
const sub={id:'sub_one',customer:'cus_one',status:'active',metadata:{user_id:'owner'},items:{data:[{price:{id:'price_pro'},current_period_start:1700000000,current_period_end:1800000000}]}};
beforeEach(()=>{
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://qa.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','key');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','service');vi.stubEnv('STRIPE_WEBHOOK_SECRET','secret');vi.stubEnv('NEXT_PUBLIC_BASE_URL','https://tevaxia.lu');
 qa.auth=true;qa.lookup.mockReset().mockResolvedValue({data:[],error:null});qa.upsert.mockReset().mockResolvedValue({error:null});qa.create.mockReset().mockResolvedValue({url:'https://checkout.stripe.com/one'});qa.retrieve.mockReset().mockResolvedValue(sub);
 qa.event={type:'checkout.session.completed',data:{object:{client_reference_id:'owner',subscription:'sub_one',customer:'cus_one'}}};
 vi.spyOn(console,'error').mockImplementation(()=>{});
});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks()});
it('refuses unverified MFA sessions before Stripe or database work',async()=>{qa.auth=false;expect((await checkout(request())).status).toBe(401);expect(qa.create).not.toHaveBeenCalled();expect(qa.lookup).not.toHaveBeenCalled()});
it.each(['https://outside.test/return','//outside.test/return','javascript:alert(1)'])('refuses an external checkout return %s',async return_url=>{expect((await checkout(request({return_url}))).status).toBe(400);expect(qa.create).not.toHaveBeenCalled()});
it('refuses a duplicate active subscription and fails closed on lookup error',async()=>{
 qa.lookup.mockResolvedValueOnce({data:[{id:'active'}],error:null});expect((await checkout(request())).status).toBe(409);
 qa.lookup.mockResolvedValueOnce({data:null,error:{message:'offline'}});expect((await checkout(request())).status).toBe(503);expect(qa.create).not.toHaveBeenCalled();
});
it('reuses one idempotency key and attaches subscription ownership for webhook delivery',async()=>{
 vi.spyOn(Date,'now').mockReturnValue(1700000000000);
 expect((await checkout(request({return_url:'/de/profil'}))).status).toBe(200);expect((await checkout(request({return_url:'/de/profil'}))).status).toBe(200);
 const [payload,options]=qa.create.mock.calls[0];expect(payload.success_url).toBe('https://tevaxia.lu/de/profil');expect(payload.subscription_data.metadata.user_id).toBe('owner');expect(options.idempotencyKey).toBe(qa.create.mock.calls[1][1].idempotencyKey);
});
it('returns a retryable failure when subscription persistence fails',async()=>{
 qa.upsert.mockResolvedValue({error:{message:'DATABASE_SECRET'}});const res=await webhook(request());expect(res.status).toBe(500);expect(await res.text()).not.toContain('DATABASE_SECRET');
});
it('reconciles delayed subscription events from the current Stripe state',async()=>{
 qa.event={type:'customer.subscription.updated',data:{object:{...sub,status:'past_due'}}};expect((await webhook(request())).status).toBe(200);expect(qa.retrieve).toHaveBeenCalledWith('sub_one');expect(qa.upsert.mock.calls[0][0].status).toBe('active');
});
it('does not acknowledge a failed owner lookup as success',async()=>{
 qa.event={type:'customer.subscription.updated',data:{object:sub}};qa.retrieve.mockResolvedValue({...sub,metadata:{}});qa.lookup.mockResolvedValue({data:null,error:{message:'offline'}});expect((await webhook(request())).status).toBe(500);expect(qa.upsert).not.toHaveBeenCalled();
});
