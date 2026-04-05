import Link from "next/link";
import { getTranslations } from "next-intl/server";

function CheckIcon({ className = "text-navy/60" }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 shrink-0 mt-0.5 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function Separator({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-navy/40">
      <span className="h-px flex-1 bg-navy/10" />
      {label}
      <span className="h-px flex-1 bg-navy/10" />
    </li>
  );
}

export default async function Pricing() {
  const t = await getTranslations("pricing");

  return (
    <div className="bg-background py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">{t("subtitle")}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-2 text-sm font-medium text-green-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            {t("launchBanner")}
          </div>
        </div>

        {/* 3 Tiers */}
        <div className="grid gap-8 lg:grid-cols-3 items-start">

          {/* ── T1 : Accès libre ── */}
          <div className="rounded-2xl border border-card-border bg-card p-8 shadow-sm">
            <h2 className="text-xl font-bold text-navy">{t("free.name")}</h2>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-navy">{t("free.price")}</span>
            </div>
            <p className="text-sm text-muted mt-1">{t("free.priceNote")}</p>
            <p className="mt-3 text-sm text-slate">{t("free.description")}</p>

            <Link href="/estimation" className="mt-6 block rounded-lg border border-card-border px-4 py-3 text-center text-sm font-semibold text-navy hover:bg-background transition-colors">
              {t("free.cta")}
            </Link>

            <ul className="mt-6 space-y-2.5">
              {(["f1","f2","f3","f4","f5","f6","f7"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2 text-sm text-slate"><CheckIcon />{t(`free.${k}`)}</li>
              ))}
            </ul>
          </div>

          {/* ── T2 : Compte gratuit (recommandé) ── */}
          <div className="relative rounded-2xl border-2 border-gold bg-gradient-to-b from-card to-gold/5 p-8 shadow-md ring-2 ring-gold/30">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold text-white tracking-wide">
              {t("account.badge")}
            </span>
            <h2 className="text-xl font-bold text-navy mt-1">{t("account.name")}</h2>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-navy">{t("account.price")}</span>
            </div>
            <p className="text-sm text-muted mt-1">{t("account.priceNote")}</p>
            <p className="mt-3 text-sm text-slate">{t("account.description")}</p>

            <Link href="/connexion" className="mt-6 block rounded-lg bg-navy px-4 py-3 text-center text-sm font-semibold text-white hover:bg-navy-light transition-colors">
              {t("account.cta")}
            </Link>

            <ul className="mt-6 space-y-2.5">
              <Separator label={t("account.inherited")} />
              {(["f1","f2","f3","f4","f5","f6","f7","f8","f9","f10","f11"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2 text-sm text-slate"><CheckIcon className="text-gold" />{t(`account.${k}`)}</li>
              ))}
            </ul>
          </div>

          {/* ── T3 : Pro ── */}
          <div className="relative rounded-2xl border border-card-border bg-card p-8 shadow-sm">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-4 py-1 text-xs font-bold text-white tracking-wide">
              {t("pro.badge")}
            </span>
            <h2 className="text-xl font-bold text-navy mt-1">{t("pro.name")}</h2>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-muted line-through">{t("pro.priceStriked")}</span>
              <span className="text-4xl font-extrabold text-green-600">{t("pro.price")}</span>
            </div>
            <p className="text-sm text-green-600 font-medium mt-1">{t("pro.priceNote")}</p>
            <p className="mt-3 text-sm text-slate">{t("pro.description")}</p>

            <Link href="/connexion" className="mt-6 block rounded-lg border-2 border-navy px-4 py-3 text-center text-sm font-semibold text-navy hover:bg-navy hover:text-white transition-colors">
              {t("pro.cta")}
            </Link>

            <ul className="mt-6 space-y-2.5">
              <Separator label={t("pro.inherited")} />
              {(["f1","f2","f3","f4","f5","f6","f7","f8","f9","f10"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2 text-sm text-slate"><CheckIcon className="text-green-600" />{t(`pro.${k}`)}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-navy text-center mb-8">{t("faq.title")}</h2>
          <dl className="space-y-4">
            {(["1","2","3","4","5"] as const).map((n) => (
              <div key={n} className="rounded-xl border border-card-border bg-card p-6">
                <dt className="text-sm font-semibold text-navy">{t(`faq.q${n}`)}</dt>
                <dd className="mt-2 text-sm text-slate leading-relaxed">{t(`faq.a${n}`)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-14 text-center text-sm text-muted">
          {t("contact")}{" "}
          <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>
        </div>
      </div>
    </div>
  );
}
