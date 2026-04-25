import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("statusPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: true, follow: true },
  };
}

export const revalidate = 60;

interface Check {
  name: string;
  description: string;
  url?: string;
  status: "ok" | "degraded" | "down" | "unknown";
  latencyMs?: number;
}

async function probe(name: string, description: string, url: string, timeoutMs = 5000): Promise<Check> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    const latency = Date.now() - start;
    clearTimeout(timeout);
    if (!res.ok) return { name, description, url, status: "degraded", latencyMs: latency };
    return { name, description, url, status: latency < 2000 ? "ok" : "degraded", latencyMs: latency };
  } catch {
    return { name, description, url, status: "down" };
  }
}

export default async function StatusPage() {
  const t = await getTranslations("statusPage");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const checks: Check[] = await Promise.all([
    probe(
      t("checkSiteName"),
      t("checkSiteDesc"),
      `https://www.tevaxia.lu/robots.txt`
    ),
    supabaseUrl && anon
      ? probe(
          t("checkDbName"),
          t("checkDbDesc"),
          `${supabaseUrl}/auth/v1/settings`
        )
      : Promise.resolve<Check>({
          name: t("checkDbName"),
          description: t("checkDbDesc"),
          status: "unknown",
        }),
    probe(
      t("checkApiName"),
      t("checkApiDesc"),
      `https://www.tevaxia.lu/api/v1/estimation?commune=Luxembourg&surface=80`
    ),
    probe(
      t("checkObservName"),
      t("checkObservDesc"),
      `https://data.public.lu`
    ),
  ]);

  const globalStatus: Check["status"] = checks.some((c) => c.status === "down")
    ? "down"
    : checks.some((c) => c.status === "degraded")
      ? "degraded"
      : "ok";

  const overallLabel: Record<Check["status"], { label: string; color: string; emoji: string }> = {
    ok: { label: t("overallOk"), color: "from-emerald-600 to-emerald-800", emoji: "✓" },
    degraded: { label: t("overallDegraded"), color: "from-amber-500 to-amber-700", emoji: "⚠" },
    down: { label: t("overallDown"), color: "from-rose-600 to-rose-800", emoji: "✕" },
    unknown: { label: t("overallUnknown"), color: "from-slate-500 to-slate-700", emoji: "?" },
  };

  const statusLabels: Record<Check["status"], string> = {
    ok: t("statusOk"),
    degraded: t("statusDegraded"),
    down: t("statusDown"),
    unknown: t("statusUnknown"),
  };

  const overall = overallLabel[globalStatus];
  const lastCheckTime = new Date().toISOString().replace("T", " ").slice(0, 19);

  return (
    <div className="bg-background min-h-screen py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-2 text-xs text-muted">
          <Link href="/" className="hover:text-navy">{"← "}{t("backLink")}</Link>
        </div>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("pageIntro")}</p>

        <div className={`mt-6 rounded-2xl bg-gradient-to-br ${overall.color} p-6 text-white shadow-lg`}>
          <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">{t("overallKicker")}</div>
          <div className="mt-2 flex items-center gap-3 text-xl font-bold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              {overall.emoji}
            </span>
            {overall.label}
          </div>
          <div className="mt-2 text-xs text-white/80">
            {t("lastCheck", { time: lastCheckTime })}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {checks.map((c) => (
            <div key={c.name} className="rounded-xl border border-card-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDot status={c.status} />
                    <span className="font-semibold text-navy">{c.name}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">{c.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-navy">{statusLabels[c.status]}</div>
                  {c.latencyMs != null && (
                    <div className="text-xs text-muted">{c.latencyMs} ms</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>{t("incidentTitle")}</strong>{" "}
          {t.rich("incidentBody", {
            email: () => (
              <a href="mailto:contact@tevaxia.lu" className="underline hover:no-underline">
                contact@tevaxia.lu
              </a>
            ),
          })}
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: Check["status"] }) {
  const color = status === "ok" ? "bg-emerald-500"
    : status === "degraded" ? "bg-amber-500"
    : status === "down" ? "bg-rose-500"
    : "bg-slate-400";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />;
}
