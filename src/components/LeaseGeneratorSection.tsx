"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import LeasePdf from "@/components/LeasePdf";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await pdf(
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
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = lot.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      a.download = `bail-${safeName}-${leaseStart}.pdf`;
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

          {error && <p className="sm:col-span-2 text-xs text-rose-700">{error}</p>}

          <div className="sm:col-span-2 flex justify-end">
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
