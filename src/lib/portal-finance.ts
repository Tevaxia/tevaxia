import type { PortalAccountData } from './coownership-portal';

function cents(amount: number): number {
  const value = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(value) || Math.abs(amount * 100 - value) > 0.0001) throw new Error('Invalid portal amount');
  return value;
}
export function remainingPortalCharge(call: { amount_due: number; amount_paid: number }): number {
  return Math.max(0, cents(call.amount_due) - cents(call.amount_paid)) / 100;
}
export function portalOutstandingStatement(data: PortalAccountData) {
  // Reminders are successive snapshots, not additional journal entries.
  const items = (data.unpaid ?? []).map(call => ({
    date: call.due_date, type: 'call' as const, label: call.call_label,
    debit: cents(call.amount_due) / 100, credit: cents(call.amount_paid) / 100,
  })).sort((a, b) => a.date.localeCompare(b.date));
  const debit = items.reduce((sum, item) => sum + cents(item.debit), 0);
  const credit = items.reduce((sum, item) => sum + cents(item.credit), 0);
  if (!Number.isSafeInteger(debit) || !Number.isSafeInteger(credit)) throw new Error('Portal statement amount exceeds limit');
  return { items, totalDebit: debit / 100, totalCredit: credit / 100, balance: (debit - credit) / 100 };
}
