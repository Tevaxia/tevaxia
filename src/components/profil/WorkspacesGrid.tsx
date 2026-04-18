"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { isWorkspaceVisible, type ProfileType } from "@/lib/profile-types";

interface WorkspacesGridProps {
  locale: string;
  /** If null or empty, show all tiles (no filter). */
  selectedProfiles?: ProfileType[] | null;
}

interface Workspace {
  slug: string;
  href: string;
  titleKey: string;
  descKey: string;
  icon: React.ReactNode;
  /** Teinte d'accent (pas gradient plein, juste le fond de l'icône). */
  tone: "blue" | "emerald" | "green" | "purple" | "rose" | "sky" | "slate" | "indigo";
  badge?: string;
}

const TONE_CLS: Record<Workspace["tone"], string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  green: "bg-green-50 text-green-700 ring-green-100",
  purple: "bg-purple-50 text-purple-700 ring-purple-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  slate: "bg-slate-50 text-slate-700 ring-slate-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
};

export default function WorkspacesGrid({ locale, selectedProfiles }: WorkspacesGridProps) {
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("workspaces");

  const all: Workspace[] = [
    {
      slug: "mes-evaluations",
      href: `${lp}/mes-evaluations`,
      titleKey: "evaluationsTitle",
      descKey: "evaluationsDesc",
      tone: "blue",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M10.5 6h.008v.008H10.5V6zM12 18H5.625c-.621 0-1.125-.504-1.125-1.125V3.375c0-.621.504-1.125 1.125-1.125H9.75M16.5 9.75v-.375a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 10.5 4.875V3.375" />
        </svg>
      ),
    },
    {
      slug: "portfolio",
      href: `${lp}/portfolio`,
      titleKey: "portfolioTitle",
      descKey: "portfolioDesc",
      tone: "emerald",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      ),
    },
    {
      slug: "energy/portfolio",
      href: `${lp}/energy/portfolio`,
      titleKey: "esgTitle",
      descKey: "esgDesc",
      tone: "green",
      badge: "ESG",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
    {
      slug: "syndic/coproprietes",
      href: `${lp}/syndic/coproprietes`,
      titleKey: "syndicTitle",
      descKey: "syndicDesc",
      tone: "purple",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21M3 3h18M3 3v18m0-18h6.75M21 3v18M9 21h12M9 9h1.5M9 12h1.5M9 15h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5" />
        </svg>
      ),
    },
    {
      slug: "hotellerie/groupe",
      href: `${lp}/hotellerie/groupe`,
      titleKey: "hotelsTitle",
      descKey: "hotelsDesc",
      tone: "rose",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
        </svg>
      ),
    },
    {
      slug: "profil/organisation",
      href: `${lp}/profil/organisation`,
      titleKey: "agencyTitle",
      descKey: "agencyDesc",
      tone: "sky",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
    },
    {
      slug: "profil/api",
      href: `${lp}/profil/api`,
      titleKey: "apiKeysTitle",
      descKey: "apiKeysDesc",
      tone: "slate",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
        </svg>
      ),
    },
    {
      slug: "api-docs",
      href: `${lp}/api-docs`,
      titleKey: "apiDocsTitle",
      descKey: "apiDocsDesc",
      tone: "indigo",
      badge: "Docs",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
      ),
    },
  ];

  const workspaces = all.filter((ws) => isWorkspaceVisible(ws.slug, selectedProfiles ?? null));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-navy">{t("sectionTitle")}</h2>
        {selectedProfiles && selectedProfiles.length > 0 && (
          <span className="text-[11px] text-muted">
            {t("filteredOn", { count: selectedProfiles.length })}
          </span>
        )}
      </div>
      {workspaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-card-border bg-card p-6 text-center text-sm text-muted">
          {t("emptyState")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.href}
              href={ws.href}
              className="group relative rounded-xl border border-card-border bg-card p-4 transition-all hover:border-navy/40 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${TONE_CLS[ws.tone]}`}>
                  {ws.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-navy truncate">{t(ws.titleKey)}</h3>
                    {ws.badge && (
                      <span className="rounded-full bg-amber-50 text-amber-800 px-1.5 py-0.5 text-[9px] font-bold tracking-wider ring-1 ring-amber-100">
                        {ws.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted leading-snug line-clamp-2">{t(ws.descKey)}</p>
                </div>
                <svg
                  className="h-4 w-4 text-muted/60 shrink-0 opacity-0 group-hover:opacity-100 group-hover:text-navy group-hover:translate-x-0.5 transition-all"
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
