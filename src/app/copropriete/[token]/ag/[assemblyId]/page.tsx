"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  portalListAssemblyResolutions, portalCastVote,
  type PortalAssemblyData, type VoteValue, type MajorityType,
} from "@/lib/coownership-assemblies";

const VOTE_KEY: Record<VoteValue, string> = {
  yes: "voteYes",
  no: "voteNo",
  abstain: "voteAbstain",
  absent: "voteAbsent",
};

const MAJORITY_KEY: Record<MajorityType, string> = {
  simple: "majSimple",
  absolute: "majAbsolute",
  double: "majDouble",
  unanimity: "majUnanimity",
};

const VOTE_COLORS: Record<VoteValue, string> = {
  yes: "bg-emerald-600 text-white hover:bg-emerald-700",
  no: "bg-rose-600 text-white hover:bg-rose-700",
  abstain: "bg-amber-600 text-white hover:bg-amber-700",
  absent: "bg-slate-300 text-slate-700 hover:bg-slate-400",
};

const VOTE_SELECTED: Record<VoteValue, string> = {
  yes: "bg-emerald-100 text-emerald-900 border-2 border-emerald-500",
  no: "bg-rose-100 text-rose-900 border-2 border-rose-500",
  abstain: "bg-amber-100 text-amber-900 border-2 border-amber-500",
  absent: "bg-slate-100 text-slate-700 border-2 border-slate-400",
};

export default function PortalVotePage(props: { params: Promise<{ token: string; assemblyId: string }> }) {
  const t = useTranslations("coproAg");
  const { token, assemblyId } = use(props.params);
  const [data, setData] = useState<PortalAssemblyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !assemblyId) return;
    setLoading(true);
    try {
      const d = await portalListAssemblyResolutions(token, assemblyId);
      setData(d);
    } catch (e) {
      setError((e as Error).message ?? t("errGeneric"));
    }
    setLoading(false);
  }, [token, assemblyId, t]);

  useEffect(() => { void reload(); }, [reload]);

  const cast = async (resolutionId: string, vote: VoteValue) => {
    setSaving(resolutionId);
    try {
      const r = await portalCastVote(token, resolutionId, vote);
      if (r.error) setError(r.error);
      else {
        setFlash(t("flashVoteSaved", { label: t(VOTE_KEY[vote]) }));
        setTimeout(() => setFlash(null), 3000);
      }
      await reload();
    } catch (e) {
      setError((e as Error).message ?? t("errGeneric"));
    }
    setSaving(null);
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!data || data.error || !data.assembly) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-navy mb-2">{t("voteUnavailable")}</h1>
        <p className="text-muted">
          {data?.error === "invalid_token" ? t("errInvalidToken")
            : data?.error === "token_not_unit_specific" ? t("errTokenNotUnit")
            : t("errAssemblyNotFound")}
        </p>
      </div>
    );
  }

  const a = data.assembly;
  const canVote = a.status === "convened" || a.status === "in_progress";

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link href={`/copropriete/${token}`} className="text-xs text-muted hover:text-navy">{t("backLink")}</Link>

        <div className="mt-3 rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 text-white">
          <div className="text-xs uppercase tracking-wider text-white/60">
            {t("voteOnlineLabel", { type: a.assembly_type === "ordinary" ? t("typeOrdinary") : t("typeExtraordinary") })}
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold">{a.title}</h1>
          <p className="mt-1 text-sm text-white/80">
            {new Date(a.scheduled_at).toLocaleString("fr-LU", { dateStyle: "full", timeStyle: "short" })}
          </p>
          {a.location && <p className="text-xs text-white/70">{a.location}</p>}
          {a.virtual_url && (
            <a href={a.virtual_url} target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-block rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30">
              {t("btnJoinVideo")}
            </a>
          )}
        </div>

        {!canVote && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {a.status === "draft" ? t("statusDraftMsg")
              : a.status === "closed" ? t("statusClosedMsg")
              : t("statusCancelledMsg")}
          </div>
        )}

        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}
        {flash && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{flash}</div>}

        {/* Résolutions */}
        {(data.resolutions?.length ?? 0) === 0 ? (
          <div className="mt-8 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
            {t("emptyResolutions")}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {data.resolutions?.map((r) => (
              <div key={r.id} className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                      {t("resolutionNumber", { n: r.number })}
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-navy">{r.title}</h3>
                    {r.description && (
                      <p className="mt-2 text-sm text-slate whitespace-pre-wrap">{r.description}</p>
                    )}
                    <div className="mt-3 inline-block rounded-full bg-background px-3 py-1 text-[11px] text-muted">
                      {t(MAJORITY_KEY[r.majority_type])}
                    </div>
                  </div>
                  {r.result !== "pending" && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      r.result === "approved" ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"
                    }`}>
                      {r.result === "approved" ? t("resultApproved") : t("resultRejected")}
                    </span>
                  )}
                </div>

                {r.my_vote && r.my_vote !== "absent" && (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                    <span dangerouslySetInnerHTML={{ __html: t("voteSaved", { vote: t(VOTE_KEY[r.my_vote]) }) }} />
                    {r.my_voted_at && t("voteSavedAt", { date: new Date(r.my_voted_at).toLocaleString("fr-LU") })}
                  </div>
                )}

                {canVote && (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(["yes", "no", "abstain", "absent"] as VoteValue[]).map((v) => (
                      <button key={v} onClick={() => cast(r.id, v)}
                        disabled={saving === r.id}
                        className={`rounded-lg px-4 py-3 text-sm font-bold transition-colors disabled:opacity-50 ${
                          r.my_vote === v ? VOTE_SELECTED[v] : VOTE_COLORS[v]
                        }`}>
                        {v === "yes" ? "✓ " : v === "no" ? "✗ " : v === "abstain" ? "~ " : "— "}
                        {t(VOTE_KEY[v])}
                      </button>
                    ))}
                  </div>
                )}

                {/* Résultats intermédiaires (si AG en cours ou close) */}
                {(a.status === "in_progress" || a.status === "closed") && (
                  <div className="mt-4 space-y-1">
                    <ResultBar label={t("barFor")} count={r.votes_yes_tantiemes} color="bg-emerald-500" suffix={t("barTantiemes", { count: r.votes_yes_tantiemes })} />
                    <ResultBar label={t("barAgainst")} count={r.votes_no_tantiemes} color="bg-rose-500" suffix={t("barTantiemes", { count: r.votes_no_tantiemes })} />
                    <ResultBar label={t("barAbstain")} count={r.votes_abstain_tantiemes} color="bg-amber-500" suffix={t("barTantiemes", { count: r.votes_abstain_tantiemes })} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900"
          dangerouslySetInnerHTML={{ __html: t("eVoteNotice") }}
        />
      </div>
    </div>
  );
}

function ResultBar({ label, count, color, suffix }: { label: string; count: number; color: string; suffix: string }) {
  const maxCount = Math.max(1, count);
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate">{label}</span>
        <span className="text-muted font-mono">{suffix}</span>
      </div>
      <div className="mt-0.5 h-1.5 w-full rounded-full bg-background overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, (count / maxCount) * 100)}%` }} />
      </div>
    </div>
  );
}
