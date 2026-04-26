import { getTranslations } from "next-intl/server";

export default async function KeyTakeaways({ items }: { items: string[] }) {
  const tc = await getTranslations("common");
  if (!items?.length) return null;
  return (
    <aside className="mt-8 rounded-xl border-l-4 border-gold bg-gradient-to-br from-navy/5 to-navy/[0.02] p-5 sm:p-6">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy">
        <svg className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5c0 1.356.6 2.578 1.55 3.412.41.36.7.815.83 1.318l.34 1.27h3.56l.34-1.27c.13-.503.42-.958.83-1.318A4.49 4.49 0 0010 1zM7 14h6v1a2 2 0 01-2 2H9a2 2 0 01-2-2v-1z" clipRule="evenodd" />
        </svg>
        {tc("keyTakeaways")}
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-navy leading-relaxed">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
