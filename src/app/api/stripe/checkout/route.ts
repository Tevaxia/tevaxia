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

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const user = authData.user;
  const origin = new URL(req.url).origin;

  let body: { return_url?: string } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }

  const successUrl = body.return_url ?? `${origin}/profil?stripe=success`;
  const cancelUrl = `${origin}/profil?stripe=cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: STRIPE_PRICE_PRO, quantity: 1 }],
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: { user_id: user.id, tier: "pro" },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: "required",
    automatic_tax: { enabled: false },
  });

  return NextResponse.json({ url: session.url });
}
