import { NextResponse } from 'next/server';
import { calculateInvestorCashFlow } from '@/lib/propcalc/cashflow';
import { calculateAcquisitionFees } from '@/lib/propcalc/fees';
import { getCountryData, CORS_HEADERS } from '@/lib/propcalc/countries';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const {
    country,
    propertyPrice,
    downPayment,
    monthlyRent,
    annualRate,
    durationYears,
    marginalRate,
  } = body;

  if (!country || !propertyPrice || !downPayment || !monthlyRent || annualRate == null || !durationYears) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required fields: country, propertyPrice, downPayment, monthlyRent, annualRate, durationYears',
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (typeof propertyPrice !== 'number' || propertyPrice <= 0) {
    return NextResponse.json(
      { success: false, error: 'propertyPrice must be a positive number' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (typeof downPayment !== 'number' || downPayment < 0) {
    return NextResponse.json(
      { success: false, error: 'downPayment must be a non-negative number' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const countryData = getCountryData(country);
  if (!countryData) {
    return NextResponse.json(
      { success: false, error: `Unsupported country: ${country}` },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  try {
    // Estimate acquisition fees to include in total investment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feesResult: any = calculateAcquisitionFees({
      propertyPrice,
      countryCode: country.toLowerCase(),
      regionCode: '',
      isNew: false,
      isPrimaryResidence: false,
      isFirstTimeBuyer: false,
      loanAmount: propertyPrice - downPayment,
      buyerAge: 0,
      countryData,
    });

    const socialChargesRate = country.toLowerCase() === 'fr' ? 0.172 : 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = calculateInvestorCashFlow({
      propertyPrice,
      acquisitionFees: feesResult.total,
      downPayment,
      annualRate,
      loanDurationYears: durationYears,
      monthlyRent,
      vacancyRate: 0.05,
      monthlyCharges: 0,
      annualPropertyTax: 0,
      annualInsurance: 0,
      managementRate: 0,
      annualMaintenance: 0,
      marginalTaxRate: marginalRate ?? 0.30,
      socialChargesRate,
      annualAppreciation: 0.02,
      countryCode: country.toLowerCase(),
      countryData,
    } as any);

    return NextResponse.json(
      {
        success: true,
        data: {
          monthlyCashFlow: result.monthlyCashFlow,
          cashOnCash: result.cashOnCash,
          noi: result.noi,
          grossYield: result.grossYield,
          netYield: result.netYield,
          monthlyMortgage: result.monthlyMortgage,
          cashFlowBeforeTax: result.cashFlowBeforeTax,
          cashFlowAfterTax: result.cashFlowAfterTax,
          leverageEffect: result.leverageEffect,
          totalInvestment: result.totalInvestment,
          cashInvested: result.cashInvested,
          loanAmount: result.loanAmount,
          projection: result.projection,
        },
      },
      { headers: CORS_HEADERS },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Calculation error: ${message}` },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
