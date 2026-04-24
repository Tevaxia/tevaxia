"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import { getCoownership, type Coownership } from "@/lib/coownerships";
import {
  listUnpaidCharges, listReminderRules, updateReminderRule,
  listRemindersSent, sendReminder, prepareReminder, nextPalier,
  PALIER_LABELS, PALIER_COLORS,
  type UnpaidCharge, type ReminderRule, type Reminder, type ReminderPalier,
} from "@/lib/coownership-reminders";
import ReminderLetterPdf from "@/components/ReminderLetterPdf";
import { getProfile } from "@/lib/profile";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

export default function RelancesPage() {
  const t = useTranslations("syndicRelances");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [unpaid, setUnpaid] = useState<UnpaidCharge[]>([]);
  const [history, setHistory] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"eligible" | "history" | "rules">("eligible");

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, r, u, h] = await Promise.all([
        getCoownership(id), listReminderRules(id),
        listUnpaidCharges(id), listRemindersSent(id, 100),
      ]);
      setCoown(c); setRules(r); setUnpaid(u); setHistory(h);
    } catch (e) {
      setError(errMsg(e, t("errorGeneric")));
    }
    setLoading(false);
  }, [id, t]);

  useEffect(() => { if (user) void reload(); }, [user, reload]);

  const eligibleCharges = useMemo(
    () => unpaid.filter((c) => c.eligible_palier > c.last_palier_sent),
    [unpaid],
  );

  const toggleSelect = (chargeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(chargeId)) next.delete(chargeId); else next.add(chargeId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(eligibleCharges.map((c) => c.charge_id)));
  };

  const selectedCharges = useMemo(
    () => eligibleCharges.filter((c) => selectedIds.has(c.charge_id)),
    [eligibleCharges, selectedIds],
  );

  const sendReminderForCharge = async (charge: UnpaidCharge) => {
    const palier = nextPalier(charge);
    if (!palier) return;
    const rule = rules.find((r) => r.palier === palier);
    if (!rule) { setError(t("ruleNotFound", { p: palier })); return; }
    const { late_interest, penalty, total_claimed, letter_body } = prepareReminder(charge, rule);
    await sendReminder({
      coownership_id: id,
      charge_id: charge.charge_id,
      unit_id: charge.unit_id,
      palier,
      amount_due: charge.amount_due,
      amount_paid: charge.amount_paid,
      amount_outstanding: charge.amount_outstanding,
      days_late: charge.days_late,
      late_interest, penalty, total_claimed,
      owner_name: charge.owner_name,
      owner_email: charge.owner_email,
      owner_address: null,
      letter_body,
      channel: palier === 3 ? "registered_letter" : "letter",
    });
  };

  const sendSelectedBatch = async () => {
    if (selectedCharges.length === 0) return;
    if (!confirm(t("confirmBatch", { n: selectedCharges.length }))) return;
    setError(null);
    let ok = 0; let ko = 0;
    for (const charge of selectedCharges) {
      try {
        await sendReminderForCharge(charge);
        ok++;
      } catch {
        ko++;
      }
    }
    setSelectedIds(new Set());
    await reload();
    alert(t("batchResult", { ok, ko }));
  };

  const downloadPdfForCharge = async (charge: UnpaidCharge) => {
    if (!coown) return;
    const palier = nextPalier(charge);
    if (!palier) { setError(t("noAvailPalier")); return; }
    const rule = rules.find((r) => r.palier === palier);
    if (!rule) return;
    const { late_interest, penalty, total_claimed, letter_body } = prepareReminder(charge, rule);
    const profile = getProfile();
    const blob = await pdf(
      <ReminderLetterPdf
        coownership={{ name: coown.name, address: coown.address, commune: coown.commune }}
        syndic={{
          name: profile.nomComplet || profile.societe || t("defaultSyndicName"),
          address: profile.adresse, email: profile.email, phone: profile.telephone,
        }}
        owner={{
          lot_number: charge.lot_number,
          owner_name: charge.owner_name,
          owner_address: null,
          owner_email: charge.owner_email,
        }}
        reminder={{
          palier, palier_label: rule.label,
          call_label: charge.call_label, due_date: charge.due_date,
          days_late: charge.days_late,
          amount_outstanding: charge.amount_outstanding,
          late_interest, penalty, total_claimed,
          letter_body,
          sent_at: new Date().toISOString(),
          is_registered: palier === 3,
        }}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relance-palier${palier}-lot${charge.lot_number}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveRule = async (ruleId: string, patch: Partial<ReminderRule>) => {
    try {
      await updateReminderRule(ruleId, patch);
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (loading || !coown) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }

  const stats = {
    total_outstanding: unpaid.reduce((s, c) => s + c.amount_outstanding, 0),
    eligible_count: eligibleCharges.length,
    eligible_amount: eligibleCharges.reduce((s, c) => s + c.amount_outstanding, 0),
    sent_this_month: history.filter((h) => {
      const d = new Date(h.sent_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes/${id}`} className="text-xs text-muted hover:text-navy">
          {t("backCoown", { name: coown.name })}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("pageSubtitle")}
        </p>

        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

        {/* KPIs */}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <StatCard label={t("kpiTotal")} value={formatEUR(stats.total_outstanding)} tone="rose" />
          <StatCard label={t("kpiEligibleCount")} value={String(stats.eligible_count)} tone="amber" />
          <StatCard label={t("kpiEligibleAmount")} value={formatEUR(stats.eligible_amount)} />
          <StatCard label={t("kpiSentMonth")} value={String(stats.sent_this_month)} />
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-card-border">
          {([
            { id: "eligible", label: t("tabEligible", { n: eligibleCharges.length }) },
            { id: "history", label: t("tabHistory", { n: history.length }) },
            { id: "rules", label: t("tabRules") },
          ] as const).map((tabItem) => (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === tabItem.id ? "border-navy text-navy" : "border-transparent text-muted hover:text-navy"
              }`}>
              {tabItem.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "eligible" && (
            <>
              {eligibleCharges.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
                  {t("emptyEligible")}
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs text-muted">
                      <button onClick={selectAll} className="text-navy underline mr-2">{t("btnSelectAll")}</button>
                      {selectedIds.size > 0 && (
                        <span>{t("selectedCount", { n: selectedIds.size })}</span>
                      )}
                    </div>
                    {selectedIds.size > 0 && (
                      <button onClick={sendSelectedBatch}
                        className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
                        {t("btnSendBatch", { n: selectedIds.size })}
                      </button>
                    )}
                  </div>
                  <div className="rounded-xl border border-card-border bg-card overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-card-border bg-background/60">
                          <th className="px-3 py-2"></th>
                          <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colLot")}</th>
                          <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colOwner")}</th>
                          <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colCall")}</th>
                          <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colDue")}</th>
                          <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colDays")}</th>
                          <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wider text-muted">{t("colPalier")}</th>
                          <th className="px-3 py-2 text-right"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {eligibleCharges.map((c) => {
                          const palier = nextPalier(c) ?? 1;
                          const selected = selectedIds.has(c.charge_id);
                          return (
                            <tr key={c.charge_id} className={`border-b border-card-border/40 ${selected ? "bg-navy/5" : ""}`}>
                              <td className="px-3 py-2">
                                <input type="checkbox" checked={selected}
                                  onChange={() => toggleSelect(c.charge_id)} />
                              </td>
                              <td className="px-3 py-2 font-mono font-semibold text-navy">{c.lot_number}</td>
                              <td className="px-3 py-2">
                                {c.owner_name ?? t("dash")}
                                {c.owner_email && <div className="text-[10px] text-muted">{c.owner_email}</div>}
                              </td>
                              <td className="px-3 py-2 text-xs">{c.call_label}</td>
                              <td className="px-3 py-2 text-right font-mono font-semibold text-rose-700">
                                {formatEUR(c.amount_outstanding)}
                              </td>
                              <td className="px-3 py-2 text-right text-xs">
                                <span className={c.days_late > 30 ? "font-semibold text-rose-700" : "text-muted"}>
                                  {c.days_late}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PALIER_COLORS[palier]}`}>
                                  {t("palierDisplay", { p: palier, label: PALIER_LABELS[palier] })}
                                </span>
                                {c.last_palier_sent > 0 && (
                                  <div className="text-[9px] text-muted mt-0.5">
                                    {t("previousPalier", { p: c.last_palier_sent })}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <button onClick={() => downloadPdfForCharge(c)}
                                    className="rounded border border-card-border bg-white px-2 py-1 text-[10px] text-slate hover:bg-background">
                                    {t("btnPreviewPdf")}
                                  </button>
                                  <button onClick={async () => { try { await sendReminderForCharge(c); await reload(); } catch (e) { setError(errMsg(e)); } }}
                                    className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700">
                                    {t("btnSend")}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "history" && (
            <>
              {history.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
                  {t("emptyHistory")}
                </div>
              ) : (
                <div className="rounded-xl border border-card-border bg-card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-card-border bg-background/60">
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colDate")}</th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colPalierH")}</th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colRecipient")}</th>
                        <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colDue")}</th>
                        <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colInterest")}</th>
                        <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colPenalty")}</th>
                        <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colTotal")}</th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colChannel")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((r) => (
                        <tr key={r.id} className="border-b border-card-border/40">
                          <td className="px-3 py-2 text-xs">
                            {new Date(r.sent_at).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PALIER_COLORS[r.palier as ReminderPalier]}`}>
                              {t("palierPrefix", { p: r.palier })}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs">{r.owner_name ?? t("dash")}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{formatEUR(r.amount_outstanding)}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-amber-700">
                            {r.late_interest > 0 ? formatEUR(r.late_interest) : t("dash")}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-amber-700">
                            {r.penalty > 0 ? formatEUR(r.penalty) : t("dash")}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-navy">
                            {formatEUR(r.total_claimed)}
                          </td>
                          <td className="px-3 py-2 text-[10px] text-muted">{r.channel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === "rules" && (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-card-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${PALIER_COLORS[rule.palier]}`}>
                        {t("rulePalierBadge", { p: rule.palier })}
                      </span>
                      <h3 className="text-sm font-bold text-navy">{rule.label}</h3>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={rule.active}
                        onChange={(e) => saveRule(rule.id, { active: e.target.checked })} />
                      {t("ruleActive")}
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4 text-xs">
                    <label>
                      <div className="text-muted mb-1">{t("ruleDays")}</div>
                      <input type="number" value={rule.days_after_due}
                        onChange={(e) => saveRule(rule.id, { days_after_due: Number(e.target.value) })}
                        className="w-full rounded border border-input-border bg-input-bg px-2 py-1" />
                    </label>
                    <label>
                      <div className="text-muted mb-1">{t("ruleMinAmount")}</div>
                      <input type="number" step={5} value={rule.min_amount_eur}
                        onChange={(e) => saveRule(rule.id, { min_amount_eur: Number(e.target.value) })}
                        className="w-full rounded border border-input-border bg-input-bg px-2 py-1" />
                    </label>
                    <label>
                      <div className="text-muted mb-1">{t("ruleRate")}</div>
                      <input type="number" step={0.01} value={rule.interest_rate_pct}
                        disabled={!rule.apply_late_interest}
                        onChange={(e) => saveRule(rule.id, { interest_rate_pct: Number(e.target.value) })}
                        className="w-full rounded border border-input-border bg-input-bg px-2 py-1 disabled:opacity-50" />
                    </label>
                    <label>
                      <div className="text-muted mb-1">{t("rulePenalty")}</div>
                      <input type="number" step={5} value={rule.penalty_fixed_eur}
                        onChange={(e) => saveRule(rule.id, { penalty_fixed_eur: Number(e.target.value) })}
                        className="w-full rounded border border-input-border bg-input-bg px-2 py-1" />
                    </label>
                    <label className="sm:col-span-4">
                      <div className="text-muted mb-1 flex items-center gap-2">
                        <input type="checkbox" checked={rule.apply_late_interest}
                          onChange={(e) => saveRule(rule.id, { apply_late_interest: e.target.checked })} />
                        {t("ruleApplyInterest")}
                      </div>
                    </label>
                    <label className="sm:col-span-4">
                      <div className="text-muted mb-1">{t("ruleTemplate", { vars: "{outstanding} {total} {interest} {penalty} {rate} {days} {ref}" })}</div>
                      <textarea value={rule.template_body} rows={8}
                        onChange={(e) => saveRule(rule.id, { template_body: e.target.value })}
                        className="w-full rounded border border-input-border bg-input-bg px-2 py-1 font-mono text-[10px]" />
                    </label>
                  </div>
                </div>
              ))}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
                <strong>{t("rulesInfoTitle")}</strong> {t("rulesInfoBody")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "rose" | "amber" }) {
  const bg = tone === "rose" ? "bg-rose-50 border-rose-200" :
    tone === "amber" ? "bg-amber-50 border-amber-200" : "bg-card border-card-border";
  const txt = tone === "rose" ? "text-rose-900" :
    tone === "amber" ? "text-amber-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-xl font-bold ${txt}`}>{value}</div>
    </div>
  );
}
