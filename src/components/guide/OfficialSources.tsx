import { getTranslations } from "next-intl/server";

export type Source = {
  title: string;
  org: string;
  url: string;
  year?: string | number;
};

export default async function OfficialSources({ sources }: { sources: Source[] }) {
  const tc = await getTranslations("common");
  if (!sources?.length) return null;
  return (
    <section className="mt-12 rounded-xl border border-card-border bg-slate-50/60 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-navy" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{tc("officialSources")}</h2>
      </div>
      <p className="mt-1 text-xs text-muted">{tc("officialSourcesSubtitle")}</p>
      <ul className="mt-4 space-y-2.5">
        {sources.map((s, i) => (
          <li key={i}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group flex items-start gap-2 rounded-md p-2 -m-2 hover:bg-white transition-colors"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-muted group-hover:text-gold" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-navy group-hover:text-gold transition-colors">{s.title}</div>
                <div className="mt-0.5 text-xs text-muted">
                  {s.org}
                  {s.year ? ` · ${s.year}` : ""}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
