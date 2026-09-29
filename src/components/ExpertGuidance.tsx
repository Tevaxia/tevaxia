"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

const GUIDANCE_PATHS = new Set(["/", "/valorisation", "/inspection", "/estimation", "/hedonique", "/comparer", "/pricing", "/solutions", "/solutions/expert-evaluateur", "/solutions/banque", "/solutions/particulier", "/outils-bancaires", "/api-banques", "/transparence", "/wizard-particulier", "/guide/estimation-bien-immobilier", "/guide/ia-tevaxia"]);

/** Educational referral, not a directory or a claim of software accreditation. */
export default function ExpertGuidance() {
  const t = useTranslations("expertGuidance");
  const pathname = usePathname();
  const contentPath = pathname.replace(/^\/(en|de|pt|lb)(?=\/|$)/, "").replace(/\/+$/, "") || "/";
  if (!GUIDANCE_PATHS.has(contentPath)) return null;
  return (
    <aside className="mx-auto my-8 max-w-5xl px-4 sm:px-6" aria-labelledby="expert-guidance-title">
      <div className="rounded-xl border border-card-border bg-card p-5 sm:p-7">
        <h2 id="expert-guidance-title" className="text-xl font-semibold text-navy">{t("title")}</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
          <p>{t("standards")}</p>
          <p>{t("limits")}</p>
          <p>{t("association")}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="https://www.lpvi.lu/" className="rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy-light">{t("contact")}</a>
          <a href="https://www.lpvi.lu/licences-tegova" className="rounded-lg border border-card-border px-4 py-3 text-sm font-medium text-navy hover:bg-slate-50">{t("qualifications")}</a>
        </div>
        <p className="mt-3 text-xs text-muted">{t("destination")}</p>
      </div>
    </aside>
  );
}
