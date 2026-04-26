import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export type Tool = { href: string; title: string; description: string };

export default async function RelatedTools({ tools, headingKey = "relatedToolsTitle" }: { tools: Tool[]; headingKey?: string }) {
  const [locale, tc] = await Promise.all([getLocale(), getTranslations("common")]);
  const lp = locale === "fr" ? "" : `/${locale}`;
  if (!tools?.length) return null;
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-navy">{tc(headingKey)}</h2>
      <p className="mt-1 text-sm text-muted">{tc("relatedToolsSubtitle")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={`${lp}${t.href}`}
            className="group flex items-start gap-3 rounded-xl border border-card-border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy group-hover:bg-gold/10 group-hover:text-gold transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-navy group-hover:text-gold transition-colors">{t.title}</div>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{t.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
