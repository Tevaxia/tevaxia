import { getTranslations } from "next-intl/server";
import LocaleLink from "./LocaleLink";
import { TOOL_GUIDES, TOOL_NOTES } from "@/lib/tool-guides";

interface FaqItem { q: string; a: string }

/** Sous un calculateur : les questions du guide audité qui s'y rapportent et
 * le lien vers ce guide. Rendu côté serveur par le gabarit racine. */
export default async function ToolFaq({ path }: { path: string }) {
  const sources = TOOL_GUIDES[path];
  if (!sources) return null;
  const tc = await getTranslations("common");
  const blocks = await Promise.all(sources.map(async source => {
    const t = await getTranslations(source.namespace);
    const all = source.items.length ? (t.raw("faq") as FaqItem[]) : [];
    return { source, title: t("title"), items: source.items.map(index => all[index]).filter(Boolean) };
  }));
  const questions = blocks.flatMap(block => block.items);
  const schema = questions.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  } : null;
  return (
    <section className="mx-auto my-10 max-w-5xl px-4 sm:px-6" aria-labelledby="tool-faq-title">
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />}
      {questions.length > 0 && <h2 id="tool-faq-title" className="text-xl font-semibold text-navy">{tc("faqTitle")}</h2>}
      {questions.length > 0 && (
        <dl className="mt-4 space-y-4">
          {questions.map(item => (
            <div key={item.q} className="rounded-xl border border-card-border bg-card p-5">
              <dt className="font-semibold text-navy">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      )}
      <ul className="mt-5 space-y-2 text-sm">
        {blocks.map(block => (
          <li key={block.source.slug}>
            <span className="text-muted">{tc("readGuide")} : </span>
            <LocaleLink href={`/guide/${block.source.slug}`} className="font-medium text-navy underline">{block.title}</LocaleLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Sous un calculateur sans guide : ce qu'il calcule, comment le renseigner,
 * ce qu'il ne couvre pas. Le texte reprend les mentions déjà affichées par l'outil. */
export async function ToolNotes({ path }: { path: string }) {
  const key = TOOL_NOTES[path];
  if (!key) return null;
  const t = await getTranslations(`toolNotes.${key}`);
  return (
    <section className="mx-auto my-10 max-w-5xl px-4 sm:px-6" aria-labelledby="tool-notes-title">
      <div className="rounded-xl border border-card-border bg-card p-5 sm:p-7">
        <h2 id="tool-notes-title" className="text-xl font-semibold text-navy">{t("title")}</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
        </div>
      </div>
    </section>
  );
}
