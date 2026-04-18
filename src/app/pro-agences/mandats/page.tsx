"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  listMyMandates, createMandate, updateMandate, deleteMandate,
  computeEstimatedCommission, mandateDaysRemaining,
  MANDATE_PIPELINE_ORDER,
  type AgencyMandate, type MandateStatus, type MandateType,
} from "@/lib/agency-mandates";
import { buildOpenImmoXml, buildPortalCsv, downloadBlob } from "@/lib/agency-xml";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

const STATUS_LABELS: Record<MandateStatus, string> = {
  prospect: "Prospect",
  mandat_signe: "Mandat signé",
  diffuse: "Diffusé",
  en_visite: "En visite",
  offre_recue: "Offre reçue",
  sous_compromis: "Sous compromis",
  vendu: "Vendu",
  abandonne: "Abandonné",
  expire: "Expiré",
};

const STATUS_COLORS: Record<MandateStatus, string> = {
  prospect: "bg-slate-100 text-slate-800 border-slate-200",
  mandat_signe: "bg-blue-100 text-blue-900 border-blue-200",
  diffuse: "bg-indigo-100 text-indigo-900 border-indigo-200",
  en_visite: "bg-violet-100 text-violet-900 border-violet-200",
  offre_recue: "bg-amber-100 text-amber-900 border-amber-200",
  sous_compromis: "bg-orange-100 text-orange-900 border-orange-200",
  vendu: "bg-emerald-100 text-emerald-900 border-emerald-200",
  abandonne: "bg-gray-100 text-gray-700 border-gray-200",
  expire: "bg-rose-100 text-rose-900 border-rose-200",
};

const TYPE_LABELS: Record<MandateType, string> = {
  exclusif: "Exclusif",
  simple: "Simple",
  semi_exclusif: "Semi-exclusif",
  recherche: "Recherche (acquéreur)",
};

const STATUS_ORDER: MandateStatus[] = [
  ...MANDATE_PIPELINE_ORDER,
  "abandonne",
  "expire",
];

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-LU", { year: "numeric", month: "short", day: "numeric" });
}

