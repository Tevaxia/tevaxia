"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listMyActivity, type ActivityEntry } from "@/lib/activity-log";
import { errMsg } from "@/lib/errors";
import {
  listMyConsents,
  setConsent,
  listMyConsentHistory,
  CONSENT_CATEGORIES,
  type UserConsent,
  type ConsentCategory,
  type ConsentHistoryEntry,
} from "@/lib/consents";

function fmtDate(s: string): string {
  return new Date(s).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function ConfidentialitePage() {
  const t = useTranslations("privacySettings");
  const { user, loading: authLoading } = useAuth();

  const [consents, setConsents] = useState<Record<ConsentCategory, boolean>>({
    marketing_emails: false,
    analytics_usage: false,
    third_party_sharing: false,
    profile_personalization: true,
    audit_legal: true,
  });
  const [consentsLoaded, setConsentsLoaded] = useState<UserConsent[]>([]);
  const [history, setHistory] = useState<ConsentHistoryEntry[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<ConsentCategory | null>(null);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [c, h, a] = await Promise.all([
      listMyConsents(),
      listMyConsentHistory(30),
      listMyActivity(50),
    ]);
    setConsentsLoaded(c);
    setHistory(h);
    setActivity(a);
    setConsents((prev) => {
      const map = { ...prev };
      for (const cc of CONSENT_CATEGORIES) {
        const found = c.find((x) => x.category === cc.category);
        map[cc.category] = found ? found.granted : cc.defaultGranted;
      }
      return map;
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { void reload(); }, [reload]);

  const handleToggle = async (cat: ConsentCategory, newValue: boolean) => {
    setSaving(cat);
    try {
      await setConsent(cat, newValue, "settings");
      setConsents((prev) => ({ ...prev, [cat]: newValue }));
      // reload history to reflect the change
      const h = await listMyConsentHistory(30);
      setHistory(h);
    } catch (e) {
      alert(errMsg(e, "Erreur"));
    } finally {
      setSaving(null);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          {t("noSupabase")}
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted">{t("loading")}</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        {t("loginRequired")} <Link href="/connexion" className="text-navy underline">{t("login")}</Link>.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/profil" className="text-xs text-muted hover:text-navy">← {t("backToProfile")}</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      {/* Consentements */}
      <section className="mt-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy">{t("consentsTitle")}</h2>
        <p className="mt-0.5 text-xs text-muted mb-4">{t("consentsSubtitle")}</p>

        <div className="space-y-3">
          {CONSENT_CATEGORIES.map((cc) => {
            const loaded = consentsLoaded.find((x) => x.category === cc.category);
            const active = consents[cc.category];
            return (
              <div key={cc.category} className="flex items-start justify-between gap-4 rounded-lg border border-card-border/60 bg-background p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-navy">{t(`consent_${cc.category}_title`)}</h3>
                    {cc.required && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-900">
                        {t("consentRequired")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">{t(`consent_${cc.category}_desc`)}</p>
                  {loaded && (
                    <p className="mt-1 text-[10px] text-muted">
                      {t("consentUpdatedAt", { date: fmtDate(loaded.granted_at) })}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={active}
                  disabled={cc.required || saving === cc.category}
                  onClick={() => handleToggle(cc.category, !active)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    active ? "bg-emerald-600" : "bg-gray-300"
                  } ${cc.required ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      active ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[10px] text-muted">{t("consentsNote")}</p>
      </section>

      {/* Historique consentements */}
      {history.length > 0 && (
        <section className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy">{t("consentHistoryTitle")}</h2>
          <p className="mt-0.5 text-xs text-muted mb-3">{t("consentHistorySubtitle")}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border bg-background/60">
                  <th className="px-3 py-2 text-left font-semibold text-navy">{t("colDate")}</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">{t("colCategory")}</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">{t("colChange")}</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">{t("colSource")}</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">{t("colVersion")}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-card-border/40">
                    <td className="px-3 py-2 font-mono text-[10px]">{fmtDate(h.changed_at)}</td>
                    <td className="px-3 py-2">{t(`consent_${h.category}_title`)}</td>
                    <td className="px-3 py-2">
                      <span className={`font-mono text-[10px] ${h.new_granted ? "text-emerald-700" : "text-rose-700"}`}>
                        {h.previous_granted === null ? "∅" : h.previous_granted ? "✓" : "✗"} → {h.new_granted ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted">{h.source ?? "—"}</td>
                    <td className="px-3 py-2 text-muted font-mono text-[10px]">{h.policy_version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Activité */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy">{t("activityTitle")}</h2>
        <p className="mt-0.5 text-xs text-muted mb-3">{t("activitySubtitle")}</p>
        {activity.length === 0 ? (
          <p className="text-xs text-muted italic">{t("activityEmpty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border bg-background/60">
                  <th className="px-3 py-2 text-left font-semibold text-navy">{t("colDate")}</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">{t("colAction")}</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">{t("colEntity")}</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">{t("colUa")}</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id} className="border-b border-card-border/40">
                    <td className="px-3 py-2 font-mono text-[10px]">{fmtDate(a.created_at)}</td>
                    <td className="px-3 py-2 font-mono">{a.action}</td>
                    <td className="px-3 py-2 text-muted">
                      {a.entity_type}
                      {a.entity_id && <span className="ml-1 font-mono text-[10px]">#{a.entity_id.slice(0, 8)}</span>}
                    </td>
                    <td className="px-3 py-2 text-muted">{a.user_agent_family ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[10px] text-muted">{t("activityNote")}</p>
      </section>
    </div>
  );
}
