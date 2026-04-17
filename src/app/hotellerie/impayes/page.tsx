"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";

interface ImpayeSimInput {
  montantFacture: number;
  joursRetard: number;
  tauxInteretRetard: number; // % annuel (loi 2004 sur retards paiement transposant directive 2011/7/UE)
  fraisAdministratifs: number; // forfait minimum 40 € art. L.441-10 code com. FR / art. 5 loi LU
  avocatHonoraires: number;
  nbFactures: number;
  lastInvoiceDate: string;
  // Options palier
  activeN1: boolean; // rappel amiable J+15
  activeN2: boolean; // mise en demeure J+30
  activeN3: boolean; // recouvrement judiciaire J+60
}

function calcPalier(joursRetard: number): { niveau: 0 | 1 | 2 | 3; label: string; description: string; action: string } {
  if (joursRetard < 15) return { niveau: 0, label: "En cours", description: "Facture récente, délai contractuel", action: "Surveillance" };
  if (joursRetard < 30) return { niveau: 1, label: "N1 — Rappel amiable", description: "J+15, premier rappel courtois par email", action: "Email automatisé avec copie facture" };
  if (joursRetard < 60) return { niveau: 2, label: "N2 — Mise en demeure", description: "J+30, lettre recommandée AR + intérêts de retard", action: "LRAR + forfait 40 € + intérêts" };
  return { niveau: 3, label: "N3 — Recouvrement judiciaire", description: "J+60, transmission contentieux (avocat / société de recouvrement)", action: "Injonction de payer / assignation" };
}

function computeInteretsRetard(montant: number, jours: number, tauxAnnuel: number): number {
  return montant * (tauxAnnuel / 100) * (jours / 365);
}

