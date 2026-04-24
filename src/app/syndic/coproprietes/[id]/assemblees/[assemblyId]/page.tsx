"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import { getCoownership, type Coownership } from "@/lib/coownerships";
import {
  getAssembly, listResolutions, createResolution, deleteResolution,
  listVotes, setVote, sendConvocation, openAssembly, closeAssembly,
  resolutionVerdict, expressedCount,
  STATUS_LABEL, MAJORITY_LABEL, VOTE_LABEL,
  type Assembly, type Resolution, type AssemblyVote, type MajorityType, type VoteValue,
} from "@/lib/coownership-assemblies";
import AssemblyMinutesPdf from "@/components/AssemblyMinutesPdf";
import ConvocationPdf from "@/components/ConvocationPdf";
import { getProfile } from "@/lib/profile";
import { errMsg } from "@/lib/errors";

const STATUS_COLORS: Record<Assembly["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  convened: "bg-blue-100 text-blue-900",
  in_progress: "bg-amber-100 text-amber-900",
  closed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-rose-100 text-rose-900",
};

const VOTE_COLORS: Record<VoteValue, string> = {
  yes: "bg-emerald-100 text-emerald-900",
  no: "bg-rose-100 text-rose-900",
  abstain: "bg-amber-100 text-amber-900",
  absent: "bg-slate-100 text-slate-600",
};

const RESULT_COLORS: Record<Resolution["result"], string> = {
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-rose-100 text-rose-900",
  pending: "bg-slate-100 text-slate-700",
};

