import type { ReactNode } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { buildLocaleUrl } from "@/lib/seo";
import type { DemoProduct } from "@/lib/demo-request";
import DemoRequestForm from "./DemoRequestForm";
import ProductPreview from "./ProductPreview";

// Page de présentation d'un logiciel (syndic, PMS, gestion locative) : ce qu'il
// fait, un aperçu, comment démarrer, ce qu'il ne fait pas, le prix, les
// questions fréquentes et une demande de démonstration. Les textes décrivent
// des écrans existants ; toute fonction citée doit pouvoir être ouverte.

export type LandingProduct = Exclude<DemoProduct, "crm">;

interface Item { title: string; desc: string }
interface Faq { q: string; a: string }

const jsonLd = (schema: unknown) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
);

/** Bloc « Demander une démonstration », réutilisable sur une page existante. */
export async function DemoSection({ product, id = "demo" }: { product: DemoProduct; id?: string }) {
  const [t, tf, locale] = await Promise.all([
    getTranslations(`productPages.${product}.demo`),
    getTranslations("productPages.common.form"),
    getLocale(),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;
  return (
    <section id={id} className="scroll-mt-24 border-t border-card-border bg-background py-14 sm:py-16" aria-labelledby={`${id}-title`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 id={`${id}-title`} className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t("intro")}</p>
        <div className="mt-6">
          <DemoRequestForm
            product={product}
            locale={locale}
            labels={{
              name: tf("name"), company: tf("company"), email: tf("email"), phone: tf("phone"),
              size: t("size"), message: tf("message"), optional: tf("optional"),
              submit: tf("submit"), sending: tf("sending"),
              successTitle: tf("successTitle"), successText: tf("successText"),
              errorInvalid: tf("errorInvalid"), errorRateLimited: tf("errorRateLimited"), errorUnavailable: tf("errorUnavailable"),
              fallback: tf("fallback"), mailSubject: t("mailSubject"),
            }}
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          {tf("privacy")}{" "}
          <Link href={`${lp}/confidentialite`} className="underline hover:text-navy">{tf("privacyLink")}</Link>
        </p>
      </div>
    </section>
  );
}

export default async function ProductLanding({ product, path, openHref, links, children }: {
  product: LandingProduct;
  /** Chemin canonique de la page, sans préfixe de langue. */
  path: string;
  /** Écran d'entrée du logiciel (derrière la connexion). */
  openHref: string;
  /** Outils publics liés ; les libellés viennent de `links.items`, dans le même ordre. */
  links: string[];
  children?: ReactNode;
}) {
  const [t, tc, locale] = await Promise.all([
    getTranslations(`productPages.${product}`),
    getTranslations("productPages.common"),
    getLocale(),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;
  const features = t.raw("features.items") as Item[];
  const steps = t.raw("start.steps") as Item[];
  const limits = t.raw("limits.items") as string[];
  const faq = t.raw("faq.items") as Faq[];
  const linkLabels = t.raw("links.items") as string[];

  return (
    <div className="bg-background" data-product-landing={product}>
      {jsonLd({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: t("hero.title"),
        description: t("meta.description"),
        url: buildLocaleUrl(path, locale),
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: locale,
        author: { "@type": "Organization", name: "Tevaxia", url: "https://tevaxia.lu" },
      })}
      {jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
      })}

      <section className="bg-gradient-to-br from-navy via-navy to-navy-dark py-14 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wider text-gold">{t("hero.eyebrow")}</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{t("hero.title")}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{t("hero.subtitle")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#demo" className="rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-navy transition hover:bg-gold-light">{tc("demoCta")}</a>
              <Link href={`${lp}${openHref}`} className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">{t("hero.open")}</Link>
            </div>
            <p className="mt-4 text-sm text-white/70">{t("hero.note")}</p>
          </div>
          <ProductPreview product={product} />
        </div>
      </section>

      <section className="py-14 sm:py-16" aria-labelledby="features-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="features-title" className="text-2xl font-bold text-navy sm:text-3xl">{t("features.title")}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{t("features.intro")}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(feature => (
              <div key={feature.title} className="rounded-xl border border-card-border bg-card p-5">
                <h3 className="text-base font-semibold text-navy">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-card-border bg-card py-14 sm:py-16" aria-labelledby="start-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="start-title" className="text-2xl font-bold text-navy sm:text-3xl">{t("start.title")}</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="min-w-0">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white" aria-hidden="true">{index + 1}</span>
                <h3 className="mt-3 text-base font-semibold text-navy">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-xl border border-card-border bg-card p-6" aria-labelledby="limits-title">
            <h2 id="limits-title" className="text-xl font-bold text-navy">{t("limits.title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("limits.intro")}</p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate">
              {limits.map(limit => <li key={limit}>{limit}</li>)}
            </ul>
          </div>
          <div className="rounded-xl bg-navy p-6 text-white" aria-labelledby="pricing-title">
            <h2 id="pricing-title" className="text-xl font-bold">{t("pricing.title")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85">{t("pricing.text")}</p>
            <Link href={`${lp}/pricing`} className="mt-5 inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light">{tc("pricingLink")}</Link>
          </div>
        </div>
      </section>

      {children}

      <section className="border-t border-card-border bg-card py-14 sm:py-16" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 id="faq-title" className="text-2xl font-bold text-navy sm:text-3xl">{tc("faqTitle")}</h2>
          <dl className="mt-6 space-y-4">
            {faq.map(item => (
              <div key={item.q} className="rounded-xl border border-card-border bg-background p-5">
                <dt className="font-semibold text-navy">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <DemoSection product={product} />

      {links.length > 0 && (
        <nav className="border-t border-card-border py-10" aria-labelledby="links-title">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 id="links-title" className="text-sm font-bold uppercase tracking-wider text-navy">{t("links.title")}</h2>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {links.map((href, index) => (
                <li key={href}><Link href={`${lp}${href}`} className="text-navy underline hover:no-underline">{linkLabels[index]}</Link></li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
