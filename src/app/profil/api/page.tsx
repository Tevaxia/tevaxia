"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { errMsg } from "@/lib/errors";
import {
  createApiKey,
  deleteApiKey,
  getUsageDaily,
  listMyApiKeys,
  revokeApiKey,
  type ApiKey,
  type ApiTier,
  type ApiUsageDay,
} from "@/lib/api-keys";
import {
  createWebhook,
  deleteWebhook,
  listMyWebhooks,
  toggleWebhookActive,
  triggerTestWebhook,
  type ApiWebhook,
  type ApiWebhookEvent,
} from "@/lib/api-webhooks";

const TIER_KEY: Record<ApiTier, "tierFree" | "tierPro" | "tierEnterprise"> = {
  free: "tierFree",
  pro: "tierPro",
  enterprise: "tierEnterprise",
};

function UsageChart({ data, dateLocale }: { data: ApiUsageDay[]; dateLocale: string }) {
  const t = useTranslations("profilApi");
  void dateLocale;
  if (data.length === 0) {
    return <div className="text-center py-8 text-sm text-muted">{t("noUsage")}</div>;
  }
  const max = Math.max(...data.map((d) => d.total), 1);
  const totalCalls = data.reduce((s, d) => s + d.total, 0);
  const totalErrors = data.reduce((s, d) => s + d.errors, 0);
  const avgLatency = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.avg_latency_ms * d.total, 0) / Math.max(totalCalls, 1)) : 0;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-card-border bg-card p-3">
          <div className="text-xs text-muted">{t("total30d")}</div>
          <div className="text-xl font-bold text-navy">{totalCalls}</div>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-3">
          <div className="text-xs text-muted">{t("errors")}</div>
          <div className={`text-xl font-bold ${totalErrors > 0 ? "text-rose-600" : "text-navy"}`}>{totalErrors}</div>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-3">
          <div className="text-xs text-muted">{t("avgLatency")}</div>
          <div className="text-xl font-bold text-navy">{avgLatency} ms</div>
        </div>
      </div>
      <div className="flex items-end gap-1 h-32 border-b border-card-border px-2">
        {data.map((d) => {
          const heightPct = (d.total / max) * 100;
          const errorPct = d.total > 0 ? (d.errors / d.total) * 100 : 0;
          return (
            <div key={d.day} className="flex-1 flex flex-col justify-end" title={`${d.day}: ${d.total} (${d.errors})`}>
              <div className="w-full bg-rose-500" style={{ height: `${(heightPct * errorPct) / 100}%` }}></div>
              <div className="w-full bg-navy" style={{ height: `${heightPct - (heightPct * errorPct) / 100}%` }}></div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{data[0]?.day}</span>
        <span>{data[data.length - 1]?.day}</span>
      </div>
    </div>
  );
}

export default function ApiDashboardPage() {
  const t = useTranslations("profilApi");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const { user, loading: authLoading } = useAuth();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [usage, setUsage] = useState<ApiUsageDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyTier, setNewKeyTier] = useState<ApiTier>("free");
  const [createdKeyPlain, setCreatedKeyPlain] = useState<string | null>(null);

  const formatDate = (s: string | null): string => {
    return s ? new Date(s).toLocaleString(dateLocale, { dateStyle: "short", timeStyle: "short" }) : "-";
  };

  const reloadKeys = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const list = await listMyApiKeys();
      setKeys(list);
      if (!activeKeyId && list.length > 0) setActiveKeyId(list[0].id);
    } catch (e) {
      setError(errMsg(e, t("errLoad")));
    } finally {
      setLoading(false);
    }
  }, [activeKeyId, t]);

  useEffect(() => {
    if (user) reloadKeys();
  }, [user, reloadKeys]);

  useEffect(() => {
    if (!activeKeyId) return;
    getUsageDaily(activeKeyId, 30).then(setUsage).catch(() => setUsage([]));
  }, [activeKeyId]);

  if (authLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted">{t("loading")}</div>;
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          {t("supabaseNotConfigured")}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="rounded-xl border border-card-border bg-card p-8">
          <h2 className="text-lg font-semibold text-navy">{t("loginRequired")}</h2>
          <Link href={`${lp}/connexion`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {t("login")}
          </Link>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { plainKey } = await createApiKey({ name: newKeyName.trim(), tier: newKeyTier });
      setCreatedKeyPlain(plainKey);
      setNewKeyName("");
      setNewKeyTier("free");
      await reloadKeys();
    } catch (e) {
      setError(errMsg(e, t("errCreate")));
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeApiKey(id);
      await reloadKeys();
    } catch (e) {
      setError(errMsg(e, t("errRevoke")));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteApiKey(id);
      if (activeKeyId === id) setActiveKeyId(null);
      await reloadKeys();
    } catch (e) {
      setError(errMsg(e, t("errDelete")));
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("pageDesc")}</p>
        </div>
        <Link href={`${lp}/profil`} className="text-sm text-muted hover:text-navy">{t("backToProfile")}</Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      {createdKeyPlain && (
        <div className="mb-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5">
          <h3 className="text-base font-semibold text-emerald-900">{t("newKeyTitle")}</h3>
          <p className="mt-1 text-xs text-emerald-800">{t("newKeyDesc")}</p>
          <div className="mt-3 flex gap-2">
            <code className="flex-1 break-all rounded-lg bg-white border border-emerald-300 p-3 text-xs text-emerald-900">{createdKeyPlain}</code>
            <button
              onClick={() => navigator.clipboard.writeText(createdKeyPlain)}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {t("copy")}
            </button>
          </div>
          <button onClick={() => setCreatedKeyPlain(null)} className="mt-3 text-xs text-emerald-700 hover:underline">
            {t("keySaved")}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-card-border bg-card p-5 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">{t("myKeys")}</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light"
          >
            {t("createKey")}
          </button>
        </div>

        {showCreate && (
          <div className="mt-4 border-t border-card-border pt-4 grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder={t("placeholderName")}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm sm:col-span-2"
            />
            <select
              value={newKeyTier}
              onChange={(e) => setNewKeyTier(e.target.value as ApiTier)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <button
              onClick={handleCreate}
              disabled={loading || !newKeyName.trim()}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-muted sm:col-span-3"
            >
              {t("create")}
            </button>
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-xs text-muted">
                <th className="py-2 text-left font-medium">{t("colName")}</th>
                <th className="py-2 text-left font-medium">{t("colPrefix")}</th>
                <th className="py-2 text-left font-medium">{t("colTier")}</th>
                <th className="py-2 text-left font-medium">{t("colStatus")}</th>
                <th className="py-2 text-left font-medium">{t("colLastUsage")}</th>
                <th className="py-2 text-right font-medium">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/50">
              {keys.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-muted">{t("noKey")}</td></tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className={`${k.id === activeKeyId ? "bg-blue-50" : ""} cursor-pointer`} onClick={() => setActiveKeyId(k.id)}>
                    <td className="py-2 font-medium text-navy">{k.name}</td>
                    <td className="py-2"><code className="text-xs">{k.key_prefix}…</code></td>
                    <td className="py-2 text-xs">{t(TIER_KEY[k.tier])}</td>
                    <td className="py-2">
                      {k.active ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">{t("statusActive")}</span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{t("statusRevoked")}</span>
                      )}
                    </td>
                    <td className="py-2 text-xs text-muted">{formatDate(k.last_used_at)}</td>
                    <td className="py-2 text-right space-x-2 text-xs">
                      {k.active && (
                        <button onClick={(e) => { e.stopPropagation(); handleRevoke(k.id); }} className="text-amber-700 hover:underline">{t("revoke")}</button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(k.id); }} className="text-rose-700 hover:underline">{t("delete")}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeKeyId && (
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-base font-semibold text-navy">{t("usageTitle")}</h2>
          <p className="mt-1 text-xs text-muted">{t("selectedKey")} <code>{keys.find((k) => k.id === activeKeyId)?.key_prefix}…</code></p>
          <div className="mt-4">
            <UsageChart data={usage} dateLocale={dateLocale} />
          </div>
        </div>
      )}

      <WebhooksSection lp={lp} />

      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
        <strong>{t("docTitle")}</strong>{" "}
        {t.rich("docBody", {
          endpoint: () => <code>/api/v1/estimation</code>,
          auth1: () => <code>Authorization: Bearer YOUR_KEY</code>,
          auth2: () => <code>X-API-Key: YOUR_KEY</code>,
          body: () => <code>{`{ "commune": "Luxembourg", "surface": 85, ... }`}</code>,
          link: () => <Link href={`${lp}/api-banques`} className="underline">/api-banques</Link>,
        })}
      </div>
    </div>
  );
}

function WebhooksSection({ lp }: { lp: string }) {
  const t = useTranslations("profilApi");
  void lp;
  const [webhooks, setWebhooks] = useState<ApiWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvent, setNewEvent] = useState<ApiWebhookEvent>("estimation.price_change");
  const [newThreshold, setNewThreshold] = useState(5);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; status?: number; durationMs?: number; error?: string }>>({});
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listMyWebhooks();
      setWebhooks(list);
    } catch (e) {
      setError(errMsg(e, t("errGeneric")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void reload(); }, [reload]);

  const handleCreate = async () => {
    if (!newUrl.trim() || !newUrl.match(/^https?:\/\//)) {
      setError(t("urlInvalid"));
      return;
    }
    try {
      await createWebhook({ event_type: newEvent, url: newUrl, threshold_pct: newThreshold });
      setNewUrl("");
      setShowCreate(false);
      setError(null);
      await reload();
    } catch (e) {
      setError(errMsg(e, t("errCreate")));
    }
  };

  const handleTest = async (id: string) => {
    setTestResult((prev) => ({ ...prev, [id]: { ok: false } }));
    const r = await triggerTestWebhook(id);
    setTestResult((prev) => ({ ...prev, [id]: r }));
  };

  const handleToggle = async (id: string, active: boolean) => {
    await toggleWebhookActive(id, !active);
    await reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDeleteWebhook"))) return;
    await deleteWebhook(id);
    await reload();
  };

  return (
    <div className="mt-8 rounded-xl border border-card-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-base font-semibold text-navy">{t("webhooksTitle")}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {t.rich("webhooksDesc", {
              header: () => <code className="text-[10px]">X-Tevaxia-Signature</code>,
            })}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light"
        >
          {showCreate ? t("cancel") : t("newWebhook")}
        </button>
      </div>

      {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      {showCreate && (
        <div className="mb-4 rounded-lg border border-navy/20 bg-navy/5 p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate mb-1">{t("targetUrl")}</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder={t("urlPlaceholder")}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate mb-1">{t("eventLabel")}</label>
              <select
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value as ApiWebhookEvent)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              >
                <option value="estimation.price_change">estimation.price_change</option>
                <option value="estimation.new">estimation.new</option>
                <option value="health.check">health.check</option>
              </select>
            </div>
            {newEvent === "estimation.price_change" && (
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">{t("thresholdLabel")}</label>
                <input
                  type="number"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(Number(e.target.value))}
                  min={1}
                  max={50}
                  step={0.5}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono"
                />
              </div>
            )}
          </div>
          <button
            onClick={handleCreate}
            className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light"
          >
            {t("create")}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted">{t("loading")}</p>
      ) : webhooks.length === 0 ? (
        <p className="text-xs text-muted italic">{t("noWebhook")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-card-border bg-background">
                <th className="px-3 py-2 text-left font-semibold text-navy">{t("colUrl")}</th>
                <th className="px-3 py-2 text-left font-semibold text-navy">{t("colEvent")}</th>
                <th className="px-3 py-2 text-right font-semibold text-navy">{t("colThreshold")}</th>
                <th className="px-3 py-2 text-center font-semibold text-navy">{t("colState")}</th>
                <th className="px-3 py-2 text-right font-semibold text-navy">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((w) => (
                <tr key={w.id} className="border-b border-card-border/40">
                  <td className="px-3 py-2 font-mono truncate max-w-xs" title={w.url}>{w.url}</td>
                  <td className="px-3 py-2"><code className="text-[10px]">{w.event_type}</code></td>
                  <td className="px-3 py-2 text-right font-mono">
                    {w.event_type === "estimation.price_change" ? `±${w.threshold_pct?.toFixed(1)} %` : "-"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {w.active ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">{t("stateActive")}</span>
                    ) : (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-700">{t("stateInactive")}</span>
                    )}
                    {testResult[w.id] && (
                      <div className={`mt-1 text-[9px] ${testResult[w.id].ok ? "text-emerald-700" : "text-rose-700"}`}>
                        {testResult[w.id].ok
                          ? `✓ ${testResult[w.id].status} (${testResult[w.id].durationMs}ms)`
                          : `✗ ${testResult[w.id].error ?? t("errLabel")}`}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2 text-xs">
                      <button onClick={() => handleTest(w.id)} className="text-navy hover:underline">{t("test")}</button>
                      <button onClick={() => handleToggle(w.id, w.active)} className="text-amber-700 hover:underline">
                        {w.active ? t("deactivate") : t("activate")}
                      </button>
                      <button onClick={() => handleDelete(w.id)} className="text-rose-700 hover:underline">{t("delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-[10px] text-muted">
        {t.rich("webhookFooter", {
          event: () => <code>estimation.price_change</code>,
        })}
      </p>
    </div>
  );
}
