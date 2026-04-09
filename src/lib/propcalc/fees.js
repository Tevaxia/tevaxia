/**
 * Acquisition Fees Calculation Engine
 * Pure calculation functions - no UI dependencies.
 */

/**
 * Calculate notary fees using a sliding scale (France-style).
 * Each slice of the property price is charged at the rate of the bracket it falls in.
 *
 * @param {number} propertyPrice
 * @param {Array} scale - [{upTo, rate}, ...] sorted ascending by upTo, last entry has upTo: null
 * @param {number} vatRate - VAT on notary fees (e.g., 0.20 for 20%)
 * @returns {number} Total notary fees including VAT
 */
export function calculateNotaryFees(propertyPrice, scale, vatRate) {
  if (propertyPrice <= 0 || !scale || scale.length === 0) {
    return 0;
  }

  let fees = 0;
  let previousLimit = 0;

  for (const bracket of scale) {
    const limit = bracket.upTo !== null ? bracket.upTo : Infinity;
    const taxableSlice = Math.min(propertyPrice, limit) - previousLimit;

    if (taxableSlice <= 0) {
      break;
    }

    fees += taxableSlice * bracket.rate;
    previousLimit = limit;

    if (propertyPrice <= limit) {
      break;
    }
  }

  return fees * (1 + vatRate);
}

/**
 * Calculate stamp duty using progressive bands (UK-style).
 * Each band is taxed independently (marginal system).
 *
 * @param {number} propertyPrice
 * @param {Array} bands - [{upTo, rate}, ...] sorted ascending by upTo, last entry has upTo: null
 * @param {number} surcharge - Additional flat rate for second/additional properties (e.g., 0.05)
 * @param {boolean} isAdditionalProperty - Whether the additional property surcharge applies
 * @returns {number} Total stamp duty
 */
export function calculateStampDuty(propertyPrice, bands, surcharge, isAdditionalProperty) {
  if (propertyPrice <= 0 || !bands || bands.length === 0) {
    return 0;
  }

  let duty = 0;
  let previousLimit = 0;

  for (const band of bands) {
    const limit = band.upTo !== null ? band.upTo : Infinity;
    const taxableSlice = Math.min(propertyPrice, limit) - previousLimit;

    if (taxableSlice <= 0) {
      break;
    }

    let rate = band.rate;
    if (isAdditionalProperty && surcharge) {
      rate += surcharge;
    }

    duty += taxableSlice * rate;
    previousLimit = limit;

    if (propertyPrice <= limit) {
      break;
    }
  }

  return duty;
}

/**
 * Find a region object from the regions array by code.
 *
 * @param {Array} regions - Array of region objects
 * @param {string} regionCode - Region code to find
 * @returns {Object|null} The matched region or null
 */
function findRegion(regions, regionCode) {
  if (!regions || !regionCode) return null;
  return regions.find((r) => r.code === regionCode) || null;
}

/**
 * Calculate France-specific acquisition fees.
 */
