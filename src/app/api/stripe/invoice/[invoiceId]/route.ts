import { getAssuredUser } from "@/lib/mfa-assurance";
import { NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { stripeInvoiceAmount } from '@/lib/stripe-amount';

export const runtime = "nodejs";

/**
 * GET /api/stripe/invoice/:invoiceId
 * Génère un PDF facture téléchargeable à partir de l'ID Stripe invoice.
 *
 * Sécurité : vérifie que la facture appartient bien au user authentifié
 * via le customer_id associé à son stripe_subscription.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  if (!isStripeConfigured || !stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }

  const { invoiceId } = await params;
  if (!/^in_[A-Za-z0-9]+$/.test(invoiceId)) return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });

  // Auth : header Authorization Bearer <jwt>
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 501 });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: authData } = await getAssuredUser(supabase, token);
  const user = authData?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Récupérer la facture Stripe
  let invoice;
  try {
    invoice = await stripe.invoices.retrieve(invoiceId);
  } catch {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Vérifier ownership : le customer_id doit correspondre à une ligne
  // stripe_subscriptions du user
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) {
    return NextResponse.json({ error: "Invoice missing customer" }, { status: 400 });
  }

  const { data: subRow, error: ownershipError } = await supabase
    .from("stripe_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (ownershipError) return NextResponse.json({ error: 'Invoice ownership verification unavailable' }, { status: 503 });

  if (!subRow) {
    return NextResponse.json({ error: "Not your invoice" }, { status: 403 });
  }

  // Stripe owns the generated invoice PDF.
  if (invoice.invoice_pdf) {
    const response = NextResponse.redirect(invoice.invoice_pdf, 302);
    response.headers.set('Cache-Control', 'no-store'); response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }

  // Fallback : retour JSON si pas de PDF Stripe
  return NextResponse.json({
    invoiceNumber: invoice.number,
    amount: stripeInvoiceAmount(invoice.total ?? 0, invoice.currency ?? 'eur'),
    currency: invoice.currency?.toUpperCase() ?? "EUR",
    status: invoice.status,
    paidAt: invoice.status_transitions?.paid_at ?? null,
    lines: invoice.lines?.data.length ?? 0,
    hostedUrl: invoice.hosted_invoice_url,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
