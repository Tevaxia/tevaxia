"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listMyProperties } from "@/lib/pms/properties";
import type { PmsProperty, PmsPropertyType } from "@/lib/pms/types";

export default function PmsHomePage() {
  const tc = useTranslations("pms.common");
  const tt = useTranslations("pms.types");
  const t = useTranslations("pms.home");
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<PmsProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    void listMyProperties().then((list) => {
      setProperties(list);
      setLoading(false);
    });
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{tc("loading")}</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")} — {t("subtitle")}</h1>
        <p className="mt-4 text-sm text-muted">{t("intro")}</p>
        <div className="mt-6">
          <Link
            href="/connexion"
            className="inline-flex items-center rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-light"
          >
            {t("loginCta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <Link
          href="/pms/proprietes/nouveau"
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-light"
        >
          {t("newProperty")}
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="mt-8">
          {/* Hero d'accueil */}
          <div className="rounded-2xl border border-card-border/60 bg-gradient-to-br from-navy-dark via-navy to-navy-light p-8 sm:p-10 shadow-lg text-white text-center relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/80 to-gold text-navy-dark shadow-sm">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m18-18v18M6 8.25h2.25M6 12h2.25m-2.25 3.75h2.25M9.75 8.25h.008v.008H9.75V8.25zm.375 3.75h.008v.008h-.008V12zm.375 3.75h.008v.008h-.008v-.008zm5.625-7.5h.008v.008h-.008V8.25zm.375 3.75h.008v.008h-.008V12zm.375 3.75h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">{t("emptyTitle")}</h2>
              <p className="mt-3 text-sm sm:text-base text-white/75 max-w-xl mx-auto">{t("emptyDesc")}</p>
              <Link
                href="/pms/proprietes/nouveau"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-bold text-navy-dark shadow-sm hover:brightness-105 transition-all"
              >
                {t("emptyCta")}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Tour 3 étapes */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-navy mb-4">{t("tourTitle")}</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { step: 1, titleKey: "tourStep1Title", descKey: "tourStep1Desc", durKey: "tourStep1Dur", iconD: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" },
                { step: 2, titleKey: "tourStep2Title", descKey: "tourStep2Desc", durKey: "tourStep2Dur", iconD: "M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
                { step: 3, titleKey: "tourStep3Title", descKey: "tourStep3Desc", durKey: "tourStep3Dur", iconD: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" },
              ].map((s) => (
                <div key={s.step} className="relative rounded-xl border border-card-border bg-card p-5">
                  <div className="absolute -top-3 left-5 rounded-full bg-navy text-white text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase">
                    {t("tourStepLabel", { n: s.step })}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5 text-navy ring-1 ring-navy/10">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.iconD} />
                    </svg>
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-navy">{t(s.titleKey)}</h4>
                  <p className="mt-1 text-xs text-muted leading-relaxed">{t(s.descKey)}</p>
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-50 text-slate-700 px-2 py-0.5 text-[10px] ring-1 ring-slate-200">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t(s.durKey)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/pms/${p.id}`}
              className="rounded-xl border border-card-border bg-card p-5 hover:border-navy transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-navy">{p.name}</h3>
                <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-medium text-navy whitespace-nowrap">
                  {tt(p.property_type as PmsPropertyType)}
                </span>
              </div>
              {p.commune && <div className="mt-1 text-xs text-muted">{p.commune}</div>}
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
                <span>{t("vatLabel")} {p.tva_rate}%</span>
                {p.taxe_sejour_eur && p.taxe_sejour_eur > 0 ? (
                  <span>{t("taxeSejourLabel")} {p.taxe_sejour_eur} €</span>
                ) : null}
                <span className="ml-auto font-mono">{p.currency}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Informations LU */}
      <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <h3 className="font-semibold">{t("compliance")}</h3>
        <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
          <li>{t("complianceTva")}</li>
          <li>{t("complianceFb")}</li>
          <li>{t("complianceTaxe")}</li>
          <li>{t("complianceInvoice")}</li>
          <li>{t("complianceRgpd")}</li>
          <li>{t("complianceIcal")}</li>
        </ul>
      </section>
    </div>
  );
}
