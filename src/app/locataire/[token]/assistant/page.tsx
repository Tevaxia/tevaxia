"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Bonjour ! Je suis l'assistant de votre logement. Je peux vous aider avec : questions sur votre bail, compréhension d'une quittance ou d'une facture, signaler un incident (fuite, panne, bruit), démarches administratives (adresse de résidence, allocation logement). Comment puis-je vous aider ?",
};

export default function TenantChatbot() {
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
      // Cette page est publique via token mais l'API chat demande un JWT.
      // Option MVP : on utilise le token comme identifiant de session.
      // Production : créer un endpoint /api/v1/ai/tenant-chat qui valide le token.
      let authToken: string | null = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token ?? null;
      }
      if (!authToken) {
        setError("Assistant conversationnel : nécessite une authentification. Demandez à votre bailleur un lien avec accès chat activé.");
        setLoading(false);
        return;
      }
      const tenantSystem = `Tu es l'assistant d'un logement au Luxembourg (session locataire token=${token.slice(0, 12)}...). Le locataire te pose des questions sur son bail, ses quittances, les démarches LU, ou signale un incident. Sois pédagogique, concis, référence loi 21.09.2006 et guichet.lu quand pertinent. Si l'utilisateur signale un incident urgent (fuite eau, gaz, feu), rappelle-lui d'appeler le bailleur ET les services d'urgence (112).`;

      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          messages: next.filter((m) => m !== WELCOME).map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: tenantSystem,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
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
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href={`/locataire/${token}`} className="text-xs text-muted hover:text-navy">&larr; Mon espace</Link>
        <div className="mt-2 mb-4">
          <h1 className="text-2xl font-bold text-navy">Assistant locataire</h1>
          <p className="text-sm text-muted">Posez vos questions sur le bail, les quittances, les démarches, ou signalez un incident.</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 250px)", minHeight: 420 }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i}
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed max-w-[85%] ${
                  m.role === "user" ? "ml-auto bg-teal-600 text-white" : "mr-auto bg-background text-foreground border border-card-border"
                }`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="mr-auto bg-background text-muted border border-card-border rounded-xl px-3 py-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <svg className="h-3 w-3 animate-spin text-teal-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Réflexion en cours...
                </span>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>
            )}
          </div>
          <div className="border-t border-card-border bg-background p-3">
            <div className="flex items-end gap-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown}
                placeholder="Ex: Quel est mon préavis si je veux partir ?"
                rows={2} disabled={loading}
                className="flex-1 resize-none rounded-lg border border-input-border bg-card px-3 py-2 text-sm" />
              <button onClick={() => void send()} disabled={loading || !input.trim()}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40">
                Envoyer
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <strong>Urgence (fuite d&apos;eau, gaz, incendie)</strong> : appelez directement votre bailleur et les services d&apos;urgence (112).
          L&apos;assistant est là pour les questions générales, pas pour les urgences vitales.
        </div>
      </div>
    </div>
  );
}
