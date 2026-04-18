"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createOrganization, type OrgType } from "@/lib/orgs";
import { createCoownership } from "@/lib/coownerships";
import { createProperty } from "@/lib/pms/properties";
import { createMandate } from "@/lib/agency-mandates";
import { errMsg } from "@/lib/errors";

type Persona = "syndic" | "agency" | "hotel";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Organization
  const [orgForm, setOrgForm] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    vat_number: "",
  });

  // Entity depending on persona
  const [coproForm, setCoproForm] = useState({
    name: "Résidence ",
    address: "",
    commune: "Luxembourg",
    year_built: 2000,
    nb_floors: 4,
    has_elevator: true,
  });
  const [hotelForm, setHotelForm] = useState({
    name: "Hôtel ",
    property_type: "hotel" as const,
    commune: "Luxembourg",
  });
  const [mandateForm, setMandateForm] = useState({
    property_address: "",
    property_commune: "Luxembourg",
    property_type: "appartement" as const,
    prix_demande: 500000,
    commission_pct: 3,
    client_name: "",
    client_email: "",
  });

  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);
  const [createdEntityId, setCreatedEntityId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email && !orgForm.contact_email) {
      setOrgForm((f) => ({ ...f, contact_email: user.email ?? "" }));
    }
  }, [user, orgForm.contact_email]);

  const handleCreateOrg = async () => {
    if (!persona || !orgForm.name.trim()) {
      setError("Nom de l'organisation requis."); return;
    }
    setLoading(true); setError(null);
    try {
      const orgType: OrgType = persona === "syndic" ? "syndic" : persona === "hotel" ? "hotel_group" : "agency";
      const org = await createOrganization({
        name: orgForm.name,
        org_type: orgType,
        contact_email: orgForm.contact_email || undefined,
        contact_phone: orgForm.contact_phone || undefined,
        vat_number: orgForm.vat_number || undefined,
      });
      setCreatedOrgId(org.id);
      setStep(3);
    } catch (e) {
      setError(errMsg(e, "Erreur création organisation"));
    }
    setLoading(false);
  };

  const handleCreateEntity = async () => {
    setLoading(true); setError(null);
    try {
      if (persona === "syndic") {
        if (!coproForm.name.trim()) { setError("Nom copropriété requis"); setLoading(false); return; }
        if (!createdOrgId) { setError("Organisation manquante"); setLoading(false); return; }
        const c = await createCoownership({
          org_id: createdOrgId,
          name: coproForm.name,
          address: coproForm.address || undefined,
          commune: coproForm.commune || undefined,
        });
        setCreatedEntityId(c.id);
      } else if (persona === "hotel") {
        if (!hotelForm.name.trim()) { setError("Nom de l'hôtel requis"); setLoading(false); return; }
        const p = await createProperty({
          name: hotelForm.name,
          property_type: hotelForm.property_type,
          commune: hotelForm.commune || null,
        });
        setCreatedEntityId(p.id);
      } else if (persona === "agency") {
        if (!mandateForm.property_address.trim()) { setError("Adresse du bien requise"); setLoading(false); return; }
        const m = await createMandate({
          property_address: mandateForm.property_address,
          property_commune: mandateForm.property_commune,
          property_type: mandateForm.property_type,
          prix_demande: mandateForm.prix_demande,
          commission_pct: mandateForm.commission_pct,
          client_name: mandateForm.client_name || null,
          client_email: mandateForm.client_email || null,
          mandate_type: "simple",
        });
        setCreatedEntityId(m.id);
      }
      setStep(4);
    } catch (e) {
      setError(errMsg(e, "Erreur création"));
    }
    setLoading(false);
  };

  const handleFinish = () => {
    if (persona === "syndic" && createdEntityId) {
      router.push(`/syndic/coproprietes/${createdEntityId}`);
    } else if (persona === "hotel" && createdEntityId) {
      router.push(`/pms/${createdEntityId}`);
    } else if (persona === "agency" && createdEntityId) {
      router.push(`/pro-agences/mandats/${createdEntityId}`);
    } else {
      router.push("/tableau-bord");
    }
  };

  if (authLoading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">Se connecter pour commencer</Link></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-muted font-semibold">Bienvenue sur tevaxia</div>
        <h1 className="mt-2 text-3xl font-bold text-navy">Configuration rapide (3 minutes)</h1>
        <p className="mt-2 text-sm text-muted">
          En 3 étapes vous aurez créé votre organisation et votre premier dossier.
          Tout est éditable ensuite.
        </p>
      </div>

      {/* Stepper */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              step >= n ? "bg-navy text-white" : "bg-background border border-card-border text-muted"
            }`}>
              {step > n ? "✓" : n}
            </div>
            {n < 4 && (
              <div className={`h-0.5 w-8 sm:w-16 ${step > n ? "bg-navy" : "bg-card-border"}`} />
            )}
          </div>
        ))}
      </div>

      {error && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}

      {/* Step 1 : Persona */}
      {step === 1 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-navy mb-4">1. Quel est votre métier ?</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <PersonaCard persona="syndic" icon="🏢" label="Syndic"
              description="Gestion copropriétés, AG, comptabilité, appels de fonds"
              selected={persona === "syndic"} onClick={() => setPersona("syndic")} />
            <PersonaCard persona="agency" icon="🏠" label="Agence immobilière"
              description="Mandats, pipeline, CRM, signatures, fiches biens"
              selected={persona === "agency"} onClick={() => setPersona("agency")} />
            <PersonaCard persona="hotel" icon="🏨" label="Hôtelier"
              description="PMS, réservations, USALI, channel manager, folios"
              selected={persona === "hotel"} onClick={() => setPersona("hotel")} />
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => persona && setStep(2)}
              disabled={!persona}
              className="rounded-lg bg-navy px-6 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50">
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 : Organization */}
      {step === 2 && persona && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-navy mb-1">2. Votre organisation</h2>
          <p className="text-sm text-muted mb-4">
            {persona === "syndic" && "Le cabinet syndic ou la société de gestion."}
            {persona === "agency" && "L'agence immobilière."}
            {persona === "hotel" && "La société propriétaire ou exploitante."}
          </p>
          <div className="grid gap-4">
            <Field label="Nom *" value={orgForm.name}
              onChange={(v) => setOrgForm({ ...orgForm, name: v })}
              placeholder={
                persona === "syndic" ? "ex. Cabinet Muller & Associés" :
                persona === "agency" ? "ex. Immo Luxembourg SARL" :
                "ex. Hôtels du Grand-Duché SARL"
              } />
            <Field label="Email contact" type="email" value={orgForm.contact_email}
              onChange={(v) => setOrgForm({ ...orgForm, contact_email: v })} />
            <Field label="Téléphone" type="tel" value={orgForm.contact_phone}
              onChange={(v) => setOrgForm({ ...orgForm, contact_phone: v })} />
            <Field label="N° TVA (optionnel)" value={orgForm.vat_number}
              onChange={(v) => setOrgForm({ ...orgForm, vat_number: v })}
              placeholder="LU12345678" />
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)}
              className="rounded-lg border border-card-border px-4 py-2 text-sm font-semibold text-slate">
              ← Retour
            </button>
            <button onClick={handleCreateOrg} disabled={loading}
              className="rounded-lg bg-navy px-6 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50">
              {loading ? "Création…" : "Créer l'organisation →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 : First entity */}
      {step === 3 && persona && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-navy mb-1">3. Votre premier dossier</h2>
          <p className="text-sm text-muted mb-4">
            {persona === "syndic" && "Ajoutez votre première copropriété (vous en ajouterez d'autres ensuite)."}
            {persona === "agency" && "Ajoutez votre premier mandat (bien en vente)."}
            {persona === "hotel" && "Ajoutez votre première propriété hôtelière."}
          </p>

          {persona === "syndic" && (
            <div className="grid gap-3">
              <Field label="Nom de la copropriété *" value={coproForm.name}
                onChange={(v) => setCoproForm({ ...coproForm, name: v })}
                placeholder="ex. Résidence Les Jardins" />
              <Field label="Adresse" value={coproForm.address}
                onChange={(v) => setCoproForm({ ...coproForm, address: v })}
                placeholder="ex. 15 rue de la Paix" />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Commune" value={coproForm.commune}
                  onChange={(v) => setCoproForm({ ...coproForm, commune: v })} />
                <Field label="Année construction" type="number" value={String(coproForm.year_built)}
                  onChange={(v) => setCoproForm({ ...coproForm, year_built: Number(v) })} />
                <Field label="Nb étages" type="number" value={String(coproForm.nb_floors)}
                  onChange={(v) => setCoproForm({ ...coproForm, nb_floors: Number(v) })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={coproForm.has_elevator}
                  onChange={(e) => setCoproForm({ ...coproForm, has_elevator: e.target.checked })} />
                Ascenseur
              </label>
            </div>
          )}

          {persona === "hotel" && (
            <div className="grid gap-3">
              <Field label="Nom de l'hôtel *" value={hotelForm.name}
                onChange={(v) => setHotelForm({ ...hotelForm, name: v })}
                placeholder="ex. Hôtel du Parc" />
              <Field label="Commune" value={hotelForm.commune}
                onChange={(v) => setHotelForm({ ...hotelForm, commune: v })} />
            </div>
          )}

          {persona === "agency" && (
            <div className="grid gap-3">
              <Field label="Adresse du bien *" value={mandateForm.property_address}
                onChange={(v) => setMandateForm({ ...mandateForm, property_address: v })}
                placeholder="ex. 15 rue de la Faïencerie, Limpertsberg" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Commune" value={mandateForm.property_commune}
                  onChange={(v) => setMandateForm({ ...mandateForm, property_commune: v })} />
                <Field label="Prix demandé (€)" type="number" value={String(mandateForm.prix_demande)}
                  onChange={(v) => setMandateForm({ ...mandateForm, prix_demande: Number(v) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nom client (mandant)" value={mandateForm.client_name}
                  onChange={(v) => setMandateForm({ ...mandateForm, client_name: v })} />
                <Field label="Email client" type="email" value={mandateForm.client_email}
                  onChange={(v) => setMandateForm({ ...mandateForm, client_email: v })} />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(2)}
              className="rounded-lg border border-card-border px-4 py-2 text-sm font-semibold text-slate">
              ← Retour
            </button>
            <button onClick={handleCreateEntity} disabled={loading}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {loading ? "Création…" : "Créer le dossier →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4 : Success */}
      {step === 4 && (
        <div className="mt-8 text-center">
          <div className="text-6xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold text-navy">Parfait, tout est prêt !</h2>
          <p className="mt-3 text-sm text-muted">
            {persona === "syndic" && "Votre première copropriété est créée. Passez à l'ajout des lots et copropriétaires, puis initialisez le plan comptable."}
            {persona === "agency" && "Votre premier mandat est créé. Ajoutez des photos, définissez la diffusion portails, trouvez les acquéreurs matchés."}
            {persona === "hotel" && "Votre première propriété est créée. Configurez les chambres, rate plans et commencez à prendre des réservations."}
          </p>
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left text-xs text-blue-900">
            <strong>Prochaines étapes recommandées :</strong>
            {persona === "syndic" && (
              <ul className="mt-2 ml-5 list-disc space-y-1">
                <li>Ajouter les lots + tantièmes dans la fiche copropriété</li>
                <li>Initialiser le plan comptable (bouton &laquo; Comptabilité &raquo;)</li>
                <li>Créer un premier appel de fonds trimestriel</li>
                <li>Configurer les clés de répartition (chauffage, ascenseur)</li>
              </ul>
            )}
            {persona === "agency" && (
              <ul className="mt-2 ml-5 list-disc space-y-1">
                <li>Ajouter le descriptif + photos dans l'aperçu du mandat</li>
                <li>Configurer la diffusion sur athome / Immotop / Immoweb</li>
                <li>Lancer le matching automatique avec vos contacts CRM</li>
                <li>Faire signer le mandat par votre client (eIDAS)</li>
              </ul>
            )}
            {persona === "hotel" && (
              <ul className="mt-2 ml-5 list-disc space-y-1">
                <li>Ajouter les types de chambres + chambres physiques</li>
                <li>Définir les rate plans (BAR, non-remboursable, etc.)</li>
                <li>Configurer les channels iCal (Airbnb, Booking)</li>
                <li>Prendre la première réservation</li>
              </ul>
            )}
          </div>
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={handleFinish}
              className="rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light">
              Aller au dossier →
            </button>
            <Link href="/tableau-bord"
              className="rounded-lg border border-card-border bg-white px-6 py-3 text-sm font-semibold text-slate hover:bg-background">
              Tableau de bord
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonaCard({ icon, label, description, selected, onClick }: {
  persona: Persona; icon: string; label: string; description: string;
  selected: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`text-left rounded-xl border-2 p-4 transition-all ${
        selected
          ? "border-navy bg-navy/5 ring-2 ring-navy/30"
          : "border-card-border bg-card hover:border-navy/50"
      }`}>
      <div className="text-4xl">{icon}</div>
      <div className="mt-2 font-bold text-navy">{label}</div>
      <div className="mt-1 text-xs text-muted">{description}</div>
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "tel" | "number";
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-slate">{label}</div>
      <input type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
    </label>
  );
}
