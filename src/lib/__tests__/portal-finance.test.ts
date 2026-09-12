import { it, expect } from 'vitest';
import { remainingPortalCharge, portalOutstandingStatement } from '../portal-finance';
import type { PortalAccountData } from '../coownership-portal';
it('subtracts partial payments using cents and never calls an overpayment an unpaid charge', () => {
  expect(remainingPortalCharge({ amount_due: 100.01, amount_paid: 30.02 })).toBe(69.99);
  expect(remainingPortalCharge({ amount_due: 10, amount_paid: 20 })).toBe(0);
  expect(() => remainingPortalCharge({ amount_due: NaN, amount_paid: 0 })).toThrow();
});
it('does not add repeated reminder snapshots to the outstanding statement', () => {
  const data = { unpaid: [{ due_date: '2026-01-01', call_label: 'Quarter', amount_due: 100.01, amount_paid: 30.02 }], reminders: [{ late_interest: 5, penalty: 40 }, { late_interest: 8, penalty: 40 }] } as PortalAccountData;
  const statement = portalOutstandingStatement(data);
  expect(statement.items).toHaveLength(1); expect(statement.totalDebit).toBe(100.01); expect(statement.totalCredit).toBe(30.02); expect(statement.balance).toBe(69.99);
  expect(data.reminders).toHaveLength(2);
});
