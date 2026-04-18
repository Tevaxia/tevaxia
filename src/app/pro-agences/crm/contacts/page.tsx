"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  listContacts, createContact, deleteContact, type CrmContact,
  contactDisplayName, type CrmContactKind,
} from "@/lib/crm";
import { errMsg } from "@/lib/errors";
import { formatEUR } from "@/lib/calculations";

const KIND_LABEL: Record<CrmContactKind, string> = {
  prospect: "Prospect", lead: "Lead", acquereur: "Acquéreur", vendeur: "Vendeur",
  bailleur: "Bailleur", locataire: "Locataire", partenaire: "Partenaire", autre: "Autre",
};

export default function ContactsPage() {
  const { user, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState<CrmContactKind | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    kind: "prospect" as CrmContactKind,
    is_company: false,
    first_name: "", last_name: "", company_name: "",
    email: "", phone: "",
    budget_min: "", budget_max: "",
    tags: "",
  });

  const reload = useCallback(async () => {
    const list = await listContacts({
      search: search || undefined,
      kind: filterKind === "all" ? undefined : filterKind,
    });
    setContacts(list);
    setLoading(false);
  }, [search, filterKind]);

  useEffect(() => {
    if (authLoading || !user) return;
    void reload();
  }, [user, authLoading, reload]);

  const handleCreate = async () => {
    if (form.is_company) {
      if (!form.company_name.trim()) { setError("Nom société requis"); return; }
    } else {
      if (!form.first_name.trim() && !form.last_name.trim()) { setError("Nom ou prénom requis"); return; }
    }
    try {
      await createContact({
        kind: form.kind,
        is_company: form.is_company,
        first_name: form.is_company ? null : (form.first_name.trim() || null),
        last_name: form.is_company ? null : (form.last_name.trim() || null),
        company_name: form.is_company ? form.company_name.trim() : null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setForm({ kind: "prospect", is_company: false, first_name: "", last_name: "", company_name: "", email: "", phone: "", budget_min: "", budget_max: "", tags: "" });
      setShowForm(false);
      setError(null);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleDelete = async (c: CrmContact) => {
    if (!confirm(`Supprimer ${contactDisplayName(c)} ?`)) return;
    try {
      await deleteContact(c.id);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">Connectez-vous</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <Link href="/pro-agences/crm" className="text-xs text-muted hover:text-navy">← CRM</Link>
      <div className="mt-1 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Contacts</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              // Export CSV des contacts actuellement affichés (filtrés)
              if (contacts.length === 0) return;
              const header = [
                "Catégorie", "Type", "Prénom", "Nom", "Société",
                "Email", "Téléphone", "Adresse", "CP", "Ville", "Pays",
                "Budget_min", "Budget_max",
                "Surface_min", "Surface_max", "Zones", "Tags", "Notes",
                "Marketing_OK", "Créé_le", "Modifié_le",
              ];
              const rows = contacts.map((c) => [
                KIND_LABEL[c.kind] ?? c.kind,
                c.is_company ? "Société" : "Particulier",
                c.first_name ?? "", c.last_name ?? "", c.company_name ?? "",
                c.email ?? "", c.phone ?? "",
                c.address ?? "", c.postal_code ?? "", c.city ?? "", c.country ?? "",
                c.budget_min ?? "", c.budget_max ?? "",
                c.target_surface_min ?? "", c.target_surface_max ?? "",
                (c.target_zones ?? []).join(";"), (c.tags ?? []).join(";"),
                (c.notes ?? "").replace(/[\r\n]+/g, " "),
                c.marketing_opt_in ? "oui" : "non",
                c.created_at, c.updated_at,
              ]);
              const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
              const csv = "\uFEFF" +
                [header.map(esc).join(";")]
                  .concat(rows.map((r) => r.map(esc).join(";")))
                  .join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={contacts.length === 0}
            className="rounded-md border border-navy bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 disabled:opacity-50"
            title="Export CSV conforme RGPD — portabilité des données"
          >
            ↓ Export CSV
          </button>
          <Link
            href="/pro-agences/crm/templates"
            className="rounded-md border border-card-border bg-background px-3 py-1.5 text-xs font-semibold text-slate hover:border-navy"
          >
            📧 Templates email
          </Link>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light"
          >
            {showForm ? "Fermer" : "+ Nouveau contact"}
          </button>
        </div>
      </div>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      {showForm && (
        <section className="mt-4 rounded-xl border border-card-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="text-muted">Catégorie</span>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as CrmContactKind })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm">
                {(Object.keys(KIND_LABEL) as CrmContactKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
            </label>
            <label className="text-xs flex items-end gap-2">
              <input type="checkbox" checked={form.is_company} onChange={(e) => setForm({ ...form, is_company: e.target.checked })} />
              <span>Personne morale (société)</span>
            </label>
            {form.is_company ? (
              <label className="text-xs sm:col-span-2">
                <span className="text-muted">Nom société *</span>
                <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
              </label>
            ) : (
              <>
                <label className="text-xs">
                  <span className="text-muted">Prénom</span>
                  <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
                </label>
                <label className="text-xs">
                  <span className="text-muted">Nom</span>
                  <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
                </label>
              </>
            )}
            <label className="text-xs">
              <span className="text-muted">Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs">
              <span className="text-muted">Téléphone</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs">
              <span className="text-muted">Budget min €</span>
              <input type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs">
              <span className="text-muted">Budget max €</span>
              <input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="text-muted">Tags (séparés par virgules)</span>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="ex. VIP, premier achat, anglophone"
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-md border border-card-border px-3 py-1.5 text-xs text-slate hover:border-navy">Annuler</button>
            <button type="button" onClick={handleCreate}
              className="rounded-md bg-navy px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">Créer</button>
          </div>
        </section>
      )}

      {/* Search + filter */}
      <div className="mt-5 flex items-center gap-2 flex-wrap">
        <input
          placeholder="Rechercher (nom, email, société…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] max-w-md rounded-md border border-card-border bg-background px-3 py-1.5 text-xs"
        />
        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value as CrmContactKind | "all")}
          className="rounded-md border border-card-border bg-background px-2 py-1.5 text-xs"
        >
          <option value="all">Toutes catégories</option>
          {(Object.keys(KIND_LABEL) as CrmContactKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
        <span className="text-[11px] text-muted">{contacts.length} contact(s)</span>
      </div>

      <div className="mt-4 rounded-xl border border-card-border bg-card p-3">
        {contacts.length === 0 ? (
          <p className="p-4 text-xs text-muted italic">Aucun contact.</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-card-border">
                <th className="py-2 px-2 text-left font-medium text-muted">Nom</th>
                <th className="py-2 px-2 text-left font-medium text-muted">Catégorie</th>
                <th className="py-2 px-2 text-left font-medium text-muted">Contact</th>
                <th className="py-2 px-2 text-right font-medium text-muted">Budget</th>
                <th className="py-2 px-2 text-left font-medium text-muted">Tags</th>
                <th className="py-2 px-2 text-right font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-card-border/40 hover:bg-card/30">
                  <td className="py-2 px-2">
                    <Link href={`/pro-agences/crm/contacts/${c.id}`} className="font-semibold text-navy hover:underline">
                      {contactDisplayName(c)}
                    </Link>
                    {c.is_company && <span className="ml-2 text-[9px] text-muted">SOCIÉTÉ</span>}
                  </td>
                  <td className="py-2 px-2 text-[10px]">
                    <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 uppercase tracking-wider">{KIND_LABEL[c.kind]}</span>
                  </td>
                  <td className="py-2 px-2">
                    <div className="text-[11px]">{c.email ?? "—"}</div>
                    <div className="text-[10px] text-muted">{c.phone ?? ""}</div>
                  </td>
                  <td className="py-2 px-2 text-right font-mono">
                    {(c.budget_min || c.budget_max)
                      ? `${c.budget_min ? formatEUR(Number(c.budget_min)) : "—"} → ${c.budget_max ? formatEUR(Number(c.budget_max)) : "—"}`
                      : "—"}
                  </td>
                  <td className="py-2 px-2">
                    {c.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="mr-1 rounded-full bg-amber-50 text-amber-900 px-1.5 py-0.5 text-[9px] ring-1 ring-amber-100">{tag}</span>
                    ))}
                  </td>
                  <td className="py-2 px-2 text-right text-[11px]">
                    <Link href={`/pro-agences/crm/contacts/${c.id}`} className="text-navy hover:underline mr-2">Ouvrir</Link>
                    <button type="button" onClick={() => handleDelete(c)} className="text-rose-700 hover:underline">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
