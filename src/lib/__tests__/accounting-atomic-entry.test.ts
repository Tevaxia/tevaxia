import { it, expect, vi, beforeEach } from 'vitest';
const rpc = vi.hoisted(() => vi.fn());
vi.mock('../supabase', () => ({ isSupabaseConfigured: true, supabase: { rpc } }));
import { createEntryWithLines } from '../coownership-accounting';
beforeEach(() => rpc.mockReset());
const input = { coownership_id: 'owner', year_id: 'year', entry_date: '2026-01-01', label: 'Invoice', lines: [{ account_id: 'expense', debit: 10, credit: 0 }, { account_id: 'bank', debit: 0, credit: 10 }, { account_id: 'empty', debit: 0, credit: 0 }] };
it('submits the entry and all nonempty lines as one transaction', async () => {
  rpc.mockResolvedValue({ data: { id: 'entry' }, error: null }); expect(await createEntryWithLines(input)).toEqual({ id: 'entry' });
  expect(rpc).toHaveBeenCalledOnce(); expect(rpc).toHaveBeenCalledWith('create_accounting_entry', { p_entry: { coownership_id: 'owner', year_id: 'year', entry_date: '2026-01-01', label: 'Invoice' }, p_lines: input.lines.slice(0,2) });
});
it('propagates a rejected transaction and refuses an empty acknowledgement', async () => {
  rpc.mockResolvedValueOnce({ data: null, error: new Error('closed') }); await expect(createEntryWithLines(input)).rejects.toThrow('closed');
  rpc.mockResolvedValueOnce({ data: null, error: null }); await expect(createEntryWithLines(input)).rejects.toThrow("pas été enregistrée");
});
