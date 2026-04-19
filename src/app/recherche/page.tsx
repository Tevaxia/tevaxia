"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatEUR } from "@/lib/calculations";

interface SearchResult {
  type: "mandate" | "contact" | "coownership" | "pms_property" | "pms_reservation";
  id: string;
  title: string;
  subtitle: string;
  url: string;
  amount?: number;
}

const TYPE_COLORS: Record<SearchResult["type"], string> = {
  mandate: "bg-indigo-100 text-indigo-900",
  contact: "bg-sky-100 text-sky-900",
  coownership: "bg-fuchsia-100 text-fuchsia-900",
  pms_property: "bg-teal-100 text-teal-900",
  pms_reservation: "bg-amber-100 text-amber-900",
};

const TYPE_ICONS: Record<SearchResult["type"], string> = {
  mandate: "🏠",
  contact: "👤",
  coownership: "🏢",
  pms_property: "🏨",
  pms_reservation: "📅",
};

export default function GlobalSearchPage() {
  const t = useTranslations("globalSearch");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SearchResult["type"] | "all">("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    if (!isSupabaseConfigured || !supabase) { setError(t("supabaseUnavailable")); return; }
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void search(query); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const filtered = results.filter((r) => filter === "all" || r.type === filter);
  const countsByType: Record<SearchResult["type"], number> = {
    mandate: 0, contact: 0, coownership: 0, pms_property: 0, pms_reservation: 0,
  };
  for (const r of results) countsByType[r.type]++;

  if (authLoading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href={`${lp}/connexion`} className="text-navy underline">{t("signIn")}</Link></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-6">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full rounded-xl border-2 border-navy/20 bg-white px-5 py-3 text-base shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted">
              {t("searching")}
            </div>
          )}
        </div>
        <div className="mt-2 text-[11px] text-muted">{t("minChars")}</div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {results.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <button onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 font-semibold ${
              filter === "all" ? "bg-navy text-white" : "bg-card border border-card-border text-slate"
            }`}>
            {t("filterAll", { n: results.length })}
          </button>
          {(Object.entries(countsByType) as [SearchResult["type"], number][]).filter(([, c]) => c > 0).map(([k, c]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1 font-semibold ${
                filter === k ? "bg-navy text-white" : "bg-card border border-card-border text-slate"
              }`}>
              {TYPE_ICONS[k]} {t(`type.${k}`)} ({c})
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="mt-8 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("noResults", { query })}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-6 space-y-2">
          {filtered.map((r) => (
            <Link key={`${r.type}-${r.id}`} href={r.url}
              className="flex items-start gap-3 rounded-xl border border-card-border bg-card p-3 hover:border-navy transition-colors">
              <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-lg text-xl ${TYPE_COLORS[r.type]}`}>
                {TYPE_ICONS[r.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[r.type]}`}>
                    {t(`type.${r.type}`)}
                  </span>
                  {r.amount != null && (
                    <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-mono">
                      {formatEUR(r.amount)}
                    </span>
                  )}
                </div>
                <div className="mt-1 font-semibold text-navy truncate">{r.title}</div>
                <div className="text-xs text-muted truncate">{r.subtitle}</div>
              </div>
              <div className="shrink-0 self-center text-navy">→</div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("footerStrong")}</strong> {t("footer")}
      </div>
    </div>
  );
}
