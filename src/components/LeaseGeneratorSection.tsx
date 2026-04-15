"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import LeasePdf from "@/components/LeasePdf";
import SignatureCanvas from "@/components/SignatureCanvas";
import type { RentalLot } from "@/lib/gestion-locative";
import { getProfile } from "@/lib/profile";

interface Props {
  lot: RentalLot;
}

export default function LeaseGeneratorSection({ lot }: Props) {
  const profile = getProfile();
  const [open, setOpen] = useState(false);
  const [tenantName, setTenantName] = useState(lot.tenantName ?? "");
  const [tenantAddress, setTenantAddress] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantBirthDate, setTenantBirthDate] = useState("");
  const [leaseStart, setLeaseStart] = useState(lot.leaseStartDate ?? new Date().toISOString().slice(0, 10));
  const [leaseEnd, setLeaseEnd] = useState(lot.leaseEndDate ?? "");
  const [duration, setDuration] = useState("durée indéterminée");
  const [deposit, setDeposit] = useState(lot.loyerMensuelActuel * 2);
  const [indexation, setIndexation] = useState("Indice des prix à la consommation (STATEC)");
  const [sigLandlord, setSigLandlord] = useState<string | null>(null);
  const [sigTenant, setSigTenant] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sha256Hex(blob: Blob): Promise<string> {
    const buf = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const landlordSigned = sigLandlord ? new Date().toISOString() : null;
      const tenantSigned = sigTenant ? new Date().toISOString() : null;

      // Premier rendu sans hash pour obtenir les bytes, puis calcul du hash,
      // puis second rendu avec le hash embarqué dans le PDF.
      const firstBlob = await pdf(
        <LeasePdf
          lot={lot}
          landlord={{
            name: profile.nomComplet || "Bailleur",
            address: profile.adresse,
            email: profile.email,
            phone: profile.telephone,
          }}
          tenant={{
            name: tenantName || "Locataire",
            address: tenantAddress,
            email: tenantEmail,
            birthDate: tenantBirthDate,
          }}
          leaseStart={leaseStart}
          leaseEndOrDuration={leaseEnd || duration}
          deposit={deposit}
          indexationReference={indexation}
          signatureLandlord={sigLandlord}
          signatureTenant={sigTenant}
          signedAtLandlord={landlordSigned}
          signedAtTenant={tenantSigned}
        />
      ).toBlob();

      const hash = await sha256Hex(firstBlob);

      const finalBlob = await pdf(
        <LeasePdf
          lot={lot}
          landlord={{
            name: profile.nomComplet || "Bailleur",
            address: profile.adresse,
            email: profile.email,
            phone: profile.telephone,
          }}
          tenant={{
            name: tenantName || "Locataire",
            address: tenantAddress,
            email: tenantEmail,
            birthDate: tenantBirthDate,
          }}
          leaseStart={leaseStart}
          leaseEndOrDuration={leaseEnd || duration}
          deposit={deposit}
          indexationReference={indexation}
          signatureLandlord={sigLandlord}
          signatureTenant={sigTenant}
          signedAtLandlord={landlordSigned}
          signedAtTenant={tenantSigned}
          pdfHash={hash}
        />
      ).toBlob();

      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = lot.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const suffix = sigLandlord && sigTenant ? "signe" : "draft";
      a.download = `bail-${safeName}-${leaseStart}-${suffix}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Générer un bail</h3>
          <p className="mt-1 text-xs text-muted">Template PDF conforme à la loi modifiée du 21 septembre 2006 sur le bail d&apos;habitation LU.</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50"
        >
          {open ? "Fermer" : "Ouvrir"}
        </button>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Locataire</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="text" placeholder="Nom complet" value={tenantName} onChange={(e) => setTenantName(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="text" placeholder="Adresse actuelle" value={tenantAddress} onChange={(e) => setTenantAddress(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="email" placeholder="Email" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="text" placeholder="Date de naissance (JJ/MM/AAAA)" value={tenantBirthDate} onChange={(e) => setTenantBirthDate(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Durée</div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-muted mb-1">Date de début</label>
                <input type="date" value={leaseStart} onChange={(e) => setLeaseStart(e.target.value)}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Date de fin (optionnelle)</label>
                <input type="date" value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Ou durée libre</label>
                <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="durée indéterminée, 3 ans…"
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">Garantie locative (€) — max 3 mois</label>
            <input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Référence d&apos;indexation</label>
            <input type="text" value={indexation} onChange={(e) => setIndexation(e.target.value)}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          </div>

          <div className="sm:col-span-2 border-t border-card-border pt-4 mt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Signatures électroniques (optionnel)
            </div>
            <p className="text-xs text-muted mb-3">
              Les deux parties peuvent signer directement sur ce même écran (réunion physique). Le PDF généré
              intègrera les signatures + une empreinte SHA-256 comme preuve d&apos;intégrité (signature simple
              au sens eIDAS art. 25). Laissez vide pour télécharger un bail non signé à imprimer.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <SignatureCanvas
                label={`Signature bailleur — ${profile.nomComplet || "vous"}`}
                value={sigLandlord}
                onChange={setSigLandlord}
              />
              <SignatureCanvas
                label={`Signature locataire${tenantName ? ` — ${tenantName}` : ""}`}
                value={sigTenant}
                onChange={setSigTenant}
              />
            </div>
          </div>

          {error && <p className="sm:col-span-2 text-xs text-rose-700">{error}</p>}

          <div className="sm:col-span-2 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {sigLandlord && sigTenant
                ? "Bail signé par les 2 parties — empreinte SHA-256 incluse au PDF."
                : sigLandlord || sigTenant
                  ? "Seule 1 partie a signé — le PDF sera partiellement signé."
                  : "Aucune signature — PDF à imprimer pour signature manuscrite."}
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading || !tenantName.trim()}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-40"
            >
              {loading ? "Génération…" : "Télécharger le bail (PDF)"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
