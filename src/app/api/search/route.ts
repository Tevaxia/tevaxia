import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SearchResult {
  type: "mandate" | "contact" | "coownership" | "pms_property" | "pms_reservation";
  id: string;
  title: string;
  subtitle: string;
  url: string;
  amount?: number;
}

/**
 * GET /api/search?q=XYZ
 *
 * Recherche cross-entités dans le périmètre de l'utilisateur authentifié.
 * Tous les résultats respectent RLS (l'utilisateur ne voit que ses propres
 * entités ou celles de son organisation).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 501 });
  }

  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const esc = q.replace(/[%_]/g, "\\$&");
  const pattern = `%${esc}%`;

  const results: SearchResult[] = [];

  // ===== Mandats =====
  const { data: mandates } = await supabase
    .from("agency_mandates")
    .select("id, property_address, property_commune, client_name, reference, prix_demande, status")
    .or(`property_address.ilike.${pattern},property_commune.ilike.${pattern},client_name.ilike.${pattern},reference.ilike.${pattern}`)
    .limit(5);
  for (const m of ((mandates ?? []) as Array<{
    id: string; property_address: string; property_commune: string | null;
    client_name: string | null; reference: string | null;
    prix_demande: number | null; status: string;
  }>)) {
    results.push({
      type: "mandate", id: m.id,
      title: m.property_address,
      subtitle: `${m.property_commune ?? "—"} · ${m.client_name ?? "sans client"} · ${m.status}`,
      url: `/pro-agences/mandats/${m.id}`,
      amount: m.prix_demande ?? undefined,
    });
  }

  // ===== Contacts CRM =====
  const { data: contacts } = await supabase
    .from("crm_contacts")
    .select("id, first_name, last_name, company_name, email, phone, kind")
    .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},company_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
    .limit(5);
  for (const c of ((contacts ?? []) as Array<{
    id: string; first_name: string | null; last_name: string | null;
    company_name: string | null; email: string | null; phone: string | null; kind: string;
  }>)) {
    const name = c.company_name ?? ([c.first_name, c.last_name].filter(Boolean).join(" ") || "?");
    results.push({
      type: "contact", id: c.id,
      title: name,
      subtitle: `${c.kind}${c.email ? ` · ${c.email}` : ""}${c.phone ? ` · ${c.phone}` : ""}`,
      url: `/pro-agences/crm/contacts/${c.id}`,
    });
  }

  // ===== Copropriétés =====
  const { data: coowns } = await supabase
    .from("coownerships")
    .select("id, name, address, commune")
    .or(`name.ilike.${pattern},address.ilike.${pattern},commune.ilike.${pattern}`)
    .limit(5);
  for (const c of ((coowns ?? []) as Array<{
    id: string; name: string; address: string | null; commune: string | null;
  }>)) {
    results.push({
      type: "coownership", id: c.id,
      title: c.name,
      subtitle: `${c.address ?? ""}${c.commune ? `, ${c.commune}` : ""}`.trim() || "Copropriété",
      url: `/syndic/coproprietes/${c.id}`,
    });
  }

  // ===== PMS Propriétés =====
  const { data: properties } = await supabase
    .from("pms_properties")
    .select("id, name, commune, property_type")
    .or(`name.ilike.${pattern},commune.ilike.${pattern}`)
    .limit(5);
  for (const p of ((properties ?? []) as Array<{
    id: string; name: string; commune: string | null; property_type: string;
  }>)) {
    results.push({
      type: "pms_property", id: p.id,
      title: p.name,
      subtitle: `${p.property_type} · ${p.commune ?? "—"}`,
      url: `/pms/${p.id}`,
    });
  }

  // ===== PMS Reservations =====
  const { data: reservations } = await supabase
    .from("pms_reservations")
    .select("id, property_id, reservation_number, booker_name, booker_email, check_in, total_amount")
    .or(`reservation_number.ilike.${pattern},booker_name.ilike.${pattern},booker_email.ilike.${pattern}`)
    .limit(5);
  for (const r of ((reservations ?? []) as Array<{
    id: string; property_id: string; reservation_number: string;
    booker_name: string | null; booker_email: string | null;
    check_in: string; total_amount: number;
  }>)) {
    results.push({
      type: "pms_reservation", id: r.id,
      title: `${r.reservation_number} — ${r.booker_name ?? "—"}`,
      subtitle: `Arrivée ${new Date(r.check_in).toLocaleDateString("fr-FR")}${r.booker_email ? ` · ${r.booker_email}` : ""}`,
      url: `/pms/${r.property_id}/reservations/${r.id}`,
      amount: Number(r.total_amount),
    });
  }

  return NextResponse.json({ q, count: results.length, results });
}
