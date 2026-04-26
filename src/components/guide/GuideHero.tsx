import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

type Props = {
  title: string;
  subtitle?: string;
  category: string;
  readingMinutes: number;
  updatedAt: string;
};

export default async function GuideHero({ title, subtitle, category, readingMinutes, updatedAt }: Props) {
  const [locale, tc] = await Promise.all([getLocale(), getTranslations("common")]);
  const lp = locale === "fr" ? "" : `/${locale}`;
  const localeMap: Record<string, string> = { fr: "fr-LU", en: "en-GB", de: "de-LU", lb: "lb-LU", pt: "pt-PT" };
  const dateLabel = new Date(updatedAt).toLocaleDateString(localeMap[locale] || "fr-LU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="border-b border-card-border pb-6">
      <nav className="text-xs text-muted">
        <Link href={`${lp}/`} className="hover:text-navy">{tc("breadcrumbHome")}</Link>
        <span className="mx-1.5">›</span>
        <Link href={`${lp}/guide`} className="hover:text-navy">{tc("breadcrumbGuide")}</Link>
        <span className="mx-1.5">›</span>
        <span className="text-slate-500">{category}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-navy sm:text-4xl leading-tight">{title}</h1>
      {subtitle && <p className="mt-3 text-base text-slate-600 leading-relaxed sm:text-lg">{subtitle}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {readingMinutes} {tc("readingMinutes")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {tc("updatedOn")} {dateLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
          </svg>
          FR · EN · DE · LB · PT
        </span>
      </div>
    </header>
  );
}
