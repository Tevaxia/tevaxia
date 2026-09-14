import { editorialPageMetadata } from "@/lib/editorial-seo";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
export default async function MotelPage() {
 const locale = await getLocale(), t = await getTranslations("motelGuide"), prefix = locale === "fr" ? "" : `/${locale}`;
 const tools = [{ key: "operating", path: "exploitation" }, { key: "value", path: "valorisation" }, { key: "acquisition", path: "pre-acquisition" }];
 return <div className="mx-auto max-w-6xl px-4 py-10">
 <Link href={`${prefix}/hotellerie`} className="text-sm underline">{t("back")}</Link>
 <h1 className="mt-3 text-2xl font-bold">{t("title")}</h1><p className="mt-4">{t("scope")}</p>
 <div className="mt-6 grid gap-5 lg:grid-cols-3">{tools.map(({key,path})=><section key={key} className="min-w-0 rounded-xl border p-5"><h2 className="text-xl font-semibold">{t(`${key}Title`)}</h2><p className="mt-3 text-sm">{t(`${key}Body`)}</p><Link data-motel-tool={key} href={`${prefix}/hotellerie/${path}`} className="mt-5 inline-block font-medium underline">{t(`${key}Link`)}</Link></section>)}</div>
 <section className="mt-6 rounded-xl border p-5"><h2 className="text-lg font-semibold">{t("recordsTitle")}</h2><p className="mt-3 text-sm">{t("recordsBody")}</p></section><p className="mt-5 text-sm">{t("independent")}</p>
 </div>;
}

export const generateMetadata = () => editorialPageMetadata("/hotellerie/motel");
