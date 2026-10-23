import { describe, expect, it } from 'vitest';
import { calculateAcquisitionFees } from '../propcalc/fees';
import { calculateBorrowingCapacity } from '../propcalc/mortgage';
import { getCountryData } from '../propcalc/countries';
import type { AcquisitionFeesResult } from '../propcalc/types';
import { POST as feesApi } from '@/app/api/v1/propcalc/fees/route';
import { POST as yieldApi } from '@/app/api/v1/propcalc/yield/route';
import { POST as cashflowApi } from '@/app/api/v1/propcalc/cashflow/route';

const fees = (countryCode: string, propertyPrice: number, extra = {}) => calculateAcquisitionFees({
  countryCode, propertyPrice, countryData: getCountryData(countryCode), regionCode: '', isNew:false,
  isPrimaryResidence:false, isFirstTimeBuyer:false, loanAmount:0, buyerAge:0, ...extra,
}) as AcquisitionFeesResult;
const item = (result: ReturnType<typeof fees>, label:string) => result.items.find((i: {label:string}) => i.label === label)?.amount;
const pt = { regionCode:'mainland', portugueseResident:true, portugueseTaxValue:0 };
const request = (body:unknown) => new Request('https://tevaxia.lu/api/v1/propcalc/test', { method:'POST',body:JSON.stringify(body) });

describe('2026 national acquisition scenarios', () => {
  it('reads Portugal investment bands with the same schema as primary residence', () => {
    expect(item(fees('pt',300000,pt),'fees.registrationTax')).toBe(11605.50);
    expect(item(fees('pt',250000,{...pt,isPrimaryResidence:true}),'fees.registrationTax')).toBe(7042.04);
    expect(item(fees('pt',2000000,{...pt,isPrimaryResidence:true}),'fees.registrationTax')).toBe(150000);
  });
  it('uses VPT when higher and applies autonomous-region tables', () => {
    expect(item(fees('pt',200000,{...pt,portugueseTaxValue:300000}),'fees.registrationTax')).toBe(11605.50);
    expect(item(fees('pt',300000,{...pt,regionCode:'madeira',isPrimaryResidence:true}),'fees.registrationTax')).toBe(7927.52);
  });
  it('uses the actual 35-inclusive age condition, qualified youth relief and stamp deduction', () => {
    const eligible={...pt,isPrimaryResidence:true,isFirstTimeBuyer:true,buyerAge:35,portugueseYoungEligible:true};
    expect(item(fees('pt',300000,eligible),'fees.registrationTax')).toBe(0);
    expect(item(fees('pt',300000,eligible),'fees.impostoSelo')).toBe(0);
    expect(item(fees('pt',400000,eligible),'fees.registrationTax')).toBe(5556.88);
    expect(item(fees('pt',400000,eligible),'fees.impostoSelo')).toBe(555.69);
    expect(() => fees('pt',300000,{...eligible,buyerAge:36})).toThrow(RangeError);
    expect(item(fees('pt',300000,{...eligible,portugueseYoungEligible:false}),'fees.registrationTax')).toBe(10542.04);
  });
  it('requires Portuguese jurisdiction/residence/base and charges nonresidents before conditional refunds', () => {
    expect(() => fees('pt',300000)).toThrow(RangeError);
    expect(item(fees('pt',300000,{...pt,portugueseResident:false}),'fees.registrationTax')).toBe(22500);
  });
  it('does not grant the Dutch starter exemption to an investor or from first-purchase status alone', () => {
    expect(item(fees('nl',300000,{buyerAge:30,isFirstTimeBuyer:true}),'fees.registrationTax')).toBe(24000);
    expect(item(fees('nl',300000,{buyerAge:30,isPrimaryResidence:true,isFirstTimeBuyer:true}),'fees.registrationTax')).toBe(6000);
    expect(item(fees('nl',300000,{buyerAge:30,isPrimaryResidence:true,nlStarterEligible:true}),'fees.registrationTax')).toBe(0);
    expect(item(fees('nl',300000,{buyerAge:35,isPrimaryResidence:true,nlStarterEligible:true}),'fees.registrationTax')).toBe(6000);
    expect(item(fees('nl',600000,{buyerAge:30,isPrimaryResidence:true,nlStarterEligible:true}),'fees.registrationTax')).toBe(12000);
  });
  it('shares the Luxembourg notary engine and keeps the 100 EUR duty minimum', () => {
    const result=fees('lu',300000,{isPrimaryResidence:true,luBellegenEligible:true,luCreditRemaining:40000});
    expect((item(result,'fees.registrationTax') ?? 0)+(item(result,'fees.bellegenAkt') ?? 0)).toBe(100);
    expect(result.total).toBeCloseTo(result.items.reduce((sum: number,i:{amount:number})=>sum+i.amount,0),2);
    expect(item(fees('lu',300000,{isPrimaryResidence:true}),'fees.bellegenAkt')).toBeUndefined();
    expect(() => fees('lu',300000,{isNew:true})).toThrow(/VEFA/);
  });
  it('uses an explicitly qualified cadastral income for Italian prezzo-valore, preserving price-based costs', () => {
    const result=fees('it',300000,{italianPrimaCasaEligible:true,italianPrezzoValore:true,italianCadastralIncome:1000});
    expect(item(result,'fees.registrationTax')).toBe(2310);
    expect(item(result,'fees.agentFee')).toBe(10980);
    expect(item(fees('it',300000,{italianPrimaCasaEligible:true,italianPrezzoValore:true,italianCadastralIncome:100}),'fees.registrationTax')).toBe(1000);
    expect(item(fees('it',300000),'fees.registrationTax')).toBe(27000);
    expect(() => fees('it',300000,{italianPrezzoValore:true})).toThrow(/CadastralIncome/);
  });
});

