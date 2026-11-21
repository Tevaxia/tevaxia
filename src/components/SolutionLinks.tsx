import { getTranslations } from "next-intl/server";
import LocaleLink from "./LocaleLink";
import { solutionsFor } from "@/lib/nav-menu";

/** Lien de chaque outil vers la page « solutions » de son métier. Rendu côté
 * serveur par le gabarit racine : présent dans le HTML de chaque outil. */
export default async function SolutionLinks({ path }: { path: string }) {
  const slugs = solutionsFor(path);
  if (!slugs.length) return null;
  const t = await getTranslations("common.solutionLinks");
  return (
    <aside className="mx-auto my-8 max-w-5xl px-4 sm:px-6 print:hidden" aria-labelledby="solution-links-title">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-card-border bg-card px-5 py-4">
        <h2 id="solution-links-title" className="text-sm font-semibold text-navy">{t("title")}</h2>
        {slugs.map(slug => (
          <LocaleLink key={slug} href={`/solutions/${slug}`} className="rounded-lg border border-card-border px-3 py-1.5 text-sm font-medium text-navy hover:bg-background">
            {t(slug)}
          </LocaleLink>
        ))}
      </div>
    </aside>
  );
}
