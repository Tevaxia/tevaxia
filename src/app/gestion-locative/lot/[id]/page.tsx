"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import InputField from "@/components/InputField";
import LeaseGeneratorSection from "@/components/LeaseGeneratorSection";
import { analyzeLot, getLot, saveLot, type EnergyClass, type RentalLot } from "@/lib/gestion-locative";
import { formatEUR, formatPct } from "@/lib/calculations";

const ENERGY_CLASSES: Array<{ value: EnergyClass; label: string }> = [
  { value: "A", label: "A — Très performant" },
  { value: "B", label: "B — Performant" },
  { value: "C", label: "C — Correct" },
  { value: "D", label: "D — Moyen" },
  { value: "E", label: "E — Peu performant" },
  { value: "F", label: "F — Mauvais" },
  { value: "G", label: "G — Très mauvais" },
  { value: "NC", label: "Non classé" },
];

export default function LotEditPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const id = String(params?.id ?? "");
  const isNew = id === "nouveau";
  const currentYear = new Date().getFullYear();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [commune, setCommune] = useState("");
  const [surface, setSurface] = useState(80);
  const [nbChambres, setNbChambres] = useState(2);
  const [classeEnergie, setClasseEnergie] = useState<EnergyClass>("D");
  const [estMeuble, setEstMeuble] = useState(false);

  const [prixAcquisition, setPrixAcquisition] = useState(500000);
  const [anneeAcquisition, setAnneeAcquisition] = useState(currentYear - 5);
  const [travauxMontant, setTravauxMontant] = useState(0);
  const [travauxAnnee, setTravauxAnnee] = useState(currentYear - 5);

  const [loyerMensuelActuel, setLoyerMensuelActuel] = useState(1800);
  const [chargesMensuelles, setChargesMensuelles] = useState(150);
  const [vacant, setVacant] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [leaseStartDate, setLeaseStartDate] = useState("");
  const [leaseEndDate, setLeaseEndDate] = useState("");

  const [existing, setExisting] = useState<RentalLot | null>(null);

  useEffect(() => {
    if (isNew) return;
    const lot = getLot(id);
    if (!lot) {
      router.replace(`${lp}/gestion-locative/portefeuille`);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExisting(lot);
    setName(lot.name);
    setAddress(lot.address ?? "");
    setCommune(lot.commune ?? "");
    setSurface(lot.surface);
    setNbChambres(lot.nbChambres ?? 2);
    setClasseEnergie(lot.classeEnergie);
    setEstMeuble(lot.estMeuble);
    setPrixAcquisition(lot.prixAcquisition);
    setAnneeAcquisition(lot.anneeAcquisition);
    setTravauxMontant(lot.travauxMontant);
    setTravauxAnnee(lot.travauxAnnee);
    setLoyerMensuelActuel(lot.loyerMensuelActuel);
    setChargesMensuelles(lot.chargesMensuelles);
    setVacant(lot.vacant);
    setTenantName(lot.tenantName ?? "");
    setLeaseStartDate(lot.leaseStartDate ?? "");
    setLeaseEndDate(lot.leaseEndDate ?? "");
  }, [id, isNew, lp, router]);

  const previewLot: RentalLot = useMemo(
    () => ({
      id: existing?.id ?? "preview",
      name: name || "Nouveau lot",
      address,
      commune,
      surface,
      nbChambres,
      classeEnergie,
      estMeuble,
      prixAcquisition,
      anneeAcquisition,
      travauxMontant,
      travauxAnnee,
      loyerMensuelActuel,
      chargesMensuelles,
      tenantName,
      leaseStartDate,
      leaseEndDate,
      vacant,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [existing, name, address, commune, surface, nbChambres, classeEnergie, estMeuble, prixAcquisition, anneeAcquisition, travauxMontant, travauxAnnee, loyerMensuelActuel, chargesMensuelles, tenantName, leaseStartDate, leaseEndDate, vacant]
  );

  const analysis = useMemo(() => analyzeLot(previewLot), [previewLot]);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Donnez un nom au lot (ex. « Studio Belair »).");
      return;
    }
    saveLot({
      id: isNew ? undefined : id,
      name: name.trim(),
      address: address.trim() || undefined,
      commune: commune.trim() || undefined,
      surface,
      nbChambres,
      classeEnergie,
      estMeuble,
      prixAcquisition,
      anneeAcquisition,
      travauxMontant,
      travauxAnnee,
      loyerMensuelActuel,
      chargesMensuelles,
      tenantName: tenantName.trim() || undefined,
      leaseStartDate: leaseStartDate || undefined,
      leaseEndDate: leaseEndDate || undefined,
      vacant,
    });
    router.push(`${lp}/gestion-locative/portefeuille`);
  };

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/gestion-locative/portefeuille`} className="text-xs text-muted hover:text-navy">← Portefeuille</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{isNew ? "Nouveau lot" : "Éditer le lot"}</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Formulaire */}
          <div className="space-y-5">
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-sm font-semibold text-navy uppercase tracking-wider">Identification</h2>
              <div className="mt-3 grid gap-3">
                <InputField label="Nom interne" type="text" value={name} onChange={setName} hint="Ex. Studio Belair, Maison Esch" />
                <InputField label="Adresse" type="text" value={address} onChange={setAddress} />
                <InputField label="Commune" type="text" value={commune} onChange={setCommune} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-sm font-semibold text-navy uppercase tracking-wider">Caractéristiques</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <InputField label="Surface" value={surface} onChange={(v) => setSurface(Number(v) || 0)} suffix="m²" min={10} max={1000} />
                <InputField label="Chambres" value={nbChambres} onChange={(v) => setNbChambres(Number(v) || 0)} min={0} max={15} />
                <InputField
                  label="Classe énergie"
                  type="select"
                  value={classeEnergie}
                  onChange={(v) => setClasseEnergie(v as EnergyClass)}
                  options={ENERGY_CLASSES}
                />
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input type="checkbox" checked={estMeuble} onChange={(e) => setEstMeuble(e.target.checked)} className="h-4 w-4" />
                  <span>Logement meublé (+10 % plafond)</span>
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-sm font-semibold text-navy uppercase tracking-wider">Acquisition &amp; travaux</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <InputField label="Prix d'acquisition" value={prixAcquisition} onChange={(v) => setPrixAcquisition(Number(v) || 0)} suffix="€" />
                <InputField label="Année d'acquisition" value={anneeAcquisition} onChange={(v) => setAnneeAcquisition(Number(v) || currentYear)} min={1960} max={currentYear} />
                <InputField label="Travaux (total)" value={travauxMontant} onChange={(v) => setTravauxMontant(Number(v) || 0)} suffix="€" />
                {travauxMontant > 0 && (
                  <InputField label="Année des travaux" value={travauxAnnee} onChange={(v) => setTravauxAnnee(Number(v) || currentYear)} min={1960} max={currentYear} />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-sm font-semibold text-navy uppercase tracking-wider">Bail en cours</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" checked={vacant} onChange={(e) => setVacant(e.target.checked)} className="h-4 w-4" />
                  <span>Lot actuellement vacant</span>
                </label>
                <InputField label="Loyer mensuel (hors charges)" value={loyerMensuelActuel} onChange={(v) => setLoyerMensuelActuel(Number(v) || 0)} suffix="€" />
                <InputField label="Charges mensuelles" value={chargesMensuelles} onChange={(v) => setChargesMensuelles(Number(v) || 0)} suffix="€" />
                {!vacant && (
                  <>
                    <InputField label="Locataire" type="text" value={tenantName} onChange={setTenantName} />
                    <InputField label="Début bail" type="text" value={leaseStartDate} onChange={setLeaseStartDate} hint="YYYY-MM" />
                    <InputField label="Fin bail" type="text" value={leaseEndDate} onChange={setLeaseEndDate} hint="YYYY-MM" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Preview analyse */}
          <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className={`rounded-2xl p-6 text-white shadow-lg ${analysis.depasseLegal ? "bg-gradient-to-br from-rose-600 to-rose-800" : "bg-gradient-to-br from-teal-700 to-emerald-800"}`}>
              <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">Plafond légal (règle des 5 %)</div>
              <div className="mt-2 text-3xl font-bold">{formatEUR(analysis.loyerLegalMensuelMax)} <span className="text-sm">/ mois</span></div>
              <div className="mt-1 text-sm text-white/90">Soit {formatEUR(analysis.loyerLegalM2Mensuel)}/m²/mois</div>
              <div className="mt-4 text-xs text-white/80">
                Loyer actuel : <span className="font-semibold">{formatEUR(loyerMensuelActuel)}</span>
                {" · Écart : "}
                <span className="font-semibold">{analysis.ecartLegalPct > 0 ? "+" : ""}{(analysis.ecartLegalPct * 100).toFixed(1)} %</span>
              </div>
              {analysis.depasseLegal && (
                <div className="mt-3 rounded-lg bg-white/15 p-2 text-xs">
                  ⚠️ Loyer actuel supérieur au plafond légal. Risque de réduction judiciaire.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5">
              <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Rendement</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted">Brut (actuel)</div>
                  <div className="text-lg font-bold text-navy">{formatPct(analysis.rendementBrutPct)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Net approximatif</div>
                  <div className="text-lg font-bold text-navy">{formatPct(analysis.rendementNetApproximatif)}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">
                Net indicatif = brut - 1,5 % (charges propriétaire, vacance, entretien courant). Hors fiscalité.
              </p>
            </div>

            {analysis.klimabonusMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="font-semibold">🌱 Opportunité Klimabonus</div>
                <div className="mt-1 text-xs">{analysis.klimabonusMessage}</div>
                <Link href={`${lp}/simulateur-aides`} className="mt-2 inline-flex text-xs font-medium text-emerald-900 underline hover:no-underline">
                  Simuler les aides de rénovation →
                </Link>
              </div>
            )}
          </div>
        </div>

        {!isNew && (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href={`${lp}/gestion-locative/lot/${previewLot.id}/paiements`}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75M21 6v9.75c0 .621-.504 1.125-1.125 1.125H21M3 21h18M12 12.75a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
                Paiements &amp; quittances
              </Link>
              <Link href={`${lp}/gestion-locative/lot/${previewLot.id}/colocataires`}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                Colocataires
              </Link>
            </div>
            <div className="mt-6">
              <LeaseGeneratorSection lot={previewLot} />
            </div>
          </>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Link href={`${lp}/gestion-locative/portefeuille`} className="text-sm text-muted hover:text-navy">
            Annuler
          </Link>
          <button
            onClick={handleSave}
            className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light"
          >
            {isNew ? "Créer le lot" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
