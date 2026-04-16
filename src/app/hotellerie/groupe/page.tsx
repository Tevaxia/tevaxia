"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listMyOrganizations, type Organization } from "@/lib/orgs";
import { listHotels, createHotel, deleteHotel, type Hotel, type HotelCategory } from "@/lib/hotels";
import { formatEUR, formatPct } from "@/lib/calculations";

const CATEGORY_LABEL: Record<HotelCategory, string> = {
  budget: "Budget (1-2★)",
  midscale: "Midscale (3★)",
  upscale: "Upscale (4★)",
  luxury: "Luxury (5★)",
};

const CATEGORY_COLOR: Record<HotelCategory, string> = {
  budget: "bg-slate-100 text-slate-800",
  midscale: "bg-blue-100 text-blue-800",
  upscale: "bg-purple-100 text-purple-800",
  luxury: "bg-amber-100 text-amber-800",
};

export default function HotelGroupDashboard() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const tg = useTranslations("hotelGroupe");
  const { user } = useAuth();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<HotelCategory>("midscale");
  const [newCommune, setNewCommune] = useState("");
  const [newChambres, setNewChambres] = useState(0);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    listMyOrganizations()
      .then((list) => {
        const hotelOrgs = list.filter((o) => o.org_type === "hotel_group");
        setOrgs(hotelOrgs);
        if (hotelOrgs.length > 0 && !activeOrgId) setActiveOrgId(hotelOrgs[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [user, activeOrgId]);

  useEffect(() => {
    if (!activeOrgId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listHotels(activeOrgId)
      .then(setHotels)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [activeOrgId]);

  const handleCreate = async () => {
    if (!activeOrgId || !newName.trim()) return;
    try {
      await createHotel({
        org_id: activeOrgId,
        name: newName.trim(),
        category: newCategory,
        commune: newCommune.trim() || undefined,
        nb_chambres: newChambres,
      });
      setNewName(""); setNewCommune(""); setNewChambres(0); setNewCategory("midscale");
      setShowCreate(false);
      const list = await listHotels(activeOrgId);
      setHotels(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur création");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet hôtel ? Les périodes de performance associées seront également supprimées.")) return;
    try {
      await deleteHotel(id);
      const list = await listHotels(activeOrgId!);
      setHotels(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur suppression");
    }
  };

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null;
  const totalRooms = hotels.reduce((s, h) => s + (h.nb_chambres ?? 0), 0);
  const totalCapex = hotels.reduce((s, h) => s + (h.prix_acquisition ?? 0), 0);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-muted">Connectez-vous pour accéder à votre dashboard hôtelier.</p>
        <Link href={`${lp}/connexion`} className="mt-4 inline-flex rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href={`${lp}/hotellerie`} className="text-xs text-muted hover:text-navy">{tg("hubLink")}</Link>
            <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{tg("title")}</h1>
            <p className="mt-1 text-sm text-muted">
              {tg("subtitle")} {tg("linkSubtitle")}
            </p>
          </div>
          {orgs.length === 0 && (
            <Link href={`${lp}/profil/organisation`} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
              {tg("createGroup")}
            </Link>
          )}
        </div>

        {orgs.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-card-border bg-card p-10 text-center">
            <div className="text-4xl">🏨</div>
            <h2 className="mt-3 text-lg font-semibold text-navy">{tg("noGroup")}</h2>
            <p className="mt-1 text-sm text-muted">
              Créez une organisation de type « Groupe hôtelier » depuis votre profil pour commencer à ajouter vos établissements.
            </p>
          </div>
        )}

        {orgs.length > 1 && (
          <div className="mt-6 flex items-center gap-2">
            <label className="text-xs text-muted">Groupe :</label>
            <select
              value={activeOrgId ?? ""}
              onChange={(e) => setActiveOrgId(e.target.value)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}

        {activeOrg && (
          <>
            {/* KPIs consolidés */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted font-semibold">{tg("establishments")}</div>
                <div className="mt-1 text-2xl font-bold text-navy">{hotels.length}</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted font-semibold">{tg("totalRooms")}</div>
                <div className="mt-1 text-2xl font-bold text-navy">{totalRooms.toLocaleString("fr-LU")}</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted font-semibold">{tg("capexCumul")}</div>
                <div className="mt-1 text-2xl font-bold text-navy">{formatEUR(totalCapex)}</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted font-semibold">{tg("organisation")}</div>
                <div className="mt-1 text-sm font-bold text-navy truncate">{activeOrg.name}</div>
                <div className="mt-0.5 text-xs text-muted">{tg("hotelGroup")}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy">{tg("myHotels")}</h2>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light"
              >
                {showCreate ? tg("cancel") : tg("addHotel")}
              </button>
            </div>

            {showCreate && (
              <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder={tg("hotelName")}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as HotelCategory)}
                    className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                  >
                    {(Object.keys(CATEGORY_LABEL) as HotelCategory[]).map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder={tg("commune")}
                    value={newCommune}
                    onChange={(e) => setNewCommune(e.target.value)}
                    className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder={tg("nbRooms")}
                    value={newChambres || ""}
                    onChange={(e) => setNewChambres(Number(e.target.value) || 0)}
                    className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                  >
                    Créer l&apos;hôtel
                  </button>
                </div>
              </div>
            )}

            {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

            {!loading && hotels.length === 0 && !showCreate && (
              <div className="mt-4 rounded-xl border border-dashed border-card-border bg-card p-8 text-center text-sm text-muted">
                Aucun hôtel dans ce groupe. Cliquez sur « {tg("addHotel")} » pour commencer.
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {hotels.map((h) => (
                <div key={h.id} className="rounded-xl border border-card-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-navy truncate">{h.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLOR[h.category]}`}>
                          {CATEGORY_LABEL[h.category]}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {h.commune ? `${h.commune} · ` : ""}
                        {h.nb_chambres > 0 ? `${h.nb_chambres} chambres` : "Chambres non renseignées"}
                        {h.operator_type !== "independent" ? ` · ${h.operator_type}` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="rounded-md p-1 text-muted hover:text-rose-600 hover:bg-rose-50"
                      title="Supprimer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" />
                      </svg>
                    </button>
                  </div>

                  {(h.classe_energie || h.year_built || h.surface_m2 || h.prix_acquisition) && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {h.classe_energie && (
                        <div className="flex justify-between border-t border-card-border/50 pt-1.5">
                          <span className="text-muted">Classe énergie</span>
                          <span className="font-medium text-navy">{h.classe_energie}</span>
                        </div>
                      )}
                      {h.year_built && (
                        <div className="flex justify-between border-t border-card-border/50 pt-1.5">
                          <span className="text-muted">Année constr.</span>
                          <span className="font-medium text-navy">{h.year_built}</span>
                        </div>
                      )}
                      {h.prix_acquisition && (
                        <div className="flex justify-between col-span-2 border-t border-card-border/50 pt-1.5">
                          <span className="text-muted">Prix d&apos;acquisition</span>
                          <span className="font-medium text-navy">{formatEUR(h.prix_acquisition)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-card-border pt-3">
                    <Link href={`${lp}/hotellerie/valorisation?hotel=${h.id}`} className="rounded-md border border-card-border bg-background px-2 py-1 text-[11px] font-medium text-navy hover:bg-slate-50">
                      Valorisation
                    </Link>
                    <Link href={`${lp}/hotellerie/dscr?hotel=${h.id}`} className="rounded-md border border-card-border bg-background px-2 py-1 text-[11px] font-medium text-navy hover:bg-slate-50">
                      DSCR
                    </Link>
                    <Link href={`${lp}/hotellerie/exploitation?hotel=${h.id}`} className="rounded-md border border-card-border bg-background px-2 py-1 text-[11px] font-medium text-navy hover:bg-slate-50">
                      Exploitation
                    </Link>
                    <Link href={`${lp}/hotellerie/revpar-comparison?hotel=${h.id}`} className="rounded-md border border-card-border bg-background px-2 py-1 text-[11px] font-medium text-navy hover:bg-slate-50">
                      RevPAR
                    </Link>
                    <Link href={`${lp}/hotellerie/renovation?hotel=${h.id}`} className="rounded-md border border-card-border bg-background px-2 py-1 text-[11px] font-medium text-navy hover:bg-slate-50">
                      Rénovation
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// formatPct used in future period KPI cards; kept to avoid churn when we add them.
void formatPct;
