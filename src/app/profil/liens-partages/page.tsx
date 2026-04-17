"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  listMySharedLinks,
  deleteSharedLink,
  fetchSharedLinkTimeline,
  buildSharedLinkUrl,
  type SharedLink,
  type SharedLinkTimelineDay,
} from "@/lib/shared-links";

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("fr-LU", { day: "2-digit", month: "short", year: "numeric" });
}

function Sparkline({ data }: { data: SharedLinkTimelineDay[] }) {
  if (data.length === 0) {
    return <div className="text-[11px] text-muted italic">—</div>;
  }
  const max = Math.max(...data.map((d) => d.views), 1);
  const total = data.reduce((s, d) => s + d.views, 0);
  return (
    <div>
      <div className="flex items-end gap-[2px] h-10">
        {data.map((d, i) => {
          const h = d.views === 0 ? 2 : Math.max(3, Math.round((d.views / max) * 36));
          return (
            <div
              key={i}
              className={`w-1.5 rounded-t ${d.views > 0 ? "bg-navy" : "bg-navy/10"}`}
              style={{ height: `${h}px` }}
              title={`${d.day} : ${d.views}`}
            />
          );
        })}
      </div>
      <div className="text-[10px] text-muted mt-1">
        {total} vues · {data.length} jours
      </div>
    </div>
  );
}

export default function LiensPartagesPage() {
  const t = useTranslations("liensPartages");
  const { user, loading: authLoading } = useAuth();
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [timelines, setTimelines] = useState<Record<string, SharedLinkTimelineDay[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const data = await listMySharedLinks();
        if (cancel) return;
        setLinks(data);
        // Fetch timelines in parallel
        const entries = await Promise.all(
          data.map(async (l) => {
            try {
              const tl = await fetchSharedLinkTimeline(l.id, 30);
              return [l.id, tl] as const;
            } catch {
              return [l.id, [] as SharedLinkTimelineDay[]] as const;
            }
          }),
        );
        if (cancel) return;
        setTimelines(Object.fromEntries(entries));
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user, authLoading]);

  async function onDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteSharedLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-navy mb-4">{t("title")}</h1>
        <p className="text-sm text-muted">{t("noSupabase")}</p>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-sm text-muted">{t("loading")}</div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-navy mb-4">{t("title")}</h1>
        <p className="text-sm text-muted">
          {t("loginRequired")}{" "}
          <Link href="/connexion" className="text-navy underline">
            {t("login")}
          </Link>
          .
        </p>
      </div>
    );
  }

  const totalViews = links.reduce((s, l) => s + l.view_count, 0);
  const totalActive = links.filter((l) => new Date(l.expires_at) > new Date()).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/profil" className="text-xs text-navy hover:underline">
        ← {t("backToProfile")}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-card-border bg-card p-4 text-center">
          <div className="text-xs text-muted">{t("statTotal")}</div>
          <div className="mt-1 text-2xl font-bold text-navy">{links.length}</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4 text-center">
          <div className="text-xs text-muted">{t("statActive")}</div>
          <div className="mt-1 text-2xl font-bold text-navy">{totalActive}</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4 text-center">
          <div className="text-xs text-muted">{t("statViews")}</div>
          <div className="mt-1 text-2xl font-bold text-navy">{totalViews}</div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      {links.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-card-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background/60">
                <th className="px-4 py-3 text-left font-semibold text-navy">{t("colTool")}</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">{t("colTitle")}</th>
                <th className="px-4 py-3 text-right font-semibold text-navy">{t("colViews")}</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">{t("colTimeline")}</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">{t("colExpires")}</th>
                <th className="px-4 py-3 text-right font-semibold text-navy">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => {
                const expired = new Date(l.expires_at) < new Date();
                const url = buildSharedLinkUrl(l.token);
                return (
                  <tr key={l.id} className="border-b border-card-border/50 hover:bg-background/40">
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-navy/10 px-2 py-0.5 text-[11px] font-mono text-navy">
                        {l.tool_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">
                        {l.title || t("untitled")}
                      </a>
                      <div className="text-[10px] text-muted font-mono">{l.token.slice(0, 12)}…</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-navy">
                      {l.view_count}
                      {l.max_views && <span className="text-muted"> / {l.max_views}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Sparkline data={timelines[l.id] ?? []} />
                    </td>
                    <td className={`px-4 py-3 text-xs ${expired ? "text-rose-700 font-semibold" : "text-muted"}`}>
                      {fmtDate(l.expires_at)}
                      {expired && <span className="ml-1">({t("expired")})</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDelete(l.id)}
                        className="text-xs text-rose-700 hover:underline"
                      >
                        {t("delete")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-[11px] text-muted">{t("note")}</p>
    </div>
  );
}
