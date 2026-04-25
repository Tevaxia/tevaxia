"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  listMyMandates, updateMandate, type AgencyMandate, type MandateStatus,
} from "@/lib/agency-mandates";
import { listContacts, type CrmContact, contactDisplayName, type CrmTask } from "@/lib/crm";
import { listTasks, completeTask, isOverdue } from "@/lib/crm/tasks";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

const STATUS_ORDER: MandateStatus[] = [
  "prospect", "mandat_signe", "diffuse", "en_visite", "offre_recue",
  "sous_compromis", "vendu", "abandonne", "expire",
];

export default function CrmDashboardPage() {
  const t = useTranslations("proaCrm");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user, loading: authLoading } = useAuth();
  const [mandates, setMandates] = useState<AgencyMandate[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const STATUS_LABEL: Record<MandateStatus, string> = {
    prospect: t("statusProspect"),
    mandat_signe: t("statusMandatSigne"),
    diffuse: t("statusDiffuse"),
    en_visite: t("statusEnVisite"),
    offre_recue: t("statusOffreRecue"),
    sous_compromis: t("statusSousCompromis"),
    vendu: t("statusVendu"),
    abandonne: t("statusAbandonne"),
    expire: t("statusExpire"),
  };

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) { setLoading(false); return; }
    try {
      const [m, c, ts] = await Promise.all([
        listMyMandates(),
        listContacts(),
        listTasks({ dueWithinDays: 7 }),
      ]);
      setMandates(m);
      setContacts(c);
      setTasks(ts);
    } catch (e) {
      setError(errMsg(e));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void reload();
  }, [authLoading, reload]);

  if (authLoading || loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href={`${lp}/connexion`} className="text-navy underline">{t("loginPrompt")}</Link></div>;

  const byStatus = STATUS_ORDER.reduce<Record<MandateStatus, AgencyMandate[]>>((acc, s) => {
    acc[s] = mandates.filter((m) => m.status === s);
    return acc;
  }, {} as Record<MandateStatus, AgencyMandate[]>);

  const overdueTasks = tasks.filter(isOverdue);
  const upcomingTasks = tasks.filter((tk) => !isOverdue(tk));

  const activePipelineStatuses: MandateStatus[] = [
    "mandat_signe", "diffuse", "en_visite", "offre_recue", "sous_compromis",
  ];
  const totalPipeline = mandates
    .filter((m) => activePipelineStatuses.includes(m.status))
    .reduce((s, m) => s + (Number(m.commission_amount_estimee) || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href={`${lp}/pro-agences`} className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
          <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("pageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`${lp}/pro-agences/crm/contacts`} className="rounded-md border border-card-border bg-background px-3 py-1.5 text-xs font-semibold text-slate hover:border-navy">
            {t("btnContacts")}
          </Link>
          <Link href={`${lp}/pro-agences/crm/tasks`} className="rounded-md border border-card-border bg-background px-3 py-1.5 text-xs font-semibold text-slate hover:border-navy">
            {t("btnTasks")}
          </Link>
          <Link href={`${lp}/pro-agences/mandats`} className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
            {t("btnNewMandate")}
          </Link>
        </div>
      </div>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={t("kpiActive")} value={activePipelineStatuses.reduce((s, k) => s + byStatus[k].length, 0).toString()} />
        <Kpi label={t("kpiProspects")} value={byStatus.prospect.length.toString()} />
        <Kpi label={t("kpiContacts")} value={contacts.length.toString()} />
        <Kpi label={t("kpiPipeline")} value={formatEUR(totalPipeline)} highlight />
      </div>

      {overdueTasks.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-900">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span><strong>{overdueTasks.length}</strong> {t("overdueAlert")}</span>
          <Link href={`${lp}/pro-agences/crm/tasks`} className="ml-auto underline font-semibold">{t("btnSeeMore")}</Link>
        </div>
      )}

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-navy">{t("pipelineTitle")}</h2>
          <span className="text-[10px] text-muted">
            {t("pipelineHint")}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STATUS_ORDER.map((s) => (
            <KanbanColumn key={s} status={s} label={STATUS_LABEL[s]}
              mandates={byStatus[s]}
              dropHere={t("dropHere")}
              dashLabel={t("dash")}
              dragHint={t("dragHint")}
              moreCount={t("moreCount", { n: byStatus[s].length - 5 })}
              lp={lp}
              onDrop={async (mandateId, newStatus) => {
                try {
                  const patch: Partial<AgencyMandate> = { status: newStatus };
                  if (newStatus === "vendu") patch.sold_at = new Date().toISOString();
                  if (newStatus === "mandat_signe") patch.signed_at = new Date().toISOString();
                  await updateMandate(mandateId, patch);
                  await reload();
                } catch (e) {
                  setError(errMsg(e));
                }
              }} />
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-navy">{t("upcomingTasksTitle")}</h2>
            <Link href={`${lp}/pro-agences/crm/tasks`} className="text-[11px] text-navy hover:underline">{t("btnAll")}</Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted italic">{t("emptyTasks")}</div>
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.slice(0, 6).map((task) => {
                const daysLeft = task.due_at ? Math.ceil((new Date(task.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <li key={task.id} className="flex items-start gap-2 rounded border border-card-border/50 bg-background p-2 text-xs">
                    <button
                      type="button"
                      onClick={async () => { await completeTask(task.id); await reload(); }}
                      className="mt-0.5 h-4 w-4 rounded border border-card-border hover:border-emerald-500 hover:bg-emerald-50 transition-colors shrink-0"
                      title={t("markDone")}
                      aria-label={t("markDone")}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-navy truncate">{task.title}</div>
                      {task.due_at && (
                        <div className="text-[10px] text-muted">
                          {daysLeft != null && daysLeft <= 0 ? t("today") : daysLeft === 1 ? t("tomorrow") : t("inDays", { n: daysLeft ?? 0 })}
                        </div>
                      )}
                    </div>
                    {task.priority === "high" && <span className="rounded-full bg-amber-100 text-amber-900 px-1.5 py-0.5 text-[9px] shrink-0">H</span>}
                    {task.priority === "urgent" && <span className="rounded-full bg-rose-100 text-rose-900 px-1.5 py-0.5 text-[9px] shrink-0">!</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-navy">{t("contactsTitle")}</h2>
            <Link href={`${lp}/pro-agences/crm/contacts`} className="text-[11px] text-navy hover:underline">{t("btnAllContacts")}</Link>
          </div>
          {contacts.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted italic">
              {t("emptyContacts")} <Link href={`${lp}/pro-agences/crm/contacts?new=1`} className="text-navy underline">{t("btnAdd")}</Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {contacts.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`${lp}/pro-agences/crm/contacts/${c.id}`}
                    className="flex items-center gap-3 rounded border border-card-border/50 bg-background p-2 text-xs hover:border-navy transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[11px] font-bold text-navy">
                      {contactDisplayName(c).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy truncate">{contactDisplayName(c)}</div>
                      <div className="text-[10px] text-muted truncate">
                        {c.email ?? c.phone ?? c.kind}
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[9px] uppercase tracking-wider shrink-0">{c.kind}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function KanbanColumn({ status, label, mandates, onDrop, dropHere, dashLabel, dragHint, moreCount, lp }: {
  status: MandateStatus;
  label: string;
  mandates: AgencyMandate[];
  onDrop: (mandateId: string, newStatus: MandateStatus) => Promise<void>;
  dropHere: string;
  dashLabel: string;
  dragHint: string;
  moreCount: string;
  lp: string;
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={`rounded-xl border p-3 min-h-[160px] transition-colors ${
        over ? "border-navy bg-navy/5 ring-2 ring-navy/30" : "border-card-border bg-card/50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setOver(false);
        const mandateId = e.dataTransfer.getData("text/mandate-id");
        const fromStatus = e.dataTransfer.getData("text/mandate-status");
        if (mandateId && fromStatus !== status) {
          await onDrop(mandateId, status);
        }
      }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</h3>
        <span className="text-[11px] font-mono text-muted">{mandates.length}</span>
      </div>
      <div className="space-y-2">
        {mandates.length === 0 && (
          <div className="text-[11px] text-muted italic text-center py-3">
            {over ? dropHere : dashLabel}
          </div>
        )}
        {mandates.slice(0, 5).map((m) => (
          <div
            key={m.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/mandate-id", m.id);
              e.dataTransfer.setData("text/mandate-status", m.status);
              e.dataTransfer.effectAllowed = "move";
            }}
            className="group cursor-move rounded-md border border-card-border bg-card p-2 text-xs hover:border-navy transition-colors"
          >
            <Link
              href={`${lp}/pro-agences/mandats/${m.id}`}
              className="block"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-semibold text-navy truncate">{m.property_address}</div>
              <div className="mt-0.5 text-[10px] text-muted truncate">
                {m.client_name ?? dashLabel}
              </div>
              {m.prix_demande != null && (
                <div className="mt-1 text-[10px] font-mono text-navy">{formatEUR(Number(m.prix_demande))}</div>
              )}
            </Link>
            <div className="mt-1 text-[9px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">
              {dragHint}
            </div>
          </div>
        ))}
        {mandates.length > 5 && (
          <Link href={`${lp}/pro-agences/mandats`} className="block text-center text-[10px] text-navy hover:underline">
            {moreCount}
          </Link>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "bg-navy text-white border-transparent" : "bg-card border-card-border text-navy"}`}>
      <div className={`text-[10px] uppercase tracking-wider ${highlight ? "text-white/60" : "text-muted"}`}>{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
