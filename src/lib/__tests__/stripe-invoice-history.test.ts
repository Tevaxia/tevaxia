import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { stripeInvoiceAmount } from '../stripe-amount';
const qa = vi.hoisted(() => ({ lookup: vi.fn(), list: vi.fn(), auth: true }));
vi.mock('@/lib/stripe', () => ({ isStripeConfigured: true, stripe: { invoices: { list: qa.list } } }));
vi.mock('@/lib/mfa-assurance', () => ({ getAssuredUser: async () => ({ data: { user: qa.auth ? { id: 'owner' } : null } }) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: () => {
  const q = { select: () => q, eq: () => q, order: () => q, limit: qa.lookup }; return q;
} }) }));
import { GET } from '@/app/api/stripe/invoices/route';
const req = () => new Request('https://tevaxia.lu/api/stripe/invoices', { headers: { authorization: 'Bearer verified' } });
const invoice = (id: string, created = 1, currency = 'eur') => ({ id, created, currency, total: 1234, status: 'paid', livemode: true });
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://qa.supabase.co'); vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'key');
  qa.auth = true; qa.lookup.mockReset().mockResolvedValue({ data: [], count: 0, error: null }); qa.list.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
it('distinguishes empty histories from failed or truncated customer lookups', async () => {
  expect(await (await GET(req())).json()).toMatchObject({ invoices: [], hasMore: false });
  for (const result of [{ data: null, error: {} }, { data: [], count: 101 }, { data: [], count: null }]) {
    qa.lookup.mockResolvedValueOnce(result); expect((await GET(req())).status).toBe(503);
  }
  expect(qa.list).not.toHaveBeenCalled();
});
it('combines historical customers and deduplicates resubscriptions', async () => {
  qa.lookup.mockResolvedValue({ data: ['cus_a', 'cus_a', 'cus_b'].map(stripe_customer_id => ({ stripe_customer_id })), count: 3 });
  qa.list.mockResolvedValueOnce({ data: [invoice('old')], has_more: false }).mockResolvedValueOnce({ data: [invoice('new', 2, 'jpy')], has_more: true });
  const response = await GET(req()), body = await response.json();
  expect(qa.list).toHaveBeenCalledTimes(2); expect(body.invoices.map((i: { id: string }) => i.id)).toEqual(['new', 'old']);
  expect(body.invoices.map((i: { amount: number }) => i.amount)).toEqual([1234, 12.34]); expect(body.hasMore).toBe(true);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});
it('does not display partial history when one customer request fails', async () => {
  qa.lookup.mockResolvedValue({ data: ['cus_a', 'cus_b'].map(stripe_customer_id => ({ stripe_customer_id })), count: 2 });
  qa.list.mockResolvedValueOnce({ data: [invoice('old')], has_more: false }).mockRejectedValueOnce(new Error('private upstream detail'));
  const response = await GET(req()); expect(response.status).toBe(503); expect(await response.text()).not.toContain('private upstream');
});
it('limits the merged history to the 24 newest invoices and identifies test data', async () => {
  qa.lookup.mockResolvedValue({ data: [{ stripe_customer_id: 'cus_a' }, { stripe_customer_id: 'cus_b' }], count: 2 });
  qa.list.mockResolvedValueOnce({ data: Array.from({ length: 24 }, (_, n) => invoice(`a${n}`, n)), has_more: false });
  qa.list.mockResolvedValueOnce({ data: [{ ...invoice('test', 99), livemode: false }], has_more: false });
  const body = await (await GET(req())).json(); expect(body.invoices).toHaveLength(24); expect(body.invoices[0].id).toBe('test'); expect(body).toMatchObject({ hasMore: true, testMode: true });
});
it('blocks a session without the required assurance before fetching invoices', async () => {
  qa.auth = false; expect((await GET(req())).status).toBe(401); expect(qa.lookup).not.toHaveBeenCalled();
});
it.each([['eur', 12.34], ['jpy', 1234], ['MGA', 1234], ['ugx', 12.34], ['isk', 12.34], ['huf', 12.34], ['twd', 12.34]])('uses Stripe invoice units for %s', (currency, expected) => {
  expect(stripeInvoiceAmount(1234, currency)).toBe(expected);
});
