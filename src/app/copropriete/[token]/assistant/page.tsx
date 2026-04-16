"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface ChatMessage { role: "user" | "assistant"; content: string; }

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Bonjour ! Je suis l'assistant de votre copropriété. Je peux vous aider avec : comprendre votre règlement, vos charges, voir les travaux votés en AG, comprendre la loi 16 mai 1975 ou préparer vos questions pour la prochaine assemblée. Comment puis-je vous aider ?",
};

export default function CoproChatbot() {
  const params = useParams();
  const token = String(params?.token ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      let authToken: string | null = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token ?? null;
      }
      if (!authToken) {
        setError("Assistant conversationnel : nécessite une authentification. Demandez à votre syndic un lien avec accès chat activé.");
        setLoading(false);
        return;
      }
      const system = `Tu es l'assistant d'une copropriété au Luxembourg (session copropriétaire token=${token.slice(0, 12)}...). Le copropriétaire te pose des questions sur le règlement de copropriété, les charges, l'AG, les travaux, ses droits et obligations. Référence loi modifiée du 16 mai 1975 et projet loi 7763 sur fonds de travaux. Sois pédagogique et concis.`;
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          messages: next.filter((m) => m !== WELCOME).map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: system,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? `Erreur ${res.status}`); return; }
      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  };

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href={`/copropriete/${token}`} className="text-xs text-muted hover:text-navy">&larr; Mon espace</Link>
        <div className="mt-2 mb-4">
          <h1 className="text-2xl font-bold text-navy">Assistant copropriétaire</h1>
          <p className="text-sm text-muted">Questions sur votre copropriété, règlement, charges, AG, travaux.</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 250px)", minHeight: 420 }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i}
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed max-w-[85%] ${
                  m.role === "user" ? "ml-auto bg-purple-600 text-white" : "mr-auto bg-background text-foreground border border-card-border"
                }`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="mr-auto bg-background text-muted border border-card-border rounded-xl px-3 py-2 text-sm">
                <svg className="h-3 w-3 animate-spin inline mr-2 text-purple-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Réflexion en cours...
              </div>
            )}
            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>}
          </div>
          <div className="border-t border-card-border bg-background p-3">
            <div className="flex items-end gap-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown}
                placeholder="Ex: Quelle majorité pour voter un ravalement de façade ?"
                rows={2} disabled={loading}
                className="flex-1 resize-none rounded-lg border border-input-border bg-card px-3 py-2 text-sm" />
              <button onClick={() => void send()} disabled={loading || !input.trim()}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-40">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
