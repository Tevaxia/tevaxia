"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LocaleLink from "@/components/LocaleLink";
import { useAuth } from "@/components/AuthProvider";
import { checkOverdueBackups, type OverdueModule } from "@/lib/backup/reminders";

/**
 * Affiche un toast discret en bas à droite si au moins une sauvegarde
 * est en retard selon les préférences utilisateur.
 *
 * Exécuté au montage (donc au login) avec un délai de 2s pour ne pas
 * polluer l'expérience de login.
 */
export default function BackupReminderToast() {
  const t = useTranslations("backup");
  const { user, loading } = useAuth();
  const [overdue, setOverdue] = useState<OverdueModule[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      const result = await checkOverdueBackups();
      if (!cancelled && result && result.length > 0) {
        setOverdue(result);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user, loading]);

  if (dismissed || overdue.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-xl border border-amber-300 bg-amber-50 shadow-xl p-4 animate-in slide-in-from-bottom-4 fade-in"
    >
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-amber-900">
            {t("reminderToastTitle")}
          </div>
          <ul className="mt-1.5 space-y-0.5 text-xs text-amber-800">
            {overdue.slice(0, 3).map((o) => (
              <li key={o.module}>
                <span className="font-medium">{t(`modules.${o.module}`).split(" — ")[0]}</span>
                {o.daysSince < 0 ? " — " + t("never") : ` — ${t("daysAgo", { n: o.daysSince })}`}
              </li>
            ))}
            {overdue.length > 3 && (
              <li className="text-amber-700 italic">+{overdue.length - 3} autres</li>
            )}
          </ul>
          <div className="mt-2.5 flex gap-2">
            <LocaleLink
              href="/profil/sauvegardes"
              className="rounded-md bg-amber-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
              onClick={() => setDismissed(true)}
            >
              {t("reminderToastCta")}
            </LocaleLink>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
            >
              {t("reminderToastDismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
