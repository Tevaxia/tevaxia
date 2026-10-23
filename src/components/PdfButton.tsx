"use client";
import {useEffect,useId,useRef,useState} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import {useAuth} from '@/components/AuthProvider';
export function PdfButton({onClick,label,generateBlob,filename,documentLocale}:{onClick?:()=>void|Promise<void>;label:string;generateBlob?:()=>Promise<Blob>;filename?:string;documentLocale?:string}){
 const {user,loading}=useAuth(),t=useTranslations('pdfActions'),locale=useLocale(),titleId=useId(),dialog=useRef<HTMLDialogElement>(null),running=useRef(false);
 const [showGate,setShowGate]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 useEffect(()=>{const el=dialog.current;if(!el)return;if(showGate&&!user){if(!el.open)el.showModal()}else if(el.open)el.close()},[showGate,user]);
 function isWaiting(win:Window){try{return !win.closed&&win.location.href==='about:blank'}catch{return false}}
 function previewMessage(win:Window,text:string){if(!isWaiting(win))return;win.document.title=text;const p=win.document.createElement('p');p.style.cssText='font-family:system-ui,sans-serif;padding:32px;line-height:1.5';p.textContent=text;win.document.body.replaceChildren(p)}
 async function run(preview:boolean){
  if(loading||running.current)return;
  if(!user){setShowGate(true);return}
  let win:Window|null=null;
  if(preview){win=window.open('','_blank');if(!win){setError(t('popupBlocked'));return}previewMessage(win,t('generating'))}
  running.current=true;setBusy(true);setError(null);
  try{
   if(generateBlob){const blob=await generateBlob();if(!(blob instanceof Blob)||blob.size===0)throw new Error('Empty PDF');
    if(preview&&win){if(isWaiting(win)){const url=URL.createObjectURL(blob);win.location.href=url;const timer=window.setInterval(()=>{if(win.closed){URL.revokeObjectURL(url);window.clearInterval(timer)}},1000)}}
    else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename||'rapport.pdf';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)}
   }else if(onClick){await onClick()}
  }catch{const message=t('failed');setError(message);if(win&&!win.closed)previewMessage(win,message)}
  finally{running.current=false;setBusy(false)}
 }
 const disabled=loading||busy||(!generateBlob&&!onClick);
 return <>
  <span className="inline-flex max-w-full flex-col gap-2 align-middle" aria-busy={busy}>
   <span className="inline-flex max-w-full flex-wrap items-center overflow-hidden rounded-lg border border-card-border shadow-sm">
    {generateBlob&&<button type="button" disabled={disabled} onClick={()=>void run(true)} className="border-r border-card-border bg-white px-3 py-2 text-sm font-medium text-navy hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60">{t('preview')}</button>}
    <button type="button" disabled={disabled} onClick={()=>void run(false)} className="bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:cursor-wait disabled:opacity-60">{label}</button>
   </span>
   {documentLocale&&documentLocale!==locale&&<span className="text-xs text-muted">{t('documentLanguage',{language:new Intl.DisplayNames([locale],{type:'language'}).of(documentLocale)||documentLocale})}</span>}
   {busy&&<span role="status" className="text-xs text-muted">{t('generating')}</span>}
   {error&&<span role="alert" className="max-w-sm text-sm text-rose-700 [overflow-wrap:anywhere]">{error}</span>}
  </span>
  <dialog ref={dialog} aria-labelledby={titleId} onCancel={()=>setShowGate(false)} onClose={()=>setShowGate(false)} className="m-auto max-w-sm rounded-xl border border-card-border bg-card p-5 text-foreground shadow-xl backdrop:bg-black/50" style={{width:'calc(100% - 2rem)'}}>
   <h2 id={titleId} className="text-lg font-semibold text-navy">{t('signInTitle')}</h2><p className="mt-3 text-sm text-muted">{t('signInScope')}</p><div className="mt-5 flex flex-col gap-3"><a href={(locale==='fr'?'':'/'+locale)+'/connexion'} className="rounded-lg bg-navy px-4 py-2 text-center text-sm font-semibold text-white">{t('signIn')}</a><button type="button" onClick={()=>setShowGate(false)} className="rounded-lg border border-card-border px-4 py-2 text-sm">{t('cancel')}</button></div>
  </dialog>
 </>;
}
