"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listMyProperties } from "@/lib/pms/properties";
import type { PmsProperty, PmsPropertyType } from "@/lib/pms/types";

const TYPE_LABELS: Record<PmsPropertyType, string> = {
  hotel: "Hôtel",
  motel: "Motel",
  chambres_hotes: "Chambres d'hôtes / B&B",
  residence: "Résidence / Aparthotel",
  auberge: "Auberge",
  camping: "Camping",
};

export default function PmsHomePage() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<PmsProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    void listMyProperties().then((list) => {
      setProperties(list);
      setLoading(false);
    });
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Property Management System — tevaxia PMS</h1>
        <p className="mt-4 text-sm text-muted">
          Logiciel de gestion réservations / chambres / facturation pour hôtels, motels, chambres d&apos;hôtes et résidences
          au Luxembourg. Fiscalité intégrée (TVA 3 % hébergement, taxe séjour par commune), export iCal OTA.
        </p>
        <div className="mt-6">
          <Link
            href="/connexion"
            className="inline-flex items-center rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-light"
          >
            Se connecter pour accéder au PMS →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            tevaxia PMS
            <span className="ml-3 inline-block rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy">
              nouveau
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Gestion réservations, chambres, tarifs, facturation. Conforme fiscalité LU (TVA 3 %, taxe séjour).
          </p>
        </div>
        <Link
          href="/pms/proprietes/nouveau"
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-light"
        >
          + Nouvelle propriété
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-card-border bg-card/50 p-10 text-center">
          <h2 className="text-lg font-semibold text-navy">Bienvenue dans le PMS tevaxia</h2>
          <p className="mt-2 text-sm text-muted max-w-xl mx-auto">
            Commencez par créer votre première propriété (hôtel, motel, gîte…). Vous pourrez ensuite définir
            types de chambres, tarifs, et accepter des réservations.
          </p>
          <Link
            href="/pms/proprietes/nouveau"
            className="mt-4 inline-flex items-center rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-light"
          >
            Créer ma première propriété
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/pms/${p.id}`}
              className="rounded-xl border border-card-border bg-card p-5 hover:border-navy transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-navy">{p.name}</h3>
                <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-medium text-navy whitespace-nowrap">
                  {TYPE_LABELS[p.property_type]}
                </span>
              </div>
              {p.commune && <div className="mt-1 text-xs text-muted">{p.commune}</div>}
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
                <span>TVA {p.tva_rate}%</span>
                {p.taxe_sejour_eur && p.taxe_sejour_eur > 0 ? (
                  <span>Taxe séjour {p.taxe_sejour_eur} €</span>
                ) : null}
                <span className="ml-auto font-mono">{p.currency}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Informations LU */}
      <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <h3 className="font-semibold">Conformité Luxembourg intégrée</h3>
        <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
          <li>TVA hébergement 3 % (art. 40 loi TVA 12.02.1979 + annexe B)</li>
          <li>TVA F&B 17 % (ou 14 % / 8 % selon produits)</li>
          <li>Taxe séjour communale configurable (Luxembourg-Ville 3 €/nuit/adulte en 2026)</li>
          <li>Facture immuable après émission (art. 61-63 loi TVA)</li>
          <li>Données invités RGPD — suppression programmée 3 ans post-séjour (sauf obligations fiscales)</li>
          <li>Export iCal pour sync Booking/Airbnb/Expedia (read-only, sans push API)</li>
        </ul>
      </section>
    </div>
  );
}