export default function AssemblyDetailPage() {
  const t = useTranslations("syndicAssemblyDetail");
  const params = useParams();
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const coownershipId = String(params?.id ?? "");
  const assemblyId = String(params?.assemblyId ?? "");
  const { user, loading: authLoading } = useAuth();

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [activeResolutionId, setActiveResolutionId] = useState<string | null>(null);
  const [votes, setVotes] = useState<AssemblyVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewRes, setShowNewRes] = useState(false);
  const [draftRes, setDraftRes] = useState<{ title: string; description: string; majority_type: MajorityType }>({
    title: "", description: "", majority_type: "simple",
  });

  const reload = useCallback(async () => {
    if (!assemblyId) return;
    setLoading(true);
    try {
      const [c, a, r] = await Promise.all([
        getCoownership(coownershipId), getAssembly(assemblyId), listResolutions(assemblyId),
      ]);
      setCoown(c); setAssembly(a); setResolutions(r);
      if (!activeResolutionId && r.length > 0) setActiveResolutionId(r[0].id);
    } catch (e) {
      setError(errMsg(e, t("errorGeneric")));
    }
    setLoading(false);
  }, [coownershipId, assemblyId, activeResolutionId, t]);

  useEffect(() => { if (user) void reload(); }, [user, reload]);

  useEffect(() => {
    if (activeResolutionId) {
      listVotes(activeResolutionId).then(setVotes);
    }
  }, [activeResolutionId]);

  const activeResolution = useMemo(
    () => resolutions.find((r) => r.id === activeResolutionId) ?? null,
    [resolutions, activeResolutionId],
  );

  const handleCreateRes = async () => {
    if (!draftRes.title.trim()) { setError(t("errorTitleRequired")); return; }
    try {
      const r = await createResolution({
        assembly_id: assemblyId,
        title: draftRes.title,
        description: draftRes.description || undefined,
        majority_type: draftRes.majority_type,
      });
      setDraftRes({ title: "", description: "", majority_type: "simple" });
      setShowNewRes(false);
      setActiveResolutionId(r.id);
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const handleDeleteRes = async (id: string) => {
    if (!confirm(t("confirmDeleteRes"))) return;
    await deleteResolution(id);
    if (activeResolutionId === id) setActiveResolutionId(null);
    await reload();
  };

  const handleSetVote = async (voteId: string, v: VoteValue) => {
    await setVote(voteId, v);
    if (activeResolutionId) {
      const [newVotes, freshResolutions] = await Promise.all([
        listVotes(activeResolutionId), listResolutions(assemblyId),
      ]);
      setVotes(newVotes);
      setResolutions(freshResolutions);
    }
  };

  const advanceStatus = async (action: "convene" | "open" | "close") => {
    if (!assembly) return;
    const fn = action === "convene" ? sendConvocation : action === "open" ? openAssembly : closeAssembly;
    const result = await fn(assembly.id);
    setAssembly(result);
  };

  const downloadConvocationPdf = async () => {
    if (!assembly || !coown) return;
    const profile = getProfile();
    const blob = await pdf(
      <ConvocationPdf
        coownership={{ name: coown.name, address: coown.address, commune: coown.commune }}
        syndic={{
          name: profile.nomComplet || profile.societe || t("defaultSyndicName"),
          address: profile.adresse, email: profile.email, phone: profile.telephone,
        }}
        assembly={assembly}
        resolutions={resolutions}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `convocation-${assembly.title.replace(/\s+/g, "-").toLowerCase()}-${new Date(assembly.scheduled_at).toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadMinutesPdf = async () => {
    if (!assembly || !coown) return;
    const votesMap: Record<string, AssemblyVote[]> = {};
    await Promise.all(resolutions.map(async (r) => {
      votesMap[r.id] = await listVotes(r.id);
    }));
    const profile = getProfile();
    const blob = await pdf(
      <AssemblyMinutesPdf
        coownership={{ name: coown.name, address: coown.address, total_tantiemes: coown.total_tantiemes }}
        syndic={{
          name: profile.nomComplet || profile.societe || t("defaultSyndicName"),
          email: profile.email,
        }}
        assembly={assembly}
        resolutions={resolutions}
        votesByResolution={votesMap}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PV-AG-${assembly.title.replace(/\s+/g, "-").toLowerCase()}-${new Date(assembly.scheduled_at).toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || !coown || !assembly) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href={`${lp}/connexion`} className="text-navy underline">{t("login")}</Link></div>;

  const totalTantiemes = coown.total_tantiemes;
  const nbVotedUnits = votes.filter((v) => v.vote !== "absent").length;
  const sortedVotes = [...votes].sort((a, b) => (a.voter_name ?? "").localeCompare(b.voter_name ?? ""));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`${lp}/syndic/coproprietes/${coownershipId}`} className="hover:text-navy">{coown.name}</Link>
        <span>/</span>
        <Link href={`${lp}/syndic/coproprietes/${coownershipId}/assemblees`} className="hover:text-navy">{t("breadAssemblies")}</Link>
        <span>/</span>
        <span className="text-navy">{assembly.title}</span>
      </div>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy truncate">{assembly.title}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[assembly.status]}`}>
              {STATUS_LABEL[assembly.status]}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted">
            {assembly.assembly_type === "ordinary" ? t("agOrdinary") : t("agExtraordinary")}
            {" · "}
            {new Date(assembly.scheduled_at).toLocaleString(dateLocale, { dateStyle: "full", timeStyle: "short" })}
            {assembly.location && ` · ${assembly.location}`}
          </div>
        </div>
        <div className="flex gap-2">
          {assembly.status === "draft" && (
            <button onClick={() => advanceStatus("convene")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              {t("btnConvene")}
            </button>
          )}
          {assembly.status === "convened" && (
            <button onClick={() => advanceStatus("open")}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              {t("btnOpen")}
            </button>
          )}
          {assembly.status === "in_progress" && (
            <button onClick={() => advanceStatus("close")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              {t("btnClose")}
            </button>
          )}
          {resolutions.length > 0 && (assembly.status === "draft" || assembly.status === "convened") && (
            <button onClick={downloadConvocationPdf}
              className="rounded-lg border border-blue-400 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-100">
              {t("btnDownloadConvocation")}
            </button>
          )}
          {(assembly.status === "in_progress" || assembly.status === "closed") && resolutions.length > 0 && (
            <button onClick={downloadMinutesPdf}
              className="rounded-lg border border-navy bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5">
              {t("btnDownloadMinutes")}
            </button>
          )}
          {assembly.virtual_url && (
            <a href={assembly.virtual_url} target="_blank" rel="noopener noreferrer"
              className="rounded-lg border border-navy bg-white px-4 py-2 text-sm font-semibold text-navy">
              {t("btnVideoconf")}
            </a>
          )}
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* KPIs */}
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-card-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("kpiResolutions")}</div>
          <div className="mt-1 text-xl font-bold text-navy">{resolutions.length}</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("kpiApproved")}</div>
          <div className="mt-1 text-xl font-bold text-emerald-700">
            {resolutions.filter((r) => r.result === "approved").length}
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("kpiRejected")}</div>
          <div className="mt-1 text-xl font-bold text-rose-700">
            {resolutions.filter((r) => r.result === "rejected").length}
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("kpiQuorum")}</div>
          <div className="mt-1 text-xl font-bold text-navy">{assembly.quorum_pct}%</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Sidebar résolutions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t("agendaTitle")}
            </h2>
            {assembly.status !== "closed" && assembly.status !== "cancelled" && (
              <button onClick={() => setShowNewRes(!showNewRes)}
                className="rounded bg-navy px-3 py-1 text-xs font-semibold text-white">
                +
              </button>
            )}
          </div>

          {showNewRes && (
            <div className="mb-3 rounded-xl border border-navy/20 bg-navy/5 p-3 space-y-2">
              <input type="text" placeholder={t("newResTitle")}
                value={draftRes.title}
                onChange={(e) => setDraftRes({ ...draftRes, title: e.target.value })}
                className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
              <textarea placeholder={t("newResDesc")}
                value={draftRes.description} rows={3}
                onChange={(e) => setDraftRes({ ...draftRes, description: e.target.value })}
                className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
              <select value={draftRes.majority_type}
                onChange={(e) => setDraftRes({ ...draftRes, majority_type: e.target.value as MajorityType })}
                className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs">
                {(Object.entries(MAJORITY_LABEL) as [MajorityType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <button onClick={handleCreateRes}
                className="w-full rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                {t("btnCreate")}
              </button>
            </div>
          )}

          {resolutions.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-card-border p-4 text-center text-xs text-muted">
              {t("emptyAgenda")}
            </div>
          ) : (
            <ol className="space-y-1">
              {resolutions.map((r) => {
                const exp = expressedCount(r);
                const pctExp = totalTantiemes > 0 ? (exp / totalTantiemes) * 100 : 0;
                return (
                  <li key={r.id}>
                    <button onClick={() => setActiveResolutionId(r.id)}
                      className={`w-full text-left rounded-lg border p-3 transition-colors ${
                        activeResolutionId === r.id
                          ? "border-navy bg-navy/5 ring-1 ring-navy"
                          : "border-card-border bg-card hover:bg-background"
                      }`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-mono text-muted">#{r.number}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${RESULT_COLORS[r.result]}`}>
                          {r.result === "approved" ? t("resApproved") : r.result === "rejected" ? t("resRejected") : t("resPending")}
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-navy line-clamp-2">{r.title}</div>
                      <div className="mt-1 text-[9px] text-muted">
                        {t("agendaExpressed", { pct: pctExp.toFixed(0) })}
                      </div>
                      <div className="mt-1 h-1 w-full rounded-full bg-background overflow-hidden">
                        <div className="h-full bg-navy" style={{ width: `${Math.min(100, pctExp)}%` }} />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Main : détail résolution + votes */}
        <div>
          {!activeResolution ? (
            <div className="rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
              {t("emptySelectRes")}
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-card-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                      {t("resPrefix", { n: activeResolution.number })}
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-navy">{activeResolution.title}</h3>
                    {activeResolution.description && (
                      <p className="mt-2 text-sm text-slate whitespace-pre-wrap">{activeResolution.description}</p>
                    )}
                    <div className="mt-3 inline-block rounded-full bg-background px-3 py-1 text-[11px] text-muted">
                      {MAJORITY_LABEL[activeResolution.majority_type]}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${RESULT_COLORS[activeResolution.result]}`}>
                    {activeResolution.result === "approved" ? t("resApproved") : activeResolution.result === "rejected" ? t("resRejected") : t("resPending")}
                  </span>
                </div>

                {/* Barres de résultat */}
                {(() => {
                  const v = resolutionVerdict(activeResolution, totalTantiemes);
                  return (
                    <div className="mt-4 space-y-2">
                      <ResultBar label={t("barYes")} count={activeResolution.votes_yes_tantiemes}
                        total={totalTantiemes} color="bg-emerald-500" t={t} />
                      <ResultBar label={t("barNo")} count={activeResolution.votes_no_tantiemes}
                        total={totalTantiemes} color="bg-rose-500" t={t} />
                      <ResultBar label={t("barAbstain")} count={activeResolution.votes_abstain_tantiemes}
                        total={totalTantiemes} color="bg-amber-500" t={t} />
                      <ResultBar label={t("barAbsent")} count={activeResolution.votes_absent_tantiemes}
                        total={totalTantiemes} color="bg-slate-400" t={t} />
                      <div className="mt-2 text-xs text-muted">
                        {t("barExpressedInfo", { pct: v.pctExpressed.toFixed(1), threshold: v.reachedThreshold })}
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4 flex justify-end">
                  <button onClick={() => handleDeleteRes(activeResolution.id)}
                    className="text-xs text-rose-700 hover:underline">
                    {t("btnDeleteRes")}
                  </button>
                </div>
              </div>

              {/* Table des votes */}
              <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-navy">
                    {t("votesTitle", { ok: nbVotedUnits, total: votes.length })}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                        <th className="px-2 py-2 text-left">{t("colLot")}</th>
                        <th className="px-2 py-2 text-left">{t("colVoter")}</th>
                        <th className="px-2 py-2 text-right">{t("colTantiemes")}</th>
                        <th className="px-2 py-2 text-center">{t("colVote")}</th>
                        <th className="px-2 py-2 text-center">{t("colActions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedVotes.map((v) => (
                        <tr key={v.id} className="border-b border-card-border/40">
                          <td className="px-2 py-1.5 font-mono text-xs">{v.unit_id.slice(-6)}</td>
                          <td className="px-2 py-1.5 text-xs">{v.voter_name ?? t("dash")}</td>
                          <td className="px-2 py-1.5 text-right font-mono text-xs">{v.tantiemes_at_vote}</td>
                          <td className="px-2 py-1.5 text-center">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${VOTE_COLORS[v.vote]}`}>
                              {VOTE_LABEL[v.vote]}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <div className="inline-flex gap-0.5">
                              {(["yes", "no", "abstain", "absent"] as VoteValue[]).map((vv) => (
                                <button key={vv} onClick={() => handleSetVote(v.id, vv)}
                                  className={`rounded px-2 py-0.5 text-[9px] font-semibold ${
                                    v.vote === vv ? VOTE_COLORS[vv] : "bg-background text-muted hover:bg-card-border/30"
                                  }`}
                                  title={VOTE_LABEL[vv]}>
                                  {vv === "yes" ? "✓" : vv === "no" ? "✗" : vv === "abstain" ? "~" : "—"}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("infoTitle")}</strong> {t("infoBody")}
      </div>
    </div>
  );
}

function ResultBar({ label, count, total, color, t }: {
  label: string; count: number; total: number; color: string;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold">{label}</span>
        <span className="text-muted">{t("barCountDetail", { n: count, pct: pct.toFixed(1) })}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-background overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
