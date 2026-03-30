"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatEUR2 } from "@/lib/calculations";

export default function AchatVsLocation() {
  // Achat
  const [prixBien, setPrixBien] = useState(750000);
  const [apport, setApport] = useState(150000);
  const [tauxCredit, setTauxCredit] = useState(3.5);
  const [dureeCredit, setDureeCredit] = useState(25);
  const [fraisAcquisitionPct, setFraisAcquisitionPct] = useState(7);
  const [chargesCoproMensuel, setChargesCoproMensuel] = useState(250);
  const [taxeFonciereAn, setTaxeFonciereAn] = useState(200);
  const [entretienAnPct, setEntretienAnPct] = useState(1);
  const [appreciationAn, setAppreciationAn] = useState(2);

  // Location
  const [loyerMensuel, setLoyerMensuel] = useState(2000);
  const [indexationLoyer, setIndexationLoyer] = useState(2);

  // Placement alternatif (si on loue, on place l'apport)
  const [rendementPlacement, setRendementPlacement] = useState(4);

  // Horizon
  const [horizon, setHorizon] = useState(15);

  const result = useMemo(() => {
    const montantCredit = prixBien - apport;
    const fraisAcquisition = prixBien * (fraisAcquisitionPct / 100);
    const tauxMensuel = tauxCredit / 100 / 12;
    const nbMois = dureeCredit * 12;

    // Mensualité crédit
    const mensualiteCredit = tauxMensuel > 0
      ? montantCredit * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois)) / (Math.pow(1 + tauxMensuel, nbMois) - 1)
      : montantCredit / nbMois;

    // Tableaux année par année
    const annees: {
      annee: number;
      // Achat
      coutAchatCumule: number;
      capitalRembourse: number;
      capitalRestant: number;
      valeurBien: number;
      patrimoineNetAchat: number;
      // Location
      coutLocationCumule: number;
      placementCapital: number;
      patrimoineNetLocation: number;
    }[] = [];

    let coutAchatCumule = apport + fraisAcquisition;
    let capitalRestant = montantCredit;
    let coutLocationCumule = 0;
    let placementCapital = apport + fraisAcquisition; // Si on loue, on garde l'apport + frais
    let loyerAnnuel = loyerMensuel * 12;

    for (let a = 1; a <= horizon; a++) {
      // ACHAT
      const valeurBien = prixBien * Math.pow(1 + appreciationAn / 100, a);
      const interetsAnnuels = capitalRestant * (tauxCredit / 100);
      const capitalAnnuel = Math.min(mensualiteCredit * 12 - interetsAnnuels, capitalRestant);
      capitalRestant = Math.max(0, capitalRestant - capitalAnnuel);

      const coutAchatAnnuel = mensualiteCredit * 12 + chargesCoproMensuel * 12 + taxeFonciereAn + prixBien * (entretienAnPct / 100);
      coutAchatCumule += coutAchatAnnuel;

      const patrimoineNetAchat = valeurBien - capitalRestant;

      // LOCATION
      coutLocationCumule += loyerAnnuel;
      const economieMensuelle = (mensualiteCredit + chargesCoproMensuel + taxeFonciereAn / 12 + prixBien * (entretienAnPct / 100) / 12) - loyerMensuel * Math.pow(1 + indexationLoyer / 100, a - 1);
      if (economieMensuelle > 0) {
        placementCapital += economieMensuelle * 12;
      }
      placementCapital *= (1 + rendementPlacement / 100);
      loyerAnnuel *= (1 + indexationLoyer / 100);

      annees.push({
        annee: a,
        coutAchatCumule,
        capitalRembourse: montantCredit - capitalRestant,
        capitalRestant,
        valeurBien,
        patrimoineNetAchat,
        coutLocationCumule,
        placementCapital,
        patrimoineNetLocation: placementCapital,
      });
    }

    // Point de croisement : quand achat devient plus avantageux
    const croisement = annees.find((a) => a.patrimoineNetAchat > a.patrimoineNetLocation);

    return {
      mensualiteCredit,
      fraisAcquisition,
      montantCredit,
      annees,
      croisement,
      derniere: annees[annees.length - 1],
    };
  }, [prixBien, apport, tauxCredit, dureeCredit, fraisAcquisitionPct, chargesCoproMensuel, taxeFonciereAn, entretienAnPct, appreciationAn, loyerMensuel, indexationLoyer, rendementPlacement, horizon]);

  const coutMensuelTotal = result.mensualiteCredit + chargesCoproMensuel + taxeFonciereAn / 12 + prixBien * (entretienAnPct / 100) / 12;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Acheter ou louer ?</h1>
          <p className="mt-2 text-muted">Comparez le coût total et le patrimoine constitué sur la durée</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Achat</h2>
              <div className="space-y-4">
                <InputField label="Prix du bien" value={prixBien} onChange={(v) => setPrixBien(Number(v))} suffix="€" />
                <InputField label="Apport personnel" value={apport} onChange={(v) => setApport(Number(v))} suffix="€" />
                <InputField label="Taux du crédit" value={tauxCredit} onChange={(v) => setTauxCredit(Number(v))} suffix="%" step={0.1} />
                <InputField label="Durée du crédit" value={dureeCredit} onChange={(v) => setDureeCredit(Number(v))} suffix="ans" />
                <InputField label="Frais d'acquisition" value={fraisAcquisitionPct} onChange={(v) => setFraisAcquisitionPct(Number(v))} suffix="%" hint="Droits 7% - Bëllegen Akt. Utilisez le simulateur pour le détail." />
                <InputField label="Charges copropriété" value={chargesCoproMensuel} onChange={(v) => setChargesCoproMensuel(Number(v))} suffix="€/mois" />
                <InputField label="Impôt foncier" value={taxeFonciereAn} onChange={(v) => setTaxeFonciereAn(Number(v))} suffix="€/an" hint="Très faible au Luxembourg" />
                <InputField label="Entretien annuel" value={entretienAnPct} onChange={(v) => setEntretienAnPct(Number(v))} suffix="% prix" hint="Configurable — typiquement 0,5-1,5%" step={0.1} />
                <InputField label="Appréciation annuelle du bien" value={appreciationAn} onChange={(v) => setAppreciationAn(Number(v))} suffix="%" step={0.1} hint="Configurable — historique LU ~3-5%/an, récent ~2%" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Location</h2>
              <div className="space-y-4">
                <InputField label="Loyer mensuel" value={loyerMensuel} onChange={(v) => setLoyerMensuel(Number(v))} suffix="€" />
                <InputField label="Indexation annuelle du loyer" value={indexationLoyer} onChange={(v) => setIndexationLoyer(Number(v))} suffix="%" step={0.1} hint="Augmentation max 10% / 2 ans (réforme 2024)" />
                <InputField label="Rendement placement alternatif" value={rendementPlacement} onChange={(v) => setRendementPlacement(Number(v))} suffix="%" step={0.1} hint="Configurable — si on loue, on place l'apport ailleurs" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Horizon</h2>
              <InputField label="Durée de comparaison" value={horizon} onChange={(v) => setHorizon(Number(v))} suffix="ans" min={1} max={35} />
            </div>
          </div>

          {/* Résultats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verdict */}
            <div className={`rounded-2xl p-8 text-white text-center shadow-lg ${
              result.derniere.patrimoineNetAchat > result.derniere.patrimoineNetLocation
                ? "bg-gradient-to-br from-navy to-navy-light"
                : "bg-gradient-to-br from-teal to-teal-light"
            }`}>
              <div className="text-sm text-white/60">
                {result.derniere.patrimoineNetAchat > result.derniere.patrimoineNetLocation
                  ? `Acheter est plus avantageux sur ${horizon} ans`
                  : `Louer est plus avantageux sur ${horizon} ans`}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-xs text-white/50">Patrimoine net si achat</div>
                  <div className="text-3xl font-bold mt-1">{formatEUR(result.derniere.patrimoineNetAchat)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Capital si location + placement</div>
                  <div className="text-3xl font-bold mt-1">{formatEUR(result.derniere.patrimoineNetLocation)}</div>
                </div>
              </div>
              {result.croisement && (
                <div className="mt-4 text-sm text-white/70">
                  L'achat devient plus avantageux à partir de l'année {result.croisement.annee}
                </div>
              )}
            </div>

            {/* Coûts mensuels comparés */}
            <div className="grid gap-4 sm:grid-cols-2">
              <ResultPanel
                title="Coût mensuel — Achat"
                lines={[
                  { label: "Mensualité crédit", value: formatEUR2(result.mensualiteCredit) },
                  { label: "Charges copropriété", value: formatEUR2(chargesCoproMensuel), sub: true },
                  { label: "Impôt foncier", value: formatEUR2(taxeFonciereAn / 12), sub: true },
                  { label: "Entretien", value: formatEUR2(prixBien * entretienAnPct / 100 / 12), sub: true },
                  { label: "Total mensuel achat", value: formatEUR2(coutMensuelTotal), highlight: true },
                ]}
              />
              <ResultPanel
                title="Coût mensuel — Location"
                lines={[
                  { label: "Loyer (année 1)", value: formatEUR2(loyerMensuel) },
                  { label: `Loyer (année ${horizon})`, value: formatEUR2(loyerMensuel * Math.pow(1 + indexationLoyer / 100, horizon - 1)), sub: true },
                  { label: "Différence mensuelle (an 1)", value: formatEUR2(coutMensuelTotal - loyerMensuel), highlight: true },
                ]}
              />
            </div>

            {/* Tableau année par année */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">Année</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Valeur bien</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Capital restant dû</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Patrimoine achat</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Capital placement</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Avantage</th>
                  </tr>
                </thead>
                <tbody>
                  {result.annees.filter((a) => a.annee % (horizon > 15 ? 3 : horizon > 10 ? 2 : 1) === 0 || a.annee === 1 || a.annee === horizon).map((a) => {
                    const diff = a.patrimoineNetAchat - a.patrimoineNetLocation;
                    return (
                      <tr key={a.annee} className="border-b border-card-border/50 hover:bg-background/50">
                        <td className="px-3 py-1.5 font-medium">{a.annee}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(a.valeurBien)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-muted">{formatEUR(a.capitalRestant)}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold">{formatEUR(a.patrimoineNetAchat)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(a.patrimoineNetLocation)}</td>
                        <td className={`px-3 py-1.5 text-right font-mono font-semibold ${diff > 0 ? "text-navy" : "text-teal"}`}>
                          {diff > 0 ? "Achat" : "Location"} {formatEUR(Math.abs(diff))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Hypothèses configurables :</strong> Le résultat dépend fortement de l'appréciation du bien
                ({appreciationAn}%/an) et du rendement du placement alternatif ({rendementPlacement}%/an).
                Modifiez ces paramètres pour tester différents scénarios. Les frais d'acquisition au Luxembourg (Bëllegen Akt)
                rendent l'achat plus attractif qu'en France grâce au crédit d'impôt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
