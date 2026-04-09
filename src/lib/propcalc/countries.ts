/**
 * Country data loader for PropCalc API routes.
 * Loads JSON files from src/lib/propcalc/data/countries/.
 */

import luData from './data/countries/lu.json';
import frData from './data/countries/fr.json';
import deData from './data/countries/de.json';
import beData from './data/countries/be.json';
import ukData from './data/countries/uk.json';
import esData from './data/countries/es.json';
import ptData from './data/countries/pt.json';
import itData from './data/countries/it.json';
import nlData from './data/countries/nl.json';
import usData from './data/countries/us.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countriesMap: Record<string, any> = {
  lu: luData,
  fr: frData,
  de: deData,
  be: beData,
  uk: ukData,
  es: esData,
  pt: ptData,
  it: itData,
  nl: nlData,
  us: usData,
};

export const SUPPORTED_COUNTRIES = Object.keys(countriesMap);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCountryData(code: string): any | null {
  return countriesMap[code.toLowerCase()] ?? null;
}

export function getAllCountries() {
  return Object.values(countriesMap).map((c) => ({
    code: c.code,
    name: c.name,
    currency: c.currency,
    currencySymbol: c.currencySymbol,
    flag: c.flag,
  }));
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-RateLimit-Limit': '1000',
};
