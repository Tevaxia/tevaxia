"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getMandate, type AgencyMandate } from "@/lib/agency-mandates";
import {
  listSignatureRequests, createSignatureRequest, markAsSent,
  cancelSignatureRequest, signingUrl, mailtoLink,
  STATUS_LABELS, STATUS_COLORS, DOCUMENT_TYPE_LABELS,
  type SignatureRequest, type SignatureDocumentType,
} from "@/lib/agency-signatures";
import { errMsg } from "@/lib/errors";

function defaultMandatBody(mandate: AgencyMandate): string {
  return `MANDAT DE VENTE ${mandate.mandate_type.toUpperCase()}

Entre les soussignés :
Le MANDANT : ${mandate.client_name ?? "[Nom du mandant]"}
représenté(e) par lui-même.

Et :
Le MANDATAIRE : Agence immobilière
agissant par l'intermédiaire d'un agent immobilier diplômé et enregistré
conformément à la loi du 28 décembre 1988 réglementant les professions
immobilières.

Il a été convenu et arrêté ce qui suit :

Article 1 — OBJET DU MANDAT
Le mandant confère au mandataire le mandat ${mandate.mandate_type} de vendre
le bien immobilier situé :
${mandate.property_address}
${mandate.property_commune ?? ""}
Type : ${mandate.property_type ?? "non précisé"}
Surface : ${mandate.property_surface ?? "—"} m²

Article 2 — PRIX DE VENTE
Le prix net vendeur est fixé à ${mandate.prix_demande ? mandate.prix_demande.toLocaleString("fr-LU") + " EUR" : "[à définir]"}.

Article 3 — COMMISSION
La commission du mandataire est fixée à ${mandate.commission_pct ?? "—"}% du prix de vente
TTC, à la charge de l'acquéreur, payable à la signature de l'acte authentique
devant notaire.

Article 4 — DURÉE
Le présent mandat est conclu pour une durée de ${mandate.start_date && mandate.end_date ? "jusqu'au " + new Date(mandate.end_date).toLocaleDateString("fr-LU") : "[durée à définir]"}.
${mandate.mandate_type === "exclusif" ? "En mandat exclusif, la durée minimale est de 3 mois conformément à la loi." : ""}

Article 5 — OBLIGATIONS DU MANDATAIRE
Le mandataire s'engage à :
- diffuser le bien sur les supports commerciaux appropriés
- rendre compte régulièrement au mandant
- respecter la confidentialité des informations transmises
- ne pas mélanger les fonds propres du mandant avec les siens

Article 6 — LOI APPLICABLE
Le présent mandat est régi par le droit luxembourgeois. Toute contestation
relève exclusivement des tribunaux de Luxembourg-Ville.

Fait à Luxembourg, le ${new Date().toLocaleDateString("fr-LU")}.`;
}