export default function HotelImpayesPage() {
  const [montantFacture, setMontantFacture] = useState(8500);
  const [joursRetard, setJoursRetard] = useState(35);
  const [tauxInteretRetard, setTauxInteretRetard] = useState(12.5); // BCE + 8 points = ~12 % en 2026
  const [fraisAdministratifs, setFraisAdministratifs] = useState(40);
  const [avocatHonoraires, setAvocatHonoraires] = useState(0);
  const [nbFactures, setNbFactures] = useState(1);
  const [lastInvoiceDate, setLastInvoiceDate] = useState(new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString().slice(0, 10));

  const palier = useMemo(() => calcPalier(joursRetard), [joursRetard]);

  const interetsRetard = useMemo(
    () => computeInteretsRetard(montantFacture * nbFactures, joursRetard, tauxInteretRetard),
    [montantFacture, nbFactures, joursRetard, tauxInteretRetard]
  );

  const totalDu = montantFacture * nbFactures;
  const totalAvecInterets = totalDu + interetsRetard;
  const totalFraisRecouvrement =
    (palier.niveau >= 2 ? fraisAdministratifs : 0) +
    (palier.niveau >= 3 ? avocatHonoraires : 0);
  const totalReclame = totalAvecInterets + totalFraisRecouvrement;

  // Probabilité récupération par palier (statistiques typique B2B hotel)
  const probaRecouvrement = palier.niveau === 0 ? 0.95 : palier.niveau === 1 ? 0.80 : palier.niveau === 2 ? 0.55 : 0.30;
  const esperanceRecupere = totalReclame * probaRecouvrement;
  const risqueDepreciation = totalReclame - esperanceRecupere;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">← Hôtellerie</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Relances impayés B2B — hôtellerie</h1>
          <p className="mt-2 text-muted">
            Gestion des factures impayées groupes / corporate / event. Paliers de relance conformes
            loi luxembourgeoise du 18 avril 2004 (délais de paiement, transposition directive 2011/7/UE).
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Facture impayée</h2>
              <div className="space-y-4">
                <InputField label="Montant facture (€)" value={montantFacture} onChange={(v) => setMontantFacture(Number(v))} suffix="€" />
                <InputField label="Nombre de factures impayées" value={nbFactures} onChange={(v) => setNbFactures(Number(v))} min={1} max={50} />
                <InputField label="Date facture la plus ancienne" type="text" value={lastInvoiceDate} onChange={setLastInvoiceDate} hint="YYYY-MM-DD" />
                <InputField label="Jours de retard (vs échéance 30j)" value={joursRetard} onChange={(v) => setJoursRetard(Number(v))} min={0} max={365} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Frais & intérêts</h2>
              <div className="space-y-4">
                <InputField label="Taux intérêt retard annuel" value={tauxInteretRetard} onChange={(v) => setTauxInteretRetard(Number(v))} suffix="%" step={0.5} hint="Loi 18.04.2004 : taux BCE + 8 points (actuellement ~12 %)" />
                <InputField label="Forfait frais administratifs (palier N2+)" value={fraisAdministratifs} onChange={(v) => setFraisAdministratifs(Number(v))} suffix="€" hint="Minimum légal 40 € (art. 5 loi 18.04.2004)" />
                <InputField label="Honoraires avocat estimés (palier N3)" value={avocatHonoraires} onChange={(v) => setAvocatHonoraires(Number(v))} suffix="€" hint="5-15 % du montant réclamé en B2B" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Palier actuel */}
            <div className={`rounded-2xl p-6 shadow-lg text-white ${
              palier.niveau === 0 ? "bg-gradient-to-br from-emerald-600 to-teal-700"
                : palier.niveau === 1 ? "bg-gradient-to-br from-amber-500 to-orange-600"
                  : palier.niveau === 2 ? "bg-gradient-to-br from-orange-600 to-rose-600"
                    : "bg-gradient-to-br from-rose-700 to-red-800"
            }`}>
              <div className="text-sm text-white/70">Palier actuel</div>
              <div className="mt-1 text-3xl font-bold">{palier.label}</div>
              <p className="mt-2 text-sm text-white/90">{palier.description}</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-xs text-white/60">Action recommandée</div>
                <div className="mt-1 text-sm font-semibold">{palier.action}</div>
              </div>
            </div>

            <ResultPanel
              title="Montant total réclamé"
              lines={[
                { label: `Factures impayées (${nbFactures} × ${formatEUR(montantFacture)})`, value: formatEUR(totalDu) },
                { label: `Intérêts de retard (${tauxInteretRetard} %/an × ${joursRetard}j)`, value: formatEUR(interetsRetard), sub: true },
                { label: "Total dû + intérêts", value: formatEUR(totalAvecInterets), highlight: true },
                { label: "Frais administratifs (palier N2)", value: palier.niveau >= 2 ? formatEUR(fraisAdministratifs) : "—", sub: true },
                { label: "Honoraires avocat (palier N3)", value: palier.niveau >= 3 ? formatEUR(avocatHonoraires) : "—", sub: true },
                { label: "TOTAL À RÉCLAMER", value: formatEUR(totalReclame), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title="Probabilité de recouvrement"
              lines={[
                { label: "Taux de réussite estimé", value: `${(probaRecouvrement * 100).toFixed(0)} %`, highlight: true },
                { label: "Espérance de récupération", value: formatEUR(esperanceRecupere) },
                { label: "Risque de dépréciation", value: formatEUR(risqueDepreciation), warning: true },
              ]}
            />

            {/* Paliers chronologiques */}
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-3">Calendrier des paliers</h3>
              <div className="space-y-2">
                {[
                  { n: 1, day: 15, label: "N1 — Rappel amiable", desc: "Email + facture en PJ, ton courtois" },
                  { n: 2, day: 30, label: "N2 — Mise en demeure", desc: "LRAR + forfait 40 € + intérêts" },
                  { n: 3, day: 60, label: "N3 — Recouvrement", desc: "Contentieux : injonction de payer ou société de recouvrement" },
                ].map((s) => {
                  const reached = joursRetard >= s.day;
                  const current = palier.niveau === s.n;
                  return (
                    <div key={s.n} className={`flex items-start gap-3 rounded-lg border p-3 ${
                      current ? "border-amber-400 bg-amber-50"
                        : reached ? "border-emerald-200 bg-emerald-50"
                          : "border-card-border bg-background"
                    }`}>
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        current ? "bg-amber-600 text-white"
                          : reached ? "bg-emerald-600 text-white"
                            : "bg-gray-300 text-gray-600"
                      }`}>
                        {reached ? "✓" : s.n}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-navy">{s.label}</div>
                          <div className="text-[10px] font-mono text-muted">J+{s.day}</div>
                        </div>
                        <p className="text-xs text-muted">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <strong>Cadre légal :</strong> loi du 18 avril 2004 modifiée (transposition directive
              2011/7/UE sur le retard de paiement B2B). Délai légal de paiement : 30 jours. Au-delà,
              intérêts de retard dus automatiquement au taux BCE refi + 8 points. Forfait frais de
              recouvrement 40 € minimum. Pour groupes corporate, adapter délais conventionnels dans
              le contrat-cadre. Voir aussi <Link href="/gestion-locative/relances" className="underline">gestion-locative/relances</Link>
              pour les relances locatives résidentielles.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