export default function MandatesPage() {
  const { user, loading: authLoading } = useAuth();
  const [mandates, setMandates] = useState<AgencyMandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MandateStatus | "all">("all");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<AgencyMandate>>({
    property_address: "", property_type: "appartement",
    mandate_type: "simple", status: "prospect",
    commission_pct: 3,
  });

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await listMyMandates();
    setMandates(list);
    setLoading(false);
  }, [user]);

  useEffect(() => { void reload(); }, [reload]);

  const handleCreate = async () => {
    if (!form.property_address?.trim()) {
      setError("Adresse requise.");
      return;
    }
    try {
      await createMandate({
        ...form,
        property_address: form.property_address,
        commission_amount_estimee: computeEstimatedCommission({
          prix_demande: form.prix_demande ?? null,
          commission_pct: form.commission_pct ?? null,
        }),
      } as Partial<AgencyMandate> & { property_address: string });
      setForm({ property_address: "", property_type: "appartement", mandate_type: "simple", status: "prospect", commission_pct: 3 });
      setShowForm(false);
      setError(null);
      await reload();
    } catch (e) {
      setError(errMsg(e, "Erreur"));
    }
  };

  const handleStatusChange = async (m: AgencyMandate, newStatus: MandateStatus) => {
    const patch: Partial<AgencyMandate> = { status: newStatus };
    if (newStatus === "mandat_signe" && !m.signed_at) {
      patch.signed_at = new Date().toISOString();
    }
    if (newStatus === "vendu") {
      patch.sold_at = new Date().toISOString();
    }
    await updateMandate(m.id, patch);
    await reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce mandat ?")) return;
    await deleteMandate(id);
    await reload();
  };

  const filtered = useMemo(() => {
    if (filter === "all") return mandates;
    return mandates.filter((m) => m.status === filter);
  }, [mandates, filter]);

  const stats = useMemo(() => {
    const active = mandates.filter((m) => ["mandat_signe", "sous_compromis"].includes(m.status));
    const sold = mandates.filter((m) => m.status === "vendu");
    const commissionEstimee = active.reduce((s, m) => s + (Number(m.commission_amount_estimee) || 0), 0);
    const commissionPercue = sold.reduce((s, m) => s + (Number(m.commission_amount_percue) || 0), 0);
    const nbExpireSoon = active.filter((m) => {
      const d = mandateDaysRemaining(m.end_date);
      return d !== null && d >= 0 && d <= 30;
    }).length;
    return { active: active.length, sold: sold.length, commissionEstimee, commissionPercue, nbExpireSoon };
  }, [mandates]);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Supabase requis (migration 039).
        </div>
      </div>
    );
  }
  if (authLoading || loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center">
      <Link href="/connexion" className="text-navy underline">Se connecter</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href="/pro-agences" className="text-xs text-muted hover:text-navy">← Pro agences</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">Suivi mandats immobiliers</h1>
      <p className="mt-1 text-sm text-muted">
        Pipeline complet : prospection → mandat → compromis → vente. Alertes échéances mandat 30j avant.
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-card-border bg-card p-4 text-center">
          <div className="text-xs text-muted">Mandats actifs</div>
          <div className="mt-1 text-2xl font-bold text-navy">{stats.active}</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4 text-center">
          <div className="text-xs text-muted">Ventes closes</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{stats.sold}</div>
        </div>
        <div className={`rounded-xl border p-4 text-center ${stats.nbExpireSoon > 0 ? "border-amber-200 bg-amber-50" : "border-card-border bg-card"}`}>
          <div className="text-xs text-muted">Expirent &lt; 30j</div>
          <div className={`mt-1 text-2xl font-bold ${stats.nbExpireSoon > 0 ? "text-amber-900" : "text-navy"}`}>{stats.nbExpireSoon}</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4 text-center">
          <div className="text-xs text-muted">Commission estimée</div>
          <div className="mt-1 text-xl font-bold text-navy">{formatEUR(stats.commissionEstimee)}</div>
          <div className="text-[10px] text-muted">perçue : {formatEUR(stats.commissionPercue)}</div>
        </div>
      </div>

      {/* Filtres & actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === "all" ? "bg-navy text-white" : "bg-card border border-card-border text-slate"}`}>
            Tous ({mandates.length})
          </button>
          {STATUS_ORDER.map((s) => {
            const count = mandates.filter((m) => m.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === s ? "bg-navy text-white" : "bg-card border border-card-border text-slate"}`}>
                {STATUS_LABELS[s]} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const active = mandates.filter((m) =>
                ["mandat_signe","diffuse","en_visite","offre_recue","sous_compromis"].includes(m.status));
              const csv = buildPortalCsv(active);
              const stamp = new Date().toLocaleDateString("fr-LU").replace(/\//g, "-");
              downloadBlob(csv, `mandats-export-portails-${stamp}.csv`, "text/csv;charset=utf-8;");
            }}
            disabled={mandates.length === 0}
            className="rounded-lg border border-navy bg-white px-3 py-2 text-sm font-semibold text-navy hover:bg-navy/5 disabled:opacity-50"
            title="Export CSV compatible athome.lu / Immotop / Immoweb"
          >
            ↓ CSV portails
          </button>
          <button
            onClick={() => {
              const active = mandates.filter((m) =>
                ["mandat_signe","diffuse","en_visite","offre_recue","sous_compromis"].includes(m.status));
              const xml = buildOpenImmoXml(active, {
                firmenname: "Agence",
                openimmo_anid: user?.id ?? "tevaxia",
                lang: "fr",
                email_zentrale: user?.email ?? "",
              });
              const stamp = new Date().toLocaleDateString("fr-LU").replace(/\//g, "-");
              downloadBlob(xml, `mandats-openimmo-${stamp}.xml`, "application/xml;charset=utf-8");
            }}
            disabled={mandates.length === 0}
            className="rounded-lg border border-navy bg-white px-3 py-2 text-sm font-semibold text-navy hover:bg-navy/5 disabled:opacity-50"
            title="Export OpenImmo v1.2.7 — standard européen accepté par athome / Immotop / Immoweb"
          >
            ↓ OpenImmo
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {showForm ? "Annuler" : "+ Nouveau mandat"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-navy/20 bg-navy/5 p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Adresse du bien *</div>
              <input type="text" value={form.property_address ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, property_address: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Commune</div>
              <input type="text" value={form.property_commune ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, property_commune: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Type</div>
              <select value={form.property_type ?? "appartement"}
                onChange={(e) => setForm((f) => ({ ...f, property_type: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="terrain">Terrain</option>
                <option value="commercial">Commercial</option>
              </select>
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Prix demandé (€)</div>
              <input type="number" value={form.prix_demande ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, prix_demande: Number(e.target.value) || null }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Commission %</div>
              <input type="number" value={form.commission_pct ?? ""} step={0.5}
                onChange={(e) => setForm((f) => ({ ...f, commission_pct: Number(e.target.value) || null }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Type de mandat</div>
              <select value={form.mandate_type ?? "simple"}
                onChange={(e) => setForm((f) => ({ ...f, mandate_type: e.target.value as MandateType }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                {(Object.entries(TYPE_LABELS) as [MandateType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Client</div>
              <input type="text" value={form.client_name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Email client</div>
              <input type="email" value={form.client_email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Début mandat</div>
              <input type="date" value={form.start_date ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Fin mandat</div>
              <input type="date" value={form.end_date ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
          </div>
          <button onClick={handleCreate}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            Créer
          </button>
        </div>
      )}

      {/* Table des mandats */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          Aucun mandat {filter !== "all" ? `avec statut ${STATUS_LABELS[filter]}` : ""}.
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-card-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background/60">
                <th className="px-3 py-3 text-left font-semibold text-navy">Bien</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">Client</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">Prix</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">Comm.</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">Mandat</th>
                <th className="px-3 py-3 text-center font-semibold text-navy">Statut</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">Fin</th>
                <th className="px-3 py-3 text-right font-semibold text-navy"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const daysRemaining = mandateDaysRemaining(m.end_date);
                const expireSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 30
                  && ["mandat_signe", "sous_compromis"].includes(m.status);
                return (
                  <tr key={m.id} className="border-b border-card-border/40 hover:bg-background/40">
                    <td className="px-3 py-3">
                      <Link href={`/pro-agences/mandats/${m.id}`}
                        className="font-medium text-navy hover:underline">
                        {m.property_address}
                      </Link>
                      <div className="text-[10px] text-muted">
                        {m.property_commune ?? "—"} · {m.property_type ?? "—"}
                        {m.is_published && <span className="ml-1 text-emerald-700">· publié</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {m.client_name ?? "—"}
                      {m.client_email && <div className="text-[10px] text-muted">{m.client_email}</div>}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">
                      {m.prix_demande ? formatEUR(m.prix_demande) : "—"}
                      {m.sold_price && <div className="text-[10px] text-emerald-700">Vendu : {formatEUR(m.sold_price)}</div>}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">
                      {m.commission_amount_estimee ? formatEUR(m.commission_amount_estimee) : "—"}
                      {m.commission_pct && <div className="text-[9px] text-muted">{m.commission_pct}%</div>}
                    </td>
                    <td className="px-3 py-3 text-xs">{TYPE_LABELS[m.mandate_type]}</td>
                    <td className="px-3 py-3 text-center">
                      <select value={m.status} onChange={(e) => handleStatusChange(m, e.target.value as MandateStatus)}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${STATUS_COLORS[m.status]}`}>
                        {STATUS_ORDER.map((s) => (<option key={s} value={s}>{STATUS_LABELS[s]}</option>))}
                      </select>
                    </td>
                    <td className={`px-3 py-3 text-xs font-mono ${expireSoon ? "text-amber-700 font-semibold" : "text-muted"}`}>
                      {fmtDate(m.end_date)}
                      {expireSoon && <div className="text-[9px]">dans {daysRemaining}j</div>}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => handleDelete(m.id)} className="text-xs text-rose-700 hover:underline">
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Cadre légal :</strong> loi du 28 décembre 1988 réglementant l&apos;accès aux professions immobilières
        et règlement grand-ducal du 4 juillet 2000. Mandat exclusif : 3 mois minimum, renouvelable tacitement
        avec préavis. Mandat simple : plusieurs agences possibles. Mention obligatoire du taux de commission
        et du prix demandé.
      </div>
    </div>
  );
}
