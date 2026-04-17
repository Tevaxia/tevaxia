"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiChatWidget() {
  const { user } = useAuth();
  const t = useTranslations("aiChat");
  const welcome: ChatMessage = { role: "assistant", content: t("welcome") };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  if (!user) return null;

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      let token: string | null = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token ?? null;
      }
      if (!token) {
        setError(t("sessionExpired"));
        setLoading(false);
        return;
      }
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m.content !== welcome.content)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("errorCode", { code: res.status }));
        return;
      }
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorUnknown"));
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow"
          aria-label={t("openLabel")}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
          </svg>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[560px] w-[95vw] max-w-[400px] flex-col rounded-2xl border border-card-border bg-card shadow-2xl">
          <div className="flex items-center justify-between gap-2 rounded-t-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09Z" />
              </svg>
              <div>
                <div className="text-sm font-semibold">{t("headerTitle")}</div>
                <div className="text-[10px] text-white/70">{t("headerSubtitle")}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white" aria-label={t("closeLabel")}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed max-w-[85%] ${
                  m.role === "user"
                    ? "ml-auto bg-navy text-white"
                    : "mr-auto bg-background text-foreground border border-card-border"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="mr-auto bg-background text-muted border border-card-border rounded-xl px-3 py-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <svg className="h-3 w-3 animate-spin text-purple-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  {t("thinking")}
                </span>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-card-border bg-background p-2">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("inputPlaceholder")}
                rows={2}
                disabled={loading}
                className="flex-1 resize-none rounded-lg border border-input-border bg-card px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 disabled:opacity-50"
              />
              <button
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40"
                aria-label={t("sendLabel")}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
            {remaining !== null && remaining >= 0 && (
              <p className="mt-1 text-[10px] text-muted">
                {remaining === 0
                  ? t("quotaExhausted")
                  : t("remainingToday", { count: remaining })}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
