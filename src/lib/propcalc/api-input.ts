export type PropcalcEndpoint = 'fees' | 'mortgage' | 'yield' | 'cashflow';
export interface PropcalcApiInput {
 luBellegenEligible?: boolean; luCreditRemaining?: number;
 portugueseTaxValue?: number; portugueseResident?: boolean; portugueseYoungEligible?: boolean;
 nlStarterEligible?: boolean;
 italianPrimaCasaEligible?: boolean; italianPrezzoValore?: boolean; italianCadastralIncome?: number; italianVatSale?: boolean; italianVatRate?: number;
 frenchVatOnFullPrice?: boolean; frenchVatRate?: number; loanGuaranteeCost?: number;
 taxYear?: number; frenchMicroEligible?: boolean; frenchNonProfessional?: boolean; frenchSocialRegime?: string; annualTaxReceipts?: number;
 portugueseCategoryFConfirmed?: boolean; portugueseRentalUse?: string; portugueseAnnualTaxReceipts?: number; portugueseDeductibleExpenses?: number; portugueseModerateRentEligible?: boolean;
 italianCedolareEligible?: boolean; italianAnnualContractRent?: number;
 ukAdditionalProperty?: boolean; ukNonResident?: boolean;
 country: string; price?: number; isPrimary?: boolean; isFirstTime?: boolean; isNew?: boolean; region?: string; loanAmount?: number; buyerAge?: number;
 monthlyIncome?: number; existingDebts?: number; downPayment?: number; annualRate?: number; durationYears?: number; residencyStatus?: 'resident' | 'nonResident' | 'nonEU';
 purchasePrice?: number; monthlyRent?: number; monthlyCharges?: number; annualPropertyTax?: number; vacancyRate?: number; managementRate?: number; taxRegime?: string; marginalRate?: number; propertyPrice?: number;
}
const fields: Record<PropcalcEndpoint, string[]> = {
 fees: ['country','price','isPrimary','isFirstTime','isNew','region','loanAmount','buyerAge','frenchVatOnFullPrice','frenchVatRate','loanGuaranteeCost','ukAdditionalProperty','ukNonResident','luBellegenEligible','luCreditRemaining','portugueseTaxValue','portugueseResident','portugueseYoungEligible','nlStarterEligible','italianPrimaCasaEligible','italianPrezzoValore','italianCadastralIncome','italianVatSale','italianVatRate'],
 mortgage: ['country','monthlyIncome','existingDebts','downPayment','annualRate','durationYears','residencyStatus'],
 yield: ['country','purchasePrice','monthlyRent','monthlyCharges','annualPropertyTax','vacancyRate','managementRate','taxRegime','marginalRate','taxYear','frenchMicroEligible','frenchNonProfessional','frenchSocialRegime','annualTaxReceipts','italianCedolareEligible','italianAnnualContractRent','portugueseCategoryFConfirmed','portugueseRentalUse','portugueseAnnualTaxReceipts','portugueseDeductibleExpenses','portugueseModerateRentEligible'],
 cashflow: ['country','propertyPrice','downPayment','monthlyRent','annualRate','durationYears','marginalRate','loanGuaranteeCost','region','portugueseTaxValue','portugueseResident'],
};
const required: Record<PropcalcEndpoint,string[]> = { fees:['price'],mortgage:['monthlyIncome'],yield:['purchasePrice','monthlyRent'],cashflow:['propertyPrice','downPayment','monthlyRent','annualRate','durationYears'] };
/** Types and arithmetic domains only; national fiscal assumptions require a separate review. */
export function assertPropcalcApiInput(value: unknown, endpoint: PropcalcEndpoint): asserts value is PropcalcApiInput {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RangeError('A JSON object is required');
 const input=value as Record<string,unknown>;
 if (Object.keys(input).some(key=>!fields[endpoint].includes(key))) throw new RangeError('Unsupported input field');
 if (typeof input.country!=='string' || !/^[a-z]{2}$/i.test(input.country)) throw new RangeError('A supported two-letter country code is required');
 for (const [code, names] of Object.entries({ lu:['luBellegenEligible','luCreditRemaining'], pt:['portugueseTaxValue','portugueseResident','portugueseYoungEligible'], nl:['nlStarterEligible'], it:['italianPrimaCasaEligible','italianPrezzoValore','italianCadastralIncome','italianVatSale','italianVatRate'] })) {
  if (input.country.toLowerCase() !== code && names.some(key=>input[key]!==undefined)) throw new RangeError(`Country-specific acquisition fields require country ${code}`);
 }
 if (input.country.toLowerCase() !== 'fr' && ['frenchVatOnFullPrice','frenchVatRate','loanGuaranteeCost','frenchMicroEligible','frenchNonProfessional','frenchSocialRegime','annualTaxReceipts'].some(key=>input[key]!==undefined)) throw new RangeError('French acquisition fields require country fr');
 if (input.country.toLowerCase() !== 'uk' && ['ukAdditionalProperty','ukNonResident'].some(key=>input[key]!==undefined)) throw new RangeError('UK acquisition fields require country uk');
 if (input.country.toLowerCase() !== 'it' && ['italianCedolareEligible','italianAnnualContractRent'].some(key=>input[key]!==undefined)) throw new RangeError('Italian rental fields require country it');
 if (!['fr','pt'].includes(input.country.toLowerCase()) && input.taxYear!==undefined) throw new RangeError('taxYear is supported only for France and Portugal');
 if (input.country.toLowerCase() !== 'pt' && ['portugueseCategoryFConfirmed', 'portugueseRentalUse', 'portugueseAnnualTaxReceipts', 'portugueseDeductibleExpenses', 'portugueseModerateRentEligible'].some(key=>input[key]!==undefined)) throw new RangeError('Portuguese rental fields require country pt');
 for(const key of required[endpoint])if(input[key]===undefined)throw new RangeError(`${key} is required`);
 for(const [key,val] of Object.entries(input)){
  if(key==='country')continue;
  if(['luBellegenEligible','portugueseResident','portugueseYoungEligible','nlStarterEligible','italianPrimaCasaEligible','italianPrezzoValore','italianVatSale','portugueseCategoryFConfirmed','portugueseModerateRentEligible','italianCedolareEligible','isPrimary','isFirstTime','isNew','frenchVatOnFullPrice','frenchMicroEligible','frenchNonProfessional','ukAdditionalProperty','ukNonResident'].includes(key)){if(typeof val!=='boolean')throw new RangeError(`${key} must be boolean`);continue;}
  if(['portugueseRentalUse','region','taxRegime','residencyStatus','frenchSocialRegime'].includes(key)){
   if(typeof val!=='string'||val.length>80)throw new RangeError(`${key} must be a string`);
   if(key==='residencyStatus'&&!['resident','nonResident','nonEU'].includes(val))throw new RangeError('Invalid residencyStatus');
   continue;
  }
  const rate=['annualRate','vacancyRate','managementRate','marginalRate','frenchVatRate','italianVatRate'].includes(key);
  const max=rate?1:key==='durationYears'?50:key==='buyerAge'?130:1e12;
  if(typeof val!=='number'||!Number.isFinite(val)||val<0||val>max)throw new RangeError(`${key} must be a finite number between 0 and ${max}${rate?' (decimal ratio)':''}`);
  if(['price','monthlyIncome','purchasePrice','propertyPrice','monthlyRent','durationYears'].includes(key)&&val===0)throw new RangeError(`${key} must be positive`);
  if(endpoint==='cashflow'&&key==='downPayment'&&val===0)throw new RangeError('A positive downPayment is required for cash-on-cash analysis');
 }
}
export function assertFinitePropcalcResult(value: unknown): void {
 if(typeof value==='number'&&!Number.isFinite(value))throw new RangeError('Non-finite calculation result');
 if(value&&typeof value==='object')for(const child of Object.values(value))assertFinitePropcalcResult(child);
}
