import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hors ligne",
  robots: { index: false },
};

export default async function OfflinePage() {
  const tc = await getTranslations("common");
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-8 w-8 text-amber-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-navy">Vous êtes hors ligne</h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          La page demandée nécessite une connexion internet. Vos données récemment consultées restent accessibles depuis l'app installée.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors">
            {tc("breadcrumbHome")}
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">Astuce : actualisez la page une fois la connexion rétablie.</p>
      </div>
    </div>
  );
}
