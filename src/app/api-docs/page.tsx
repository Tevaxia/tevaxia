import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("apiDocs");
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    robots: { index: true, follow: true },
  };
}

export default async function ApiDocsPage() {
  const [t, locale] = await Promise.all([getTranslations("apiDocs"), getLocale()]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`${lp}/`} className="text-xs text-muted hover:text-navy">{t("back")}</Link>
          <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <a
            href="/openapi.yaml"
            target="_blank"
            rel="noopener"
            className="rounded-xl border border-card-border bg-card p-4 hover:bg-slate-50"
          >
            <div className="text-sm font-semibold text-navy">openapi.yaml</div>
            <div className="mt-1 text-xs text-muted">{t("cards.specRawDesc")}</div>
          </a>
          <a
            href="https://petstore.swagger.io/?url=https://www.tevaxia.lu/openapi.yaml"
            target="_blank"
            rel="noopener"
            className="rounded-xl border border-card-border bg-card p-4 hover:bg-slate-50"
          >
            <div className="text-sm font-semibold text-navy">Swagger UI</div>
            <div className="mt-1 text-xs text-muted">{t("cards.swaggerUiDesc")}</div>
          </a>
          <a
            href="https://editor.swagger.io/?url=https://www.tevaxia.lu/openapi.yaml"
            target="_blank"
            rel="noopener"
            className="rounded-xl border border-card-border bg-card p-4 hover:bg-slate-50"
          >
            <div className="text-sm font-semibold text-navy">Swagger Editor</div>
            <div className="mt-1 text-xs text-muted">{t("cards.swaggerEditorDesc")}</div>
          </a>
        </div>

        <section className="rounded-xl border border-card-border bg-card p-6 mb-6">
          <h2 className="text-base font-semibold text-navy">{t("auth.title")}</h2>
          <p className="mt-2 text-sm text-slate">{t("auth.desc")}</p>
          <pre className="mt-3 rounded-lg bg-slate-950 text-slate-100 p-4 text-xs overflow-x-auto">
{`# Option 1 — X-API-Key header
curl https://www.tevaxia.lu/api/v1/estimation \\
  -H "X-API-Key: tvx_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"commune":"Luxembourg","surface":90}'

# Option 2 — Authorization Bearer
curl https://www.tevaxia.lu/api/v1/estimation \\
  -H "Authorization: Bearer tvx_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"commune":"Luxembourg","surface":90}'`}
          </pre>
          <p className="mt-3 text-xs text-muted">
            {t("auth.keysInfo")}{" "}
            <Link href={`${lp}/profil/api`} className="text-navy underline hover:no-underline">/profil/api</Link>
            {" "}{t("auth.keysInfoSuffix")}
          </p>
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 mb-6">
          <h2 className="text-base font-semibold text-amber-900">{t("sandbox.title")}</h2>
          <p className="mt-2 text-sm text-amber-900">{t("sandbox.desc")}</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white border border-amber-300 px-3 py-2 text-xs font-mono text-amber-900">
              tvx_sandbox_public_demo_key_read_only
            </code>
            <span className="rounded-full bg-amber-200 text-amber-900 px-2.5 py-1 text-[10px] font-semibold uppercase">
              {t("sandbox.badge")}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-amber-800">{t("sandbox.warning")}</p>
        </section>

        <section className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 mb-6">
          <h2 className="text-base font-semibold text-purple-900">{t("ai.title")}</h2>
          <p className="mt-2 text-sm text-purple-900">{t("ai.intro")}</p>
          <pre className="mt-3 rounded-lg bg-slate-950 text-slate-100 p-4 text-xs overflow-x-auto">
{`# POST /api/v1/ai/analyze
curl https://www.tevaxia.lu/api/v1/ai/analyze \\
  -H "X-API-Key: tvx_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "context": "Commune: Luxembourg\\nSurface: 90m²\\nEstimation: 950000 EUR",
    "prompt": "Comment this estimate vs market."
  }'

# → { "text": "...", "model": "llama3.1-8b", "provider": "cerebras", "remaining": -1 }


# POST /api/v1/ai/chat
curl https://www.tevaxia.lu/api/v1/ai/chat \\
  -H "X-API-Key: tvx_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "How is LU 3% VAT computed?" }
    ]
  }'

# → { "text": "...", "model": "...", "provider": "...", "remaining": -1 }`}
          </pre>
          <p className="mt-3 text-xs text-purple-900">{t("ai.footer")}</p>
        </section>

        <section className="rounded-xl border border-card-border bg-card p-6">
          <h2 className="text-base font-semibold text-navy">{t("example.title")}</h2>
          <pre className="mt-3 rounded-lg bg-slate-950 text-slate-100 p-4 text-xs overflow-x-auto">
{`const response = await fetch(
  "https://www.tevaxia.lu/api/v1/estimation/batch",
  {
    method: "POST",
    headers: {
      "X-API-Key": process.env.TEVAXIA_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: myPortfolio.map((asset) => ({
        commune: asset.commune,
        surface: asset.surface,
        classeEnergie: asset.epc,
        etat: asset.condition,
      })),
    }),
  }
);

const { results, succeeded, failed } = await response.json();
console.log(\`\${succeeded}/\${results.length} assets estimated\`);`}
          </pre>
        </section>

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>{t("contact.question")}</strong>{" "}
          <a href="mailto:contact@tevaxia.lu?subject=API%20tevaxia" className="underline hover:no-underline">
            contact@tevaxia.lu
          </a>
          {" "}{t("contact.footer")}
        </div>
      </div>
    </div>
  );
}
