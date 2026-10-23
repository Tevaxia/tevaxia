"use client";

import { useAuth } from "@/components/AuthProvider";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import LeasePdf from "@/components/LeasePdf";
import SignatureCanvas from "@/components/SignatureCanvas";
import type { RentalLot } from "@/lib/gestion-locative";
import { getProfile, defaultProfile } from "@/lib/profile";
import { errMsg } from "@/lib/errors";
import { leaseChecksum, validateLeaseDraft } from "@/lib/lease-document";

interface Props {
  lot: RentalLot;
}

export default function LeaseGeneratorSection({ lot }: Props) {
  const t = useTranslations("leaseDraft");
  const { user } = useAuth();
  let profile;
  try {profile=getProfile(user?.id ?? null);} catch {profile=defaultProfile();}
  const [open, setOpen] = useState(false);
  const [tenantName, setTenantName] = useState(lot.tenantName ?? "");
  const [tenantAddress, setTenantAddress] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantBirthDate, setTenantBirthDate] = useState("");
  const [leaseStart, setLeaseStart] = useState(lot.leaseStartDate ?? new Date().toISOString().slice(0, 10));
  const [leaseEnd, setLeaseEnd] = useState(lot.leaseEndDate ?? "");
  const [duration, setDuration] = useState("durée indéterminée");
  const [deposit, setDeposit] = useState(lot.loyerMensuelActuel * 2);
  const [conclusionDate, setConclusionDate] = useState(new Date().toISOString().slice(0, 10));
  const [landlordName, setLandlordName] = useState(profile.nomComplet ?? "");
  const [landlordAddress, setLandlordAddress] = useState(profile.adresse ?? "");
  const [cadastralReference, setCadastralReference] = useState("");
  const [premisesDescription, setPremisesDescription] = useState("");
  const [furnitureSupplement, setFurnitureSupplement] = useState(0);
  const [chargesType, setChargesType] = useState<"advance" | "fixed">("advance");
  const [rentConfirmed, setRentConfirmed] = useState(false);
  const [sigLandlord, setSigLandlord] = useState<string | null>(null);
  const [sigTenant, setSigTenant] = useState<string | null>(null);
  const [signedAtLandlord, setSignedAtLandlord] = useState<string | null>(null);
  const [signedAtTenant, setSignedAtTenant] = useState<string | null>(null);
  const [checksum, setChecksum] = useState<{ text: string; fileName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function download(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    try { document.body.appendChild(a); a.click(); }
    finally { a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60_000); }
  }

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setChecksum(null);
    try {
      const profile=getProfile(user?.id ?? null);
      const errors = validateLeaseDraft({ landlordName, landlordAddress, tenantName, tenantAddress,
        propertyAddress: lot.address ?? "", cadastralReference, premisesDescription, conclusionDate,
        leaseStart, leaseEnd, duration, monthlyRent: lot.loyerMensuelActuel,
        monthlyCharges: lot.chargesMensuelles, deposit, furnished: lot.estMeuble, furnitureSupplement });
      if (errors.length) throw new Error(errors.join(" "));
      // Render exactly once. The external checksum covers these final bytes.
      const finalBlob = await pdf(
        <LeasePdf
          lot={lot}
          landlord={{
            name: landlordName.trim(),
            address: landlordAddress.trim(),
            email: profile.email,
            phone: profile.telephone,
          }}
          tenant={{
            name: tenantName.trim(),
            address: tenantAddress,
            email: tenantEmail,
            birthDate: tenantBirthDate,
          }}
          leaseStart={leaseStart}
          leaseEndOrDuration={leaseEnd || duration}
          deposit={deposit}
          conclusionDate={conclusionDate}
          cadastralReference={cadastralReference}
          premisesDescription={premisesDescription}
          furnitureSupplement={furnitureSupplement}
          chargesType={chargesType}
          rentConfirmed={rentConfirmed}
          signatureLandlord={sigLandlord}
          signatureTenant={sigTenant}
          signedAtLandlord={signedAtLandlord}
          signedAtTenant={signedAtTenant}
        />
      ).toBlob();

      const safeName = lot.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "logement";
      const fileName = `projet-bail-${safeName}-${leaseStart}.pdf`;
      const text = await leaseChecksum(finalBlob, fileName);
      download(finalBlob, fileName);
      setChecksum({ text, fileName: `${fileName}.sha256` });
    } catch (e) {
      setError(errMsg(e, "Erreur de génération"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">{t("title")}</h3>
          <p className="mt-1 text-xs text-muted">{t("notice")}</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50"
        >
          {open ? t("close") : t("open")}
        </button>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2" onChange={() => { setSigLandlord(null); setSigTenant(null); setSignedAtLandlord(null); setSignedAtTenant(null); setChecksum(null); }}>
          <label className="text-xs text-muted">Nom complet du bailleur
            <input value={landlordName} onChange={e => setLandlordName(e.target.value)} className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-muted">Adresse du bailleur
            <input value={landlordAddress} onChange={e => setLandlordAddress(e.target.value)} className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-muted">Référence cadastrale du logement
            <input value={cadastralReference} onChange={e => setCadastralReference(e.target.value)} className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-muted">Pièces, parties d’immeuble et annexes louées
            <textarea value={premisesDescription} onChange={e => setPremisesDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          </label>
          <p className="sm:col-span-2 text-xs text-muted">Adresse du logement : {lot.address || "À compléter dans la fiche du lot avant génération."}</p>
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
            <label className="block text-xs text-muted mb-2">Date de conclusion prévue
              <input type="date" min="2024-08-01" value={conclusionDate} onChange={e => setConclusionDate(e.target.value)} className="ml-2 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
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
            <label className="block text-xs text-muted mb-1">Garantie locative (€) — maximum 2 mois hors charges</label>
            <input type="number" min="0" max={2 * lot.loyerMensuelActuel} step="0.01" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Régime des charges</label>
            <select value={chargesType} onChange={e => setChargesType(e.target.value as "advance" | "fixed")} className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
              <option value="advance">Acomptes avec décompte annuel</option><option value="fixed">Forfait convenu</option>
            </select>
          </div>
          {lot.estMeuble && <label className="text-xs text-muted">Supplément mobilier mensuel, inclus dans le loyer hors charges (€)
            <input type="number" min="0" max={lot.loyerMensuelActuel} step="0.01" value={furnitureSupplement} onChange={e => setFurnitureSupplement(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            À justifier avec l’inventaire et les factures du mobilier éligible.
          </label>}
          <label className="sm:col-span-2 flex items-start gap-2 text-xs text-muted">
            <input type="checkbox" checked={rentConfirmed} onChange={e => setRentConfirmed(e.target.checked)} />
            En qualité de bailleur, je déclare avoir vérifié et pouvoir justifier le respect du plafond légal du loyer, ainsi que du supplément mobilier le cas échéant. Cette déclaration sera reproduite ; Tevaxia ne la vérifie pas. Sinon, le projet indiquera que cette vérification reste à faire.
          </label>

          <div className="sm:col-span-2 border-t border-card-border pt-4 mt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Tracés de signature (optionnel)
            </div>
            <p className="text-xs text-muted mb-3">
              Les tracés saisis sur cet écran sont insérés comme images. L’identité des signataires et l’heure ne sont pas certifiées. Une empreinte externe permet de comparer le PDF téléchargé à une copie ; elle ne prouve ni l’identité ni l’accord des parties. Laissez vide pour faire relire et signer le projet séparément.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <SignatureCanvas
                label={`Signature bailleur — ${landlordName || "vous"}`}
                value={sigLandlord}
                onChange={value => { setSigLandlord(value); setSignedAtLandlord(value ? new Date().toISOString() : null); }}
              />
              <SignatureCanvas
                label={`Signature locataire${tenantName ? ` — ${tenantName}` : ""}`}
                value={sigTenant}
                onChange={value => { setSigTenant(value); setSignedAtTenant(value ? new Date().toISOString() : null); }}
              />
            </div>
          </div>

          {error && <p className="sm:col-span-2 text-xs text-rose-700">{error}</p>}

          <div className="sm:col-span-2 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {sigLandlord && sigTenant
                ? "Deux tracés seront insérés dans le projet."
                : sigLandlord || sigTenant
                  ? "Un seul tracé sera inséré dans le projet."
                  : "Projet sans tracé de signature."}
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading || !tenantName.trim()}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-40"
            >
              {loading ? "Génération…" : "Télécharger le projet (PDF)"}
            </button>
          </div>
          {checksum && <div className="sm:col-span-2 text-xs text-muted">
            <button type="button" className="underline" onClick={() => download(new Blob([checksum.text], { type: "text/plain" }), checksum.fileName)}>Télécharger l’empreinte du PDF généré (.sha256)</button>
            <p>Conservez ce fichier séparément avec le PDF. Comparez son empreinte à un SHA-256 calculé sur le fichier PDF final, sans le réenregistrer. Une empreinte seule n’est pas une signature électronique certifiée.</p>
          </div>}
        </div>
      )}
    </div>
  );
}
