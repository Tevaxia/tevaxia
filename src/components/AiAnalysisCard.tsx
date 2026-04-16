"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { useAI } from "@/lib/useAI";

interface AiAnalysisCardProps {
  context: string;
  prompt: string;
}

export default function AiAnalysisCard({ context, prompt }: AiAnalysisCardProps) {
  const t = useTranslations("aiAnalysis");
  const { user } = useAuth();
  const { analyze, loading, error, remaining } = useAI();
  const [result, setResult] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const handleAnalyze = async () => {
    try {
      const text = await analyze(context, prompt);
      setResult(text);
      setCollapsed(false);
    } catch {
      // error is already set in the hook
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
      {/* Header / trigger */}
      {!result && !loading && (
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
                <svg className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
                {t("title")}
              </h3>
              <p className="mt-0.5 text-xs text-muted">{t("desc")}</p>
            </div>
            <button
              onClick={handleAnalyze}
              className="shrink-0 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              {t("analyzeBtn")}
            </button>
          </div>
          {remaining !== null && remaining >= 0 && (
            <p className="mt-2 text-[10px] text-muted">
              {t("remaining", { count: remaining })}
            </p>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-5">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 animate-spin text-purple-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-navy">{t("analyzing")}</p>
              <p className="text-xs text-muted">{t("analyzingHint")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="p-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs text-red-800">{error}</p>
          </div>
          <button
            onClick={handleAnalyze}
            className="mt-3 rounded-lg border border-card-border bg-background px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50"
          >
            {t("retry")}
          </button>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-between gap-3 px-5 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 hover:from-purple-100 hover:to-indigo-100 transition-colors"
          >
            <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
              <svg className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
              {t("resultTitle")}
            </h3>
            <svg className={`h-4 w-4 text-purple-400 transition-transform ${collapsed ? "" : "rotate-180"}`} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {!collapsed && (
            <div className="p-5">
              <div className="prose prose-sm max-w-none text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={handleAnalyze}
                  className="rounded-lg border border-card-border bg-background px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50"
                >
                  {t("reanalyze")}
                </button>
                {remaining !== null && remaining >= 0 && (
                  <p className="text-[10px] text-muted">
                    {t("remaining", { count: remaining })}
                  </p>
                )}
              </div>
              <p className="mt-3 text-[10px] text-muted">{t("disclaimer")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
