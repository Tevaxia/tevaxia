import { getLocale } from "next-intl/server";

const labels: Record<string, { by: string; profile: string }> = {
  fr: { by: "Par", profile: "Parcours et qualifications" },
  en: { by: "By", profile: "Background and qualifications" },
  de: { by: "Von", profile: "Werdegang und Qualifikationen" },
  pt: { by: "Por", profile: "Percurso e qualificações" },
  lb: { by: "Vum", profile: "Parcours a Qualifikatiounen" },
};

export default async function ArticleAuthor() {
  const locale = await getLocale();
  const label = labels[locale] ?? labels.fr;
  return (
    <p className="mb-6 text-sm text-muted">
      {label.by} <span className="font-semibold text-navy">Erwan Bargain</span>
      {" · "}
      <a className="underline underline-offset-2 hover:text-navy" href="https://bargain-expertise.fr/a-propos/" rel="author">
        {label.profile}
      </a>
      {" · "}
      <a className="underline underline-offset-2 hover:text-navy" href="https://www.linkedin.com/in/erwanbargain/" rel="me">
        LinkedIn
      </a>
    </p>
  );
}
