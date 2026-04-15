import type {
  HotelCategory,
  HotelValuationInputs,
  HotelValuationResult,
  RevenueMix,
} from "./types";

const DEFAULT_REVENUE_MIX: Record<HotelCategory, RevenueMix> = {
  budget: { rooms: 0.85, fb: 0.10, autres: 0.05 },
  midscale: { rooms: 0.72, fb: 0.20, autres: 0.08 },
  upscale: { rooms: 0.62, fb: 0.28, autres: 0.10 },
  luxury: { rooms: 0.55, fb: 0.32, autres: 0.13 },
};

const DEFAULT_STAFF_RATIO: Record<HotelCategory, number> = {
  budget: 0.22,
  midscale: 0.28,
  upscale: 0.32,
  luxury: 0.38,
};

const DEFAULT_ENERGY_RATIO: Record<HotelCategory, number> = {
  budget: 0.05,
  midscale: 0.06,
  upscale: 0.07,
  luxury: 0.08,
};

const DEFAULT_OTHER_OPEX_RATIO: Record<HotelCategory, number> = {
  budget: 0.18,
  midscale: 0.20,
  upscale: 0.22,
  luxury: 0.24,
};

const DEFAULT_CAP_RATE: Record<HotelCategory, number> = {
  budget: 0.090,
  midscale: 0.080,
  upscale: 0.070,
  luxury: 0.060,
};

const PRICE_PER_KEY_BASE: Record<HotelCategory, number> = {
  budget: 110000,
  midscale: 180000,
  upscale: 320000,
  luxury: 550000,
};

const DEFAULT_FFE_RESERVE = 0.04;

export function computeHotelValuation(input: HotelValuationInputs): HotelValuationResult {
  if (input.nbChambres <= 0) throw new Error("nbChambres must be > 0");
  if (input.adr <= 0) throw new Error("adr must be > 0");
  if (input.occupancy <= 0 || input.occupancy > 1) {
    throw new Error("occupancy must be between 0 (exclusive) and 1");
  }

  const cat = input.category;
  const mix = input.revenueMix ?? DEFAULT_REVENUE_MIX[cat];
  const staffRatio = input.staffRatio ?? DEFAULT_STAFF_RATIO[cat];
  const energyRatio = input.energyRatio ?? DEFAULT_ENERGY_RATIO[cat];
  const otherOpexRatio = input.otherOpexRatio ?? DEFAULT_OTHER_OPEX_RATIO[cat];
  const ffeRate = input.ffeReserve ?? DEFAULT_FFE_RESERVE;
  const capRate = input.capRate ?? DEFAULT_CAP_RATE[cat];

  const mixSum = mix.rooms + mix.fb + mix.autres;
  if (Math.abs(mixSum - 1) > 0.01) {
    throw new Error(`revenueMix must sum to 1 (got ${mixSum})`);
  }

  const revPAR = input.adr * input.occupancy;
  const revenuRoomsAnnuel = revPAR * 365 * input.nbChambres;
  const revenuTotalAnnuel = revenuRoomsAnnuel / mix.rooms;

  const breakdown = {
    rooms: revenuRoomsAnnuel,
    fb: revenuTotalAnnuel * mix.fb,
    autres: revenuTotalAnnuel * mix.autres,
  };

  const chargesStaff = revenuTotalAnnuel * staffRatio;
  const chargesEnergy = revenuTotalAnnuel * energyRatio;
  const chargesOther = revenuTotalAnnuel * otherOpexRatio;
  const chargesTotal = chargesStaff + chargesEnergy + chargesOther;

  const ffe = revenuTotalAnnuel * ffeRate;
  const gop = revenuTotalAnnuel - chargesTotal;
  const ebitda = gop - ffe;

  const valeurDCF = ebitda > 0 ? ebitda / capRate : 0;
  const pricePerKeyUsed = input.pricePerKeyOverride ?? PRICE_PER_KEY_BASE[cat];
  const valeurMultipleParChambre = pricePerKeyUsed * input.nbChambres;

  const valeurCentrale = (valeurDCF + valeurMultipleParChambre) / 2;
  const fourchetteBasse = valeurCentrale * 0.85;
  const fourchetteHaute = valeurCentrale * 1.15;

  const multipleEbitda = ebitda > 0 ? valeurCentrale / ebitda : 0;

  return {
    revPAR,
    revenuRoomsAnnuel,
    revenuTotalAnnuel,
    breakdown,
    charges: {
      staff: chargesStaff,
      energy: chargesEnergy,
      other: chargesOther,
      total: chargesTotal,
    },
    ffe,
    gop,
    gopMargin: revenuTotalAnnuel > 0 ? gop / revenuTotalAnnuel : 0,
    ebitda,
    ebitdaMargin: revenuTotalAnnuel > 0 ? ebitda / revenuTotalAnnuel : 0,
    capRateUsed: capRate,
    valeurDCF,
    valeurMultipleParChambre,
    pricePerKeyUsed,
    valeurCentrale,
    fourchetteBasse,
    fourchetteHaute,
    multipleEbitda,
  };
}

export function getDefaultsForCategory(cat: HotelCategory) {
  return {
    revenueMix: DEFAULT_REVENUE_MIX[cat],
    staffRatio: DEFAULT_STAFF_RATIO[cat],
    energyRatio: DEFAULT_ENERGY_RATIO[cat],
    otherOpexRatio: DEFAULT_OTHER_OPEX_RATIO[cat],
    capRate: DEFAULT_CAP_RATE[cat],
    pricePerKey: PRICE_PER_KEY_BASE[cat],
    ffeReserve: DEFAULT_FFE_RESERVE,
  };
}
