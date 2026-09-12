import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../supabase', () => ({ isSupabaseConfigured: true, supabase: { rpc: mock.rpc } }));
import { fetchSharedLinkByToken, parsePublicSharedLink, postSharedLinkComment } from '../shared-links';
import { isEstimationPayload, isValorisationPayload, isMonthlyDcfPayload, isDcfMultiPayload, isHotelValorisationPayload, sharedCalculatorPath } from '../public-shared-payload';
import { calculerDCFLeases } from '../dcf-leases';
const token = 'a'.repeat(48);
const estimate = () => ({ inputs: { commune: 'Test', surface: 50 }, results: { estimationBasse: 100, estimationCentrale: 120.75, estimationHaute: 130, prixM2Ajuste: 2.415, confiance: 'moyenne', ajustements: [{ label: '<script>plain text</script>', pct: 0 }] } });
const link = () => ({ success: true, tool_type: 'estimation', title: 'Snapshot', payload: estimate(), view_count: 1, expires_at: '2026-10-01T00:00:00+00:00' });
const reply = (data: unknown, error: unknown = null) => mock.rpc.mockReturnValue({ abortSignal: vi.fn().mockResolvedValue({ data, error }) });
beforeEach(() => { mock.rpc.mockReset(); reply(link()); });
afterEach(() => vi.restoreAllMocks());
it.each(['', '../secret', 'a'.repeat(47), 'b'.repeat(49), 'x'.repeat(48)])('does not request an invalid token %s', async value => {
  expect(await fetchSharedLinkByToken(value)).toEqual({ success: false, error: 'invalid_token' }); expect(mock.rpc).not.toHaveBeenCalled();
});
it('accepts an explicit public response and drops unexpected private metadata', async () => {
  reply({ ...link(), owner_user_id: 'private', visitor_email: 'private' });
  expect(await fetchSharedLinkByToken(token)).toEqual(link());
  expect(mock.rpc).toHaveBeenCalledExactlyOnceWith('get_shared_link', { p_token: token });
  expect(mock.rpc.mock.results[0].value.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
});
it.each(['not_found', 'expired', 'view_limit_reached'])('preserves explicit %s server refusals', async error => {
  reply({ success: false, error }); expect(await fetchSharedLinkByToken(token)).toEqual({ success: false, error });
});
it.each([null, {}, { success: 'true' }, { ...link(), view_count: '1' }, { ...link(), view_count: -1 }, { ...link(), title: {} }, { ...link(), expires_at: 'invalid' }, { ...link(), tool_type: 'new-unknown-tool' }, { ...link(), payload: [] }])('rejects malformed response %# without inventing missing data', data => {
  expect(parsePublicSharedLink(data)).toEqual({ success: false, error: 'invalid_response' });
});
it('rejects excessive size, nesting, cycles and non-finite stored values', () => {
  const deep: Record<string, unknown> = {}; let node = deep;
  for (let i = 0; i < 40; i++) { const next = {}; node.child = next; node = next; }
  const cycle: Record<string, unknown> = {}; cycle.self = cycle;
  for (const payload of [deep, cycle, { bad: Infinity }, { huge: 'x'.repeat(1000001) }]) expect(parsePublicSharedLink({ ...link(), payload }).success).toBe(false);
});
it('keeps network, timeout and database errors distinct from a missing link and never retries automatically', async () => {
  mock.rpc.mockImplementation(() => { throw Error('offline'); });
  expect(await fetchSharedLinkByToken(token)).toEqual({ success: false, error: 'unavailable' }); expect(mock.rpc).toHaveBeenCalledTimes(1);
  reply(null, { message: 'private database error' }); expect(await fetchSharedLinkByToken(token)).toEqual({ success: false, error: 'unavailable' });
});
it('accepts the actual current estimation schema and rejects malformed adjustment arrays', () => {
  expect(isEstimationPayload(estimate())).toBe(true);
  expect(isEstimationPayload({ ...estimate(), results: { ...estimate().results, ajustements: {} } })).toBe(false);
  expect(isEstimationPayload({ ...estimate(), results: { ...estimate().results, ajustements: [{ label: {}, pct: 1 }] } })).toBe(false);
  expect(isEstimationPayload({ ...estimate(), results: { ...estimate().results, estimationCentrale: '120' } })).toBe(false);
});
it('preserves genuine zero and negative values but rejects empty and mistyped valuation summaries', () => {
  expect(isValorisationPayload({ inputs: {}, results: { valeurRetenue: 0, valeurDCF: -120.50 } })).toBe(true);
  expect(isValorisationPayload({ inputs: {}, results: {} })).toBe(false);
  expect(isValorisationPayload({ inputs: {}, results: { valeurRetenue: null } })).toBe(false);
});
it('routes the actual monthly DCF engine snapshot to the compatible public view', () => {
  const inputs = { model: 'monthly-expected-v1', leases: [{ id: 'a', locataire: 'Synthetic', surface: 100, loyerAnnuel: 12000, dateDebut: '2026-01', dateFin: '2036-12', probabiliteRenouvellement: 100, ervM2: 120, indexation: 0, franchiseMois: 0, fitOutContribution: 0, chargesLocataire: 0 }], periodeAnalyse: 5, tauxActualisation: 5, tauxCapSortie: 5, fraisCessionPct: 1, chargesProprietaireFixe: 1000, capexAnnuel: 200, vacanceERV: 0, dateValeur: '2026-01' };
  const result = calculerDCFLeases(inputs);
  const payload = { inputs, results: { valeurDCF: result.valeurDCF, fluxTerminal: result.fluxTerminal, cashFlows: result.cashFlows } };
  expect(isMonthlyDcfPayload(payload)).toBe(true); expect(isDcfMultiPayload(payload)).toBe(false);
  expect(isMonthlyDcfPayload({ ...payload, results: { ...payload.results, cashFlows: result.cashFlows.slice(1) } })).toBe(false);
  expect(isMonthlyDcfPayload({ ...payload, results: { ...payload.results, cashFlows: [] } })).toBe(false);
});
it('refuses an incompatible hotel payload instead of dereferencing missing nested costs', () => { expect(isHotelValorisationPayload({ inputs: {}, results: { valeurCentrale: 100 } })).toBe(false); });
it('opens the calculator corresponding to the shared tool', () => { expect(sharedCalculatorPath('estimation')).toBe('/estimation'); expect(sharedCalculatorPath('dcf-multi')).toBe('/dcf-multi'); expect(sharedCalculatorPath('hotel-dscr')).toBe('/hotellerie/dscr'); });
it.each([{ token: 'bad', message: 'hello' }, { token, message: '  ' }, { token, message: 'a'.repeat(4001) }, { token, message: 'hi', visitorName: 'a'.repeat(101) }, { token, message: 'hi', visitorEmail: 'bad@email' }])('rejects invalid comments before sending %#', async input => {
  expect((await postSharedLinkComment(input)).success).toBe(false); expect(mock.rpc).not.toHaveBeenCalled();
});
it('confirms only explicit comment success and normalizes optional fields', async () => {
  reply({ success: true }); expect(await postSharedLinkComment({ token, message: ' hello ', visitorName: ' ', visitorEmail: ' ' })).toEqual({ success: true });
  expect(mock.rpc).toHaveBeenCalledExactlyOnceWith('post_shared_link_comment', { p_token: token, p_message: 'hello', p_visitor_name: null, p_visitor_email: null });
});
it.each([null, { success: 'true' }, { success: false }, { success: true, error: 'expired' }])('treats ambiguous comment responses as uncertain %#', async data => {
  reply(data); expect(await postSharedLinkComment({ token, message: 'hello' })).toEqual({ success: false, error: 'unavailable' }); expect(mock.rpc).toHaveBeenCalledTimes(1);
});
it('does not resend a comment after a lost response', async () => {
  mock.rpc.mockReturnValue({ abortSignal: vi.fn().mockRejectedValue(Error('lost response')) });
  expect(await postSharedLinkComment({ token, message: 'hello' })).toEqual({ success: false, error: 'unavailable' }); expect(mock.rpc).toHaveBeenCalledTimes(1);
});
it('preserves explicit comment throttling without presenting it as successful delivery', async () => {
  reply({ success: false, error: 'rate_limited' }); expect(await postSharedLinkComment({ token, message: 'hello' })).toEqual({ success: false, error: 'rate_limited' });
});

