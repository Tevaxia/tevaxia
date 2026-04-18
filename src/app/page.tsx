import Link from "next/link";
import dynamic from "next/dynamic";
import { getTranslations, getLocale } from "next-intl/server";
import { SoftwareApplicationJsonLd } from "@/components/JsonLd";

const OnboardingIntent = dynamic(() => import("@/components/OnboardingIntent"), {
  loading: () => <div className="py-16 text-center text-muted text-sm">Chargement…</div>,
});

export default async function Home() {
  const [t, locale] = await Promise.all([getTranslations("home"), getLocale()]);
  const lp = locale === "fr" ? "" : `/${locale}`; // locale prefix

  const MODULES = [
    {
      href: "/estimation",
      title: t("modules.estimation.title"),
      description: t("modules.estimation.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699-2.067a14.997 14.997 0 01-3.44 0" />
        </svg>
      ),
      tag: t("modules.estimation.tag"),
      color: "from-rose-500 to-pink-500",
    },
    {
      href: "/carte",
      title: t("modules.carte.title"),
      description: t("modules.carte.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
      tag: t("modules.carte.tag"),
      color: "from-indigo-500 to-blue-500",
    },
    {
      href: "/calculateur-loyer",
      title: t("modules.loyer.title"),
      description: t("modules.loyer.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
        </svg>
      ),
      tag: t("modules.loyer.tag"),
      color: "from-navy to-navy-light",
    },
    {
      href: "/frais-acquisition",
      title: t("modules.frais.title"),
      description: t("modules.frais.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      tag: t("modules.frais.tag"),
      color: "from-gold-dark to-gold",
    },
    {
      href: "/plus-values",
      title: t("modules.plusValues.title"),
      description: t("modules.plusValues.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      ),
      tag: t("modules.plusValues.tag"),
      color: "from-teal to-teal-light",
    },
    {
      href: "/simulateur-aides",
      title: t("modules.aides.title"),
      description: t("modules.aides.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      tag: t("modules.aides.tag"),
      color: "from-emerald-600 to-emerald-500",
    },
    {
      href: "/achat-vs-location",
      title: t("modules.achatLocation.title"),
      description: t("modules.achatLocation.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      tag: t("modules.achatLocation.tag"),
      color: "from-cyan-600 to-cyan-500",
    },
    {
      href: "/bilan-promoteur",
      title: t("modules.bilanPromoteur.title"),
      description: t("modules.bilanPromoteur.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      ),
      tag: t("modules.bilanPromoteur.tag"),
      color: "from-amber-600 to-amber-500",
    },
    {
      href: "/estimateur-construction",
      title: t("modules.estimateurConstruction.title"),
      description: t("modules.estimateurConstruction.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
        </svg>
      ),
      tag: t("modules.estimateurConstruction.tag"),
      color: "from-orange-600 to-orange-500",
    },
    {
      href: "/calculateur-vrd",
      title: t("modules.calculateurVrd.title"),
      description: t("modules.calculateurVrd.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      tag: t("modules.calculateurVrd.tag"),
      color: "from-stone-600 to-stone-500",
    },
    {
      href: "/convertisseur-surfaces",
      title: t("modules.convertisseurSurfaces.title"),
      description: t("modules.convertisseurSurfaces.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      ),
      tag: t("modules.convertisseurSurfaces.tag"),
      color: "from-violet-600 to-violet-500",
    },
    {
      href: "/energy",
      title: t("modules.energy.title"),
      description: t("modules.energy.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      tag: t("modules.energy.tag"),
      color: "from-emerald-600 to-green-500",
    },
    {
      href: "/valorisation",
      title: t("modules.valorisation.title"),
      description: t("modules.valorisation.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-1.5M12 12.75l3-1.5M12 12.75L9 11.25M12 12.75V16.5" />
        </svg>
      ),
      tag: t("modules.valorisation.tag"),
      color: "from-purple-700 to-purple-500",
    },
    {
      href: "/outils-bancaires",
      title: t("modules.bancaire.title"),
      description: t("modules.bancaire.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
      ),
      tag: t("modules.bancaire.tag"),
      color: "from-slate to-gray-600",
    },
    {
      href: "/marche",
      title: t("modules.marche.title"),
      description: t("modules.marche.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
        </svg>
      ),
      tag: t("modules.marche.tag"),
      color: "from-sky-600 to-sky-500",
    },
    {
      href: "/pag-pap",
      title: t("modules.pagPap.title"),
      description: t("modules.pagPap.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
      tag: t("modules.pagPap.tag"),
      color: "from-lime-600 to-lime-500",
    },
    {
      href: "/syndic",
      title: t("modules.syndic.title"),
      description: t("modules.syndic.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      ),
      tag: t("modules.syndic.tag"),
      color: "from-orange-600 to-amber-500",
    },
    {
      href: "/hotellerie",
      title: t("modules.hotellerie.title"),
      description: t("modules.hotellerie.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m18-18v18M6 8.25h2.25M6 12h2.25m-2.25 3.75h2.25M9.75 8.25h.008v.008H9.75V8.25zm.375 3.75h.008v.008h-.008V12zm.375 3.75h.008v.008h-.008v-.008zm5.625-7.5h.008v.008h-.008V8.25zm.375 3.75h.008v.008h-.008V12zm.375 3.75h.008v.008h-.008v-.008z" />
        </svg>
      ),
      tag: t("modules.hotellerie.tag"),
      color: "from-purple-700 to-purple-500",
    },
    {
      href: "/pms",
      title: t("modules.pms.title"),
      description: t("modules.pms.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
        </svg>
      ),
      tag: t("modules.pms.tag"),
      color: "from-gold to-amber-400",
    },
    {
      href: "/gestion-locative",
      title: t("modules.gestionLocative.title"),
      description: t("modules.gestionLocative.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
        </svg>
      ),
      tag: t("modules.gestionLocative.tag"),
      color: "from-teal-600 to-teal-500",
    },
    {
      href: "/bail-commercial",
      title: t("modules.bailCommercial.title"),
      description: t("modules.bailCommercial.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      tag: t("modules.bailCommercial.tag"),
      color: "from-blue-700 to-blue-500",
    },
    {
      href: "/dcf-multi",
      title: t("modules.dcfMulti.title"),
      description: t("modules.dcfMulti.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      tag: t("modules.dcfMulti.tag"),
      color: "from-indigo-600 to-indigo-500",
    },
    {
      href: "/portfolio",
      title: t("modules.portfolio.title"),
      description: t("modules.portfolio.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      ),
      tag: t("modules.portfolio.tag"),
      color: "from-cyan-700 to-cyan-500",
    },
    {
      href: "/propcalc",
      title: t("modules.propcalc.title"),
      description: t("modules.propcalc.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
        </svg>
      ),
      tag: t("modules.propcalc.tag"),
      color: "from-fuchsia-600 to-fuchsia-500",
    },
    {
      href: "/hedonique",
      title: t("modules.hedonique.title"),
      description: t("modules.hedonique.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
        </svg>
      ),
      tag: t("modules.hedonique.tag"),
      color: "from-pink-600 to-pink-500",
    },
    {
      href: "/aml-kyc",
      title: t("modules.amlKyc.title"),
      description: t("modules.amlKyc.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      tag: t("modules.amlKyc.tag"),
      color: "from-red-600 to-red-500",
    },
    {
      href: "/inspection",
      title: t("modules.inspection.title"),
      description: t("modules.inspection.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      tag: t("modules.inspection.tag"),
      color: "from-yellow-600 to-yellow-500",
    },
    {
      href: "/terres-agricoles",
      title: t("modules.terresAgricoles.title"),
      description: t("modules.terresAgricoles.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ),
      tag: t("modules.terresAgricoles.tag"),
      color: "from-green-700 to-green-500",
    },
    {
      href: "/transparence",
      title: t("modules.transparence.title"),
      description: t("modules.transparence.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      tag: t("modules.transparence.tag"),
      color: "from-gray-600 to-gray-500",
    },
    {
      href: "/vefa",
      title: t("modules.vefa.title"),
      description: t("modules.vefa.description"),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0a2.999 2.999 0 002.25-1.016A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016A2.993 2.993 0 0018.75 7.5l-1.072-4.013a1.5 1.5 0 00-1.447-1.112H7.77a1.5 1.5 0 00-1.449 1.112L5.25 7.5" />
        </svg>
      ),
      tag: t("modules.vefa.tag"),
      color: "from-rose-600 to-rose-500",
    },
  ];

  return (
    <div className="bg-background">
      <SoftwareApplicationJsonLd name="tevaxia.lu" description={t("jsonLdDescription")} url="https://tevaxia.lu" />
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light opacity-90" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("heroTitle")}{" "}
              <span className="text-gold">{t("heroHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/70">
              {t("heroDescription")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/50">
              <span className="rounded-full border border-white/20 px-3 py-1">{t("tags.habitat")}</span>
              <span className="rounded-full border border-white/20 px-3 py-1">{t("tags.tegova")}</span>
              <span className="rounded-full border border-white/20 px-3 py-1">{t("tags.epbd")}</span>
              <span className="rounded-full border border-white/20 px-3 py-1">{t("tags.lir")}</span>
              <span className="rounded-full border border-white/20 px-3 py-1">{t("tags.bail")}</span>
              <span className="rounded-full border border-white/20 px-3 py-1">{t("tags.statec")}</span>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#profils"
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy-dark shadow-sm transition-colors hover:bg-gold-light"
              >
                {t("heroCta1")}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
              </a>
              <Link
                href={`${lp}/plan-du-site`}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t("heroCta2")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding by intent */}
      <OnboardingIntent />

      {/* Modules grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6">
            {MODULES.map((module) => (
              <Link
                key={module.href}
                href={`${lp}${module.href}`}
                className="group relative flex w-full flex-col rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${module.color} text-white shadow-sm`}>
                  {module.icon}
                </div>
                <h3 className="text-lg font-semibold text-navy group-hover:text-navy-light transition-colors">
                  {module.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {module.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-navy">
                    {module.tag}
                  </span>
                  <svg
                    className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-navy"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guide immobilier LU — GEO */}
      <section className="py-16 sm:py-20 border-t border-card-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">{t("guideSection.title")}</h2>
            <p className="mt-3 text-sm text-muted max-w-2xl mx-auto">{t("guideSection.subtitle")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { slug: "frais-notaire-luxembourg", q: t("guideSection.q1") },
              { slug: "regle-5-pourcent-loyer", q: t("guideSection.q2") },
              { slug: "bellegen-akt", q: t("guideSection.q3") },
              { slug: "plus-value-immobiliere", q: t("guideSection.q4") },
              { slug: "bail-habitation-luxembourg", q: t("guideSection.q5") },
              { slug: "copropriete-luxembourg", q: t("guideSection.q6") },
              { slug: "klimabonus", q: t("guideSection.q7") },
              { slug: "estimation-bien-immobilier", q: t("guideSection.q8") },
              { slug: "achat-immobilier-non-resident", q: t("guideSection.q9") },
              { slug: "tva-3-pourcent-logement", q: t("guideSection.q10") },
              { slug: "bail-commercial-luxembourg", q: t("guideSection.q11") },
              { slug: "investir-hotel-luxembourg", q: t("guideSection.q12") },
            ].map((g) => (
              <Link
                key={g.slug}
                href={`${lp}/guide/${g.slug}`}
                className="group flex items-start gap-3 rounded-xl border border-card-border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                <span className="text-sm font-medium text-navy group-hover:text-navy-light transition-colors">{g.q}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href={`${lp}/guide`} className="inline-flex items-center text-sm font-semibold text-navy hover:text-navy-light transition-colors">
              {t("guideSection.seeAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* Key figures */}
      <section className="border-t border-card-border bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
            {[
              { value: "30+", label: t("stats.tools") },
              { value: "8", label: t("stats.energySimulators") },
              { value: "100", label: t("stats.communes") },
              { value: "5", label: t("stats.languages") },
              { value: "172", label: t("stats.tests") },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-navy sm:text-4xl">{stat.value}</div>
                <div className="mt-2 text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-muted">
            {t("trust.heading")}
          </p>
          <div className="flex flex-wrap items-stretch justify-center gap-4">
            {[
              { title: t("trust.tegova"), desc: t("trust.tegovaDesc"), icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>
              ) },
              { title: t("trust.data"), desc: t("trust.dataDesc"), icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>
              ) },
              { title: t("trust.rgpd"), desc: t("trust.rgpdDesc"), icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              ) },
              { title: t("trust.tests"), desc: t("trust.testsDesc"), icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" /></svg>
              ) },
            ].map((badge) => (
              <div key={badge.title} className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-5 py-3 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
                  {badge.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-navy">{badge.title}</div>
                  <div className="text-xs text-muted">{badge.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Suggestion */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 sm:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  {t("missingTool")}
                </h2>
                <p className="mt-4 text-white/70 leading-relaxed">
                  {t("missingToolDescription")}
                </p>
                <div className="mt-6">
                  <a
                    href="mailto:contact@tevaxia.lu"
                    className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy-dark shadow-sm transition-colors hover:bg-gold-light"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    contact@tevaxia.lu
                  </a>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-white/10 px-4 py-3">
                  <div className="text-sm font-medium text-white">{t("contact.tevaxiaTitle")}</div>
                  <ul className="mt-2 space-y-1 text-sm text-white/60">
                    <li>{t("contact.tevaxiaLine1")}</li>
                    <li>{t("contact.tevaxiaLine2")}</li>
                    <li>{t("contact.tevaxiaLine3")}</li>
                    <li>{t("contact.tevaxiaLine4")}</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-white/10 px-4 py-3">
                  <div className="text-sm font-medium text-white">{t("contact.energyTitle")}</div>
                  <ul className="mt-2 space-y-1 text-sm text-white/60">
                    <li>{t("contact.energyLine1")}</li>
                    <li>{t("contact.energyLine2")}</li>
                    <li>{t("contact.energyLine3")}</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-white/10 px-4 py-3">
                  <div className="text-sm font-medium text-white">{t("contact.sourcesTitle")}</div>
                  <ul className="mt-2 space-y-1 text-sm text-white/60">
                    <li>{t("contact.sourcesLine1")}</li>
                    <li>{t("contact.sourcesLine2")}</li>
                    <li>{t("contact.sourcesLine3")}</li>
                    <li>{t("contact.sourcesLine4")}</li>
                    <li>{t("contact.sourcesLine5")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