describe('API contracts for corrected calculations', () => {
  it('serves a qualified Portuguese investment and cash-flow scenario without schema errors', async () => {
    const extra={region:'mainland',portugueseResident:true,portugueseTaxValue:300000};
    const response=await feesApi(request({country:'pt',price:300000,...extra}));
    expect(response.status).toBe(200);
    const cash=await cashflowApi(request({country:'pt',propertyPrice:300000,downPayment:100000,monthlyRent:1500,annualRate:.035,durationYears:25,...extra}));
    expect(cash.status).toBe(200);
  });
  it.each([['be','cadastral'],['nl','box3']])('refuses to fake %s/%s taxation', async (country,taxRegime) => {
    const response=await yieldApi(request({country,taxRegime,purchasePrice:300000,monthlyRent:1500}));
    expect(response.status).toBe(400);
    const result=await response.json();expect(result.success).toBe(false);expect(result.error).toMatch(/not supported/);
  });
  it('requires true booleans for relief confirmations', async () => {
    expect((await feesApi(request({country:'nl',price:300000,nlStarterEligible:'true'}))).status).toBe(400);
  });
});

describe('simultaneous financing constraints', () => {
  it.each([0,1,1000,50000,500000])('balances every euro for deposit %s', downPayment => {
    const r=calculateBorrowingCapacity({monthlyIncome:5000,existingDebts:0,annualRate:.035,durationYears:25,downPayment,insuranceRate:0,countryRules:{maxDSTI:.45,ltvResident:1},residencyStatus:'resident'}) as { maxPropertyPrice: number; estimatedFees: number; maxLoanAmount: number; monthlyPayment: number };
    expect(r.maxPropertyPrice+r.estimatedFees-r.maxLoanAmount-downPayment).toBeCloseTo(0,1);
    expect(r.maxLoanAmount).toBeLessThanOrEqual(r.maxPropertyPrice+.01);
    expect(r.monthlyPayment).toBeLessThanOrEqual(2250.01);
    if(downPayment===0)expect(r.maxPropertyPrice).toBe(0);
    if(downPayment===1)expect(r.maxPropertyPrice).toBe(12.5);
  });
});
