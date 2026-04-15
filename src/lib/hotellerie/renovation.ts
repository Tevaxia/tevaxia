import type {
  RenovationHotelInputs,
  RenovationHotelLine,
  RenovationHotelResult,
} from "./types";

interface PostRenovation {
  poste: string;
  coutParChambre: number;
  reductionPct: number;
  tauxAideKlimabonus: number;
}

const POSTES: Record<keyof Pick<RenovationHotelInputs, "travauxIsolation" | "travauxCVC" | "travauxECS" | "travauxLED" | "travauxFenetres">, PostRenovation> = {
  travauxIsolation: {
    poste: "Isolation enveloppe (toiture, façade)",
    coutParChambre: 8500,
    reductionPct: 0.30,
    tauxAideKlimabonus: 0.45,
  },
  travauxCVC: {
    poste: "CVC (chauffage / ventilation / clim)",
    coutParChambre: 6500,
    reductionPct: 0.25,
    tauxAideKlimabonus: 0.40,
  },
  travauxECS: {
    poste: "Eau chaude sanitaire (PAC, solaire)",
    coutParChambre: 2200,
    reductionPct: 0.10,
    tauxAideKlimabonus: 0.50,
  },
  travauxLED: {
    poste: "Éclairage LED + GTB",
    coutParChambre: 800,
    reductionPct: 0.08,
    tauxAideKlimabonus: 0.20,
  },
  travauxFenetres: {
    poste: "Menuiseries (triple vitrage)",
    coutParChambre: 4500,
    reductionPct: 0.15,
    tauxAideKlimabonus: 0.35,
  },
};

const ACTUALISATION_RATE = 0.04;
const HORIZON_YEARS = 10;

export function computeRenovationHotel(input: RenovationHotelInputs): RenovationHotelResult {
  if (input.surfaceChauffeeM2 <= 0) throw new Error("surfaceChauffeeM2 must be > 0");
  if (input.nbChambres <= 0) throw new Error("nbChambres must be > 0");
  if (input.consoActuelleKwhM2 <= 0) throw new Error("consoActuelleKwhM2 must be > 0");
  if (input.prixKwhMoyen <= 0) throw new Error("prixKwhMoyen must be > 0");
  if (input.adr <= 0 || input.occupancy <= 0 || input.occupancy > 1) {
    throw new Error("Invalid ADR / occupancy");
  }

  const lines: RenovationHotelLine[] = [];
  let coutBrutTotal = 0;
  let aideTotal = 0;
  let totalReductionPct = 0;

  for (const [key, post] of Object.entries(POSTES) as Array<[keyof typeof POSTES, PostRenovation]>) {
    const retenu = input[key];
    const coutBrut = retenu ? post.coutParChambre * input.nbChambres : 0;
    const aide = coutBrut * post.tauxAideKlimabonus;
    const coutNet = coutBrut - aide;
    if (retenu) {
      coutBrutTotal += coutBrut;
      aideTotal += aide;
      totalReductionPct += post.reductionPct;
    }
    lines.push({
      poste: post.poste,
      retenu,
      coutBrut,
      tauxAideKlimabonus: post.tauxAideKlimabonus,
      aide,
      coutNet,
    });
  }

  const coutNetTotal = coutBrutTotal - aideTotal;
  totalReductionPct = Math.min(0.65, totalReductionPct);

  const consoAvantKwh = input.consoActuelleKwhM2 * input.surfaceChauffeeM2;
  const consoCible = input.consoCibleKwhM2 > 0
    ? input.consoCibleKwhM2 * input.surfaceChauffeeM2
    : consoAvantKwh * (1 - totalReductionPct);
  const consoApresKwh = Math.min(consoAvantKwh, consoCible);
  const reductionKwh = Math.max(0, consoAvantKwh - consoApresKwh);
  const economiesAnnuelles = reductionKwh * input.prixKwhMoyen;

  const revenuRoomsAnnuel = input.adr * input.occupancy * 365 * input.nbChambres;
  const gainRevparAnnuel = revenuRoomsAnnuel * (input.gainRevparPctViaLabel / 100);

  const paybackSansLabel = economiesAnnuelles > 0 ? coutNetTotal / economiesAnnuelles : Infinity;
  const totalAnnualBenefit = economiesAnnuelles + gainRevparAnnuel;
  const paybackAvecLabel = totalAnnualBenefit > 0 ? coutNetTotal / totalAnnualBenefit : Infinity;

  let vanDixAns = -coutNetTotal;
  for (let y = 1; y <= HORIZON_YEARS; y++) {
    vanDixAns += totalAnnualBenefit / Math.pow(1 + ACTUALISATION_RATE, y);
  }

  return {
    lines,
    coutBrutTotal,
    aideKlimabonusTotal: aideTotal,
    coutNetTotal,
    consoAvantKwh,
    consoApresKwh,
    reductionKwh,
    economiesAnnuelles,
    gainRevparAnnuel,
    paybackSansLabel,
    paybackAvecLabel,
    vanDixAns,
  };
}
