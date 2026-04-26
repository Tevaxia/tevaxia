"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Subscription = {
  id: string;
  token: string;
  label: string;
  active: boolean;
  created_at: string;
  last_accessed_at: string | null;
  access_count: number;
};

function generateToken(): string {
  // 32 hex chars (~128 bits) — random, opaque
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildIcsUrl(token: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/calendar/${token}/feed.ics`;
}

function buildWebcalUrl(token: string): string {
  if (typeof window === "undefined") return "";
  const host = window.location.host;
  return `webcal://${host}/api/calendar/${token}/feed.ics`;
}

export default function CalendarSyncSection({ userId }: { userId: string | null }) {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_calendar_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setSubs((data as Subscription[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createSubscription() {
    if (!userId || !supabase) return;
    setBusy(true);
    setError(null);
    const token = generateToken();
    const { error } = await supabase
      .from("crm_calendar_subscriptions")
      .insert({ user_id: userId, token, label: "Calendrier tevaxia", active: true });
    if (error) {
      setError(error.message);
    } else {
      await load();
    }
    setBusy(false);
  }

  async function toggleActive(sub: Subscription) {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase
      .from("crm_calendar_subscriptions")
      .update({ active: !sub.active })
      .eq("id", sub.id);
    if (error) setError(error.message);
    else await load();
    setBusy(false);
  }

  async function deleteSubscription(sub: Subscription) {
    if (!supabase) return;
    if (!confirm("Révoquer cet abonnement ? Le calendrier ne se mettra plus à jour côté Google/Outlook.")) return;
    setBusy(true);
    const { error } = await supabase
      .from("crm_calendar_subscriptions")
      .delete()
      .eq("id", sub.id);
    if (error) setError(error.message);
    else await load();
    setBusy(false);
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  }

  if (!userId) {
    return (
      <div className="rounded-xl border border-card-border bg-card p-6">
        <h3 className="text-lg font-semibold text-navy">Synchroniser mon calendrier</h3>
        <p className="mt-2 text-sm text-muted">Connectez-vous pour générer un lien d'abonnement calendrier.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-card-border bg-card p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-navy">Synchroniser mon calendrier</h3>
          <p className="mt-1 text-sm text-muted leading-relaxed">
            Générez une URL d'abonnement à coller dans Google Calendar, Outlook ou Apple Calendar pour voir vos tâches CRM et visites planifiées.
            Lecture seule, mise à jour toutes les heures.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="mt-5">
        {loading ? (
          <div className="text-sm text-muted">Chargement…</div>
        ) : subs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-card-border bg-background p-5 text-center">
            <p className="text-sm text-muted">Aucun abonnement actif.</p>
            <button
              type="button"
              disabled={busy}
              onClick={createSubscription}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50 transition-colors"
            >
              Générer une URL d'abonnement
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map((sub) => {
              const url = buildIcsUrl(sub.token);
              const webcal = buildWebcalUrl(sub.token);
              return (
                <div key={sub.id} className={`rounded-lg border ${sub.active ? "border-card-border bg-background" : "border-rose-200 bg-rose-50/40"} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-navy">{sub.label}</div>
                      <div className="mt-0.5 text-xs text-muted">
                        Créé le {new Date(sub.created_at).toLocaleDateString("fr-LU")} ·{" "}
                        {sub.last_accessed_at
                          ? `dernier accès ${new Date(sub.last_accessed_at).toLocaleString("fr-LU")} (${sub.access_count} appels)`
                          : "jamais accédé"}
                        {!sub.active && <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-rose-700">révoqué</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleActive(sub)}
                        className="text-xs text-muted hover:text-navy underline"
                      >
                        {sub.active ? "Désactiver" : "Réactiver"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => deleteSubscription(sub)}
                        className="text-xs text-rose-600 hover:text-rose-700 underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {sub.active && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 rounded-md border border-card-border bg-white px-3 py-2">
                        <code className="flex-1 truncate text-xs text-navy">{url}</code>
                        <button
                          type="button"
                          onClick={() => copy(url, `https-${sub.id}`)}
                          className="shrink-0 rounded bg-navy px-3 py-1 text-xs font-semibold text-white hover:bg-navy-light"
                        >
                          {copiedId === `https-${sub.id}` ? "Copié" : "Copier URL"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <a
                          href={webcal}
                          className="inline-flex items-center gap-1 rounded-md border border-card-border bg-white px-3 py-1.5 font-medium text-navy hover:bg-card transition-colors"
                        >
                          📅 Ouvrir dans Apple Calendar (webcal://)
                        </a>
                        <a
                          href={`https://www.google.com/calendar/render?cid=${encodeURIComponent(url)}`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 rounded-md border border-card-border bg-white px-3 py-1.5 font-medium text-navy hover:bg-card transition-colors"
                        >
                          📅 Ajouter à Google Calendar
                        </a>
                      </div>
                      <p className="text-[11px] text-muted">
                        Dans Outlook : <em>Paramètres → Calendrier → Calendriers partagés → Publier un calendrier</em> puis collez l'URL HTTPS ci-dessus.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              disabled={busy}
              onClick={createSubscription}
              className="text-xs text-navy hover:text-gold underline"
            >
              + Créer un autre abonnement
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-card-border bg-background p-4">
        <div className="flex items-start gap-2">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <div className="flex-1 text-xs leading-relaxed">
            <div className="font-semibold text-navy">Sync bi-directionnelle Google / Microsoft</div>
            <p className="mt-1 text-muted">
              Connexion OAuth pour synchroniser dans les deux sens (les modifications côté Google/Outlook reviennent dans tevaxia).
              <strong className="text-amber-700"> Configuration requise :</strong> clés OAuth Google Cloud + Azure App Registration à fournir
              dans les variables d'environnement (cf. roadmap technique).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="/api/oauth/google/calendar/connect"
                className="inline-flex items-center gap-1 rounded-md border border-card-border bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-card transition-colors"
              >
                Connecter Google Calendar
              </a>
              <a
                href="/api/oauth/microsoft/calendar/connect"
                className="inline-flex items-center gap-1 rounded-md border border-card-border bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-card transition-colors"
              >
                Connecter Outlook
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
