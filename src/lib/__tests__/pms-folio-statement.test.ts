import { describe, it, expect } from 'vitest';
import { prepareFolioStatement } from '../pms/folio-statement';
import type { PmsFolio, PmsFolioCharge } from '../pms/types';
const folio = {id:'f',currency:'EUR',subtotal_ht:0.3,total_tva:0.02,total_ttc:0.32,balance_due:0.12} as PmsFolio;
const line = (id:string, ht:number, vat:number): PmsFolioCharge => ({id,folio_id:'f',category:'bar',description:'Recorded service',quantity:1,unit_price_ht:ht,tva_rate:3,line_ht:ht,line_tva:vat,line_ttc:Math.round((ht+vat)*100)/100,posted_at:'2026-09-09T22:00:00Z',voided:false,notes:'Evidence'} as PmsFolioCharge);
describe('folio statement is a copy of reconciled records',()=>{
 it('preserves the reservation currency without converting its amounts',()=>{const report=prepareFolioStatement({...folio,currency:'USD'},[line('a',.1,.01),line('b',.2,.01)]);expect(report.currency).toBe('USD');expect(report.gross).toBe(.32);});
 it('sums cents and preserves recorded VAT instead of reconstructing it',()=>{const r=prepareFolioStatement(folio,[line('a',.1,.01),line('b',.2,.01)]);expect(r).toMatchObject({ht:.3,vat:.02,gross:.32,balance:.12});expect(r.lines[0].line_tva).toBe(.01);expect(r).not.toHaveProperty('invoice_number');});
 it('excludes voided charges, preserves notes and copies the input',()=>{const a=line('a',.1,.01);const r=prepareFolioStatement(folio,[a,line('b',.2,.01),{...line('c',100,3),voided:true}]);expect(r.lines).toHaveLength(2);a.notes='Changed';expect(r.lines[0].notes).toBe('Evidence');});
 it('refuses incomplete totals, duplicate and foreign lines',()=>{expect(()=>prepareFolioStatement(folio,[line('a',.1,.01)])).toThrow();expect(()=>prepareFolioStatement(folio,[line('a',.1,.01),line('a',.2,.01)])).toThrow();expect(()=>prepareFolioStatement(folio,[{...line('a',.1,.01),folio_id:'other'}])).toThrow();});
 it('refuses unsupported currency, broken precision and unbalanced records',()=>{expect(()=>prepareFolioStatement({...folio,currency:'invalid'},[])).toThrow();expect(()=>prepareFolioStatement(folio,[{...line('a',.1,.01),line_ht:NaN}])).toThrow();expect(()=>prepareFolioStatement(folio,[{...line('a',.1,.01),line_ttc:.12}])).toThrow();expect(()=>prepareFolioStatement(folio,[{...line('a',.1,.01),line_ht:.001}])).toThrow();});
 it('requires a timestamp with timezone and finite quantities',()=>{expect(()=>prepareFolioStatement(folio,[{...line('a',.1,.01),posted_at:'2026-09-09'}])).toThrow();expect(()=>prepareFolioStatement(folio,[{...line('a',.1,.01),quantity:NaN}])).toThrow();});
});
