"use client";

import { useAuth } from "@/components/AuthProvider";
import { useAI } from "@/lib/useAI";

interface AiDraftButtonProps {
  context: string;
  prompt: string;
  onResult: (text: string) => void;
  label?: string;
  size?: "xs" | "sm";
  className?: string;
}

/**
 * Small inline button that drafts text via the AI endpoint and injects
 * the result into a form field via onResult. Renders nothing when the
 * user is not authenticated (same contract as AiAnalysisCard).
 */
export default function AiDraftButton({
  context,
  prompt,
  onResult,
  label = "Rédiger avec l'IA",
  size = "sm",
  className = "",
}: AiDraftButtonProps) {
  const { user } = useAuth();
  const { analyze, loading, error } = useAI();

  if (!user) return null;

  const handleClick = async () => {
    try {
      const text = await analyze(context, prompt);
      onResult(text.trim());
    } catch {
      // error set in hook
    }
  };

  const sizing = size === "xs"
    ? "px-2 py-1 text-[10px] gap-1"
    : "px-3 py-1.5 text-xs gap-1.5";

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 ${sizing}`}
      >
        <svg className={`${size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"} ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
          {loading ? (
            <>
              <circle className="opacity-25" cx="12" cy="12" r="10" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </>
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09Z" />
          )}
        </svg>
        {loading ? "Rédaction..." : label}
      </button>
      {error && <span className="text-[10px] text-rose-700">{error}</span>}
    </div>
  );
}
