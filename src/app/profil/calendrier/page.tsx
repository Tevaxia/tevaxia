"use client";

import Link from "@/components/LocaleLink";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import CalendarSyncSection from "@/components/CalendarSyncSection";

function OAuthBanner() {
  const sp = useSearchParams(), t = useTranslations("calendarSync");
  const status = sp.get("status"), provider = sp.get("provider");
  if (!status || !provider) return null;
  const providerLabel = provider === "google" ? "Google Calendar" : provider === "microsoft" ? "Outlook" : provider;
  return <div role="status" className={`mt-6 rounded-lg border p-4 text-sm ${status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>
    {t(status === "success" ? "connected" : "connectionFailed", { provider: providerLabel })}
  </div>;
}

export default function CalendrierPage() {
  const { user } = useAuth(), t = useTranslations("calendarSync");
  return <div className="bg-background min-h-screen py-8 sm:py-12">
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <nav className="text-xs text-muted"><Link href="/profil" className="hover:text-navy">← {t("backProfile")}</Link></nav>
      <h1 className="mt-4 text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
      <p className="mt-3 text-base text-slate-600 leading-relaxed">{t("pageIntro")}</p>
      <Suspense fallback={null}><OAuthBanner /></Suspense>
      <div className="mt-8"><CalendarSyncSection userId={user?.id || null} /></div>
      <section className="mt-10 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{t("howTitle")}</h2>
        <ol className="mt-3 space-y-2.5 text-sm text-slate-700 list-decimal list-inside">{["stepCreate", "stepCopy", "stepGoogle", "stepOutlook", "stepApple"].map(key => <li key={key}>{t(key)}</li>)}</ol>
      </section>
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{t("eventsTitle")}</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc list-inside">{["eventsTasks", "eventsVisits", "eventsWindow", "eventsPrivacy"].map(key => <li key={key}>{t(key)}</li>)}</ul>
      </section>
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{t("securityTitle")}</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc list-inside">{["securityToken", "securityRevoke", "securityAccess"].map(key => <li key={key}>{t(key)}</li>)}</ul>
      </section>
    </div>
  </div>;
}
