import { getTranslations } from "next-intl/server";

export type FaqItem = { q: string; a: string };

export default async function FaqSection({ items, idPrefix = "faq" }: { items: FaqItem[]; idPrefix?: string }) {
  const tc = await getTranslations("common");
  if (!items?.length) return null;
  return (
    <section id={idPrefix} className="mt-12 scroll-mt-24">
      <h2 className="text-2xl font-bold text-navy">{tc("faqTitle")}</h2>
      <p className="mt-1 text-sm text-muted">{tc("faqSubtitle")}</p>
      <div className="mt-5 divide-y divide-card-border rounded-xl border border-card-border bg-white">
        {items.map((item, i) => (
          <details key={i} className="group">
            <summary className="cursor-pointer list-none flex items-start gap-3 p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-card-border text-xs text-muted group-open:bg-navy group-open:border-navy group-open:text-gold transition-colors">
                <svg className="h-3 w-3 group-open:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </span>
              <span className="flex-1 text-sm font-semibold text-navy group-open:text-gold sm:text-base">{item.q}</span>
            </summary>
            <div className="px-4 pb-5 pl-12 sm:px-5 sm:pl-14">
              <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
