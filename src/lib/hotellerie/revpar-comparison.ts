import type { RevparCompsetInputs, RevparCompsetResult } from "./types";

export function computeRevparCompset(input: RevparCompsetInputs): RevparCompsetResult {
  if (input.hotelOccupancy <= 0 || input.hotelOccupancy > 1) {
    throw new Error("hotelOccupancy must be in (0, 1]");
  }
  if (input.compsetOccupancy <= 0 || input.compsetOccupancy > 1) {
    throw new Error("compsetOccupancy must be in (0, 1]");
  }
  if (input.hotelADR <= 0 || input.compsetADR <= 0) {
    throw new Error("ADR values must be > 0");
  }
  if (input.nbChambres <= 0) throw new Error("nbChambres must be > 0");

  const hotelRevPAR = input.hotelADR * input.hotelOccupancy;
  const compsetRevPAR = input.compsetADR * input.compsetOccupancy;

  const mpi = (input.hotelOccupancy / input.compsetOccupancy) * 100;
  const ari = (input.hotelADR / input.compsetADR) * 100;
  const rgi = (hotelRevPAR / compsetRevPAR) * 100;

  let diagnostic: RevparCompsetResult["diagnostic"];
  let diagnosticDetail: string;

  if (rgi >= 110) {
    diagnostic = "sur-performance";
    diagnosticDetail = "RevPAR > 10 % au-dessus du marché — vérifier la durabilité (fair share trop élevé peut indiquer une politique de prix risquée).";
  } else if (rgi >= 95) {
    diagnostic = "sain";
    diagnosticDetail = "Performance dans la norme du compset (fair share atteint).";
  } else if (mpi < 95 && ari >= 100) {
    diagnostic = "problème prix";
    diagnosticDetail = "Prix supérieurs au marché mais occupation en retrait — yield management trop agressif, baisser ADR ou améliorer la value perception.";
  } else if (ari < 95 && mpi >= 100) {
    diagnostic = "problème commercial";
    diagnosticDetail = "Bonne occupation mais prix sous le marché — sous-pricing, le revenue management peut faire monter l'ADR.";
  } else {
    diagnostic = "problème commercial";
    diagnosticDetail = "Sous-performance double (occupation ET prix sous le marché) — diagnostic produit/distribution requis.";
  }

  const fairShareRevPAR = compsetRevPAR;
  const manqueAGagnerPourFair = Math.max(0, fairShareRevPAR - hotelRevPAR);
  const manqueAGagnerAnnuel = manqueAGagnerPourFair * 365 * input.nbChambres;

  return {
    hotelRevPAR,
    compsetRevPAR,
    mpi,
    ari,
    rgi,
    diagnostic,
    diagnosticDetail,
    manqueAGagnerAnnuel,
  };
}
