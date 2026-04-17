import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation API — tevaxia.lu",
  description: "Documentation OpenAPI 3.1 de l'API tevaxia.lu : estimation, batch, rapports co-brandés agences. Sandbox disponible.",
  robots: { index: true, follow: true },
};

export default function ApiDocsPage() {
  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="text-xs text-muted hover:text-navy">← tevaxia.lu</Link>
          <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Documentation API tevaxia.lu</h1>
          <p className="mt-2 text-sm text-muted">
            Spécification OpenAPI 3.1 publique — endpoints, schémas, exemples.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <a
            href="/openapi.yaml"
            target="_blank"
            rel="noopener"
            className="rounded-xl border border-card-border bg-card p-4 hover:bg-slate-50"
          >
            <div className="text-sm font-semibold text-navy">openapi.yaml</div>
            <div className="mt-1 text-xs text-muted">Spec brute (YAML) à importer dans Postman, Insomnia, Hoppscotch, Stoplight…</div>
          </a>
          <a
            href="https://petstore.swagger.io/?url=https://www.tevaxia.lu/openapi.yaml"
            target="_blank"
            rel="noopener"
            className="rounded-xl border border-card-border bg-card p-4 hover:bg-slate-50"
          >
            <div className="text-sm font-semibold text-navy">Swagger UI</div>
            <div className="mt-1 text-xs text-muted">Ouvrir dans l&apos;explorateur Swagger (import automatique de la spec).</div>
          </a>
          <a
            href="https://editor.swagger.io/?url=https://www.tevaxia.lu/openapi.yaml"
            target="_blank"
            rel="noopener"
            className="rounded-xl border border-card-border bg-card p-4 hover:bg-slate-50"
          >
            <div className="text-sm font-semibold text-navy">Swagger Editor</div>
            <div className="mt-1 text-xs text-muted">Éditeur en ligne, génération de SDK clients (JS, Python, Java, Go…).</div>
          </a>
        </div>

        <section className="rounded-xl border border-card-border bg-card p-6 mb-6">
          <h2 className="text-base font-semibold text-navy">Authentification</h2>
          <p className="mt-2 text-sm text-slate">
            Chaque requête doit inclure votre clé API. Deux en-têtes acceptés :
          </p>
          <pre className="mt-3 rounded-lg bg-slate-950 text-slate-100 p-4 text-xs overflow-x-auto">
{`# Option 1 — en-tête X-API-Key
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
            Vos clés API se gèrent depuis{" "}
            <Link href="/profil/api" className="text-navy underline hover:no-underline">/profil/api</Link>
            {" "}(création, révocation, suivi d&apos;usage 30 jours).
          </p>
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 mb-6">
          <h2 className="text-base font-semibold text-amber-900">Sandbox — test gratuit sans inscription</h2>
          <p className="mt-2 text-sm text-amber-900">
            Utilisez la clé publique de sandbox ci-dessous pour tester l&apos;API sans créer de compte.
            Rate-limitée à 60 requêtes par minute, réponses identiques à la production mais non facturées.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white border border-amber-300 px-3 py-2 text-xs font-mono text-amber-900">
              tvx_sandbox_public_demo_key_read_only
            </code>
            <span className="rounded-full bg-amber-200 text-amber-900 px-2.5 py-1 text-[10px] font-semibold uppercase">
              Sandbox
            </span>
          </div>
          <p className="mt-2 text-[11px] text-amber-800">
            ⚠ La sandbox est en lecture seule et peut être désactivée sans préavis. Pour un usage durable,
            créez votre propre clé via /profil/api (plan Free : 10 000 requêtes/mois).
          </p>
        </section>

        <section className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 mb-6">
          <h2 className="text-base font-semibold text-purple-900">Endpoints IA — analyse &amp; chat</h2>
          <p className="mt-2 text-sm text-purple-900">
            Deux endpoints IA accessibles avec votre clé API tevaxia (rate-limit tier standard) :
          </p>
          <pre className="mt-3 rounded-lg bg-slate-950 text-slate-100 p-4 text-xs overflow-x-auto">
{`# POST /api/v1/ai/analyze — analyse structurée d'un résultat
curl https://www.tevaxia.lu/api/v1/ai/analyze \\
  -H "X-API-Key: tvx_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "context": "Commune: Luxembourg\\nSurface: 90m²\\nEstimation: 950000 EUR",
    "prompt": "Commente cette estimation par rapport au marché."
  }'

# → { "text": "...", "model": "gpt-oss-120b", "provider": "cerebras", "remaining": -1 }


# POST /api/v1/ai/chat — conversation multi-tour
curl https://www.tevaxia.lu/api/v1/ai/chat \\
  -H "X-API-Key: tvx_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "Comment est calculée la TVA 3% au LU ?" }
    ]
  }'

# → { "text": "...", "model": "...", "provider": "...", "remaining": -1 }`}
          </pre>
          <p className="mt-3 text-xs text-purple-900">
            Le serveur utilise par défaut Cerebras (GPT-OSS 120B, fallback Groq Llama 3.3). Si vous avez configuré une clé BYOK
            OpenAI/Anthropic dans votre profil, elle sera utilisée automatiquement.
            Limite : rate-limit tier de votre clé API (Free : 10/min, 200/jour).
          </p>
        </section>

        <section className="rounded-xl border border-card-border bg-card p-6">
          <h2 className="text-base font-semibold text-navy">Exemple JavaScript (batch)</h2>
          <pre className="mt-3 rounded-lg bg-slate-950 text-slate-100 p-4 text-xs overflow-x-auto">
{`// Évaluer 100 biens d'un portefeuille en un seul appel
const response = await fetch(
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
console.log(\`\${succeeded}/\${results.length} biens estimés\`);`}
          </pre>
        </section>

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Questions d&apos;intégration B2B ?</strong>{" "}
          <a href="mailto:contact@tevaxia.lu?subject=API%20tevaxia" className="underline hover:no-underline">
            contact@tevaxia.lu
          </a>
          — nous répondons sous 48 h ouvrées et pouvons fournir un SLA dédié, un endpoint batch plus
          volumineux et un support d&apos;intégration.
        </div>
      </div>
    </div>
  );
}
