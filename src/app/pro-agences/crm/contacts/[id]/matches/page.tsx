"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  findMandatesForContact, VERDICT_LABELS, VERDICT_COLORS,
  type MatchResult,
} from "@/lib/agency-matching";
import { contactDisplayName, type CrmContact } from "@/lib/crm/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

export default function ContactMatchesPage() {
  const t = useTranslations("proaCrmContactMatches");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const params = useParams<{ id: string }>();
  const contactId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const [contact, setContact] = useState<CrmContact | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<number>(40);

  const reload = useCallback(async () => {
    if (!contactId || !isSupabaseConfigured || !supabase || !user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: contactData } = await supabase
        .from("crm_contacts").select("*").eq("id", contactId).single();
      setContact(contactData as CrmContact | null);
      const results = await findMandatesForContact(contactId, { minScore });
      setMatches(results);
    } catch (e) {
      setError(errMsg(e, t("errorGeneric")));
    }
    setLoading(false);
  }, [contactId, user, minScore, t]);

  useEffect(() => { void reload(); }, [reload]);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }
  if (!user) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center">
      <Link href={`${lp}/connexion`} className="text-navy underline">{t("login")}</Link>
    </div>
  );
  if (!contact) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">
      {t("contactNotFound")}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`${lp}/pro-agences/crm/contacts`} className="hover:text-navy">{t("breadContacts")}</Link>
        <span>/</span>
        <Link href={`${lp}/pro-agences/crm/contacts/${contactId}`} className="hover:text-navy">
          {contactDisplayName(contact)}
        </Link>
        <span>/</span>
        <span className="text-navy">{t("breadMatches")}</span>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-navy">
        {t("pageTitle", { name: contactDisplayName(contact) })}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {t("pageSubtitle")}
      </p>

      <div className="mt-4 rounded-xl border border-card-border bg-card p-4 text-xs">
        <div className="flex flex-wrap gap-3">
          {contact.budget_min != null || contact.budget_max != null ? (
            <span className="rounded-full bg-background px-2 py-1">
              {t("budgetLabel", {
                min: contact.budget_min ? formatEUR(contact.budget_min) : t("budgetUnknown"),
                max: contact.budget_max ? formatEUR(contact.budget_max) : t("budgetUnknown"),
              })}
            </span>
          ) : <span className="text-muted italic">{t("budgetNotSet")}</span>}
          {contact.target_surface_min != null || contact.target_surface_max != null ? (
            <span className="rounded-full bg-background px-2 py-1">
              {t("surfaceLabel", {
                min: contact.target_surface_min ?? t("budgetUnknown"),
                max: contact.target_surface_max ?? t("budgetUnknown"),
              })}
            </span>
          ) : null}
          {contact.target_zones && contact.target_zones.length > 0 && (
            <span className="rounded-full bg-background px-2 py-1">
              {t("zonesLabel", { list: contact.target_zones.join(", ") })}
            </span>
          )}
          {contact.tags && contact.tags.length > 0 && (
            <span className="rounded-full bg-background px-2 py-1">
              {t("prefsLabel", { list: contact.tags.join(", ") })}
            </span>
          )}
        </div>
        {(!contact.budget_min && !contact.budget_max) || !contact.target_zones?.length ? (
          <div className="mt-2 text-[11px] text-amber-700">
            {t("enrichTip")}
            <Link href={`${lp}/pro-agences/crm/contacts/${contactId}`} className="ml-1 underline">
              {t("btnEdit")}
            </Link>
          </div>
        ) : null}
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      <div className="mt-5 flex items-center gap-2 text-xs">
        <span className="text-muted">{t("thresholdLabel")}</span>
        {[0, 40, 70].map((s) => (
          <button key={s} onClick={() => setMinScore(s)}
            className={`rounded-full px-3 py-1 font-semibold ${
              minScore === s ? "bg-navy text-white" : "bg-card border border-card-border text-slate"
            }`}>
            {s === 0 ? t("thresholdAll") : s === 40 ? t("threshold40") : t("threshold70")}
          </button>
        ))}
      </div>

      {matches.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("emptyMatches")}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {matches.map((m) => (
            <Link key={m.mandate.id} href={`${lp}/pro-agences/mandats/${m.mandate.id}`}
              className="block rounded-xl border border-card-border bg-card p-4 hover:border-navy">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-navy truncate">{m.mandate.property_address}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${VERDICT_COLORS[m.verdict]}`}>
                      {VERDICT_LABELS[m.verdict]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted">
                    <span>{m.mandate.property_commune ?? t("dash")}</span>
                    <span>·</span>
                    <span>{m.mandate.property_type ?? t("dash")}</span>
                    {m.mandate.prix_demande && <><span>·</span><span className="font-mono">{formatEUR(m.mandate.prix_demande)}</span></>}
                    {m.mandate.property_surface && <><span>·</span><span>{m.mandate.property_surface} m²</span></>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-navy">{m.score.total}</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted">{t("scoreOver")}</div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-[10px]">
                <span className="text-muted">B: <span className="text-navy font-mono">{m.score.budget}/40</span></span>
                <span className="text-muted">S: <span className="text-navy font-mono">{m.score.surface}/30</span></span>
                <span className="text-muted">Z: <span className="text-navy font-mono">{m.score.zone}/20</span></span>
                <span className="text-muted">T: <span className="text-navy font-mono">{m.score.type}/10</span></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
