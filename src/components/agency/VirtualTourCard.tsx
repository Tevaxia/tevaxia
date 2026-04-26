"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { detectTourProvider, tourEmbedUrl, type VirtualTourProvider } from "@/lib/agency-mandates";

const PROVIDER_LABELS: Record<VirtualTourProvider, string> = {
  matterport: "Matterport",
  klapty: "Klapty",
  eyespy360: "EyeSpy360",
  kuula: "Kuula",
  youtube: "YouTube",
  vimeo: "Vimeo",
  autre: "Autre",
};

type Props = {
  mandateId: string;
  /** initial values from the parent if available, otherwise loaded from DB */
  initialTourUrl?: string | null;
  initialVideoUrl?: string | null;
};

export default function VirtualTourCard({ mandateId, initialTourUrl, initialVideoUrl }: Props) {
  const [tourUrl, setTourUrl] = useState(initialTourUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? "");
  const [loading, setLoading] = useState(initialTourUrl === undefined && initialVideoUrl === undefined);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (initialTourUrl !== undefined || initialVideoUrl !== undefined) return;
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    void (async () => {
      const { data } = await supabase!
        .from("agency_mandates")
        .select("virtual_tour_url, video_url")
        .eq("id", mandateId)
        .single();
      if (data) {
        setTourUrl(data.virtual_tour_url ?? "");
        setVideoUrl(data.video_url ?? "");
      }
      setLoading(false);
    })();
  }, [mandateId, initialTourUrl, initialVideoUrl]);

  async function handleSave() {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase non configuré");
      return;
    }
    setSaving(true);
    setError(null);

    // Validate URLs (HTTPS or empty)
    const trimTour = tourUrl.trim();
    const trimVideo = videoUrl.trim();
    if (trimTour && !trimTour.startsWith("https://")) {
      setError("L'URL du tour virtuel doit commencer par https://");
      setSaving(false);
      return;
    }
    if (trimVideo && !trimVideo.startsWith("https://")) {
      setError("L'URL de la vidéo doit commencer par https://");
      setSaving(false);
      return;
    }

    const provider = trimTour ? detectTourProvider(trimTour) : null;

    const { error: err } = await supabase!
      .from("agency_mandates")
      .update({
        virtual_tour_url: trimTour || null,
        video_url: trimVideo || null,
        virtual_tour_provider: provider,
      })
      .eq("id", mandateId);

    if (err) {
      setError(err.message);
    } else {
      setSavedAt(new Date());
      setEditing(false);
    }
    setSaving(false);
  }

  const provider = detectTourProvider(tourUrl);
  const embedTour = tourUrl ? tourEmbedUrl(tourUrl) : null;
  const embedVideo = videoUrl ? tourEmbedUrl(videoUrl) : null;

  if (loading) {
    return (
      <div className="rounded-xl border border-card-border bg-card p-5">
        <div className="text-sm text-muted">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-sm font-bold uppercase tracking-wider text-navy">Médias 360°</h3>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-navy hover:text-gold underline"
          >
            {tourUrl || videoUrl ? "Modifier" : "Ajouter"}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{error}</div>
      )}

      {!editing && !tourUrl && !videoUrl && (
        <div className="mt-3 rounded-lg border border-dashed border-card-border bg-background p-4 text-center">
          <p className="text-xs text-muted">
            Ajoutez un tour virtuel (Matterport, Klapty, Kuula…) ou une vidéo (YouTube, Vimeo) pour enrichir l'annonce.
            Inclus automatiquement dans l'export OpenImmo et le PDF co-brandé.
          </p>
        </div>
      )}

      {!editing && tourUrl && embedTour && (
        <div className="mt-3">
          <div className="aspect-video overflow-hidden rounded-lg border border-card-border bg-black">
            <iframe
              src={embedTour}
              title="Tour virtuel"
              className="h-full w-full"
              frameBorder={0}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking; vr"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            {provider && <span className="text-muted">Source : {PROVIDER_LABELS[provider]}</span>}
            <a
              href={tourUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy hover:text-gold underline"
            >
              Ouvrir en plein écran ↗
            </a>
          </div>
        </div>
      )}

      {!editing && videoUrl && embedVideo && (
        <div className="mt-4">
          <div className="aspect-video overflow-hidden rounded-lg border border-card-border bg-black">
            <iframe
              src={embedVideo}
              title="Vidéo de présentation"
              className="h-full w-full"
              frameBorder={0}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          <div className="mt-2 text-right text-xs">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy hover:text-gold underline"
            >
              Ouvrir en plein écran ↗
            </a>
          </div>
        </div>
      )}

      {editing && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-navy">URL du tour virtuel (HTTPS)</label>
            <input
              type="url"
              value={tourUrl}
              onChange={(e) => setTourUrl(e.target.value)}
              placeholder="https://my.matterport.com/show/?m=..."
              className="mt-1 w-full rounded-md border border-card-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-muted">
              Compatible avec Matterport, Klapty, EyeSpy360, Kuula. Détection automatique du fournisseur.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-navy">URL de la vidéo (HTTPS, optionnel)</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-1 w-full rounded-md border border-card-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-muted">
              YouTube et Vimeo : conversion automatique en URL d'embed.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:text-navy"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-md bg-navy px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      {savedAt && !editing && (
        <div className="mt-3 text-xs text-emerald-700">
          ✓ Enregistré à {savedAt.toLocaleTimeString("fr-LU")}
        </div>
      )}
    </div>
  );
}
