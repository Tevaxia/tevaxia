"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR } from "@/lib/calculations";
import { checkSTRCompliance, STR_LICENSE_THRESHOLD_DAYS, STR_TAX_THRESHOLD_EUR } from "@/lib/str-calc";

const OWNER_TYPES = [
  { value: "particulier", label: "Particulier" },
  { value: "societe", label: "Société (SCI, SARL-S, SPF)" },
  { value: "non_resident", label: "Non-résident fiscal LU" },
];

export default function StrCompliance() {
  const [nightsPlanned, setNightsPlanned] = useState(60);
  const [commune, setCommune] = useState("Luxembourg");
  const [isPrimaryResidence, setIsPrimaryResidence] = useState(false);
  const [ownerType, setOwnerType] = useState<"particulier" | "societe" | "non_resident">("particulier");
  const [annualRevenue, setAnnualRevenue] = useState(8000);

  const result = useMemo(() => checkSTRCompliance({
    nightsPlannedPerYear: nightsPlanned,
    commune,
    isPrimaryResidence,
    ownerType,
    annualRevenueEstimated: annualRevenue,
  }), [nightsPlanned, commune, isPrimaryResidence, ownerType, annualRevenue]);

  const riskColor = result.communeRegulationRisk === "high" ? "bg-rose-100 text-rose-800 border-rose-200"
    : result.communeRegulationRisk === "medium" ? "bg-amber-100 text-amber-800 border-amber-200"
    : "bg-emerald-100 text-emerald-800 border-emerald-200";

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/str" className="text-xs text-muted hover:text-navy">&larr; Location courte durée</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Conformité STR au Luxembourg</h1>
          <p className="mt-2 text-muted">
            Vérifiez vos obligations légales avant de lancer une location courte durée au Luxembourg.
            Seuil 3 mois, licence d&apos;hébergement, règlements communaux, fiscalité IR, Règlement UE 2024/1028.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Votre projet STR</h2>
              <div className="space-y-4">
                <InputField
                  label="Nuitées prévues sur 12 mois"
                  value={nightsPlanned}
                  onChange={(v) => setNightsPlanned(Number(v))}
                  suffix="nuits"
                  min={0}
                  max={365}
                  hint={`Seuil légal : ${STR_LICENSE_THRESHOLD_DAYS} nuits/an (au-delà, licence obligatoire)`}
                />
                <InputField label="Commune" type="text" value={commune} onChange={(v) => setCommune(String(v))} />
                <InputField
                  label="Type de propriétaire"
                  type="select"
                  value={ownerType}
                  onChange={(v) => setOwnerType(v as "particulier" | "societe" | "non_resident")}
                  options={OWNER_TYPES}
                />
                <InputField
                  label="Revenu STR annuel estimé"
                  value={annualRevenue}
                  onChange={(v) => setAnnualRevenue(Number(v))}
                  suffix="€"
                  hint={`Seuil déclaration IR : ${formatEUR(STR_TAX_THRESHOLD_EUR)}/an`}
                />
                <label className="flex items-center gap-2 text-sm text-slate">
                  <input
                    type="checkbox"
                    checked={isPrimaryResidence}
                    onChange={(e) => setIsPrimaryResidence(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  Le bien est ma résidence principale (location occasionnelle pendant mes déplacements)
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 p-8 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/70">Statut réglementaire</div>
              <div className="mt-2 text-2xl font-bold">
                {result.requiresLicense ? "Licence d'hébergement requise" : "Aucune licence requise"}
              </div>
              <div className="mt-2 text-sm text-white/80">
                {result.requiresLicense
                  ? `Vous dépassez le seuil de ${STR_LICENSE_THRESHOLD_DAYS} nuits/an de ${Math.abs(result.licenseThresholdMargin)} nuits. Demande à déposer avant toute mise en location.`
                  : `Il vous reste ${result.licenseThresholdMargin} nuits avant d'atteindre le seuil de licence.`}
              </div>
            </div>

            <div className={`rounded-xl border-2 p-5 ${riskColor}`}>
              <h3 className="text-sm font-semibold">Risque réglementaire communal</h3>
              <p className="mt-2 text-sm">
                Commune « {commune} » : risque <strong>{result.communeRegulationRisk === "high" ? "élevé" : result.communeRegulationRisk === "medium" ? "moyen" : "faible"}</strong>.
              </p>
              {result.communeRegulationRisk === "high" && (
                <p className="mt-2 text-xs">
                  Luxembourg-Ville notamment impose des restrictions strictes depuis 2024 : vérifiez le règlement communal en vigueur.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-navy">Fiscalité IR Luxembourg</h3>
              <div className="mt-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Seuil déclaration IR</span>
                  <span className="font-mono font-semibold">{formatEUR(STR_TAX_THRESHOLD_EUR)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Votre revenu estimé</span>
                  <span className="font-mono font-semibold">{formatEUR(annualRevenue)}</span>
                </div>
                <div className="flex justify-between border-t border-card-border pt-2">
                  <span className="font-semibold">Déclaration obligatoire ?</span>
                  <span className={`font-semibold ${result.requiresTaxDeclaration ? "text-rose-700" : "text-emerald-700"}`}>
                    {result.requiresTaxDeclaration ? "OUI (formulaire 100)" : "Non"}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">
                Taux marginal max LU : <strong>45,78 %</strong> (IR 42 % × contribution emploi 1,09).
                Charges déductibles : intérêts emprunt, PNO, ménage, amortissement mobilier, commissions OTA (15-18 %).
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-blue-900">Règlement UE 2024/1028 sur les STR</h3>
              <p className="mt-2 text-sm text-blue-800">
                <strong>Entrée en vigueur mi-2026.</strong> Obligations :
              </p>
              <ul className="mt-2 text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Enregistrement dans le <strong>registre unique européen</strong> des locations courte durée</li>
                <li>Transmission des nuitées aux communes (plateformes Airbnb/Booking s&apos;occupent du reporting)</li>
                <li>Numéro d&apos;identification à afficher obligatoirement sur les annonces</li>
              </ul>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-navy">Actions à entreprendre</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-7.5a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Z" />
                    </svg>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <AiAnalysisCard
              context={[
                `Diagnostic conformité STR Luxembourg`,
                `Commune: ${commune}`,
                `Nuitées prévues: ${nightsPlanned}/an (seuil licence: ${STR_LICENSE_THRESHOLD_DAYS})`,
                `Type propriétaire: ${ownerType}`,
                `Résidence principale: ${isPrimaryResidence ? "oui" : "non"}`,
                `Revenu estimé: ${formatEUR(annualRevenue)}/an`,
                "",
                `Licence d'hébergement requise: ${result.requiresLicense ? "OUI" : "non"}`,
                `Déclaration IR requise: ${result.requiresTaxDeclaration ? "OUI" : "non"}`,
                `Risque réglementaire communal: ${result.communeRegulationRisk}`,
                `EU Regulation 2024/1028 applicable: ${result.euRegulationCompliance.registrationRequired ? "OUI (mi-2026)" : "non"}`,
              ].join("\n")}
              prompt="Analyse ce dossier conformité STR Luxembourg. Livre : (1) synthèse du niveau de risque légal (vert/orange/rouge) avec justification, (2) liste hiérarchisée des démarches à effectuer (obtenir licence si nécessaire, déclaration guichet.lu, déclaration IR, enregistrement registre EU, assurance PNO courte durée), (3) pièges communaux spécifiques (Luxembourg-Ville règlement 2024 restrictif, copropriété avec clause anti-STR), (4) optimisations légales : rester sous 90 jours pour éviter licence, régime meublé touristique vs bail habitation, société vs particulier, (5) timeline concrète (démarches ordre chronologique). Ton clair pour un propriétaire non-juriste. Réfère art. 6 loi 17.07.2020 + art. 98 LIR + EU Reg 2024/1028."
            />
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>Avertissement :</strong> cette analyse est indicative. La réglementation STR LU évolue rapidement (refonte EU 2024/1028, règlements communaux).
          Validez toujours avec un avocat spécialisé ou un expert-comptable LU avant toute mise en location. Les valeurs sont celles en vigueur en avril 2026.
        </div>
      </div>
    </div>
  );
}
