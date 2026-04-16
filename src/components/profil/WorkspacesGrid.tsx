"use client";

import Link from "next/link";

interface WorkspacesGridProps {
  locale: string;
}

interface Workspace {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}

export default function WorkspacesGrid({ locale }: WorkspacesGridProps) {
  const lp = locale === "fr" ? "" : `/${locale}`;

  const workspaces: Workspace[] = [
    {
      href: `${lp}/mes-evaluations`,
      title: "Mes évaluations",
      description: "Historique de vos simulations et rapports sauvegardés",
      color: "from-blue-600 to-indigo-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 11.25 1.5-1.5m0 0 1.5-1.5m-1.5 1.5 1.5 1.5m-1.5-1.5-1.5 1.5M6.75 7.5h1.5m-1.5 3h1.5m-1.5 3h1.5m3 3H5.625c-.621 0-1.125-.504-1.125-1.125V3.375c0-.621.504-1.125 1.125-1.125H9.75M16.5 9.75v-.375a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 10.5 4.875V3.375" />
        </svg>
      ),
    },
    {
      href: `${lp}/portfolio`,
      title: "Mon portefeuille",
      description: "Dashboard multi-biens pour investisseur / family office",
      color: "from-emerald-600 to-teal-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>
      ),
    },
    {
      href: `${lp}/energy/portfolio`,
      title: "Portfolio ESG / Énergie",
      description: "Stranding risk CRREM, alignement EPBD IV / SFDR",
      color: "from-green-600 to-lime-600",
      badge: "ESG",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
    {
      href: `${lp}/syndic/coproprietes`,
      title: "Mes copropriétés",
      description: "Gestion syndic : AG, appels de fonds, comptabilité",
      color: "from-purple-600 to-pink-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21M3 3h18M3 3v18m0-18h6.75M21 3v18M9 21h12M9 9h1.5M9 12h1.5M9 15h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5" />
        </svg>
      ),
    },
    {
      href: `${lp}/hotellerie/groupe`,
      title: "Mes hôtels",
      description: "Catalogue d'établissements, P&L USALI, groupe hôtelier",
      color: "from-rose-600 to-orange-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
        </svg>
      ),
    },
    {
      href: `${lp}/profil/organisation`,
      title: "Mon agence",
      description: "Créer une organisation, inviter des collaborateurs",
      color: "from-sky-600 to-cyan-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
    },
    {
      href: `${lp}/profil/api`,
      title: "Mes clés API",
      description: "Gestion des clés, quotas, suivi d'usage 30 jours",
      color: "from-slate-700 to-slate-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
        </svg>
      ),
    },
    {
      href: `${lp}/api-docs`,
      title: "Documentation API",
      description: "OpenAPI 3.1, endpoints /estimation, /ai/analyze, /ai/chat, /ai/extract",
      color: "from-indigo-600 to-violet-600",
      badge: "Docs",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Mes espaces</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {workspaces.map((ws) => (
          <Link
            key={ws.href}
            href={ws.href}
            className="group relative rounded-xl border border-card-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-navy/30"
          >
            {ws.badge && (
              <span className="absolute top-2 right-2 rounded-full bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                {ws.badge}
              </span>
            )}
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${ws.color} text-white shadow-sm`}>
              {ws.icon}
            </div>
            <h3 className="text-sm font-semibold text-navy group-hover:text-navy-light transition-colors">
              {ws.title}
            </h3>
            <p className="mt-1 text-xs text-muted leading-snug line-clamp-2">{ws.description}</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-navy/60 group-hover:text-navy">
              <span>Ouvrir</span>
              <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
