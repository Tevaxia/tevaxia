"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LocaleLink from "@/components/LocaleLink";
import { useAuth } from "@/components/AuthProvider";
import BackupButton from "@/components/BackupButton";
import { availableModules, type BackupModule } from "@/lib/backup";
import { lastBackupPerModule, listBackups, type BackupRecord } from "@/lib/backup/history";

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export default function SauvegardesPage() {
  const t = useTranslations("backup");
  const { user, loading } = useAuth();
  const [lastByModule, setLastByModule] = useState<Record<string, BackupRecord>>({});
  const [history, setHistory] = useState<BackupRecord[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    lastBackupPerModule().then(setLastByModule).catch(() => setLastByModule({}));
    listBackups(20).then(setHistory).catch(() => setHistory([]));
  }, [user, refreshTick]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
        <p className="mt-3 text-sm text-muted">{t("loginRequired")}</p>
        <LocaleLink href="/connexion" className="mt-6 inline-block rounded-lg bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-navy-light">
          Connexion →
        </LocaleLink>
      </div>
    );
  }

  const modules = availableModules();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
        <p className="mt-2 text-sm text-muted max-w-2xl">{t("pageSubtitle")}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 mb-8">
        {t("rgpdNote")}
      </div>

      <div className="space-y-4">
        {modules.map((m) => {
          const last = lastByModule[m];
          return (
            <div key={m} className="rounded-xl border border-card-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[250px]">
                  <h2 className="text-sm font-semibold text-navy">
                    {t(`modules.${m}` as `modules.${BackupModule}`)}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {t("lastBackup")}:{" "}
                    {last ? (
                      <span className="text-slate">
                        {t("daysAgo", { n: daysSince(last.created_at) })} · {last.destination === "drive" ? "Drive" : "ZIP"}
                      </span>
                    ) : (
                      <span className="text-amber-700">{t("never")}</span>
                    )}
                  </p>
                </div>
                <div onClick={() => setTimeout(() => setRefreshTick((x) => x + 1), 2000)}>
                  <BackupButton module={m} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-navy mb-3">{t("historyTitle")}</h2>
        {history.length === 0 ? (
          <p className="text-xs text-muted">{t("historyEmpty")}</p>
        ) : (
          <div className="rounded-xl border border-card-border bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-background">
                <tr className="text-left text-muted">
                  <th className="px-3 py-2 font-medium">Module</th>
                  <th className="px-3 py-2 font-medium">Destination</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium text-right">Items</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const total = Object.values(h.counts).reduce((s, n) => s + (n ?? 0), 0);
                  return (
                    <tr key={h.id} className="border-t border-card-border">
                      <td className="px-3 py-2 text-navy font-medium">{h.module}</td>
                      <td className="px-3 py-2 text-slate">{h.destination === "drive" ? "Drive" : "ZIP"}</td>
                      <td className="px-3 py-2 text-muted">{new Date(h.created_at).toLocaleString("fr-LU")}</td>
                      <td className="px-3 py-2 text-right font-mono text-navy">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
