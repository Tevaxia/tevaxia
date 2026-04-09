import { NextResponse } from 'next/server';
import { calculateNetYield, calculateTaxImpact } from '@/lib/propcalc/rental';
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
    purchasePrice,
    monthlyRent,
    monthlyCharges,
    annualPropertyTax,
    vacancyRate,
    managementRate,
    taxRegime,
    marginalRate,
  } = body;

  if (!country || !purchasePrice || !monthlyRent) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: country, purchasePrice, monthlyRent' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (typeof purchasePrice !== 'number' || purchasePrice <= 0) {
    return NextResponse.json(
      { success: false, error: 'purchasePrice must be a positive number' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (typeof monthlyRent !== 'number' || monthlyRent <= 0) {
    return NextResponse.json(
      { success: false, error: 'monthlyRent must be a positive number' },
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
    const annualRent = monthlyRent * 12;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yieldResult: any = calculateNetYield({
      annualRent,
      purchasePrice,
      monthlyCharges: monthlyCharges ?? 0,
      annualPropertyTax: annualPropertyTax ?? 0,
      annualInsurance: 0,
      vacancyRate: vacancyRate ?? 0,
      managementRate: managementRate ?? 0,
      annualMaintenance: 0,
    });

    // Calculate tax impact if a tax regime or marginal rate is provided
    const regimes = countryData.rentalTax?.regimes || [];
    const selectedRegime = taxRegime ?? regimes[0]?.code ?? '';
    const socialChargesRate = country.toLowerCase() === 'fr' ? 0.172 : 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taxResult: any = calculateTaxImpact({
      netRent: yieldResult.netRent,
      purchasePrice,
      annualRent,
      countryCode: country.toLowerCase(),
      taxRegime: selectedRegime,
      marginalRate: marginalRate ?? 0.30,
      socialChargesRate,
      countryData,
    } as any);

    return NextResponse.json(
      {
        success: true,
        data: {
          grossYield: yieldResult.grossYield,
          netYield: yieldResult.netYield,
          netAfterTax: taxResult.netAfterTax,
          netNetYield: taxResult.netNetYield,
          annualExpenses: yieldResult.totalExpenses,
          effectiveRent: yieldResult.effectiveRent,
          netRent: yieldResult.netRent,
          expenses: yieldResult.expenses,
          tax: {
            taxableIncome: taxResult.taxableIncome,
            incomeTax: taxResult.incomeTax,
            socialCharges: taxResult.socialCharges,
            totalTax: taxResult.totalTax,
          },
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
