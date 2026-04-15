import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe";

// Le type du client admin est volontairement permissif ; on manipule
// des tables custom (stripe_subscriptions) non présentes dans les
// types Supabase générés.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

export const runtime = "nodejs";

/**
 * POST /api/stripe/webhook
 * Reçoit les événements Stripe (Checkout completed, subscription
 * updated/deleted). Met à jour stripe_subscriptions via service_role.
 */
export async function POST(req: Request) {
  if (!isStripeConfigured || !stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    return NextResponse.json({ error: `Invalid signature: ${e instanceof Error ? e.message : e}` }, { status: 400 });
  }

  // Admin client (service role) pour bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 501 });
  }
  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.client_reference_id || session.metadata?.user_id) ?? null;
        if (!userId || !session.subscription) break;

        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

        const sub = await stripe.subscriptions.retrieve(subId);
        await upsertSubscription(admin, userId, customerId, sub);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        // Retrouver user_id via la ligne existante ou les métadonnées
        let userId: string = sub.metadata?.user_id ?? "";
        if (!userId) {
          const { data: existing } = await admin
            .from("stripe_subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          userId = (existing?.user_id as string | undefined) ?? "";
        }
        if (!userId) break;

        await upsertSubscription(admin, userId, customerId, sub);
        break;
      }

      default:
        // Événements non gérés — on les ignore silencieusement
        break;
    }
  } catch (e) {
    console.error("Stripe webhook handler error:", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function upsertSubscription(
  admin: AdminClient,
  userId: string,
  customerId: string | null,
  sub: Stripe.Subscription
) {
  const item = sub.items.data[0];
  const priceId = item?.price.id ?? null;
  const tier = sub.metadata?.tier === "enterprise" ? "enterprise" : "pro";

  // Dans l'API Stripe 2024-12+, current_period_* sont sur l'item
  const periodStart = (item as unknown as { current_period_start?: number })?.current_period_start;
  const periodEnd = (item as unknown as { current_period_end?: number })?.current_period_end;

  const row = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    tier,
    status: sub.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("stripe_subscriptions") as any).upsert(row, { onConflict: "stripe_subscription_id" });
}
