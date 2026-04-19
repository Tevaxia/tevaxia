"use client";

import { useEffect, useMemo, useState, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { getReservation } from "@/lib/pms/reservations";
import {
  getFolioByReservation, openFolio, autoPostRoomCharges,
  listFolioCharges, postCharge, voidCharge, settleFolio,
  groupChargesByCategory, computeVatBreakdown,
  CATEGORY_LABELS, CATEGORY_DEFAULT_TVA,
} from "@/lib/pms/folios";
import type {
  PmsProperty, PmsReservation, PmsFolio, PmsFolioCharge, PmsChargeCategory,
} from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/pms/errors";
import { buildPmsFacturX } from "@/lib/facturation/factur-x-pms-builder";
import { generateFacturXPdf } from "@/lib/facturation/factur-x-pdf";
import { track, captureError } from "@/lib/analytics";

const QUICK_CATEGORIES: { cat: PmsChargeCategory; label: string; defaultPrice: number }[] = [
  { cat: "breakfast", label: "Petit-déj", defaultPrice: 15 },
  { cat: "bar", label: "Bar", defaultPrice: 10 },
  { cat: "minibar", label: "Minibar", defaultPrice: 8 },
  { cat: "parking", label: "Parking", defaultPrice: 12 },
  { cat: "laundry", label: "Blanchisserie", defaultPrice: 20 },
  { cat: "spa", label: "Spa", defaultPrice: 40 },
  { cat: "room_service", label: "Room service", defaultPrice: 25 },
  { cat: "dinner", label: "Dîner", defaultPrice: 35 },
];

const STATUS_COLORS: Record<PmsFolio["status"], string> = {
  open: "bg-blue-100 text-blue-900",
  pending_settlement: "bg-amber-100 text-amber-900",
  settled: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-rose-100 text-rose-900",
};

const STATUS_LABELS: Record<PmsFolio["status"], string> = {
  open: "Ouvert",
  pending_settlement: "À facturer",
  settled: "Facturé",
  cancelled: "Annulé",
};

function fmtDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleString("fr-LU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function FolioPage(props: { params: Promise<{ propertyId: string; resId: string }> }) {
  const { propertyId, resId } = use(props.params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [reservation, setReservation] = useState<PmsReservation | null>(null);
  const [folio, setFolio] = useState<PmsFolio | null>(null);
  const [charges, setCharges] = useState<PmsFolioCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVoided, setShowVoided] = useState(false);

  // Form posting
  const [form, setForm] = useState<{
    category: PmsChargeCategory; description: string;
    quantity: string; unit_price_ht: string; tva_rate: string; notes: string;
  }>({
    category: "bar", description: "", quantity: "1", unit_price_ht: "",
    tva_rate: String(CATEGORY_DEFAULT_TVA.bar), notes: "",
  });

  const reload = useCallback(async () => {
    if (!propertyId || !resId) return;
    setLoading(true);
    try {
      const [p, r] = await Promise.all([getProperty(propertyId), getReservation(resId)]);
      setProperty(p); setReservation(r);
      let f = await getFolioByReservation(resId);
      // Si pas de folio (réservation jamais check-in), on le crée manuellement
      if (!f && r && (r.status === "checked_in" || r.status === "checked_out")) {
        f = await openFolio(propertyId, resId);
        if (f) await autoPostRoomCharges(f.id);
        f = await getFolioByReservation(resId);
      }
      setFolio(f);
      if (f) {
        const cs = await listFolioCharges(f.id, showVoided);
        setCharges(cs);
      }
    } catch (e) {
      setError(errMsg(e));
    }
    setLoading(false);
  }, [propertyId, resId, showVoided]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const handleOpenFolio = async () => {
    if (!folio) {
      try {
        const f = await openFolio(propertyId, resId);
        await autoPostRoomCharges(f.id);
        await reload();
      } catch (e) {
        setError(errMsg(e));
      }
    }
  };

  const handlePost = async () => {
    if (!folio) return;
    if (!form.description.trim() || !form.unit_price_ht) {
      setError("Description et prix requis.");
      return;
    }
    try {
      await postCharge({
        folio_id: folio.id,
        category: form.category,
        description: form.description,
        quantity: Number(form.quantity) || 1,
        unit_price_ht: Number(form.unit_price_ht),
        tva_rate: Number(form.tva_rate),
        notes: form.notes || undefined,
      });
      setForm({ ...form, description: "", unit_price_ht: "", notes: "" });
      setError(null);
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const handleQuickPost = async (qc: typeof QUICK_CATEGORIES[number]) => {
    if (!folio) return;
    try {
      await postCharge({
        folio_id: folio.id,
        category: qc.cat,
        description: qc.label,
        quantity: 1,
        unit_price_ht: qc.defaultPrice / (1 + CATEGORY_DEFAULT_TVA[qc.cat] / 100),
        tva_rate: CATEGORY_DEFAULT_TVA[qc.cat],
      });
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const handleVoid = async (chargeId: string) => {
    const reason = prompt("Motif d'annulation :");
    if (!reason) return;
    try {
      await voidCharge(chargeId, reason);
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const handleSettle = async () => {
    if (!folio) return;
    if (!confirm(`Générer la facture définitive pour ce folio (${formatEUR(folio.total_ttc)} TTC) ?`)) return;
    try {
      const invoiceId = await settleFolio(folio.id);
      alert("Facture générée avec succès.");
      router.push(`/pms/${propertyId}/factures?invoice=${invoiceId}`);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const handleFacturX = async () => {
    if (!property || !reservation) return;
    try {
      const inv = buildPmsFacturX({
        reservation: {
          reservation_number: reservation.reservation_number,
          booker_name: reservation.booker_name,
          booker_email: reservation.booker_email,
          check_in: reservation.check_in,
          check_out: reservation.check_out,
          nb_adults: reservation.nb_adults,
          nb_children: reservation.nb_children,
        },
        property: {
          name: property.name,
          address: property.address,
          city: property.commune,
          country_code: "LU",
        },
        charges,
      });
      const artifacts = await generateFacturXPdf(inv);
      const blob = new Blob([artifacts.pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = artifacts.pdfFilename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const xmlBlob = new Blob([artifacts.xml], { type: "application/xml" });
      const xmlUrl = URL.createObjectURL(xmlBlob);
      const a2 = document.createElement("a");
      a2.href = xmlUrl; a2.download = artifacts.xmlFilename;
      document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
      URL.revokeObjectURL(xmlUrl);

      track("pms_facturx_generated", {
        reservation_number: reservation.reservation_number,
        nb_charges: charges.filter((c) => !c.voided).length,
        total_ttc: folio?.total_ttc ?? 0,
      });
    } catch (e) {
      captureError(e, { module: "pms_facturx", action: "generate", reservation_number: reservation?.reservation_number });
      setError(errMsg(e));
    }
  };

  const grouped = useMemo(() => groupChargesByCategory(charges), [charges]);
  const breakdown = useMemo(() => computeVatBreakdown(charges), [charges]);

  if (authLoading || loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !property || !reservation) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">
      <Link href="/connexion" className="text-navy underline">Se connecter</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`/pms/${propertyId}`} className="hover:text-navy">{property.name}</Link>
        <span>/</span>
        <Link href={`/pms/${propertyId}/reservations/${resId}`} className="hover:text-navy">
          Réservation {reservation.reservation_number}
        </Link>
        <span>/</span>
        <span className="text-navy">Folio</span>
      </div>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            Folio — {reservation.reservation_number}
          </h1>
          <div className="mt-1 text-xs text-muted">
            {reservation.nb_adults} adulte(s){reservation.nb_children > 0 ? `, ${reservation.nb_children} enfant(s)` : ""}
            {" · "}
            {new Date(reservation.check_in).toLocaleDateString("fr-LU")} → {new Date(reservation.check_out).toLocaleDateString("fr-LU")}
            {" · "}
            {reservation.nb_nights} nuit(s)
          </div>
        </div>
        {folio && (
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[folio.status]}`}>
              {STATUS_LABELS[folio.status]}
            </span>
            {folio.status === "pending_settlement" && (
              <button onClick={handleSettle}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Générer la facture
              </button>
            )}
            {charges.filter((c) => !c.voided).length > 0 && (
              <button onClick={handleFacturX}
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                title="Génère Factur-X EN 16931 (PDF/A-3 + XML CII embarqué) pour transmission e-invoicing client corporate">
                ⚡ Factur-X
              </button>
            )}
            {folio.status === "settled" && folio.invoice_id && (
              <Link href={`/pms/${propertyId}/factures?invoice=${folio.invoice_id}`}
                className="rounded-lg border border-navy bg-white px-4 py-2 text-sm font-semibold text-navy">
                Voir facture →
              </Link>
            )}
          </div>
        )}
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* Pas encore de folio : call-to-action */}
      {!folio && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border p-8 text-center">
          <p className="text-sm text-muted">
            {reservation.status === "confirmed"
              ? "Le folio sera ouvert automatiquement au check-in avec pré-chargement des nuits et de la taxe de séjour."
              : "Aucun folio ouvert pour cette réservation."}
          </p>
          {reservation.status === "confirmed" ? (
            <p className="mt-2 text-xs text-muted">
              Pour poster des pré-charges (acompte, consommations avant arrivée), ouvrez le folio manuellement.
            </p>
          ) : null}
          <button onClick={handleOpenFolio}
            className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            Ouvrir le folio maintenant
          </button>
        </div>
      )}

      {folio && (
        <>
          {/* KPIs ventilation TVA */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <KpiCard label="Hébergement (3%)" ht={breakdown.hebergement.ht} ttc={breakdown.hebergement.ttc} />
            <KpiCard label="F&B (17%)" ht={breakdown.fb.ht} ttc={breakdown.fb.ttc} />
            <KpiCard label="Autres (17%)" ht={breakdown.other.ht} ttc={breakdown.other.ttc} />
            <KpiCard label="Taxe séjour" ht={breakdown.taxe_sejour} ttc={breakdown.taxe_sejour} sub="0% TVA" />
            <KpiCard label="Total dû" ht={Number(folio.total_ttc)} ttc={Number(folio.balance_due)}
              highlight sub={folio.balance_due > 0 ? "Solde restant" : "Réglé"} />
          </div>

          {/* Quick post buttons */}
          {folio.status === "open" && (
            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Poster une consommation rapide</div>
              <div className="flex flex-wrap gap-2">
                {QUICK_CATEGORIES.map((qc) => (
                  <button key={qc.cat} onClick={() => handleQuickPost(qc)}
                    className="rounded-lg border border-card-border bg-card px-3 py-2 text-xs font-semibold text-navy hover:border-navy">
                    + {qc.label} <span className="text-[10px] text-muted">({formatEUR(qc.defaultPrice)} TTC)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form custom post */}
          {folio.status === "open" && (
            <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Poster une ligne personnalisée</div>
              <div className="grid gap-3 sm:grid-cols-6">
                <select value={form.category}
                  onChange={(e) => {
                    const cat = e.target.value as PmsChargeCategory;
                    setForm((f) => ({ ...f, category: cat, tva_rate: String(CATEGORY_DEFAULT_TVA[cat]) }));
                  }}
                  className="rounded-lg border border-input-border bg-input-bg px-2 py-2 text-sm">
                  {(Object.keys(CATEGORY_LABELS) as PmsChargeCategory[])
                    .filter((c) => c !== "room" && c !== "taxe_sejour")
                    .map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                </select>
                <input type="text" placeholder="Description" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="sm:col-span-2 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                <input type="number" placeholder="Qté" value={form.quantity} step={0.5}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-right font-mono" />
                <input type="number" placeholder="PU HT €" value={form.unit_price_ht} step={0.01}
                  onChange={(e) => setForm({ ...form, unit_price_ht: e.target.value })}
                  className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-right font-mono" />
                <input type="number" placeholder="TVA %" value={form.tva_rate} step={0.5}
                  onChange={(e) => setForm({ ...form, tva_rate: e.target.value })}
                  className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-right font-mono" />
              </div>
              <div className="mt-3 flex justify-end">
                <button onClick={handlePost}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
                  Poster
                </button>
              </div>
            </div>
          )}

          {/* Charges table */}
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
              Lignes du folio ({charges.filter((c) => !c.voided).length})
            </h2>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={showVoided}
                onChange={(e) => setShowVoided(e.target.checked)} />
              Afficher les annulations
            </label>
          </div>

          {charges.length === 0 ? (
            <div className="mt-3 rounded-xl border-2 border-dashed border-card-border p-8 text-center text-sm text-muted">
              Aucune ligne postée.
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-background/60">
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Date</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Catégorie</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Description</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">Qté</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">PU HT</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">TVA</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">HT</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">TTC</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((c) => (
                    <tr key={c.id} className={`border-b border-card-border/40 ${c.voided ? "opacity-40 line-through" : ""}`}>
                      <td className="px-3 py-2 text-xs text-muted">{fmtDateTime(c.posted_at)}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-navy">
                          {CATEGORY_LABELS[c.category]}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{c.description}</div>
                        {c.source && c.source !== "manual" && (
                          <div className="text-[9px] text-muted uppercase">{c.source.replace("_", " ")}</div>
                        )}
                        {c.void_reason && <div className="text-[9px] text-rose-700">VOID: {c.void_reason}</div>}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{Number(c.quantity).toLocaleString("fr-LU")}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{formatEUR(Number(c.unit_price_ht))}</td>
                      <td className="px-3 py-2 text-right text-xs text-muted">{c.tva_rate}%</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{formatEUR(Number(c.line_ht))}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-navy">{formatEUR(Number(c.line_ttc))}</td>
                      <td className="px-3 py-2 text-right">
                        {!c.voided && folio.status === "open" && (
                          <button onClick={() => handleVoid(c.id)}
                            className="text-[10px] text-rose-700 hover:underline">Annuler</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-card-border bg-background font-semibold">
                    <td colSpan={6} className="px-3 py-3 text-right">Totaux</td>
                    <td className="px-3 py-3 text-right font-mono">{formatEUR(breakdown.total_ht)}</td>
                    <td className="px-3 py-3 text-right font-mono text-navy">{formatEUR(breakdown.total_ttc)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Récap par catégorie */}
          {Object.keys(grouped).length > 0 && (
            <div className="mt-6 rounded-xl border border-card-border bg-card p-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">Ventilation par catégorie</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-[10px] uppercase tracking-wider text-muted">
                    <th className="px-2 py-1">Catégorie</th>
                    <th className="px-2 py-1 text-right">Nb</th>
                    <th className="px-2 py-1 text-right">HT</th>
                    <th className="px-2 py-1 text-right">TVA</th>
                    <th className="px-2 py-1 text-right">TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.entries(grouped) as [PmsChargeCategory, { count: number; ht: number; tva: number; ttc: number }][]).map(([cat, tot]) => (
                    <tr key={cat} className="border-b border-card-border/40">
                      <td className="px-2 py-1.5">{CATEGORY_LABELS[cat]}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs">{tot.count}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs">{formatEUR(tot.ht)}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs text-muted">{formatEUR(tot.tva)}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs font-semibold text-navy">{formatEUR(tot.ttc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
            <strong>TVA LU hôtellerie :</strong> hébergement 3% (loi TVA art. 40 + annexe B), F&B 17% (taux normal),
            taxe de séjour hors TVA (art. 44). Au check-out, ce folio se transforme en facture officielle avec
            ventilation automatique des 3 taux et pré-remplissage conforme règlement 24.03.2023 sur la
            facturation électronique.
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, ht, ttc, sub, highlight = false }: {
  label: string; ht: number; ttc: number; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-navy bg-navy text-white" : "border-card-border bg-card"}`}>
      <div className={`text-[10px] uppercase tracking-wider ${highlight ? "text-white/70" : "text-muted"}`}>{label}</div>
      <div className={`mt-1 text-lg font-bold ${highlight ? "text-white" : "text-navy"}`}>{formatEUR(ttc)}</div>
      <div className={`text-[10px] ${highlight ? "text-white/60" : "text-muted"}`}>
        {sub ?? `HT : ${formatEUR(ht)}`}
      </div>
    </div>
  );
}
