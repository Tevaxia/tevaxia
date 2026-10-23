import { calculerFraisAcquisition } from '../calculations';
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

  if (regionCode && !findRegion(acq.regions, regionCode)) throw new RangeError('Unsupported French department');
  if (isNew && typeof params.frenchVatOnFullPrice !== 'boolean') throw new RangeError('For a new French property, explicitly state frenchVatOnFullPrice; building age alone does not establish reduced transfer-tax eligibility');
  const reducedRate = isNew && params.frenchVatOnFullPrice === true;
  if (reducedRate && ![0.055, 0.1, 0.2].includes(params.frenchVatRate)) throw new RangeError('An explicit supported French sale VAT rate is required (0.055, 0.1 or 0.2)');
  if (!reducedRate && params.frenchVatRate !== undefined) throw new RangeError('frenchVatRate requires a confirmed new sale subject to VAT on the full price');
  if (!isNew && params.frenchVatOnFullPrice !== undefined) throw new RangeError('French sale VAT fields require isNew');
  const excludedCosts = ['formalities', 'disbursements', 'additionalActs', 'agencyFees'];
  if (reducedRate) {
    const taxBase = propertyPrice / (1 + params.frenchVatRate);
    const registrationAmount = taxBase * acq.new.registrationRate;
    items.push({
      label: 'fees.registrationTax',
      amount: Math.round(registrationAmount * 100) / 100,
      rate: acq.new.registrationRate * 100,
      details: `Droits réduits 0,71498 % sur prix HT ${taxBase.toFixed(2)} EUR ; prix saisi TTC, TVA ${(params.frenchVatRate * 100).toFixed(1)} % déjà incluse. Vente neuve soumise à TVA sur le prix total confirmée ; TVA sur marge exclue.`,
    });
  } else {
    // Residential ordinary-rate snapshot, not a nationwide average or a tax assessment.
    const region = findRegion(acq.regions, regionCode);
    if (regionCode && !region) throw new RangeError('Unsupported French department; use a listed department or an explicit unlocated scenario');
    const firstPrimary = params.isFirstTimeBuyer === true && params.isPrimaryResidence === true;
    const departmentalRate = firstPrimary
      ? (region?.firstPrimaryDepartmentalTaxRate ?? acq.old.departmentalTax)
      : (region?.departmentalTaxRate ?? acq.old.departmentalTaxMax);
    const dmtoRate = departmentalRate * (1 + acq.old.collectionRate) + acq.old.communalTax;
    items.push({
      label: 'fees.registrationTax',
      amount: Math.round(propertyPrice * dmtoRate * 100) / 100,
      rate: Math.round(dmtoRate * 1e7) / 1e5,
      details: `DMTO résidentiel ${region ? region.name : 'hypothèse sans département'} : ${(dmtoRate * 100).toFixed(5)} % ; département ${(departmentalRate * 100).toFixed(2)} %, commune 1,20 %, collecte 2,37 % du droit départemental. Tableau ${acq.old.rateSnapshot}.${firstPrimary ? ' Primo-accession et résidence principale confirmées pour toute la part acquise ; cas mixtes exclus.' : ''} Hors exonérations locales et cas particuliers.`,
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

  // The local land-register regime is outside this ordinary publication estimate.
  if (regionCode === '67') {
    excludedCosts.push('localLandRegisterPublication');
  } else {
    const csiAmount = Math.max(propertyPrice * acq.csi, acq.csiMinimum);
    items.push({ label: 'fees.csi', amount: Math.round(csiAmount * 100) / 100, rate: acq.csi * 100, details: `CSI de la vente 0,1 % (minimum ${acq.csiMinimum} EUR), hors garantie du prêt` });
  }

  // A guarantee is chosen in the loan offer. A 0.05% registration charge is not its full cost.
  if (params.loanGuaranteeCost !== undefined) {
    if (!Number.isFinite(params.loanGuaranteeCost) || params.loanGuaranteeCost < 0 || params.loanGuaranteeCost > 1e12 || !(loanAmount > 0)) throw new RangeError('loanGuaranteeCost requires a loan and a finite non-negative quoted cost');
    items.push({ label: 'fees.mortgageRegistration', amount: Math.round(params.loanGuaranteeCost * 100) / 100, details: 'Coût de garantie renseigné depuis le devis de financement ; aucun type de garantie présumé' });
  } else if (loanAmount > 0) {
    excludedCosts.push('loanGuarantee');
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    items,
    coverage: { status: 'partial', excludedCosts, priceBasis: 'VAT-inclusive when applicable', reducedRate, saleVatRate: reducedRate ? params.frenchVatRate : null },
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
 * Calculate UK-specific acquisition fees.
 */
function calculateUKFees(params, countryData) {
  const { propertyPrice, regionCode, isFirstTimeBuyer, isPrimaryResidence } = params;
  const region = regionCode || 'ENG';
  if (!['ENG', 'NIR', 'SCT', 'WLS'].includes(region)) throw new RangeError('Unsupported UK tax jurisdiction');
  const additional = params.ukAdditionalProperty === true;
  const nonResident = params.ukNonResident === true;
  if (additional && isFirstTimeBuyer) throw new RangeError('First-time eligibility cannot be combined with an additional-property scenario');
  const eligibleFirst = isFirstTimeBuyer === true && isPrimaryResidence === true && !additional;
  const systemKey = region === 'SCT' ? 'scotland' : region === 'WLS' ? 'wales' : 'england';
  const system = countryData.acquisitionFees.stampDuty[systemKey];
  const ftb = system.firstTimeBuyer;
  const relief = eligibleFirst && systemKey !== 'wales' && (!ftb.maxPropertyPrice || propertyPrice <= ftb.maxPropertyPrice);
  let bands = relief ? ftb.bands : system.bands;
  const additionalApplies = additional && propertyPrice >= 40000;
  if (systemKey === 'wales' && additionalApplies) bands = system.higherBands;
  let duty = calculateStampDuty(propertyPrice, bands, 0, false);
  if (additionalApplies && systemKey !== 'wales') duty += propertyPrice * system.additionalPropertySurcharge;
  const nonResidentApplies = nonResident && systemKey === 'england' && propertyPrice >= 40000;
  if (nonResidentApplies) duty += propertyPrice * system.nonResidentSurcharge;
  const total = Math.round(duty * 100) / 100;
  return {
    items: [{ label: 'fees.stampDuty', amount: total, rate: Math.round(duty / propertyPrice * 10000) / 100,
      details: `${system.name}; ${region}; additional-property rates ${additionalApplies ? 'applied' : 'not applied'}; non-resident surcharge ${nonResidentApplies ? 'applied' : 'not applied'}; first-buyer relief ${relief ? 'applied' : 'not applied'}. Ordinary single residential purchase by individuals; no linked transactions, new lease rent, corporate or transitional rules.` }],
    total, totalPercent: Math.round(duty / propertyPrice * 10000) / 100,
    coverage: { status: 'partial', excludedCosts: ['conveyancing', 'landRegistration', 'survey', 'financing'],
      region, defaultRegionAssumed: !regionCode, additionalPropertyAssumption: additional, nonResidentAssumption: nonResident,
      firstBuyerReliefApplied: relief, rateSnapshot: '2026-09-10' },
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
 * @param {boolean} [params.frenchVatOnFullPrice] - Explicit reduced-rate qualification for a new French sale
 * @param {number} [params.frenchVatRate] - Declared sale VAT ratio, with a VAT-inclusive property price
 * @param {boolean} [params.ukAdditionalProperty] - Confirm higher-rate liability, independently of main-residence use
 * @param {boolean} [params.ukNonResident] - Non-resident surcharge qualification for SDLT
 * @param {number} [params.loanGuaranteeCost] - Quoted French financing guarantee cost, not a statutory rate
 * @param {boolean} [params.luBellegenEligible]
 * @param {number} [params.luCreditRemaining]
 * @param {number} [params.portugueseTaxValue] - VPT; tax base is max(VPT, sale price)
 * @param {boolean} [params.portugueseResident]
 * @param {boolean} [params.portugueseYoungEligible] - All conditions, for every purchaser
 * @param {boolean} [params.nlStarterEligible] - Exemption unused, whole property's conditions satisfied
 * @param {boolean} [params.italianPrimaCasaEligible]
 * @param {boolean} [params.italianPrezzoValore]
 * @param {number} [params.italianCadastralIncome] - Unrevalued rendita catastale
 * @param {boolean} [params.italianVatSale]
 * @param {number} [params.italianVatRate]
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
function calculateLuxembourgFees(params) {
  const { propertyPrice, isPrimaryResidence, loanAmount = 0 } = params;
  if (params.isNew) throw new RangeError('Luxembourg VEFA needs land/construction and VAT inputs; use /frais-acquisition');
  if (params.luBellegenEligible && (!isPrimaryResidence || !Number.isFinite(params.luCreditRemaining))) {
    throw new RangeError('Bëllegen Akt requires confirmed personal eligibility and luCreditRemaining');
  }
  if (!params.luBellegenEligible && params.luCreditRemaining !== undefined) throw new RangeError('luCreditRemaining requires luBellegenEligible');
  const result = calculerFraisAcquisition({ prixBien: propertyPrice, estNeuf: false,
    residencePrincipale: isPrimaryResidence && params.luBellegenEligible === true,
    nbAcquereurs: 1, creditsRestants: [params.luCreditRemaining ?? 0], montantHypotheque: loanAmount });
  const items = [
    { label: 'fees.registrationTax', amount: Math.max(100, result.droitsTotal), rate: 7, details: "Droits d'enregistrement et transcription; minimum 100 EUR" },
    ...(result.creditBellegenAkt > 0 ? [{ label: 'fees.bellegenAkt', amount: -result.creditBellegenAkt, rate: 0, details: 'Solde personnel confirmé; perception minimale 100 EUR' }] : []),
    { label: 'fees.notaryFees', amount: result.emolumentsNotaire, details: 'Émoluments de vente tarifés TTC; copies et débours exclus' },
    ...(loanAmount > 0 ? [{ label: 'fees.mortgageRegistration', amount: result.fraisHypotheque, details: 'Prêt ordinaire: émoluments TTC et droits; garantie égale au principal' }] : []),
  ];
  return { items, total: result.totalFrais, totalPercent: Math.round(result.totalPourcentage * 10000) / 100,
    coverage: { status: 'partial', excludedCosts: ['copies','disbursements','agencyFees','exceptionalActs'],
      priceBasis: 'Existing residential property; one individual buyer. No Bëllegen Akt without explicit eligibility and remaining credit. Shared purchases and VEFA: use /frais-acquisition.' } };
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

  if (!['mainland','azores','madeira'].includes(params.regionCode)) throw new RangeError('Portugal requires region: mainland, azores or madeira');
  if (typeof params.portugueseResident !== 'boolean') throw new RangeError('Portugal requires portugueseResident (fiscal residence at acquisition)');
  if (!Number.isFinite(params.portugueseTaxValue) || params.portugueseTaxValue < 0) throw new RangeError('Portugal requires portugueseTaxValue (VPT)');
  const taxBase = Math.max(propertyPrice, params.portugueseTaxValue);
  const islands = params.regionCode !== 'mainland';
  const young = params.portugueseYoungEligible === true;
  const youngData = acq.imtBands.youngFirstTimeBuyer;
  const exemptionLimit = islands ? youngData.islandsMaxPrice : youngData.maxPrice;
  const partialLimit = islands ? youngData.islandsPartialLimit : youngData.partialLimit;
  if (young && (!isFirstTimeBuyer || !isPrimaryResidence || !params.portugueseResident || !Number.isFinite(buyerAge) || buyerAge < 0 || buyerAge > 35)) {
    throw new RangeError('IMT Jovem requires age <=35, first permanent home, resident status and confirmation of all eligibility conditions');
  }
  if (young && taxBase > partialLimit) throw new RangeError('IMT Jovem above the partial-exemption band is outside this simulator; obtain an AT assessment');
  const key = islands ? (isPrimaryResidence ? 'islandsPrimaryResidence' : 'islandsInvestment') : (isPrimaryResidence ? 'primaryResidence' : 'investment');
  const band = acq.imtBands[key].find(b => b.upTo === null || taxBase <= b.upTo);
  let imtAmount = Math.max(0, taxBase * band.rate - band.deduction);
  if (!params.portugueseResident) imtAmount = taxBase * .075;
  else if (young) imtAmount = Math.max(0, (taxBase - exemptionLimit) * .08);
  items.push({ label: 'fees.registrationTax', amount: Math.round(imtAmount * 100) / 100,
    rate: Math.round(imtAmount / taxBase * 10000) / 100,
    details: `IMT 2026; base max(prix,VPT) ${taxBase} EUR; ${params.regionCode}; ${!params.portugueseResident ? 'non-resident 7.5%, before any separately assessed refund' : young ? 'IMT Jovem eligibility confirmed for every purchaser' : 'ordinary residential scale'}` });
  const seloAmount = Math.max(0, taxBase - (young ? exemptionLimit : 0)) * acq.impostoSelo;
  items.push({ label: 'fees.impostoSelo', amount: Math.round(seloAmount * 100) / 100,
    rate: Math.round(seloAmount / taxBase * 10000) / 100,
    details: young ? 'Imposto do Selo 0.8% after eligible young-buyer deduction' : 'Imposto do Selo 0.8% on max(price,VPT)' });

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
    coverage: { status: 'partial', excludedCosts: ['bankCharges','specialTransactions','mixedBuyerEligibility'], priceBasis: 'Residential full-property purchase; VPT supplied. 2026-10-23 rules; non-resident exceptions/refunds not modeled. Mortgage stamp estimate assumes a term of at least five years. Notary/lawyer estimates require quotes.' },
    total: Math.round(total * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((total / propertyPrice) * 10000) / 100 : 0,
  };
}

/**
 * Calculate Italy-specific acquisition fees.
 */
function calculateItalyFees(params, countryData) {
  const { propertyPrice, isNew } = params;
  const acq = countryData.acquisitionFees;
  const items = [];

  const primaCasa = params.italianPrimaCasaEligible === true;
  const vatSale = params.italianVatSale === true;
  if (isNew && typeof params.italianVatSale !== 'boolean') throw new RangeError('Italy: building age does not establish VAT liability; specify italianVatSale');
  if (vatSale && ![.04,.10,.22].includes(params.italianVatRate)) throw new RangeError('Italy VAT sale requires an explicit italianVatRate (.04, .10 or .22) and a VAT-exclusive price');
  if (vatSale && params.italianVatRate === .04 && !primaCasa) throw new RangeError('Italian 4% VAT requires confirmed prima casa eligibility');
  if (params.italianPrezzoValore && vatSale) throw new RangeError('Prezzo-valore cannot apply to a VAT sale');
  if (!params.italianPrezzoValore && params.italianCadastralIncome !== undefined) throw new RangeError('Cadastral income requires italianPrezzoValore');
  if (vatSale) {
    // Developer: VAT-based
    const dev = { vatRate: params.italianVatRate, fixedFees: 600 };
    const vatAmount = propertyPrice * dev.vatRate;
    items.push({
      label: 'fees.vat',
      amount: Math.round(vatAmount * 100) / 100,
      rate: dev.vatRate * 100,
      details: `IVA ${dev.vatRate * 100}% on VAT-exclusive price; qualification supplied by caller`,
    });
    items.push({
      label: 'fees.registrationTax',
      amount: dev.fixedFees,
      rate: 0,
      details: 'Imposte fisse (registro + ipotecaria + catastale)',
    });
  } else {
    // Private sale: registration-based
    const pvt = primaCasa ? acq.private.primaCasa : acq.private.investment;
    if (params.italianPrezzoValore && (!Number.isFinite(params.italianCadastralIncome) || params.italianCadastralIncome <= 0)) throw new RangeError('Prezzo-valore requires a positive unrevalued italianCadastralIncome and confirmation of eligibility/request in the deed');
    const taxBase = params.italianPrezzoValore ? params.italianCadastralIncome * 1.05 * (primaCasa ? 110 : 120) : propertyPrice;
    const regAmount = Math.max(1000, taxBase * pvt.registrationRate);
    items.push({
      label: 'fees.registrationTax',
      amount: Math.round(regAmount * 100) / 100,
      rate: pvt.registrationRate * 100,
      details: `Imposta di registro ${pvt.registrationRate * 100}% on ${params.italianPrezzoValore ? 'rendita × 1.05 × statutory multiplier' : 'declared sale price (not a cadastral assessment)'}; base ${taxBase} EUR; minimum 1000 EUR`,
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
    coverage: { status: 'partial', excludedCosts: ['specialTransactions','mortgageCosts'], priceBasis: 'Residential purchase by an individual outside a business. Prima casa and prezzo-valore need separate confirmations; otherwise ordinary price-based scenario. VAT status is independent of building age. Notary/agent amounts are quotes-to-confirm, not statutory fees.' },
    total: Math.round(total * 100) / 100,
    totalPercent: propertyPrice > 0 ? Math.round((total / propertyPrice) * 10000) / 100 : 0,
  };
}

/**
 * Calculate Netherlands-specific acquisition fees.
 */
function calculateNetherlandsFees(params, countryData) {
  const { propertyPrice, isNew, isPrimaryResidence, buyerAge } = params;
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

    if (isPrimaryResidence && params.nlStarterEligible === true && buyerAge >= 18 && buyerAge < ob.firstTimeBuyer.maxAge && propertyPrice <= ob.firstTimeBuyer.maxPrice) {
      obRate = ob.firstTimeBuyer.rate;
      obDetails = `Startersvrijstelling (unused exemption confirmed; 0%, 18 <= age < ${ob.firstTimeBuyer.maxAge}, max ${ob.firstTimeBuyer.maxPrice.toLocaleString()} EUR)`;
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
