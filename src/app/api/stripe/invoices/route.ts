import { getAssuredUser } from '@/lib/mfa-assurance';
import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { stripeInvoiceAmount } from '@/lib/stripe-amount';
export const runtime = 'nodejs';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'no-store' };
export async function GET(req: Request) {
  if (!isStripeConfigured || !stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 501, headers });
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase not configured' }, { status: 501, headers });
  const client = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data } = await getAssuredUser(client, token);
  if (!data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  try {
    const { data: rows, error, count } = await client.from('stripe_subscriptions').select('stripe_customer_id', { count: 'exact' }).eq('user_id', data.user.id).order('id').limit(100);
    if (error || !Array.isArray(rows) || count !== rows.length || rows.some(row => row.stripe_customer_id !== null && typeof row.stripe_customer_id !== 'string')) throw new Error('Customer lookup incomplete');
    // Resubscriptions can share a customer or create a new one. Preserve both histories.
    const customers = [...new Set(rows.map(row => row.stripe_customer_id as string | null).filter((id): id is string => !!id))];
    const all: Stripe.Invoice[] = []; let hasMore = false;
    for (let i = 0; i < customers.length; i += 5) {
      const batches = await Promise.all(customers.slice(i, i + 5).map(customer => stripe!.invoices.list({ customer, limit: 24 }, { timeout: 10_000, maxNetworkRetries: 0 })));
      for (const batch of batches) { all.push(...batch.data); hasMore ||= batch.has_more; }
    }
    const invoices = [...new Map(all.map(invoice => [invoice.id, invoice])).values()].sort((a,b) => b.created-a.created || a.id.localeCompare(b.id));
    return NextResponse.json({ hasMore: hasMore || invoices.length > 24, testMode: invoices.some(inv => inv.livemode === false), invoices: invoices.slice(0,24).map(inv => ({
      id: inv.id, number: inv.number, date: inv.created ? new Date(inv.created*1000).toISOString().slice(0,10) : null,
      amount: stripeInvoiceAmount(inv.total, inv.currency), currency: inv.currency.toUpperCase(), status: inv.status ?? 'draft', paid: inv.status === 'paid',
      periodEnd: inv.period_end ? new Date(inv.period_end*1000).toISOString().slice(0,10) : null, hostedUrl: inv.hosted_invoice_url, pdfUrl: inv.invoice_pdf,
    })) }, { headers });
  } catch { return NextResponse.json({ error: 'Invoice history unavailable' }, { status: 503, headers }); }
}
