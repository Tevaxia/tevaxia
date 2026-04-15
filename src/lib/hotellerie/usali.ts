import type { HotelCategory, UsaliInputs, UsaliResult, UsaliYear } from "./types";

interface DepartmentalRatios {
  roomsCostRatio: number;
  fbCostRatio: number;
  autresCostRatio: number;
  fbShareOfTotal: number;
  miceShareOfTotal: number;
  autresShareOfTotal: number;
}

const DEPT_RATIOS: Record<HotelCategory, DepartmentalRatios> = {
  budget: { roomsCostRatio: 0.25, fbCostRatio: 0.85, autresCostRatio: 0.50, fbShareOfTotal: 0.10, miceShareOfTotal: 0.00, autresShareOfTotal: 0.05 },
  midscale: { roomsCostRatio: 0.30, fbCostRatio: 0.80, autresCostRatio: 0.55, fbShareOfTotal: 0.18, miceShareOfTotal: 0.05, autresShareOfTotal: 0.05 },
  upscale: { roomsCostRatio: 0.32, fbCostRatio: 0.75, autresCostRatio: 0.55, fbShareOfTotal: 0.24, miceShareOfTotal: 0.07, autresShareOfTotal: 0.07 },
  luxury: { roomsCostRatio: 0.35, fbCostRatio: 0.72, autresCostRatio: 0.55, fbShareOfTotal: 0.28, miceShareOfTotal: 0.08, autresShareOfTotal: 0.09 },
};

const UNDISTRIBUTED_RATIOS: Record<HotelCategory, { admin: number; marketing: number; energy: number; maintenance: number }> = {
  budget: { admin: 0.06, marketing: 0.04, energy: 0.05, maintenance: 0.04 },
  midscale: { admin: 0.07, marketing: 0.05, energy: 0.06, maintenance: 0.04 },
  upscale: { admin: 0.08, marketing: 0.06, energy: 0.07, maintenance: 0.05 },
  luxury: { admin: 0.09, marketing: 0.07, energy: 0.08, maintenance: 0.06 },
};

const FFE_RESERVE = 0.04;

const BENCHMARK_GOP_MARGIN: Record<HotelCategory, { low: number; high: number }> = {
  budget: { low: 0.40, high: 0.55 },
  midscale: { low: 0.32, high: 0.45 },
  upscale: { low: 0.28, high: 0.40 },
  luxury: { low: 0.22, high: 0.35 },
};

export function computeUsali(input: UsaliInputs): UsaliResult {
  if (input.nbChambres <= 0) throw new Error("nbChambres must be > 0");
  if (input.adrYear1 <= 0) throw new Error("adrYear1 must be > 0");
  if (input.occupancyYear1 <= 0 || input.occupancyYear1 > 1) {
    throw new Error("occupancyYear1 must be between 0 and 1");
  }
  if (input.horizonYears < 1 || input.horizonYears > 10) {
    throw new Error("horizonYears must be between 1 and 10");
  }
  if (input.fteCount < 0) throw new Error("fteCount must be >= 0");
  if (input.staffCostPerFTE < 0) throw new Error("staffCostPerFTE must be >= 0");

  const ratios = DEPT_RATIOS[input.category];
  const undist = UNDISTRIBUTED_RATIOS[input.category];

  const fbShare = input.hasFB ? ratios.fbShareOfTotal : 0;
  const miceShare = input.hasMICE ? ratios.miceShareOfTotal : 0;
  const autresShare = ratios.autresShareOfTotal;
  const roomsShare = 1 - fbShare - miceShare - autresShare;

  const totalStaffCost = input.fteCount * input.staffCostPerFTE;

  const years: UsaliYear[] = [];
  for (let y = 1; y <= input.horizonYears; y++) {
    const adr = input.adrYear1 * Math.pow(1 + input.adrGrowth, y - 1);
    const occupancy = Math.min(0.95, Math.max(0.05, input.occupancyYear1 + (input.occupancyGrowthPts / 100) * (y - 1)));
    const revPAR = adr * occupancy;
    const revenuRooms = revPAR * 365 * input.nbChambres;
    const revenuTotal = revenuRooms / roomsShare;
    const revenuFB = revenuTotal * fbShare;
    const revenuMICE = revenuTotal * miceShare;
    const revenuAutres = revenuTotal * autresShare;

    const departmentalRooms = revenuRooms * (1 - ratios.roomsCostRatio);
    const departmentalFB = revenuFB * (1 - ratios.fbCostRatio);
    const departmentalAutres = (revenuMICE + revenuAutres) * (1 - ratios.autresCostRatio);
    const totalDepartmentalProfit = departmentalRooms + departmentalFB + departmentalAutres;

    const undistributedAdmin = revenuTotal * undist.admin;
    const undistributedMarketing = revenuTotal * undist.marketing;
    const undistributedEnergy = revenuTotal * undist.energy;
    const undistributedMaintenance = revenuTotal * undist.maintenance;
    const totalUndistributed = undistributedAdmin + undistributedMarketing + undistributedEnergy + undistributedMaintenance + totalStaffCost;

    const gop = totalDepartmentalProfit - totalUndistributed;
    const ffeReserve = revenuTotal * FFE_RESERVE;
    const ebitda = gop - input.fixedCharges - ffeReserve;

    const goppar = gop / (input.nbChambres * 365);

    years.push({
      annee: y,
      occupancy,
      adr,
      revPAR,
      goppar,
      revenuRooms,
      revenuFB,
      revenuMICE,
      revenuAutres,
      revenuTotal,
      departmentalRooms,
      departmentalFB,
      departmentalAutres,
      totalDepartmentalProfit,
      undistributedAdmin,
      undistributedMarketing,
      undistributedEnergy,
      undistributedMaintenance,
      totalUndistributed,
      gop,
      gopMargin: revenuTotal > 0 ? gop / revenuTotal : 0,
      fixedCharges: input.fixedCharges,
      ffeReserve,
      ebitda,
      ebitdaMargin: revenuTotal > 0 ? ebitda / revenuTotal : 0,
    });
  }

  const totalRevenuHorizon = years.reduce((s, y) => s + y.revenuTotal, 0);
  const totalGopHorizon = years.reduce((s, y) => s + y.gop, 0);
  const totalEbitdaHorizon = years.reduce((s, y) => s + y.ebitda, 0);
  const averageGoppar = years.reduce((s, y) => s + y.goppar, 0) / years.length;
  const averageGopMargin = years.reduce((s, y) => s + y.gopMargin, 0) / years.length;
  const averageEbitdaMargin = years.reduce((s, y) => s + y.ebitdaMargin, 0) / years.length;

  const bench = BENCHMARK_GOP_MARGIN[input.category];
  let diagnostic: UsaliResult["benchmark"]["diagnostic"];
  if (averageGopMargin < bench.low) diagnostic = "sous-performance";
  else if (averageGopMargin > bench.high) diagnostic = "sur-performance";
  else diagnostic = "dans la norme";

  return {
    years,
    totalRevenuHorizon,
    totalGopHorizon,
    totalEbitdaHorizon,
    averageGoppar,
    averageEbitdaMargin,
    benchmark: {
      expectedGopMarginLow: bench.low,
      expectedGopMarginHigh: bench.high,
      diagnostic,
    },
  };
}
