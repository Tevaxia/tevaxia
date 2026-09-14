import { editorialPageMetadata } from "@/lib/editorial-seo";
import { getTranslations } from "next-intl/server";

export default async function CguPage() {
  const t = await getTranslations("cgu");

  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-navy mb-2">{t("title")}</h1>
        <p className="text-muted mb-6 text-sm">{t("lastUpdate")}</p>
        <p className="text-sm text-slate mb-8 leading-relaxed">{t("intro")}</p>

        <div className="prose prose-sm text-slate space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-navy">{t("article1.title")}</h2>
            <p className="mt-2">{t("article1.p1")}</p>
            <p>{t("article1.p2")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">{t("article2.title")}</h2>
            <p className="mt-2">{t("article2.p1")}</p>
            <p>{t("article2.p2")}</p>
            <p>{t("article2.p3")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">{t("article3.title")}</h2>
            <p className="mt-2">{t("article3.p1")}</p>
            <p>{t("article3.p2")}</p>
            <p>{t("article3.p3")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">{t("article4.title")}</h2>
            <p className="mt-2">{t("article4.p1")}</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>{t("article4.li1")}</li>
              <li>{t("article4.li2")}</li>
              <li>{t("article4.li3")}</li>
              <li>{t("article4.li4")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">{t("article5.title")}</h2>
            <p className="mt-2">{t("article5.p1")}</p>
            <p>{t("article5.p2")}</p>
            <p>{t("article5.p3")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">{t("article6.title")}</h2>
            <p className="mt-2">{t("article6.p1")}</p>
            <p>{t("article6.p2")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">{t("article7.title")}</h2>
            <p className="mt-2">{t("article7.p1")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">{t("article8.title")}</h2>
            <p className="mt-2">{t("article8.p1")}</p>
            <p>{t("article8.p2")}</p>
            <p>{t("article8.p3")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">{t("article9.title")}</h2>
            <p className="mt-2">{t("article9.p1")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">{t("article10.title")}</h2>
            <p className="mt-2">{t("article10.p1")}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export const generateMetadata = () => editorialPageMetadata("/cgu");
