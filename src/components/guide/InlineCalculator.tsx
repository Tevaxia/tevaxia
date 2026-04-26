import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

type Props = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

export default async function InlineCalculator({ title, description, href, ctaLabel }: Props) {
  const [locale, tc] = await Promise.all([getLocale(), getTranslations("common")]);
  const lp = locale === "fr" ? "" : `/${locale}`;
  return (
    <div className="my-8 rounded-xl border border-gold/40 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy text-gold">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-6.75h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zM5.25 21h13.5A2.25 2.25 0 0021 18.75V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v12A2.25 2.25 0 005.25 21z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-gold">{tc("calculatorTevaxia")}</div>
          <h3 className="mt-1 text-base font-semibold text-navy">{title}</h3>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{description}</p>
          <Link
            href={`${lp}${href}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light transition-colors"
          >
            {ctaLabel}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
