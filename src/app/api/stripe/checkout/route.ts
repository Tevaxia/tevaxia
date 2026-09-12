import { getAssuredUser } from "@/lib/mfa-assurance";
import { createHash } from 'node:crypto';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, STRIPE_PRICE_PRO, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST /api/stripe/checkout
 * Body: { access_token?: string, return_url?: string }
 * Returns: { url: string }
 *
 * Crée une session Stripe Checkout pour l'utilisateur courant et
 * retourne l'URL à laquelle le client doit être redirigé.
 */
export async function POST(req: Request) {
  if (!isStripeConfigured || !stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 501 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!accessToken) {
    return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: authData, error: authError } = await getAssuredUser(supabase, accessToken);
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const user = authData.user;
  const origin = new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://tevaxia.lu').origin;

  let body: { return_url?: string } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  if (!body || typeof body !== 'object' || Array.isArray(body) || (body.return_url !== undefined && (typeof body.return_url !== 'string' || body.return_url.length > 2048))) return NextResponse.json({ error: 'Invalid return URL' }, { status: 400 });
  let successUrl = `${origin}/profil?stripe=success`;
  if (body.return_url) {
    try { const candidate = new URL(body.return_url, origin); if (candidate.origin !== origin || candidate.username || candidate.password) throw new Error('origin'); successUrl = candidate.href; }
    catch { return NextResponse.json({ error: 'Invalid return URL' }, { status: 400 }); }
  }
  const cancelUrl = `${origin}/profil?stripe=cancel`;
  const { data: existing, error: lookupError } = await supabase.from('stripe_subscriptions').select('id').eq('user_id', user.id).in('status', ['active','trialing']).limit(1);
  if (lookupError || !Array.isArray(existing)) return NextResponse.json({ error: 'Subscription verification unavailable' }, { status: 503 });
  if (existing.length) return NextResponse.json({ error: 'An active subscription already exists' }, { status: 409 });
  const payload = {
    mode: "subscription" as const,
    payment_method_types: ["card" as const],
    line_items: [{ price: STRIPE_PRICE_PRO, quantity: 1 }],
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: { user_id: user.id, tier: "pro" },
    subscription_data: { metadata: { user_id: user.id, tier: 'pro' } },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: "required" as const,
    automatic_tax: { enabled: false },
  };
  // Double clicks and concurrent retries of the same checkout reuse one Stripe session.
  const idempotencyKey = 'tevaxia-checkout-' + createHash('sha256').update(JSON.stringify([user.id, Math.floor(Date.now()/600000), payload])).digest('hex');
  try {
    const session = await stripe.checkout.sessions.create(payload, { idempotencyKey });
    if (!session.url) throw new Error('Missing checkout URL');
    return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Checkout unavailable' }, { status: 503 }); }
}
