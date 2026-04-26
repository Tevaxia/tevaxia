import { getTranslations } from "next-intl/server";

export type TocItem = { id: string; label: string };

export default async function TableOfContents({ items }: { items: TocItem[] }) {
  const tc = await getTranslations("common");
  if (!items?.length) return null;
  return (
    <nav
      aria-label={tc("tocAria")}
      className="mt-8 rounded-xl border border-card-border bg-card p-5"
    >
      <div className="text-xs font-bold uppercase tracking-wider text-muted">{tc("tableOfContents")}</div>
      <ol className="mt-3 space-y-1.5">
        {items.map((item, i) => (
          <li key={item.id} className="text-sm">
            <a href={`#${item.id}`} className="group flex items-baseline gap-2 text-slate-700 hover:text-gold transition-colors">
              <span className="text-xs font-mono text-muted group-hover:text-gold">{String(i + 1).padStart(2, "0")}</span>
              <span className="group-hover:underline">{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
