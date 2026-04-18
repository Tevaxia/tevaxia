"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createProperty } from "@/lib/pms/properties";
import { errMsg } from "@/lib/pms/errors";
import type { PmsPropertyType } from "@/lib/pms/types";

const TYPE_OPTIONS: { value: PmsPropertyType; label: string }[] = [
  { value: "hotel", label: "Hôtel" },
  { value: "motel", label: "Motel" },
  { value: "chambres_hotes", label: "Chambres d'hôtes / B&B" },
  { value: "residence", label: "Résidence / Aparthotel" },
  { value: "auberge", label: "Auberge" },
  { value: "camping", label: "Camping" },
];

// Présets taxe séjour LU (€ / nuit / adulte) — source : règlements communaux 2025-2026
const TAXE_SEJOUR_PRESETS: { commune: string; value: number }[] = [
  { commune: "Luxembourg-Ville", value: 3.0 },
  { commune: "Esch-sur-Alzette", value: 2.0 },
  { commune: "Differdange", value: 1.5 },
  { commune: "Dudelange", value: 1.5 },
  { commune: "Ettelbruck", value: 1.5 },
  { commune: "Remich", value: 1.5 },
  { commune: "Autre / aucune", value: 0 },
];

export default function NewPropertyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({
    name: "",
    property_type: "hotel" as PmsPropertyType,
    address: "",
    commune: "",
    postal_code: "",
    phone: "",
    email: "",
    website: "",
    tva_rate: 3,
    tva_rate_fb: 17,
    taxe_sejour_eur: 0,
    currency: "EUR",
    check_in_time: "15:00",
    check_out_time: "11:00",
    registration_number: "",
    vat_number: "",
    invoice_prefix: "FAC-",
    legal_footer: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-sm text-muted">
          <Link href="/connexion" className="text-navy underline">Connectez-vous</Link> pour créer une propriété.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Nom requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const p = await createProperty({
        name: form.name.trim(),
        property_type: form.property_type,
        address: form.address || null,
        commune: form.commune || null,
        postal_code: form.postal_code || null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        tva_rate: form.tva_rate,
        tva_rate_fb: form.tva_rate_fb,
        taxe_sejour_eur: form.taxe_sejour_eur,
        currency: form.currency,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
        registration_number: form.registration_number || null,
        vat_number: form.vat_number || null,
        invoice_prefix: form.invoice_prefix || "FAC-",
        legal_footer: form.legal_footer || null,
      });
      router.push(`/pms/${p.id}/setup`);
    } catch (e) {
      setError(errMsg(e));
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/pms" className="text-xs text-navy hover:underline">← Retour PMS</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">Nouvelle propriété</h1>
      <p className="mt-1 text-sm text-muted">Créez votre hôtel/motel/B&amp;B pour commencer à gérer réservations et facturation.</p>

      <div className="mt-6 space-y-6 rounded-xl border border-card-border bg-card p-6">
        {/* Identité */}
        <section>
          <h2 className="text-sm font-semibold text-navy mb-3">Identité</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="text-muted">Nom commercial *</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
                placeholder="Hôtel Central"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted">Type</span>
              <select
                value={form.property_type}
                onChange={(e) => setForm({ ...form, property_type: e.target.value as PmsPropertyType })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              >
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="text-muted">Adresse</span>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted">Commune</span>
              <input
                value={form.commune}
                onChange={(e) => {
                  const v = e.target.value;
                  const preset = TAXE_SEJOUR_PRESETS.find((p) => p.commune.toLowerCase() === v.toLowerCase());
                  setForm({ ...form, commune: v, taxe_sejour_eur: preset?.value ?? form.taxe_sejour_eur });
                }}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
                list="commune-list"
              />
              <datalist id="commune-list">
                {TAXE_SEJOUR_PRESETS.map((p) => <option key={p.commune} value={p.commune} />)}
              </datalist>
            </label>
            <label className="text-xs">
              <span className="text-muted">Code postal</span>
              <input
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-sm font-semibold text-navy mb-3">Contact</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs">
              <span className="text-muted">Téléphone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted">Site web</span>
              <input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
          </div>
        </section>

        {/* Fiscalité LU */}
        <section>
          <h2 className="text-sm font-semibold text-navy mb-3">Fiscalité Luxembourg</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="text-xs">
              <span className="text-muted">TVA hébergement %</span>
              <input
                type="number" step="0.5"
                value={form.tva_rate}
                onChange={(e) => setForm({ ...form, tva_rate: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted">TVA F&amp;B %</span>
              <input
                type="number" step="0.5"
                value={form.tva_rate_fb}
                onChange={(e) => setForm({ ...form, tva_rate_fb: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted">Taxe séjour €/nuit/adulte</span>
              <input
                type="number" step="0.1"
                value={form.taxe_sejour_eur}
                onChange={(e) => setForm({ ...form, taxe_sejour_eur: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted">Devise</span>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="CHF">CHF</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            <label className="text-xs">
              <span className="text-muted">N° RCS LU</span>
              <input
                placeholder="B xxxxxx"
                value={form.registration_number}
                onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted">N° TVA</span>
              <input
                placeholder="LU12345678"
                value={form.vat_number}
                onChange={(e) => setForm({ ...form, vat_number: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted">Préfixe facture</span>
              <input
                value={form.invoice_prefix}
                onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
          </div>
        </section>

        {/* Horaires */}
        <section>
          <h2 className="text-sm font-semibold text-navy mb-3">Horaires</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="text-muted">Check-in à partir de</span>
              <input
                type="time"
                value={form.check_in_time}
                onChange={(e) => setForm({ ...form, check_in_time: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted">Check-out avant</span>
              <input
                type="time"
                value={form.check_out_time}
                onChange={(e) => setForm({ ...form, check_out_time: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
          </div>
        </section>

        {/* Bas de facture */}
        <section>
          <h2 className="text-sm font-semibold text-navy mb-3">Mentions légales facture</h2>
          <textarea
            value={form.legal_footer}
            onChange={(e) => setForm({ ...form, legal_footer: e.target.value })}
            rows={3}
            placeholder="IBAN : LUxx xxxx xxxx xxxx xxxx · Paiement à 30 jours · Taux de pénalité BCE +8 pp (art. L.441-10 C. commerce — loi 18.04.2004 LU)"
            className="w-full rounded-md border border-card-border bg-background px-2 py-2 text-xs"
          />
        </section>

        {error && <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/pms"
            className="rounded-md border border-card-border px-4 py-1.5 text-sm text-slate hover:border-navy"
          >
            Annuler
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-md bg-navy px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-navy-light disabled:opacity-50"
          >
            {saving ? "Création…" : "Créer la propriété"}
          </button>
        </div>
      </div>
    </div>
  );
}
