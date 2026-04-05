// ============================================================
// NARRATIVE — Génération de texte d'analyse (templates, 0 coût)
// ============================================================
// Assemble un texte structuré à partir des résultats de valorisation.
// Pas d'IA — du remplissage de templates intelligent.
// Uses translation keys — the caller resolves them via t().

import { formatEUR } from "./calculations";

interface NarrativeInput {
  // Contexte
  commune?: string;
  quartier?: string;
  assetType: string;
  evsType: string;
  surface: number;
  // Valeurs
  valeurComparaison?: number;
  valeurCapitalisation?: number;
  valeurDCF?: number;
  valeurReconciliee?: number;
  // Capitalisation
  noi?: number;
  tauxCap?: number;
  rendementInitial?: number;
  rendementReversionnaire?: number;
  sousLoue?: boolean;
  // DCF
  irr?: number;
  tauxActualisation?: number;
  tauxCapSortie?: number;
  // MLV
  mlv?: number;
  ratioMLV?: number;
  // ESG
  esgScore?: number;
  esgNiveau?: string;
  esgImpact?: number;
  classeEnergie?: string;
  // Marché
  prixM2Commune?: number;
  nbTransactions?: number;
}

// The t() function type from next-intl
type TFunction = (key: string, values?: Record<string, string | number>) => string;

function positionVsMarche(t: TFunction, valeurM2: number, marchM2: number): string {
  const ecart = ((valeurM2 - marchM2) / marchM2) * 100;
  if (ecart > 10) return t("narrPosWellAbove", { prix: formatEUR(marchM2), pct: ecart.toFixed(0) });
  if (ecart > 3) return t("narrPosSlightlyAbove", { prix: formatEUR(marchM2), pct: ecart.toFixed(0) });
  if (ecart > -3) return t("narrPosInLine", { prix: formatEUR(marchM2) });
  if (ecart > -10) return t("narrPosSlightlyBelow", { prix: formatEUR(marchM2), pct: ecart.toFixed(0) });
  return t("narrPosWellBelow", { prix: formatEUR(marchM2), pct: ecart.toFixed(0) });
}

function coherenceMethodes(t: TFunction, vals: number[]): string {
  if (vals.length < 2) return "";
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const moy = vals.reduce((s, v) => s + v, 0) / vals.length;
  const ecart = ((max - min) / moy) * 100;
  if (ecart < 5) return t("narrCoherenceExcellente");
  if (ecart < 15) return t("narrCoherenceSatisfaisante");
  if (ecart < 25) return t("narrCoherenceEcartSignificatif");
  return t("narrCoherenceEcartImportant");
}

export function genererNarrative(input: NarrativeInput, t: TFunction): string {
  const sections: string[] = [];

  // 1. Introduction
  const localisation = input.quartier
    ? `${input.quartier}, ${t("narrCommuneDe", { commune: input.commune || "" })}`
    : input.commune || t("narrLocNonPrecisee");

  sections.push(
    t("narrIntroduction", {
      assetType: input.assetType.toLowerCase(),
      surface: input.surface,
      localisation,
      evsType: input.evsType,
    })
  );

  // 2. Contexte marché
  if (input.prixM2Commune) {
    const contexte = input.nbTransactions && input.nbTransactions > 50
      ? t("narrMarcheVolumeSignificatif", { nb: input.nbTransactions })
      : input.nbTransactions
      ? t("narrMarcheVolumeLimite", { nb: input.nbTransactions })
      : "";
    sections.push(
      t("narrContexteMarche", { prix: formatEUR(input.prixM2Commune) }) + " " + contexte
    );
  }

  // 3. Résultats par méthode
  const valeurs: number[] = [];

  if (input.valeurComparaison && input.valeurComparaison > 0) {
    valeurs.push(input.valeurComparaison);
    const m2 = input.surface > 0 ? input.valeurComparaison / input.surface : 0;
    let position = "";
    if (input.prixM2Commune && m2 > 0) {
      position = " " + t("narrPositionPrix") + " " + positionVsMarche(t, m2, input.prixM2Commune) + ".";
    }
    sections.push(
      t("narrMethodeComparaison", { valeur: formatEUR(input.valeurComparaison), m2: formatEUR(Math.round(m2)) }) + position
    );
  }

  if (input.valeurCapitalisation && input.valeurCapitalisation > 0 && input.noi) {
    valeurs.push(input.valeurCapitalisation);
    let detail = t("narrCapNOI", { noi: formatEUR(input.noi), taux: input.tauxCap?.toFixed(2) || "0" });
    if (input.rendementReversionnaire !== undefined && input.sousLoue !== undefined) {
      detail += " " + (input.sousLoue ? t("narrCapSousLoue") : t("narrCapSurLoue"));
    }
    sections.push(
      t("narrMethodeCapitalisation", { valeur: formatEUR(input.valeurCapitalisation) }) + " " + detail
    );
  }

  if (input.valeurDCF && input.valeurDCF > 0) {
    valeurs.push(input.valeurDCF);
    const irrText = input.irr ? " " + t("narrDCFIRR", { irr: (input.irr * 100).toFixed(2) }) : "";
    sections.push(
      t("narrMethodeDCF", {
        valeur: formatEUR(input.valeurDCF),
        tauxActu: input.tauxActualisation?.toFixed(2) || "0",
        tauxSortie: input.tauxCapSortie?.toFixed(2) || "0",
      }) + irrText
    );
  }

  // 4. Cohérence
  if (valeurs.length >= 2) {
    sections.push(coherenceMethodes(t, valeurs));
  }

  // 5. Réconciliation
  if (input.valeurReconciliee && input.valeurReconciliee > 0) {
    sections.push(
      t("narrReconciliation", {
        valeur: formatEUR(input.valeurReconciliee),
        m2: formatEUR(Math.round(input.valeurReconciliee / input.surface)),
      })
    );
  }

  // 6. MLV
  if (input.mlv && input.mlv > 0 && input.ratioMLV) {
    sections.push(
      t("narrMLV", {
        mlv: formatEUR(input.mlv),
        ratio: (input.ratioMLV * 100).toFixed(1),
      })
    );
  }

  // 7. ESG
  if (input.esgScore !== undefined) {
    let esgKey: string;
    if (input.esgScore >= 60) esgKey = "narrESGBon";
    else if (input.esgScore >= 40) esgKey = "narrESGMoyen";
    else esgKey = "narrESGInsuffisant";

    const esgComment = t(esgKey, {
      score: input.esgScore,
      niveau: input.esgNiveau || "",
      impact: String(input.esgImpact || 0),
    });

    if (input.classeEnergie) {
      sections.push(
        t("narrESGClasse", { classe: input.classeEnergie }) + " " + esgComment
      );
    }
  }

  // 8. Réserves
  sections.push(t("narrReserves"));

  return sections.join("\n\n");
}
