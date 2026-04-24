import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("esgHub");
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
  };
}

const TONE_CLS: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  slate: "bg-slate-50 text-slate-500 ring-slate-200",
};

export default async function EsgHubPage() {
  const t = await getTranslations("esgHub");

  const MODULES = [
    {
      href: "/esg/crrem-pathways",
      title: t("modCrremTitle"),
      subtitle: t("modCrremSubtitle"),
      desc: t("modCrremDesc"),
      tags: ["CRREM v3.0", "SFDR Art. 8/9", "PAI 2 & 5", "EPBD"],
      tone: "emerald",
      status: "live",
    },
    {
      href: "/esg/taxonomy",
      title: t("modTaxoTitle"),
      subtitle: t("modTaxoSubtitle"),
      desc: t("modTaxoDesc"),
      tags: ["Art. 7.7", "Climate Mitigation", "DNSH", "CRR Pillar 3"],
      tone: "blue",
      status: "live",
    },
    {
      href: "#vsme",
      title: t("modVsmeTitle"),
      subtitle: t("modVsmeSubtitle"),
      desc: t("modVsmeDesc"),
      tags: ["VSME EFRAG", "PME", "volontaire"],
      tone: "slate",
      status: "soon",
    },
    {
      href: "#csrd",
      title: t("modCsrdTitle"),
      subtitle: t("modCsrdSubtitle"),
      desc: t("modCsrdDesc"),
      tags: ["ESRS E1", "Omnibus 2025", "Scope 1/2/3"],
      tone: "slate",
      status: "soon",
    },
  ];

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 py-16 sm:py-20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 text-center text-white">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{t("heroTitle")}</h1>
          <p className="mt-4 text-sm sm:text-base text-white/75 max-w-3xl mx-auto">
            {t("heroSubtitle")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/70">
            <span className="rounded-full border border-white/20 px-3 py-1">CRREM v3.0 (2024)</span>
            <span className="rounded-full border border-white/20 px-3 py-1">EU Taxonomy 2021/2139</span>
            <span className="rounded-full border border-white/20 px-3 py-1">SFDR Art. 8/9</span>
            <span className="rounded-full border border-white/20 px-3 py-1">CRR Pillar 3</span>
            <span className="rounded-full border border-white/20 px-3 py-1">EPBD IV 2024</span>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {MODULES.map((m) => {
            const isSoon = m.status === "soon";
            const cardClass = `group rounded-2xl border p-6 transition-all ${
              isSoon
                ? "border-card-border bg-card/40 opacity-75"
                : "border-card-border bg-card hover:border-navy/40 hover:shadow-md"
            }`;
            const inner = (
              <>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${TONE_CLS[m.tone]}`}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  {isSoon && (
                    <span className="rounded-full bg-amber-50 text-amber-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ring-amber-100">
                      {t("badgeSoon")}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-navy">{m.title}</h2>
                <div className="mt-0.5 text-xs font-medium text-muted">{m.subtitle}</div>
                <p className="mt-3 text-sm text-slate leading-relaxed">{m.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {m.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px]">{tag}</span>
                  ))}
                </div>
                {!isSoon && (
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-navy group-hover:text-navy-light">
                    {t("ctaOpen")}
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                )}
              </>
            );
            return isSoon ? (
              <div key={m.href} className={cardClass}>{inner}</div>
            ) : (
              <Link key={m.href} href={m.href} className={cardClass}>{inner}</Link>
            );
          })}
        </div>

        {/* Positioning */}
        <section className="mt-12 rounded-2xl border border-card-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-navy">{t("forWhoTitle")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
            <div>
              <div className="font-semibold text-navy mb-1">{t("forWho1Title")}</div>
              <p className="text-xs text-muted leading-relaxed">{t("forWho1Desc")}</p>
            </div>
            <div>
              <div className="font-semibold text-navy mb-1">{t("forWho2Title")}</div>
              <p className="text-xs text-muted leading-relaxed">{t("forWho2Desc")}</p>
            </div>
            <div>
              <div className="font-semibold text-navy mb-1">{t("forWho3Title")}</div>
              <p className="text-xs text-muted leading-relaxed">{t("forWho3Desc")}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-900">
          <h3 className="font-semibold mb-1">{t("methoTitle")}</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>{t("methoItem1")} (<a href="https://www.crrem.eu/pathways/" target="_blank" rel="noopener noreferrer" className="underline">crrem.eu/pathways</a>)</li>
            <li>{t("methoItem2")}</li>
            <li>{t("methoItem3")}</li>
            <li>{t("methoItem4")}</li>
            <li>{t("methoItem5")}</li>
          </ul>
        </section>
      </section>
    </div>
  );
}
