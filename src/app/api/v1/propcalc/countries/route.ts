import { NextResponse } from 'next/server';
import { getAllCountries, CORS_HEADERS } from '@/lib/propcalc/countries';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const countries = getAllCountries();

  return NextResponse.json(
    {
      success: true,
      data: countries,
    },
    { headers: CORS_HEADERS },
  );
}
