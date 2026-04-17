import { NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

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

  const { data: authData } = await supabase.auth.getUser();
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

  const { data: subRow } = await supabase
    .from("stripe_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!subRow) {
    return NextResponse.json({ error: "Not your invoice" }, { status: 403 });
  }

  // Build invoice data payload
  const lines = (invoice.lines?.data ?? []).map((l) => ({
    description: l.description ?? "Abonnement",
    quantity: l.quantity ?? 1,
    unitPrice: (l.amount ?? 0) / 100 / (l.quantity ?? 1),
  }));

  // Réutilise redirection vers hosted invoice Stripe pour le moment
  // (leur PDF est déjà LU-conforme). Le user peut customiser avec
  // la génération locale via StripeInvoicePdf s'il préfère.
  if (invoice.invoice_pdf) {
    return NextResponse.redirect(invoice.invoice_pdf, 302);
  }

  // Fallback : retour JSON si pas de PDF Stripe
  return NextResponse.json({
    invoiceNumber: invoice.number,
    amount: (invoice.total ?? 0) / 100,
    currency: invoice.currency?.toUpperCase() ?? "EUR",
    status: invoice.status,
    paidAt: invoice.status_transitions?.paid_at ?? null,
    lines: lines.length,
    hostedUrl: invoice.hosted_invoice_url,
  });
}
