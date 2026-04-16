"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { getCoownership, type Coownership } from "@/lib/coownerships";

interface Thread {
  id: string;
  coownership_id: string;
  unit_id: string | null;
  subject: string;
  kind: "private" | "announcement" | "incident";
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  thread_id: string;
  author_kind: "syndic" | "coproprietaire";
  author_name: string | null;
  body: string;
  created_at: string;
}

export default function MessageriePage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { user } = useAuth();

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadSubject, setNewThreadSubject] = useState("");
  const [newThreadKind, setNewThreadKind] = useState<Thread["kind"]>("announcement");
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshThreads = useCallback(async () => {
    if (!supabase || !id) return;
    const c = await getCoownership(id);
    setCoown(c);
    const { data } = await supabase.from("coownership_threads")
      .select("*").eq("coownership_id", id).order("last_message_at", { ascending: false });
    setThreads((data ?? []) as Thread[]);
  }, [id]);

  const loadMessages = async (threadId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from("coownership_messages")
      .select("*").eq("thread_id", threadId).order("created_at");
    setMessages((data ?? []) as Message[]);
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  useEffect(() => { if (user && id) void refreshThreads(); }, [user, id, refreshThreads]);

  // Realtime subscription
  useEffect(() => {
    if (!activeThread || !supabase) return;
    void loadMessages(activeThread.id);
    const channel = supabase.channel(`thread:${activeThread.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "coownership_messages", filter: `thread_id=eq.${activeThread.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }, 50);
        })
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [activeThread]);

  const handleCreateThread = async () => {
    if (!supabase || !user || !newThreadSubject.trim()) return;
    const { data, error } = await supabase.from("coownership_threads")
      .insert({ coownership_id: id, subject: newThreadSubject, kind: newThreadKind, created_by: user.id })
      .select().single();
    if (error) return;
    setNewThreadSubject(""); setShowNewThread(false);
    await refreshThreads();
    setActiveThread(data as Thread);
  };

  const handleSendMessage = async () => {
    if (!supabase || !activeThread || !user || !newMessage.trim()) return;
    await supabase.from("coownership_messages").insert({
      thread_id: activeThread.id,
      author_kind: "syndic",
      author_name: user.email ?? "Syndic",
      author_user_id: user.id,
      body: newMessage.trim(),
    });
    await supabase.from("coownership_threads").update({ last_message_at: new Date().toISOString() }).eq("id", activeThread.id);
    setNewMessage("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSendMessage(); }
  };

  if (!coown) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`/syndic/coproprietes/${id}`} className="text-xs text-muted hover:text-navy">&larr; {coown.name}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy">Messagerie</h1>
        <p className="mt-1 text-sm text-muted">Communications en temps réel avec les copropriétaires. Announces publiques, threads privés, incidents.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_2fr] h-[calc(100vh-250px)] min-h-[500px]">
          {/* Sidebar threads */}
          <div className="rounded-xl border border-card-border bg-card flex flex-col overflow-hidden">
            <div className="border-b border-card-border p-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-navy">Conversations</span>
              <button onClick={() => setShowNewThread(!showNewThread)}
                className="rounded-lg bg-navy px-2 py-1 text-xs text-white hover:bg-navy-light">
                {showNewThread ? "Annuler" : "+ Nouveau"}
              </button>
            </div>
            {showNewThread && (
              <div className="border-b border-card-border bg-navy/5 p-3 space-y-2">
                <input type="text" placeholder="Sujet" value={newThreadSubject}
                  onChange={(e) => setNewThreadSubject(e.target.value)}
                  className="w-full rounded border border-input-border bg-white px-2 py-1 text-sm" />
                <select value={newThreadKind} onChange={(e) => setNewThreadKind(e.target.value as Thread["kind"])}
                  className="w-full rounded border border-input-border bg-white px-2 py-1 text-xs">
                  <option value="announcement">📢 Annonce (tous)</option>
                  <option value="private">💬 Privé</option>
                  <option value="incident">⚠ Incident</option>
                </select>
                <button onClick={handleCreateThread} disabled={!newThreadSubject.trim()}
                  className="w-full rounded bg-emerald-600 py-1 text-xs text-white disabled:opacity-40">
                  Créer
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto divide-y divide-card-border/50">
              {threads.length === 0 ? (
                <p className="p-4 text-xs text-muted">Aucune conversation</p>
              ) : threads.map((t) => (
                <button key={t.id} onClick={() => setActiveThread(t)}
                  className={`w-full text-left p-3 hover:bg-background ${activeThread?.id === t.id ? "bg-navy/5" : ""}`}>
                  <div className="flex items-center gap-1 text-[10px] text-muted">
                    {t.kind === "announcement" && "📢"}
                    {t.kind === "private" && "💬"}
                    {t.kind === "incident" && "⚠"}
                    {" "}{new Date(t.last_message_at).toLocaleDateString("fr-LU")}
                  </div>
                  <div className="text-sm font-semibold text-navy truncate">{t.subject}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="rounded-xl border border-card-border bg-card flex flex-col overflow-hidden">
            {activeThread ? (
              <>
                <div className="border-b border-card-border bg-background p-3">
                  <div className="text-sm font-semibold text-navy">{activeThread.subject}</div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => (
                    <div key={m.id}
                      className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${m.author_kind === "syndic" ? "ml-auto bg-navy text-white" : "mr-auto bg-background border border-card-border"}`}>
                      <div className="text-[10px] opacity-70 mb-0.5">{m.author_name} · {new Date(m.created_at).toLocaleString("fr-LU", { dateStyle: "short", timeStyle: "short" })}</div>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-card-border p-3 flex gap-2">
                  <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={onKeyDown} placeholder="Écrire un message…" rows={2}
                    className="flex-1 resize-none rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                  <button onClick={() => void handleSendMessage()} disabled={!newMessage.trim()}
                    className="rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-40">
                    Envoyer
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted text-sm p-6">
                Sélectionnez une conversation ou créez-en une.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
          <strong>Realtime actif :</strong> les messages s&apos;affichent instantanément via Supabase Realtime (WebSocket).
          Les copropriétaires peuvent répondre depuis leur portail <code>/copropriete/[token]</code>.
        </div>
      </div>
    </div>
  );
}
