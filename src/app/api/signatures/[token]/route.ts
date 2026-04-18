import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hashDocument } from "@/lib/agency-signatures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/signatures/[token]
 *
 * Public route : récupère les infos de la demande de signature par son token.
 * Ne retourne pas les champs internes (user_id, org_id). Marque la demande
 * comme "viewed" au premier accès.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ error: "Service key required" }, { status: 501 });
  }
  const supabase = createClient(url, serviceKey);

  const { data: request, error } = await supabase
    .from("agency_signature_requests")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Expired ?
  if (new Date(request.expires_at) < new Date() && request.status !== "signed") {
    await supabase
      .from("agency_signature_requests")
      .update({ status: "expired" })
      .eq("id", request.id);
    await supabase.from("agency_signature_events").insert({
      request_id: request.id, event_type: "expired",
    });
    return NextResponse.json({ error: "Request expired", expired_at: request.expires_at }, { status: 410 });
  }

  // Premier accès ? Mark as viewed
  if (!request.first_viewed_at && ["sent", "draft"].includes(request.status)) {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null;
    const ua = req.headers.get("user-agent") ?? null;
    await supabase
      .from("agency_signature_requests")
      .update({
        status: "viewed",
        first_viewed_at: new Date().toISOString(),
      })
      .eq("id", request.id);
    await supabase.from("agency_signature_events").insert({
      request_id: request.id, event_type: "viewed",
      actor_ip: ip, actor_user_agent: ua,
    });
  }

  return NextResponse.json({
    id: request.id,
    document_type: request.document_type,
    document_title: request.document_title,
    document_body: request.document_body,
    document_hash: request.document_hash,
    signer_name: request.signer_name,
    signer_email: request.signer_email,
    status: request.status,
    expires_at: request.expires_at,
    signed_at: request.signed_at,
    mandate_id: request.mandate_id,
  });
}

/**
 * POST /api/signatures/[token]
 *
 * Body : { action: "sign" | "decline", consent_text?, declined_reason?, timezone? }
 *
 * - "sign" : enregistre la signature avec IP + UA + timestamp + consent
 * - "decline" : enregistre le refus avec motif
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ error: "Service key required" }, { status: 501 });
  }
  const supabase = createClient(url, serviceKey);

  const body = (await req.json()) as {
    action: "sign" | "decline";
    consent_text?: string;
    declined_reason?: string;
    timezone?: string;
  };

  const { data: request } = await supabase
    .from("agency_signature_requests")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (["signed", "declined", "expired", "cancelled"].includes(request.status)) {
    return NextResponse.json({ error: `Cannot ${body.action} — already ${request.status}` }, { status: 409 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null;
  const ua = req.headers.get("user-agent") ?? null;

  if (body.action === "sign") {
    if (!body.consent_text) {
      return NextResponse.json({ error: "consent_text required" }, { status: 400 });
    }
    // Re-verify hash n'a pas changé (aucun tampering entre view et sign)
    const currentHash = await hashDocument(request.document_body);
    if (currentHash !== request.document_hash) {
      return NextResponse.json({ error: "Document integrity check failed" }, { status: 400 });
    }

    await supabase
      .from("agency_signature_requests")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
        signer_ip: ip,
        signer_user_agent: ua,
        signer_timezone: body.timezone ?? null,
        consent_text: body.consent_text,
      })
      .eq("id", request.id);
    await supabase.from("agency_signature_events").insert({
      request_id: request.id, event_type: "signed",
      actor_ip: ip, actor_user_agent: ua,
      metadata: { timezone: body.timezone ?? null },
    });
    return NextResponse.json({ ok: true, status: "signed", signed_at: new Date().toISOString() });
  }

  if (body.action === "decline") {
    await supabase
      .from("agency_signature_requests")
      .update({
        status: "declined",
        declined_at: new Date().toISOString(),
        declined_reason: body.declined_reason ?? null,
      })
      .eq("id", request.id);
    await supabase.from("agency_signature_events").insert({
      request_id: request.id, event_type: "declined",
      actor_ip: ip, actor_user_agent: ua,
      metadata: { reason: body.declined_reason ?? null },
    });
    return NextResponse.json({ ok: true, status: "declined" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
