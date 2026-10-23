// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
const source = readFileSync('public/propcalc/propcalc.min.js','utf8');
const countries = ['lu','pt','be','nl'].map(code=>({code,name:{en:code},currency:'EUR',maxDurationYears:30,acquisitionRegions:[]}));
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(()=>{
  document.body.innerHTML='';
  fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({success:true,data:countries})});
  vi.stubGlobal('fetch',fetchMock);
});
afterEach(()=>{vi.unstubAllGlobals();});
async function mount(module:string,country='lu') {
  const host=document.createElement('div');host.dataset.propcalc='';host.dataset.module=module;host.dataset.country=country;host.dataset.lang='en';document.body.appendChild(host);
  window.eval(source);
  (window as unknown as {PropCalc:{mount():void}}).PropCalc.mount();
  await vi.waitFor(()=>expect(host.shadowRoot?.querySelector('form, [role="status"]')).toBeTruthy());
  await vi.waitFor(()=>expect(host.shadowRoot?.textContent).not.toContain('Calculating…'));
  return host.shadowRoot!;
}
it('uses the corrected API, not embedded calculation code; currency and percentage units match',async()=>{
  const root=await mount('mortgage');
  fetchMock.mockResolvedValueOnce({ok:true,json:async()=>({success:true,assumptions:{feeRate:.08},data:{currency:'EUR',maxPropertyPrice:100000,maxLoanAmount:48000}})});
  root.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  await vi.waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(2));
  const [url,options]=fetchMock.mock.calls[1];
  expect(url).toBe('https://tevaxia.lu/api/v1/propcalc/mortgage');
  expect(options.credentials).toBe('omit');
  expect(JSON.parse(options.body)).toMatchObject({country:'lu',annualRate:.035,durationYears:25});
  await vi.waitFor(()=>expect(root.querySelector('output')?.textContent).toContain('100,000'));
});
it('does not run a substituted Belgian fiscal calculation',async()=>{
  const root=await mount('yield','be');
  expect(root.querySelector('form')).toBeNull();
  expect(root.textContent).toContain('needs additional data');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('asks for Portugal residence and VPT before submitting a valid API payload',async()=>{
  const root=await mount('fees','pt');
  const selects=root.querySelectorAll('form select');
  (selects[1] as HTMLSelectElement).value='false';
  fetchMock.mockResolvedValueOnce({ok:true,json:async()=>({success:true,data:{currency:'EUR',totalFees:25000}})});
  root.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  await vi.waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({country:'pt',region:'mainland',portugueseResident:false,portugueseTaxValue:300000,isPrimary:false,isFirstTime:false});
});
it('renders API failures as text and clears any earlier result',async()=>{
  const root=await mount('fees');
  fetchMock.mockResolvedValueOnce({ok:false,json:async()=>({success:false,error:'<img src=x onerror=alert(1)>'})});
  root.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  await vi.waitFor(()=>expect(root.querySelector('output')?.textContent).toContain('<img'));
  expect(root.querySelector('output img')).toBeNull();
});
