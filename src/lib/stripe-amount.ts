// Stripe charge/invoice units, not ISO display digits or payout units.
// https://docs.stripe.com/currencies#zero-decimal
const zeroDecimal = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);
export function stripeInvoiceAmount(amount: number, currency: string): number {
  if (!Number.isSafeInteger(amount) || !/^[a-z]{3}$/i.test(currency)) throw new Error('Invalid Stripe amount');
  // ISK/UGX retain two API decimals; HUF/TWD charges also use two decimals.
  return amount / (zeroDecimal.has(currency.toUpperCase()) ? 1 : 100);
}
