"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  listMyKycCases, createKycCase, closeKycCase,
  listArchivesForCase, uploadKycArchive, getKycSignedUrl,
  type KycCase, type KycArchive, type KycDocumentType, type KycRiskLevel,
} from "@/lib/kyc-archives";

const DOC_LABELS: Record<KycDocumentType, string> = {
  id_document: "Pièce d'identité",
  proof_of_address: "Justificatif de domicile",
  beneficial_owner: "Bénéficiaire effectif (UBO)",
  source_of_funds: "Origine des fonds",
  source_of_wealth: "Origine du patrimoine",
  pep_declaration: "Déclaration PEP",
  sanctions_screening: "Filtrage sanctions",
  risk_assessment: "Évaluation des risques",
  business_relationship: "Contrat / accord",
  correspondence: "Correspondance",
  suspicious_activity: "Déclaration de soupçon CRF",
  autre: "Autre",
};

const RISK_COLORS: Record<KycRiskLevel, string> = {
  faible: "bg-emerald-100 text-emerald-800",
  standard: "bg-blue-100 text-blue-800",
  eleve: "bg-amber-100 text-amber-900",
  tres_eleve: "bg-rose-100 text-rose-900",
};

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-LU", { year: "numeric", month: "short", day: "numeric" });
}
function fmtSize(b: number | null): string {
  if (!b) return "—";
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`;
  return `${(b / 1024 / 1024).toFixed(1)} Mo`;
}

export default function KycArchivesPage() {
  const { user, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<KycCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<KycCase | null>(null);
  const [archives, setArchives] = useState<KycArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewCase, setShowNewCase] = useState(false);
  const [caseForm, setCaseForm] = useState({
    counterparty_name: "",
    counterparty_type: "personne_physique" as "personne_physique" | "personne_morale",
    counterparty_ref: "",
    risk_level: "standard" as KycRiskLevel,
    notes: "",
  });

  const [showUpload, setShowUpload] = useState(false);
  const [docForm, setDocForm] = useState({ documentType: "id_document" as KycDocumentType, title: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const reloadCases = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await listMyKycCases();
    setCases(list);
    setLoading(false);
  }, [user]);

  useEffect(() => { void reloadCases(); }, [reloadCases]);

  useEffect(() => {
    if (!selectedCase) return;
    void listArchivesForCase(selectedCase.id).then(setArchives);
  }, [selectedCase]);

  const handleCreateCase = async () => {
    if (!caseForm.counterparty_name.trim()) {
      setError("Nom de contrepartie requis.");
      return;
    }
    try {
      const c = await createKycCase({
        counterparty_name: caseForm.counterparty_name,
        counterparty_type: caseForm.counterparty_type,
        counterparty_ref: caseForm.counterparty_ref || undefined,
        risk_level: caseForm.risk_level,
        notes: caseForm.notes || undefined,
      });
      setCaseForm({ counterparty_name: "", counterparty_type: "personne_physique", counterparty_ref: "", risk_level: "standard", notes: "" });
      setShowNewCase(false);
      setError(null);
      setSelectedCase(c);
      await reloadCases();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  };

  const handleCloseCase = async () => {
    if (!selectedCase) return;
    if (!confirm("Clôturer la relation d'affaires ? Les archives restent conservées 5 ans après.")) return;
    await closeKycCase(selectedCase.id, new Date().toISOString().slice(0, 10));
    await reloadCases();
    const updated = cases.find((c) => c.id === selectedCase.id);
    if (updated) setSelectedCase(updated);
  };

  const handleUpload = async () => {
    if (!selectedCase || !file || !docForm.title.trim()) {
      setError("Document et titre requis.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 20 Mo).");
      return;
    }
    setUploading(true);
    try {
      await uploadKycArchive({
        caseId: selectedCase.id,
        documentType: docForm.documentType,
        title: docForm.title,
        file,
      });
      setDocForm({ documentType: "id_document", title: "" });
      setFile(null);
      setShowUpload(false);
      setError(null);
      const list = await listArchivesForCase(selectedCase.id);
      setArchives(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUploading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Supabase + bucket &quot;aml-kyc&quot; requis (migration 038).
        </div>
      </div>
    );
  }

  if (authLoading || loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center">
      <Link href="/connexion" className="text-navy underline">Se connecter</Link> pour accéder aux archives KYC.
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href="/aml-kyc" className="text-xs text-muted hover:text-navy">← AML / KYC</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">Archivage KYC — conservation 5 ans</h1>
      <p className="mt-1 text-sm text-muted">
        Archivage des dossiers LBC-FT conforme loi du 12 novembre 2004 art. 3 §6 : conservation 5 ans après
        la fin de la relation d&apos;affaires. Fichiers chiffrés (AES-256) et immuables en DB.
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Liste des dossiers */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy">Dossiers ({cases.length})</h2>
            <button
              onClick={() => setShowNewCase(!showNewCase)}
              className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light"
            >
              {showNewCase ? "Annuler" : "+ Nouveau"}
            </button>
          </div>

          {showNewCase && (
            <div className="mb-4 rounded-xl border border-navy/20 bg-navy/5 p-4 space-y-3">
              <input type="text" value={caseForm.counterparty_name}
                onChange={(e) => setCaseForm((f) => ({ ...f, counterparty_name: e.target.value }))}
                placeholder="Nom contrepartie"
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <select value={caseForm.counterparty_type}
                onChange={(e) => setCaseForm((f) => ({ ...f, counterparty_type: e.target.value as "personne_physique" | "personne_morale" }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                <option value="personne_physique">Personne physique</option>
                <option value="personne_morale">Personne morale</option>
              </select>
              <input type="text" value={caseForm.counterparty_ref}
                onChange={(e) => setCaseForm((f) => ({ ...f, counterparty_ref: e.target.value }))}
                placeholder="NIF / RCS (optionnel)"
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <select value={caseForm.risk_level}
                onChange={(e) => setCaseForm((f) => ({ ...f, risk_level: e.target.value as KycRiskLevel }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                <option value="faible">Risque faible</option>
                <option value="standard">Standard</option>
                <option value="eleve">Élevé (EDD)</option>
                <option value="tres_eleve">Très élevé (PEP, haute exposition)</option>
              </select>
              <button onClick={handleCreateCase}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
                Créer
              </button>
            </div>
          )}

          <div className="space-y-2">
            {cases.length === 0 ? (
              <p className="text-xs text-muted italic">Aucun dossier. Créez-en un pour archiver les documents d&apos;une contrepartie.</p>
            ) : (
              cases.map((c) => (
                <button key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedCase?.id === c.id ? "border-navy bg-navy/10" : "border-card-border bg-card hover:border-navy/40"
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-navy truncate">{c.counterparty_name}</div>
                      <div className="text-[10px] text-muted">
                        {c.counterparty_type === "personne_physique" ? "Personne physique" : "Personne morale"}
                        {c.counterparty_ref && ` · ${c.counterparty_ref}`}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${RISK_COLORS[c.risk_level]}`}>
                      {c.risk_level}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-muted font-mono">
                    <span>Début : {fmtDate(c.relationship_start)}</span>
                    {c.relationship_end && <span className="text-amber-700">Clos : {fmtDate(c.relationship_end)}</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Archives du dossier sélectionné */}
        <div className="lg:col-span-2">
          {!selectedCase ? (
            <div className="rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
              Sélectionnez un dossier pour voir ses archives.
            </div>
          ) : (
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <h2 className="text-base font-semibold text-navy">{selectedCase.counterparty_name}</h2>
                  <p className="text-xs text-muted">
                    {archives.length} document(s) archivé(s) · risque {selectedCase.risk_level}
                    {selectedCase.relationship_end && ` · clos le ${fmtDate(selectedCase.relationship_end)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!selectedCase.relationship_end && (
                    <button onClick={handleCloseCase}
                      className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100">
                      Clôturer relation
                    </button>
                  )}
                  <button onClick={() => setShowUpload(!showUpload)}
                    className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
                    {showUpload ? "Annuler" : "+ Archiver"}
                  </button>
                </div>
              </div>

              {showUpload && (
                <div className="mb-4 rounded-lg border border-navy/20 bg-navy/5 p-4 space-y-3">
                  <select value={docForm.documentType}
                    onChange={(e) => setDocForm((f) => ({ ...f, documentType: e.target.value as KycDocumentType }))}
                    className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                    {(Object.entries(DOC_LABELS) as [KycDocumentType, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input type="text" value={docForm.title}
                    onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="ex. CNI recto-verso"
                    className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm" />
                  {file && <div className="text-[10px] text-muted">{file.name} · {fmtSize(file.size)}</div>}
                  <button onClick={handleUpload} disabled={uploading || !file || !docForm.title.trim()}
                    className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50">
                    {uploading ? "Upload…" : "Archiver (irréversible)"}
                  </button>
                </div>
              )}

              {archives.length === 0 ? (
                <p className="text-xs text-muted italic">Aucun document archivé.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-card-border bg-background">
                        <th className="px-3 py-2 text-left font-semibold text-navy">Type</th>
                        <th className="px-3 py-2 text-left font-semibold text-navy">Titre</th>
                        <th className="px-3 py-2 text-left font-semibold text-navy">Archivé</th>
                        <th className="px-3 py-2 text-left font-semibold text-navy">Conservé jusqu&apos;au</th>
                        <th className="px-3 py-2 text-right font-semibold text-navy"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {archives.map((a) => (
                        <tr key={a.id} className="border-b border-card-border/40">
                          <td className="px-3 py-2">
                            <span className="inline-block rounded-full bg-navy/10 px-2 py-0.5 text-[10px] text-navy">
                              {DOC_LABELS[a.document_type]}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{a.title}</div>
                            <div className="text-[9px] text-muted font-mono">SHA-256 {a.sha256.slice(0, 16)}…</div>
                          </td>
                          <td className="px-3 py-2 text-[10px] font-mono">{fmtDate(a.archived_at)}</td>
                          <td className="px-3 py-2 text-[10px] font-mono">{fmtDate(a.retention_until)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={async () => {
                                try {
                                  const url = await getKycSignedUrl(a.storage_path);
                                  window.open(url, "_blank");
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : "Erreur");
                                }
                              }}
                              className="text-xs text-navy hover:underline">
                              Télécharger
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Cadre légal :</strong> loi modifiée du 12 novembre 2004 relative à la lutte contre le
        blanchiment et le financement du terrorisme, art. 3 §6. Les archives sont conservées 5 ans après
        la fin de la relation d&apos;affaires. En cas de contrôle CSSF/CRF, elles doivent être immédiatement
        accessibles. Table immuable côté DB (trigger `kyc_archive_is_immutable`).
      </div>
    </div>
  );
}
