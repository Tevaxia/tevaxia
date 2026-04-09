import { NextResponse } from 'next/server';
import { calculateBorrowingCapacity } from '@/lib/propcalc/mortgage';
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
    monthlyIncome,
    existingDebts,
    downPayment,
    annualRate,
    durationYears,
    residencyStatus,
  } = body;

  if (!country || !monthlyIncome) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: country, monthlyIncome' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (typeof monthlyIncome !== 'number' || monthlyIncome <= 0) {
    return NextResponse.json(
      { success: false, error: 'monthlyIncome must be a positive number' },
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
    const borrowingRules = countryData.borrowing;
    const rate =
      typeof annualRate === 'number' ? annualRate : borrowingRules.defaultRate / 100;
    const duration =
      typeof durationYears === 'number'
        ? Math.min(durationYears, borrowingRules.maxDurationYears)
        : Math.min(25, borrowingRules.maxDurationYears);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = calculateBorrowingCapacity({
      monthlyIncome,
      existingDebts: existingDebts ?? 0,
      annualRate: rate,
      durationYears: duration,
      downPayment: downPayment ?? 0,
      insuranceRate: 0,
      countryRules: borrowingRules,
      residencyStatus: residencyStatus ?? 'resident',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          maxLoanAmount: result.maxLoanAmount,
          maxPropertyPrice: result.maxPropertyPrice,
          monthlyPayment: result.monthlyPayment,
          monthlyInsurance: result.monthlyInsurance,
          totalMonthly: result.totalMonthly,
          dtiRatio: result.dtiRatio,
          maxDTI: result.maxDTI,
          ltvApplied: result.ltvApplied,
          estimatedFees: result.estimatedFees,
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