function calculateFranceFees(params, countryData) {
  const {
    propertyPrice,
    regionCode,
    isNew,
    loanAmount,
  } = params;

  const acq = countryData.acquisitionFees;
  const items = [];

  if (isNew) {
    // New property: reduced registration + VAT is included in price
    const registrationAmount = propertyPrice * acq.new.registrationRate;
    items.push({
      label: 'fees.registrationTax',
      amount: Math.round(registrationAmount * 100) / 100,
      rate: acq.new.registrationRate * 100,
      details: 'Taxe de publicit\u00e9 fonci\u00e8re 0.715%',
    });
  } else {
    // Existing property: DMTO (registration / transfer tax)
    const region = findRegion(acq.regions, regionCode);
    const dmtoRate = region ? region.registrationTaxRate : acq.old.typicalTotal;
    const dmtoAmount = propertyPrice * dmtoRate;
    items.push({
      label: 'fees.registrationTax',
      amount: Math.round(dmtoAmount * 100) / 100,
      rate: dmtoRate * 100,
      details: region
        ? `DMTO ${region.name} (${(dmtoRate * 100).toFixed(2)}%)`
        : `DMTO taux moyen (${(dmtoRate * 100).toFixed(1)}%)`,
    });
  }

  // Notary fees (sliding scale + VAT)
  const notaryAmount = calculateNotaryFees(propertyPrice, acq.notaryScale, acq.notaryVAT);
  items.push({
    label: 'fees.notaryFees',
    amount: Math.round(notaryAmount * 100) / 100,
    rate: propertyPrice > 0 ? Math.round((notaryAmount / propertyPrice) * 10000) / 100 : 0,
    details: '\u00c9moluments du notaire (bar\u00e8me + TVA 20%)',
  });

  // CSI (Contribution de S\u00e9curit\u00e9 Immobili\u00e8re)
  const csiAmount = Math.max(propertyPrice * acq.csi, acq.csiMinimum);
  items.push({
    label: 'fees.csi',
    amount: Math.round(csiAmount * 100) / 100,
    rate: acq.csi * 100,
    details: `CSI ${(acq.csi * 100).toFixed(1)}% (min ${acq.csiMinimum} EUR)`,
  });

  // Mortgage registration (PPD by default)
  if (loanAmount > 0) {
    const ppdRate = acq.mortgageRegistration.ppd.rate;
    const mortgageRegAmount = loanAmount * ppdRate;
    items.push({
      label: 'fees.mortgageRegistration',
      amount: Math.round(mortgageRegAmount * 100) / 100,
      rate: ppdRate * 100,
      details: 'Privil\u00e8ge de pr\u00eateur de deniers (PPD)',
    });
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    items,
    total: Math.round(total * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((total / propertyPrice) * 10000) / 100 : 0,
  };
}

/**
 * Calculate Germany-specific acquisition fees.
 */
function calculateGermanyFees(params, countryData) {
  const {
    propertyPrice,
    regionCode,
    loanAmount,
  } = params;

  const acq = countryData.acquisitionFees;
  const items = [];

  // Grunderwerbsteuer (property transfer tax, varies by Bundesland)
  const region = findRegion(acq.regions, regionCode);
  const transferRate = region ? region.transferTaxRate : 0.05; // default to 5% if no region
  const transferAmount = propertyPrice * transferRate;
  items.push({
    label: 'fees.grunderwerbsteuer',
    amount: Math.round(transferAmount * 100) / 100,
    rate: transferRate * 100,
    details: region
      ? `Grunderwerbsteuer ${region.name} (${(transferRate * 100).toFixed(1)}%)`
      : `Grunderwerbsteuer (${(transferRate * 100).toFixed(1)}%)`,
  });

  // Notary fees (flat rate)
  const notaryAmount = propertyPrice * acq.notaryRate;
  items.push({
    label: 'fees.notaryFees',
    amount: Math.round(notaryAmount * 100) / 100,
    rate: acq.notaryRate * 100,
    details: `Notarkosten (${(acq.notaryRate * 100).toFixed(1)}%)`,
  });

  // Land registry (Grundbuch)
  const grundbuchAmount = propertyPrice * acq.landRegistryRate;
  items.push({
    label: 'fees.grundbuch',
    amount: Math.round(grundbuchAmount * 100) / 100,
    rate: acq.landRegistryRate * 100,
    details: `Grundbucheintragung (${(acq.landRegistryRate * 100).toFixed(1)}%)`,
  });

  // Makler (agent fees - buyer's half since Dec 2020)
  const maklerAmount = propertyPrice * acq.agentFee.buyerShare;
  items.push({
    label: 'fees.makler',
    amount: Math.round(maklerAmount * 100) / 100,
    rate: acq.agentFee.buyerShare * 100,
    details: `Maklerprovision K\u00e4uferanteil (${(acq.agentFee.buyerShare * 100).toFixed(2)}%)`,
  });

  // Grundschuld (mortgage registration)
  if (loanAmount > 0) {
    const grundschuldRate = acq.mortgageRegistration.grundschuld.rate;
    const grundschuldAmount = loanAmount * grundschuldRate;
    items.push({
      label: 'fees.grundschuld',
      amount: Math.round(grundschuldAmount * 100) / 100,
      rate: grundschuldRate * 100,
      details: `Grundschuldbestellung (${(grundschuldRate * 100).toFixed(1)}%)`,
    });
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    items,
    total: Math.round(total * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((total / propertyPrice) * 10000) / 100 : 0,
  };
}

/**
 * Determine which stamp duty system and bands to use for a UK region.
 */
function getUKStampDutyConfig(regionCode, countryData, isFirstTimeBuyer) {
  const stampDuty = countryData.acquisitionFees.stampDuty;

  let systemKey;
  switch (regionCode) {
    case 'SCT':
      systemKey = 'scotland';
      break;
    case 'WLS':
      systemKey = 'wales';
      break;
    case 'ENG':
    case 'NIR':
    default:
      systemKey = 'england';
      break;
  }

  const system = stampDuty[systemKey];

  // Use first-time buyer bands if eligible
  let bands = system.bands;
  if (isFirstTimeBuyer && system.firstTimeBuyer) {
    const ftb = system.firstTimeBuyer;
    // Check max property price limit for FTB relief (England has 500k cap)
    if (ftb.maxPropertyPrice === null || ftb.maxPropertyPrice === undefined) {
      bands = ftb.bands;
    } else {
      // FTB bands only apply if we don't know the price yet; we handle the cap in the caller
      bands = ftb.bands;
    }
  }

  return {
    name: system.name,
    bands,
    surcharge: system.additionalPropertySurcharge || 0,
    nonResidentSurcharge: system.nonResidentSurcharge || 0,
    firstTimeBuyerMaxPrice: system.firstTimeBuyer
      ? system.firstTimeBuyer.maxPropertyPrice
      : null,
    standardBands: system.bands,
  };
}

/**
 * Calculate UK-specific acquisition fees.
 */
function calculateUKFees(params, countryData) {
  const {
    propertyPrice,
    regionCode,
    isFirstTimeBuyer,
    isPrimaryResidence,
  } = params;

  const acq = countryData.acquisitionFees;
  const items = [];

  // Determine stamp duty bands
  const sdConfig = getUKStampDutyConfig(regionCode, countryData, isFirstTimeBuyer);
  const isAdditionalProperty = !isPrimaryResidence;

  // Check FTB price cap (England: 500k) - fall back to standard bands if over limit
  let bands = sdConfig.bands;
  if (isFirstTimeBuyer && sdConfig.firstTimeBuyerMaxPrice !== null) {
    if (propertyPrice > sdConfig.firstTimeBuyerMaxPrice) {
      bands = sdConfig.standardBands;
    }
  }

  const stampDutyAmount = calculateStampDuty(
    propertyPrice,
    bands,
    sdConfig.surcharge,
    isAdditionalProperty,
  );

  items.push({
    label: 'fees.stampDuty',
    amount: Math.round(stampDutyAmount * 100) / 100,
    rate: propertyPrice > 0 ? Math.round((stampDutyAmount / propertyPrice) * 10000) / 100 : 0,
    details: sdConfig.name,
  });

  // Solicitor / Conveyancing
  const solicitorAmount = acq.solicitor.typicalFixed;
  items.push({
    label: 'fees.solicitor',
    amount: solicitorAmount,
    rate: propertyPrice > 0 ? Math.round((solicitorAmount / propertyPrice) * 10000) / 100 : 0,
    details: 'Solicitor / conveyancing fees',
  });

  // Land Registry
  const landRegistryAmount = acq.landRegistry.typicalFixed;
  items.push({
    label: 'fees.landRegistry',
    amount: landRegistryAmount,
    rate: propertyPrice > 0
      ? Math.round((landRegistryAmount / propertyPrice) * 10000) / 100
      : 0,
    details: 'Land Registry fee',
  });

  // Survey
  const surveyAmount = acq.survey.typicalFixed;
  items.push({
    label: 'fees.survey',
    amount: surveyAmount,
    rate: propertyPrice > 0 ? Math.round((surveyAmount / propertyPrice) * 10000) / 100 : 0,
    details: 'Home survey',
  });

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    items,
    total: Math.round(total * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((total / propertyPrice) * 10000) / 100 : 0,
  };
}

/**
 * Calculate all acquisition fees for a property purchase.
 *
 * @param {Object} params
 * @param {number} params.propertyPrice
 * @param {string} params.countryCode - 'fr', 'de', 'uk'
 * @param {string} params.regionCode - Department/Land/nation code
 * @param {boolean} params.isNew - New build vs existing property
 * @param {boolean} params.isPrimaryResidence
 * @param {boolean} params.isFirstTimeBuyer
 * @param {number} params.loanAmount
 * @param {number} params.buyerAge
 * @param {Object} params.countryData - Full country data JSON
 * @returns {Object} { items: [{label, amount, rate, details}], total, totalPercent }
 */
export function calculateAcquisitionFees(params) {
  const { countryCode, countryData } = params;

  if (!countryData || params.propertyPrice <= 0) {
    return { items: [], total: 0, totalPercent: 0 };
  }

  switch (countryCode) {
    case 'fr':
      return calculateFranceFees(params, countryData);
    case 'de':
      return calculateGermanyFees(params, countryData);
    case 'uk':
      return calculateUKFees(params, countryData);
    case 'lu':
      return calculateLuxembourgFees(params, countryData);
    case 'be':
      return calculateBelgiumFees(params, countryData);
    case 'es':
      return calculateSpainFees(params, countryData);
    case 'pt':
      return calculatePortugalFees(params, countryData);
    case 'it':
      return calculateItalyFees(params, countryData);
    case 'nl':
      return calculateNetherlandsFees(params, countryData);
    case 'us':
      return calculateUSFees(params, countryData);
    default:
      return { items: [], total: 0, totalPercent: 0 };
  }
}

/**
 * Calculate Luxembourg-specific acquisition fees.
 */
function calculateLuxembourgFees(params, countryData) {
  const { propertyPrice, isPrimaryResidence, loanAmount } = params;
  const acq = countryData.acquisitionFees;
  const items = [];

  // Registration + transcription (7%)
  const transferAmount = propertyPrice * acq.totalTransferRate;
  items.push({
    label: 'fees.registrationTax',
    amount: Math.round(transferAmount * 100) / 100,
    rate: acq.totalTransferRate * 100,
    details: `Droits d'enregistrement ${(acq.registrationRate * 100)}% + transcription ${(acq.transcriptionRate * 100)}%`,
  });

  // Bëllegen Akt credit (RP only)
  if (isPrimaryResidence && acq.bellegenAkt) {
    const credit = Math.min(acq.bellegenAkt.maxCreditPerPerson, transferAmount);
    items.push({
      label: 'fees.bellegenAkt',
      amount: Math.round(-credit * 100) / 100,
      rate: 0,
      details: `Crédit Bëllegen Akt (max ${acq.bellegenAkt.maxCreditPerPerson.toLocaleString()} EUR/pers.)`,
    });
  }

  // Notary
  const notaryAmount = propertyPrice * acq.notaryRate;
  items.push({
    label: 'fees.notaryFees',
    amount: Math.round(notaryAmount * 100) / 100,
    rate: acq.notaryRate * 100,
    details: 'Frais de notaire',
  });

  // Mortgage registration
  if (loanAmount > 0) {
    const mortgageAmount = loanAmount * acq.mortgageRegistration.rate;
    items.push({
      label: 'fees.mortgageRegistration',
      amount: Math.round(mortgageAmount * 100) / 100,
      rate: acq.mortgageRegistration.rate * 100,
      details: 'Inscription hypothécaire',
    });
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    items,
    total: Math.round(total * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((total / propertyPrice) * 10000) / 100 : 0,
  };
}

/**
 * Calculate Belgium-specific acquisition fees.
 */
function calculateBelgiumFees(params, countryData) {
  const { propertyPrice, regionCode, isNew, isPrimaryResidence, isFirstTimeBuyer, loanAmount } = params;
  const acq = countryData.acquisitionFees;
  const items = [];

  if (isNew) {
    // New build: VAT 21%
    const vatAmount = propertyPrice * acq.new.vatRate;
    items.push({
      label: 'fees.vat',
      amount: Math.round(vatAmount * 100) / 100,
      rate: acq.new.vatRate * 100,
      details: 'TVA sur bien neuf',
    });
  } else {
    // Registration tax varies by region
    const region = findRegion(acq.regions, regionCode);
    let regRate = region ? region.registrationTaxRate : 0.125;

    // First-time buyer / primary residence reductions
    if (isFirstTimeBuyer && isPrimaryResidence && region) {
      if (region.firstTimeBuyerRate != null) {
        regRate = region.firstTimeBuyerRate;
      } else if (region.code === 'BXL' && region.abatementAmount) {
        // Brussels: abatement on first tranche
        const abatementBase = Math.min(propertyPrice, region.abatementAmount);
        const abatementSavings = propertyPrice <= (region.abatementMaxPrice || Infinity)
          ? abatementBase * region.registrationTaxRate
          : 0;
        const fullTax = propertyPrice * region.registrationTaxRate;
        const regAmount = fullTax - abatementSavings;
        items.push({
          label: 'fees.registrationTax',
          amount: Math.round(regAmount * 100) / 100,
          rate: propertyPrice > 0 ? Math.round((regAmount / propertyPrice) * 10000) / 100 : 0,
          details: `${region.name} — abattement ${region.abatementAmount.toLocaleString()} EUR`,
        });
        regRate = null; // skip normal push
      }
    }

    if (regRate != null) {
      const regAmount = propertyPrice * regRate;
      const regionName = region ? region.name : 'Belgique';
      items.push({
        label: 'fees.registrationTax',
        amount: Math.round(regAmount * 100) / 100,
        rate: regRate * 100,
        details: `Droits d'enregistrement ${regionName} (${(regRate * 100).toFixed(1)}%)`,
      });
    }
  }

  // Notary
  const notaryAmount = propertyPrice * acq.notaryRate;
  items.push({
    label: 'fees.notaryFees',
    amount: Math.round(notaryAmount * 100) / 100,
    rate: acq.notaryRate * 100,
    details: 'Frais de notaire (barème fédéral)',
  });

  // Mortgage registration
  if (loanAmount > 0) {
    const mortgageAmount = loanAmount * acq.mortgageRegistration.rate;
    items.push({
      label: 'fees.mortgageRegistration',
      amount: Math.round(mortgageAmount * 100) / 100,
      rate: acq.mortgageRegistration.rate * 100,
      details: 'Inscription hypothécaire',
    });
  }

  // Admin fees
  if (acq.adminFees) {
    items.push({
      label: 'fees.adminFees',
      amount: acq.adminFees,
      rate: propertyPrice > 0 ? Math.round((acq.adminFees / propertyPrice) * 10000) / 100 : 0,
      details: 'Frais administratifs',
    });
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    items,
    total: Math.round(total * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((total / propertyPrice) * 10000) / 100 : 0,
  };
}

/**
 * Calculate Spain-specific acquisition fees.
 */
function calculateSpainFees(params, countryData) {
  const { propertyPrice, regionCode, isNew } = params;
  const acq = countryData.acquisitionFees;
  const items = [];

  if (isNew) {
    // IVA 10% (or IGIC 7% Canarias) + AJD
    const isCanarias = regionCode === 'CAN';
    const vatRate = isCanarias ? acq.new.canariasIgicRate : acq.new.ivaRate;
    const vatAmount = propertyPrice * vatRate;
    items.push({
      label: 'fees.vat',
      amount: Math.round(vatAmount * 100) / 100,
      rate: vatRate * 100,
      details: isCanarias ? 'IGIC Canarias' : 'IVA',
    });

    const ajdAmount = propertyPrice * acq.new.ajdRate;
    items.push({
      label: 'fees.ajd',
      amount: Math.round(ajdAmount * 100) / 100,
      rate: acq.new.ajdRate * 100,
      details: 'AJD (Actos Jurídicos Documentados)',
    });
  } else {
    // ITP by comunidad
    const region = findRegion(acq.regions, regionCode);
    const itpRate = region ? region.itpRate : 0.08;
    const itpAmount = propertyPrice * itpRate;
    items.push({
      label: 'fees.registrationTax',
      amount: Math.round(itpAmount * 100) / 100,
      rate: itpRate * 100,
      details: region
        ? `ITP ${region.name} (${(itpRate * 100).toFixed(1)}%)`
        : `ITP (${(itpRate * 100).toFixed(1)}%)`,
    });
  }

  // Notary
  const notaryAmount = propertyPrice * acq.notaryRate;
  items.push({
    label: 'fees.notaryFees',
    amount: Math.round(notaryAmount * 100) / 100,
    rate: acq.notaryRate * 100,
    details: 'Notaría',
  });

  // Registro
  const registroAmount = propertyPrice * acq.registroRate;
  items.push({
    label: 'fees.landRegistry',
    amount: Math.round(registroAmount * 100) / 100,
    rate: acq.registroRate * 100,
    details: 'Registro de la Propiedad',
  });

  // Gestoría
  if (acq.gestoriaFixed) {
    items.push({
      label: 'fees.gestoria',
      amount: acq.gestoriaFixed,
      rate: propertyPrice > 0 ? Math.round((acq.gestoriaFixed / propertyPrice) * 10000) / 100 : 0,
      details: 'Gestoría',
    });
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    items,
    total: Math.round(total * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((total / propertyPrice) * 10000) / 100 : 0,
  };
}

/**
 * Calculate Portugal-specific acquisition fees.
 */
function calculatePortugalFees(params, countryData) {
  const { propertyPrice, isPrimaryResidence, isFirstTimeBuyer, buyerAge, loanAmount } = params;
  const acq = countryData.acquisitionFees;
  const items = [];

  // IMT calculation
  let imtAmount = 0;
  let imtRate = 0;
  const youngFTB = acq.imtBands.youngFirstTimeBuyer;

  if (isFirstTimeBuyer && isPrimaryResidence && buyerAge && buyerAge < youngFTB.maxAge && propertyPrice <= youngFTB.maxPrice) {
    // Young first-time buyer exemption
    imtAmount = 0;
    items.push({
      label: 'fees.registrationTax',
      amount: 0,
      rate: 0,
      details: `Exemption IMT primo < ${youngFTB.maxAge} ans`,
    });
  } else {
    const bands = isPrimaryResidence ? acq.imtBands.primaryResidence : acq.imtBands.investment;
    for (const band of bands) {
      if (band.flat) {
        imtAmount = propertyPrice * band.rate;
        imtRate = band.rate;
        break;
      }
      const limit = band.upTo !== null ? band.upTo : Infinity;
      if (propertyPrice <= limit) {
        imtAmount = propertyPrice * band.rate - (band.deduction || 0);
        imtRate = band.rate;
        break;
      }
    }
    imtAmount = Math.max(0, imtAmount);
    items.push({
      label: 'fees.registrationTax',
      amount: Math.round(imtAmount * 100) / 100,
      rate: propertyPrice > 0 ? Math.round((imtAmount / propertyPrice) * 10000) / 100 : 0,
      details: `IMT (${(imtRate * 100).toFixed(1)}%)`,
    });
  }

  // Imposto de Selo
  const seloAmount = propertyPrice * acq.impostoSelo;
  items.push({
    label: 'fees.impostoSelo',
    amount: Math.round(seloAmount * 100) / 100,
    rate: acq.impostoSelo * 100,
    details: 'Imposto de Selo (0.8%)',
  });

  // Selo on mortgage
  if (loanAmount > 0) {
    const seloHipAmount = loanAmount * acq.seloHipoteca;
    items.push({
      label: 'fees.mortgageRegistration',
      amount: Math.round(seloHipAmount * 100) / 100,
      rate: acq.seloHipoteca * 100,
      details: 'Selo hipoteca (0.6%)',
    });
  }

  // Notary + Registro
  items.push({
    label: 'fees.notaryFees',
    amount: acq.notaryFixed,
    rate: propertyPrice > 0 ? Math.round((acq.notaryFixed / propertyPrice) * 10000) / 100 : 0,
    details: 'Notário + Conservatória',
  });

  // Lawyer
  const lawyerAmount = propertyPrice * acq.lawyerRate;
  items.push({
    label: 'fees.lawyer',
    amount: Math.round(lawyerAmount * 100) / 100,
    rate: acq.lawyerRate * 100,
    details: 'Advogado (1.25%)',
  });

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    items,
    total: Math.round(total * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((total / propertyPrice) * 10000) / 100 : 0,
  };
}

/**
 * Calculate Italy-specific acquisition fees.
 */
function calculateItalyFees(params, countryData) {
  const { propertyPrice, isNew, isPrimaryResidence } = params;
  const acq = countryData.acquisitionFees;
  const items = [];

  if (isNew) {
    // Developer: VAT-based
    const dev = isPrimaryResidence ? acq.developer.primaCasa : acq.developer.investment;
    const vatAmount = propertyPrice * dev.vatRate;
    items.push({
      label: 'fees.vat',
      amount: Math.round(vatAmount * 100) / 100,
      rate: dev.vatRate * 100,
      details: isPrimaryResidence ? 'IVA 4% prima casa' : 'IVA 10% investimento',
    });
    items.push({
      label: 'fees.registrationTax',
      amount: dev.fixedFees,
      rate: 0,
      details: 'Imposte fisse (registro + ipotecaria + catastale)',
    });
  } else {
    // Private sale: registration-based
    const pvt = isPrimaryResidence ? acq.private.primaCasa : acq.private.investment;
    const regAmount = propertyPrice * pvt.registrationRate;
    items.push({
      label: 'fees.registrationTax',
      amount: Math.round(regAmount * 100) / 100,
      rate: pvt.registrationRate * 100,
      details: isPrimaryResidence
        ? 'Imposta di registro 2% (su valore catastale)'
        : 'Imposta di registro 9% (su valore catastale)',
    });
    items.push({
      label: 'fees.fixedFees',
      amount: pvt.fixedFees,
      rate: 0,
      details: 'Imposte fisse (ipotecaria + catastale)',
    });
  }

  // Notary
  const notaryAmount = propertyPrice * acq.notaryRate * (1 + acq.notaryVAT);
  items.push({
    label: 'fees.notaryFees',
    amount: Math.round(notaryAmount * 100) / 100,
    rate: propertyPrice > 0 ? Math.round((notaryAmount / propertyPrice) * 10000) / 100 : 0,
    details: `Notaio (${(acq.notaryRate * 100).toFixed(1)}% + IVA 22%)`,
  });

  // Agent fee (buyer side)
  const agentAmount = propertyPrice * acq.agentFee.buyerRate * (1 + acq.agentFee.vatRate);
  items.push({
    label: 'fees.agentFee',
    amount: Math.round(agentAmount * 100) / 100,
    rate: propertyPrice > 0 ? Math.round((agentAmount / propertyPrice) * 10000) / 100 : 0,
    details: `Agenzia (${(acq.agentFee.buyerRate * 100)}% + IVA 22%)`,
  });

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    items,
    total: Math.round(total * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((total / propertyPrice) * 10000) / 100 : 0,
  };
}

/**
 * Calculate Netherlands-specific acquisition fees.
 */
function calculateNetherlandsFees(params, countryData) {
  const { propertyPrice, isNew, isFirstTimeBuyer, isPrimaryResidence, buyerAge } = params;
  const acq = countryData.acquisitionFees;
  const items = [];

  if (isNew) {
    const vatAmount = propertyPrice * acq.new.vatRate;
    items.push({
      label: 'fees.vat',
      amount: Math.round(vatAmount * 100) / 100,
      rate: acq.new.vatRate * 100,
      details: 'BTW 21% — geen overdrachtsbelasting',
    });
  } else {
    const ob = acq.overdrachtsbelasting;
    let obRate;
    let obDetails;

    if (isFirstTimeBuyer && buyerAge >= 18 && buyerAge < ob.firstTimeBuyer.maxAge && propertyPrice <= ob.firstTimeBuyer.maxPrice) {
      obRate = ob.firstTimeBuyer.rate;
      obDetails = `Startersvrijstelling (0% primo 18-${ob.firstTimeBuyer.maxAge}, max ${ob.firstTimeBuyer.maxPrice.toLocaleString()} EUR)`;
    } else if (isPrimaryResidence) {
      obRate = ob.occupant.rate;
      obDetails = 'Overdrachtsbelasting eigen woning (2%)';
    } else {
      obRate = ob.investor.rate;
      obDetails = `Overdrachtsbelasting belegger (${(ob.investor.rate * 100)}%)`;
    }

    const obAmount = propertyPrice * obRate;
    items.push({
      label: 'fees.registrationTax',
      amount: Math.round(obAmount * 100) / 100,
      rate: obRate * 100,
      details: obDetails,
    });
  }

  const notaryAmount = acq.notaryFixed * (1 + acq.notaryVAT);
  items.push({
    label: 'fees.notaryFees',
    amount: Math.round(notaryAmount * 100) / 100,
    rate: propertyPrice > 0 ? Math.round((notaryAmount / propertyPrice) * 10000) / 100 : 0,
    details: `Notariskosten (${acq.notaryFixed} EUR + BTW 21%)`,
  });

  items.push({
    label: 'fees.landRegistry',
    amount: acq.kadasterFixed,
    rate: propertyPrice > 0 ? Math.round((acq.kadasterFixed / propertyPrice) * 10000) / 100 : 0,
    details: 'Kadaster',
  });

  if (acq.makelaarRate) {
    const makelaarAmount = propertyPrice * acq.makelaarRate;
    items.push({
      label: 'fees.agentFee',
      amount: Math.round(makelaarAmount * 100) / 100,
      rate: acq.makelaarRate * 100,
      details: 'Aankoopmakelaar (~1%, optioneel)',
    });
  }

  const nlTotal = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    items,
    total: Math.round(nlTotal * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((nlTotal / propertyPrice) * 10000) / 100 : 0,
  };
}

/**
 * Calculate US-specific acquisition fees.
 */
function calculateUSFees(params, countryData) {
  const { propertyPrice, regionCode } = params;
  const acq = countryData.acquisitionFees;
  const items = [];

  const region = findRegion(acq.regions, regionCode);
  const transferRate = region ? region.transferTaxRate : 0;
  if (transferRate > 0) {
    const transferAmount = propertyPrice * transferRate;
    items.push({
      label: 'fees.registrationTax',
      amount: Math.round(transferAmount * 100) / 100,
      rate: transferRate * 100,
      details: region ? `Transfer tax — ${region.name} (${(transferRate * 100).toFixed(2)}%)` : 'Transfer tax',
    });
  }

  const titleAmount = propertyPrice * acq.titleInsuranceRate;
  items.push({
    label: 'fees.titleInsurance',
    amount: Math.round(titleAmount * 100) / 100,
    rate: acq.titleInsuranceRate * 100,
    details: 'Title insurance',
  });

  const escrowAmount = propertyPrice * acq.escrowRate;
  items.push({
    label: 'fees.escrow',
    amount: Math.round(escrowAmount * 100) / 100,
    rate: acq.escrowRate * 100,
    details: 'Escrow / closing costs',
  });

  items.push({
    label: 'fees.landRegistry',
    amount: acq.recordingFixed,
    rate: propertyPrice > 0 ? Math.round((acq.recordingFixed / propertyPrice) * 10000) / 100 : 0,
    details: 'Recording fees',
  });

  items.push({
    label: 'fees.survey',
    amount: acq.appraisalFixed,
    rate: propertyPrice > 0 ? Math.round((acq.appraisalFixed / propertyPrice) * 10000) / 100 : 0,
    details: 'Appraisal',
  });

  items.push({
    label: 'fees.lawyer',
    amount: acq.attorneyFixed,
    rate: propertyPrice > 0 ? Math.round((acq.attorneyFixed / propertyPrice) * 10000) / 100 : 0,
    details: 'Attorney fees',
  });

  const usTotal = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    items,
    total: Math.round(usTotal * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((usTotal / propertyPrice) * 10000) / 100 : 0,
  };
}
