"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  listMyMandates, type AgencyMandate, type MandateStatus,
} from "@/lib/agency-mandates";
import { listContacts, type CrmContact, contactDisplayName, type CrmTask } from "@/lib/crm";
import { listTasks, completeTask, isOverdue } from "@/lib/crm/tasks";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

const STATUS_ORDER: MandateStatus[] = [
  "prospect", "mandat_signe", "diffuse", "en_visite", "offre_recue",
  "sous_compromis", "vendu", "abandonne", "expire",
];
const STATUS_LABEL: Record<MandateStatus, string> = {
  prospect: "Prospect",
  mandat_signe: "Mandat signé",
  diffuse: "Diffusé",
  en_visite: "En visite",
  offre_recue: "Offre reçue",
  sous_compromis: "Sous compromis",
  vendu: "Vendu",
  abandonne: "Abandonné",
  expire: "Expiré",
};

export default function CrmDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [mandates, setMandates] = useState<AgencyMandate[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) { setLoading(false); return; }
    try {
      const [m, c, t] = await Promise.all([
        listMyMandates(),
        listContacts(),
        listTasks({ dueWithinDays: 7 }),
      ]);
      setMandates(m);
      setContacts(c);
      setTasks(t);
    } catch (e) {
      setError(errMsg(e));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void reload();
  }, [authLoading, reload]);

  if (authLoading || loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">Connectez-vous</Link></div>;

  // Regroupe mandats par statut pour Kanban
  const byStatus = STATUS_ORDER.reduce<Record<MandateStatus, AgencyMandate[]>>((acc, s) => {
    acc[s] = mandates.filter((m) => m.status === s);
    return acc;
  }, {} as Record<MandateStatus, AgencyMandate[]>);

  const overdueTasks = tasks.filter(isOverdue);
  const upcomingTasks = tasks.filter((t) => !isOverdue(t));

  const activePipelineStatuses: MandateStatus[] = [
    "mandat_signe", "diffuse", "en_visite", "offre_recue", "sous_compromis",
  ];
  const totalPipeline = mandates
    .filter((m) => activePipelineStatuses.includes(m.status))
    .reduce((s, m) => s + (Number(m.commission_amount_estimee) || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/pro-agences" className="text-xs text-muted hover:text-navy">← Pro-agences</Link>
          <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">CRM agences</h1>
          <p className="mt-1 text-sm text-muted">Pipeline mandats, contacts, tâches et interactions en un seul endroit.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pro-agences/crm/contacts" className="rounded-md border border-card-border bg-background px-3 py-1.5 text-xs font-semibold text-slate hover:border-navy">
            Contacts
          </Link>
          <Link href="/pro-agences/crm/tasks" className="rounded-md border border-card-border bg-background px-3 py-1.5 text-xs font-semibold text-slate hover:border-navy">
            Tâches
          </Link>
          <Link href="/pro-agences/mandats" className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
            + Nouveau mandat
          </Link>
        </div>
      </div>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Mandats en cours" value={activePipelineStatuses.reduce((s, k) => s + byStatus[k].length, 0).toString()} />
        <Kpi label="Prospects" value={byStatus.prospect.length.toString()} />
        <Kpi label="Contacts CRM" value={contacts.length.toString()} />
        <Kpi label="Pipeline commissions" value={formatEUR(totalPipeline)} highlight />
      </div>

      {/* Alerte tâches en retard */}
      {overdueTasks.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-900">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span><strong>{overdueTasks.length}</strong> tâche(s) en retard</span>
          <Link href="/pro-agences/crm/tasks" className="ml-auto underline font-semibold">Voir →</Link>
        </div>
      )}

      {/* Kanban */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-navy mb-3">Pipeline mandats</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="rounded-xl border border-card-border bg-card/50 p-3 min-h-[160px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{STATUS_LABEL[s]}</h3>
                <span className="text-[11px] font-mono text-muted">{byStatus[s].length}</span>
              </div>
              <div className="space-y-2">
                {byStatus[s].length === 0 && (
                  <div className="text-[11px] text-muted italic text-center py-3">—</div>
                )}
                {byStatus[s].slice(0, 5).map((m) => (
                  <Link
                    key={m.id}
                    href={`/pro-agences/mandats/${m.id}`}
                    className="block rounded-md border border-card-border bg-card p-2 text-xs hover:border-navy transition-colors"
                  >
                    <div className="font-semibold text-navy truncate">{m.property_address}</div>
                    <div className="mt-0.5 text-[10px] text-muted truncate">
                      {m.client_name ?? "—"}
                    </div>
                    {m.prix_demande != null && (
                      <div className="mt-1 text-[10px] font-mono text-navy">{formatEUR(Number(m.prix_demande))}</div>
                    )}
                  </Link>
                ))}
                {byStatus[s].length > 5 && (
                  <Link href="/pro-agences/mandats" className="block text-center text-[10px] text-navy hover:underline">
                    +{byStatus[s].length - 5} autres →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 colonnes : tâches à venir / contacts récents / résumé */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-navy">Prochaines tâches (7 j)</h2>
            <Link href="/pro-agences/crm/tasks" className="text-[11px] text-navy hover:underline">Toutes →</Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted italic">Aucune tâche à venir.</div>
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
                      title="Marquer comme fait"
                      aria-label="Marquer comme fait"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-navy truncate">{task.title}</div>
                      {task.due_at && (
                        <div className="text-[10px] text-muted">
                          {daysLeft != null && daysLeft <= 0 ? "Aujourd'hui" : daysLeft === 1 ? "Demain" : `dans ${daysLeft} j`}
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
            <h2 className="text-sm font-semibold text-navy">Contacts récents</h2>
            <Link href="/pro-agences/crm/contacts" className="text-[11px] text-navy hover:underline">Tous →</Link>
          </div>
          {contacts.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted italic">
              Aucun contact. <Link href="/pro-agences/crm/contacts?new=1" className="text-navy underline">+ Ajouter</Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {contacts.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/pro-agences/crm/contacts/${c.id}`}
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

function Kpi({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "bg-navy text-white border-transparent" : "bg-card border-card-border text-navy"}`}>
      <div className={`text-[10px] uppercase tracking-wider ${highlight ? "text-white/60" : "text-muted"}`}>{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
