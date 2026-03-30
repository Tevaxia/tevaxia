"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import { simulerAides, formatEUR, type AideDetail } from "@/lib/calculations";

const CATEGORIE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  etatique_acquisition: { label: "Aides étatiques (acquisition)", color: "text-navy", bg: "bg-navy/5 border-navy/20" },
  etatique_energie: { label: "Aides étatiques (énergie)", color: "text-teal", bg: "bg-teal/5 border-teal/20" },
  privee: { label: "Aides privées", color: "text-gold-dark", bg: "bg-gold/5 border-gold/20" },
  communale: { label: "Aides communales", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  patrimoine: { label: "Patrimoine", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

const NATURE_LABELS: Record<string, { label: string; color: string }> = {
  directe: { label: "Aide directe", color: "bg-green-100 text-green-700" },
  economie: { label: "Économie estimée", color: "bg-blue-100 text-blue-700" },
  garantie: { label: "Garantie", color: "bg-gray-100 text-gray-700" },
};

function AideCard({ aide }: { aide: AideDetail }) {
  const cat = CATEGORIE_LABELS[aide.categorie] || { label: aide.categorie, color: "text-slate", bg: "bg-gray-50" };
  const nature = NATURE_LABELS[aide.nature] || NATURE_LABELS.directe;
  return (
    <div className={`rounded-lg border p-4 ${cat.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-semibold ${cat.color}`}>{aide.nom}</h4>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${nature.color}`}>
              {nature.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">{aide.description}</p>
          <p className="mt-1 text-xs text-muted/70 italic">{aide.conditions}</p>
        </div>
        <span className="shrink-0 font-mono text-lg font-bold text-foreground">
          {formatEUR(aide.montant)}
        </span>
      </div>
    </div>
  );
}

export default function SimulateurAides() {
  const [typeProjet, setTypeProjet] = useState<"acquisition" | "construction" | "renovation">("acquisition");
  const [prixBien, setPrixBien] = useState(750000);
  const [montantTravaux, setMontantTravaux] = useState(50000);
  const [revenuMenage, setRevenuMenage] = useState(80000);
  const [nbEmprunteurs, setNbEmprunteurs] = useState<1 | 2>(2);
  const [nbEnfants, setNbEnfants] = useState(1);
  const [typeBien, setTypeBien] = useState<"appartement" | "maison_rangee" | "maison_jumelee" | "maison_isolee">("appartement");
  const [residencePrincipale, setResidencePrincipale] = useState(true);
  const [estNeuf, setEstNeuf] = useState(false);
  const [montantPret, setMontantPret] = useState(600000);
  const [epargneReguliere3ans, setEpargneReguliere3ans] = useState(true);
  const [commune, setCommune] = useState("Luxembourg-Ville");

  const result = useMemo(
    () =>
      simulerAides({
        typeProjet,
        prixBien,
        montantTravaux: typeProjet === "renovation" ? montantTravaux : undefined,
        revenuMenage,
        nbEmprunteurs,
        nbEnfants,
        typeBien,
        residencePrincipale,
        estNeuf,
        montantPret,
        epargneReguliere3ans,
        commune,
      }),
    [typeProjet, prixBien, montantTravaux, revenuMenage, nbEmprunteurs, nbEnfants, typeBien, residencePrincipale, estNeuf, montantPret, epargneReguliere3ans, commune]
  );

  // Group aides by category
  const aidesByCategorie = useMemo(() => {
    const groups: Record<string, AideDetail[]> = {};
    for (const aide of result.aides) {
      if (!groups[aide.categorie]) groups[aide.categorie] = [];
      groups[aide.categorie].push(aide);
    }
    return groups;
  }, [result.aides]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">
              Simulateur d'Aides
            </h1>
            <span className="rounded-full bg-gold/20 px-3 py-0.5 text-xs font-semibold text-gold-dark">
              5 couches d'aides
            </span>
          </div>
          <p className="mt-2 text-muted">
            Étatiques acquisition + rénovation énergie + privées + communales + patrimoine — le simulateur le plus complet du Luxembourg
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Inputs - 2 cols */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Projet</h2>
              <div className="space-y-4">
                <InputField
                  label="Type de projet"
                  type="select"
                  value={typeProjet}
                  onChange={(v) => setTypeProjet(v as "acquisition" | "construction" | "renovation")}
                  options={[
                    { value: "acquisition", label: "Acquisition (ancien)" },
                    { value: "construction", label: "Construction / VEFA (neuf)" },
                    { value: "renovation", label: "Rénovation énergétique" },
                  ]}
                />
                <InputField
                  label="Prix du bien"
                  value={prixBien}
                  onChange={(v) => setPrixBien(Number(v))}
                  suffix="€"
                />
                {typeProjet === "renovation" && (
                  <InputField
                    label="Montant des travaux"
                    value={montantTravaux}
                    onChange={(v) => setMontantTravaux(Number(v))}
                    suffix="€"
                    hint="Travaux de rénovation énergétique"
                  />
                )}
                <InputField
                  label="Type de bien"
                  type="select"
                  value={typeBien}
                  onChange={(v) => setTypeBien(v as typeof typeBien)}
                  options={[
                    { value: "appartement", label: "Appartement / copropriété (+40%)" },
                    { value: "maison_rangee", label: "Maison en rangée (+40%)" },
                    { value: "maison_jumelee", label: "Maison jumelée (+15%)" },
                    { value: "maison_isolee", label: "Maison isolée" },
                  ]}
                />
                <ToggleField
                  label="Résidence principale"
                  checked={residencePrincipale}
                  onChange={setResidencePrincipale}
                />
                {typeProjet === "construction" && (
                  <ToggleField
                    label="Bien neuf"
                    checked={estNeuf}
                    onChange={setEstNeuf}
                    hint="TVA super-réduite 3%"
                  />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Profil</h2>
              <div className="space-y-4">
                <InputField
                  label="Revenu annuel du ménage"
                  value={revenuMenage}
                  onChange={(v) => setRevenuMenage(Number(v))}
                  suffix="€"
                />
                <InputField
                  label="Nombre d'emprunteurs"
                  type="select"
                  value={String(nbEmprunteurs)}
                  onChange={(v) => setNbEmprunteurs(Number(v) as 1 | 2)}
                  options={[
                    { value: "1", label: "1 emprunteur" },
                    { value: "2", label: "2 emprunteurs" },
                  ]}
                />
                <InputField
                  label="Nombre d'enfants à charge"
                  value={nbEnfants}
                  onChange={(v) => setNbEnfants(Number(v))}
                  min={0}
                  max={10}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Financement</h2>
              <div className="space-y-4">
                <InputField
                  label="Montant du prêt"
                  value={montantPret}
                  onChange={(v) => setMontantPret(Number(v))}
                  suffix="€"
                />
                <ToggleField
                  label="Épargne régulière ≥ 3 ans"
                  checked={epargneReguliere3ans}
                  onChange={setEpargneReguliere3ans}
                  hint="1 000 €/an min. — requis pour garantie État et prime épargne"
                />
                <InputField
                  label="Commune"
                  type="text"
                  value={commune}
                  onChange={setCommune}
                  hint="Pour les aides communales spécifiques"
                />
              </div>
            </div>
          </div>

          {/* Results - 3 cols */}
          <div className="space-y-6 lg:col-span-3">
            {/* Total banner */}
            <div className="rounded-xl bg-gradient-to-br from-navy to-navy-light p-6 text-white shadow-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Aides directes</div>
                  <div className="mt-1 text-3xl font-bold">{formatEUR(result.totalAidesDirectes)}</div>
                  <div className="mt-1 text-xs text-white/50">Cash reçu ou impôt économisé</div>
                </div>
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Économies estimées</div>
                  <div className="mt-1 text-3xl font-bold text-gold-light">{formatEUR(result.totalEconomies)}</div>
                  <div className="mt-1 text-xs text-white/50">Intérêts évités sur la durée du prêt</div>
                </div>
              </div>
              {result.garantieEtat && (
                <div className="mt-4 rounded-lg bg-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Garantie de l'État</div>
                      <div className="text-xs text-white/60">
                        Caution publique de {formatEUR(result.garantieEtat.montantGaranti)} — ce n'est pas du cash,
                        c'est une garantie qui remplace la caution bancaire privée
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/50">Économie réelle</div>
                      <div className="text-lg font-bold text-gold-light">
                        ~{formatEUR(result.garantieEtat.economieEstimee)}
                      </div>
                      <div className="text-[10px] text-white/40">~1,5% du montant garanti</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 border-t border-white/20 pt-3 flex items-center justify-between">
                <span className="text-sm text-white/70">Bénéfice total estimé</span>
                <span className="text-2xl font-bold">{formatEUR(result.totalGeneral)}</span>
              </div>
            </div>

            {!residencePrincipale && (
              <div className="rounded-xl border-2 border-warning/30 bg-amber-50 p-6">
                <h3 className="text-base font-semibold text-warning">Résidence principale requise</h3>
                <p className="mt-1 text-sm text-amber-700">
                  La quasi-totalité des aides luxembourgeoises sont conditionnées à l'occupation en tant
                  que résidence principale. Activez cette option pour voir les aides disponibles.
                </p>
              </div>
            )}

            {/* Aides grouped by category */}
            {Object.entries(aidesByCategorie).map(([categorie, aides]) => (
              <div key={categorie}>
                <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wider ${CATEGORIE_LABELS[categorie]?.color || "text-slate"}`}>
                  {CATEGORIE_LABELS[categorie]?.label || categorie}
                  <span className="ml-2 text-xs font-normal text-muted">
                    ({formatEUR(result.totalParCategorie[categorie] || 0)})
                  </span>
                </h3>
                <div className="space-y-3">
                  {aides.map((aide, i) => (
                    <AideCard key={i} aide={aide} />
                  ))}
                </div>
              </div>
            ))}

            {/* Disclaimer */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Important</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">Estimations</strong> — Les montants affichés sont des estimations
                  basées sur les barèmes officiels. Les aides réelles dépendent de l'instruction de votre dossier
                  par le ministère du Logement et les organismes concernés.
                </p>
                <p>
                  <strong className="text-slate">Aides communales</strong> — Chaque commune a ses propres règles
                  et plafonds. Contactez votre commune pour connaître les aides exactes disponibles. Les aides
                  communales peuvent représenter 30 à 50% de l'aide étatique.
                </p>
                <p>
                  <strong className="text-slate">Cumul</strong> — Les 5 couches d'aides sont en principe
                  cumulables, dans la limite d'un plafond global de 35 000 € pour les primes en capital.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