export default function SignaturesPage() {
  const params = useParams<{ id: string }>();
  const mandateId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const [mandate, setMandate] = useState<AgencyMandate | null>(null);
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    document_type: SignatureDocumentType;
    document_title: string;
    document_body: string;
    signer_name: string;
    signer_email: string;
    signer_phone: string;
    expires_in_days: number;
  }>({
    document_type: "mandat",
    document_title: "Mandat de vente",
    document_body: "",
    signer_name: "",
    signer_email: "",
    signer_phone: "",
    expires_in_days: 30,
  });

  const reload = useCallback(async () => {
    if (!mandateId) return;
    setLoading(true);
    try {
      const [m, r] = await Promise.all([
        getMandate(mandateId),
        listSignatureRequests({ mandateId }),
      ]);
      setMandate(m);
      setRequests(r);
      // Pré-remplir le document body depuis le mandat
      if (m && !form.document_body) {
        setForm((f) => ({
          ...f,
          signer_name: m.client_name ?? "",
          signer_email: m.client_email ?? "",
          document_title: `Mandat ${m.mandate_type} — ${m.property_address}`,
          document_body: defaultMandatBody(m),
        }));
      }
    } catch (e) {
      setError(errMsg(e, "Erreur"));
    }
    setLoading(false);
  }, [mandateId, form.document_body]);

  useEffect(() => { void reload(); }, [reload]);

  const handleCreate = async () => {
    if (!form.signer_name.trim() || !form.signer_email.trim()) {
      setError("Nom et email du signataire requis."); return;
    }
    if (!form.document_body.trim()) {
      setError("Corps du document vide."); return;
    }
    try {
      const req = await createSignatureRequest({
        mandate_id: mandateId ?? undefined,
        document_type: form.document_type,
        document_title: form.document_title,
        document_body: form.document_body,
        signer_name: form.signer_name,
        signer_email: form.signer_email,
        signer_phone: form.signer_phone || undefined,
        expires_in_days: form.expires_in_days,
      });
      await markAsSent(req.id);
      setShowForm(false);
      setFlash(`Demande créée. Copiez le lien et envoyez-le à ${req.signer_email}.`);
      setError(null);
      await reload();
    } catch (e) {
      setError(errMsg(e, "Erreur"));
    }
  };

  const copyLink = async (req: SignatureRequest) => {
    const url = signingUrl(req.token);
    try {
      await navigator.clipboard.writeText(url);
      setFlash(`Lien copié : ${url}`);
    } catch {
      setFlash(`Lien : ${url}`);
    }
  };

  const cancel = async (req: SignatureRequest) => {
    if (!confirm(`Annuler la demande envoyée à ${req.signer_email} ?`)) return;
    await cancelSignatureRequest(req.id);
    await reload();
  };

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  }
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">Se connecter</Link></div>;
  if (!mandate) return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">Mandat introuvable.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/pro-agences/mandats" className="hover:text-navy">Mandats</Link>
        <span>/</span>
        <Link href={`/pro-agences/mandats/${mandateId}`} className="hover:text-navy">{mandate.reference ?? mandate.id.slice(0, 8)}</Link>
        <span>/</span>
        <span className="text-navy">Signatures</span>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Signatures électroniques</h1>
          <p className="mt-1 text-sm text-muted">
            Workflow de signature en ligne conforme règlement UE 910/2014 (eIDAS).
            Niveau &laquo;&nbsp;signature électronique simple&nbsp;&raquo; — valide pour mandats
            commerciaux. Pour actes notariés, signature qualifiée LuxTrust requise (roadmap T5).
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
          {showForm ? "Annuler" : "+ Nouvelle signature"}
        </button>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}
      {flash && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{flash}</div>}

      {/* Formulaire */}
      {showForm && (
        <div className="mt-5 rounded-xl border border-navy/20 bg-navy/5 p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Type de document</div>
              <select value={form.document_type}
                onChange={(e) => setForm({ ...form, document_type: e.target.value as SignatureDocumentType })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                {(Object.entries(DOCUMENT_TYPE_LABELS) as [SignatureDocumentType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <label className="text-xs sm:col-span-2">
              <div className="mb-1 font-semibold text-slate">Titre</div>
              <input type="text" value={form.document_title}
                onChange={(e) => setForm({ ...form, document_title: e.target.value })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Nom signataire *</div>
              <input type="text" value={form.signer_name}
                onChange={(e) => setForm({ ...form, signer_name: e.target.value })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Email signataire *</div>
              <input type="email" value={form.signer_email}
                onChange={(e) => setForm({ ...form, signer_email: e.target.value })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Téléphone (optionnel)</div>
              <input type="tel" value={form.signer_phone}
                onChange={(e) => setForm({ ...form, signer_phone: e.target.value })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs sm:col-span-3">
              <div className="mb-1 font-semibold text-slate">Contenu du document</div>
              <textarea value={form.document_body}
                onChange={(e) => setForm({ ...form, document_body: e.target.value })}
                rows={16}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs font-mono" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Expire dans (jours)</div>
              <input type="number" value={form.expires_in_days} min={1} max={365}
                onChange={(e) => setForm({ ...form, expires_in_days: Number(e.target.value) })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
          </div>
          <button onClick={handleCreate}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Créer la demande et générer le lien
          </button>
        </div>
      )}

      {/* Liste */}
      {requests.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          Aucune demande de signature pour ce mandat.
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-card-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    <span className="text-sm font-semibold text-navy">{r.document_title}</span>
                    <span className="text-[10px] text-muted">
                      {DOCUMENT_TYPE_LABELS[r.document_type]}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {r.signer_name} · {r.signer_email}
                    {r.signer_phone && ` · ${r.signer_phone}`}
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-3 text-[10px] text-muted sm:grid-cols-4">
                    <span>Créée : {new Date(r.created_at).toLocaleDateString("fr-LU")}</span>
                    {r.sent_at && <span>Envoyée : {new Date(r.sent_at).toLocaleDateString("fr-LU")}</span>}
                    {r.first_viewed_at && <span>Vue : {new Date(r.first_viewed_at).toLocaleDateString("fr-LU")}</span>}
                    {r.signed_at && <span className="text-emerald-700 font-semibold">Signée : {new Date(r.signed_at).toLocaleDateString("fr-LU")}</span>}
                    <span>Expire : {new Date(r.expires_at).toLocaleDateString("fr-LU")}</span>
                  </div>
                  {r.signer_ip && (
                    <div className="mt-2 rounded bg-background px-2 py-1 text-[10px] font-mono text-muted">
                      🔒 Preuve : IP {r.signer_ip} · {r.signer_user_agent?.slice(0, 50) ?? "—"}
                    </div>
                  )}
                  {r.declined_reason && (
                    <div className="mt-2 rounded bg-rose-50 px-2 py-1 text-[11px] text-rose-900">
                      Motif refus : {r.declined_reason}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {["draft", "sent", "viewed"].includes(r.status) && (
                    <>
                      <button onClick={() => copyLink(r)}
                        className="rounded-lg border border-navy bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5">
                        📋 Copier lien
                      </button>
                      <a href={mailtoLink(r)}
                        className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
                        📧 Email
                      </a>
                      <button onClick={() => cancel(r)}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                        Annuler
                      </button>
                    </>
                  )}
                  <a href={signingUrl(r.token)} target="_blank" rel="noopener noreferrer"
                    className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-semibold text-slate hover:bg-background">
                    Ouvrir
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Preuve eIDAS conservée :</strong> à la signature, la plateforme enregistre l&apos;adresse IP,
        le navigateur, le fuseau horaire et l&apos;horodatage serveur, le tout rendu immuable par un trigger
        DB. Le document est identifié par son hash SHA-256 — toute modification ultérieure invalide la
        signature et déclenche une alerte.
      </div>
    </div>
  );
}
