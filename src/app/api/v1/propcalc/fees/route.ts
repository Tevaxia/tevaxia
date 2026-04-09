import { NextResponse } from 'next/server';
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

  const { country, price, isPrimary, isFirstTime, isNew, region, loanAmount, buyerAge } = body;

  if (!country || !price) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: country, price' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (typeof price !== 'number' || price <= 0) {
    return NextResponse.json(
      { success: false, error: 'price must be a positive number' },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = calculateAcquisitionFees({
      propertyPrice: price,
      countryCode: country.toLowerCase(),
      regionCode: region ?? '',
      isNew: isNew ?? false,
      isPrimaryResidence: isPrimary ?? false,
      isFirstTimeBuyer: isFirstTime ?? false,
      loanAmount: loanAmount ?? 0,
      buyerAge: buyerAge ?? 0,
      countryData,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          totalFees: result.total,
          percentOfPrice: result.totalPercent,
          breakdown: result.items,
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
