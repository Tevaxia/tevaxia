"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getContact, updateContact, deleteContact, contactDisplayName, type CrmContact, type CrmContactKind, type CrmInteraction, type CrmInteractionType, type CrmTask } from "@/lib/crm";
import { listInteractions, logInteraction } from "@/lib/crm/interactions";
import { listTasks, createTask, completeTask, isOverdue } from "@/lib/crm/tasks";
import { errMsg } from "@/lib/errors";
import { formatEUR } from "@/lib/calculations";
import { useRouter } from "next/navigation";
import {
  NURTURE_SEQUENCES, enrollContact, estimateSequenceDuration,
  type NurtureSequence,
} from "@/lib/crm/nurture-sequences";

const KIND_KEY: Record<CrmContactKind, string> = {
  prospect: "kindProspect", lead: "kindLead", acquereur: "kindAcquereur", vendeur: "kindVendeur",
  bailleur: "kindBailleur", locataire: "kindLocataire", partenaire: "kindPartenaire", autre: "kindAutre",
};

const INTERACTION_KEY: Record<CrmInteractionType, string> = {
  call: "interactionCall", email: "interactionEmail", sms: "interactionSms", meeting: "interactionMeeting",
  visit: "interactionVisit", offer: "interactionOffer", document: "interactionDocument", note: "interactionNote",
  task_done: "interactionTaskDone", status_change: "interactionStatusChange",
};

const SEQ_NAME_KEY: Record<string, string> = {
  prospect_silent_30j: "seqProspectSilent30jName",
  post_visite_followup: "seqPostVisiteFollowupName",
  acquereur_actif: "seqAcquereurActifName",
  post_vente_satisfaction: "seqPostVenteSatisfactionName",
  mandat_post_signature: "seqMandatPostSignatureName",
};

const SEQ_DESC_KEY: Record<string, string> = {
  prospect_silent_30j: "seqProspectSilent30jDesc",
  post_visite_followup: "seqPostVisiteFollowupDesc",
  acquereur_actif: "seqAcquereurActifDesc",
  post_vente_satisfaction: "seqPostVenteSatisfactionDesc",
  mandat_post_signature: "seqMandatPostSignatureDesc",
};

const INTERACTION_ICON: Record<CrmInteractionType, string> = {
  call: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
  email: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
  sms: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
  meeting: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  visit: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
  offer: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  document: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m1.5-3.75h-1.5",
  note: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125",
  task_done: "M9 12.75L11.25 15 15 9.75",
  status_change: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
};

export default function ContactDetailPage(props: { params: Promise<{ id: string }> }) {
  const t = useTranslations("proaCrmContactDetail");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";

  const { id } = use(props.params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [contact, setContact] = useState<CrmContact | null>(null);
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [interactionForm, setInteractionForm] = useState({
    type: "note" as CrmInteractionType,
    subject: "",
    body: "",
    outcome: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    dueAt: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
  });

  const reload = useCallback(async () => {
    const [c, inter, ts] = await Promise.all([
      getContact(id),
      listInteractions({ contactId: id, limit: 50 }),
      listTasks({ contactId: id, status: ["todo", "in_progress"] }),
    ]);
    setContact(c);
    setInteractions(inter);
    setTasks(ts);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (authLoading || !user) return;
    void reload();
  }, [user, authLoading, reload]);

  const handleUpdate = async (patch: Partial<CrmContact>) => {
    if (!contact) return;
    try {
      await updateContact(contact.id, patch);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleLogInteraction = async () => {
    if (!interactionForm.subject.trim() && !interactionForm.body.trim()) {
      setError(t("errSubjectOrBody"));
      return;
    }
    try {
      await logInteraction({
        contactId: id,
        type: interactionForm.type,
        subject: interactionForm.subject.trim() || undefined,
        body: interactionForm.body.trim() || undefined,
        outcome: interactionForm.outcome.trim() || undefined,
      });
      setInteractionForm({ type: "note", subject: "", body: "", outcome: "" });
      setError(null);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) { setError(t("errTaskTitle")); return; }
    try {
      await createTask({
        title: taskForm.title.trim(),
        dueAt: taskForm.dueAt || undefined,
        priority: taskForm.priority,
        contactId: id,
      });
      setTaskForm({ title: "", dueAt: "", priority: "normal" });
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleDelete = async () => {
    if (!contact) return;
    if (!confirm(t("confirmDelete", { name: contactDisplayName(contact) }))) return;
    try {
      await deleteContact(contact.id);
      router.push("/pro-agences/crm/contacts");
    } catch (e) { setError(errMsg(e)); }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">{t("loginPrompt")}</Link></div>;
  if (!contact) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted">{t("notFound")}</div>;

  const subjectPlaceholder =
    interactionForm.type === "call" ? t("placeholderSubjectCall") :
    interactionForm.type === "email" ? t("placeholderSubjectEmail") :
    t("placeholderSubjectGeneric");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Link href="/pro-agences/crm/contacts" className="text-xs text-muted hover:text-navy">{t("backLink")}</Link>

      <div className="mt-1 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{contactDisplayName(contact)}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wider">{t(KIND_KEY[contact.kind])}</span>
            {contact.is_company && <span className="rounded-full bg-navy/10 text-navy px-2 py-0.5 text-[10px]">{t("badgeCompany")}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["prospect", "lead", "acquereur"].includes(contact.kind) && (
            <Link href={`/pro-agences/crm/contacts/${contact.id}/matches`}
              className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100">
              {t("btnMatchedProperties")}
            </Link>
          )}
          <NurtureDropdown contactId={contact.id} onEnrolled={() => { /* could reload tasks */ }} />
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="rounded-md border border-card-border bg-background px-3 py-1.5 text-xs font-semibold text-slate hover:border-navy"
          >
            {editing ? t("btnCancel") : t("btnEdit")}
          </button>
          <button type="button" onClick={handleDelete} className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-900 hover:bg-rose-100">
            {t("btnDelete")}
          </button>
        </div>
      </div>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Colonne gauche : identité + tâches */}
        <div className="space-y-4 lg:col-span-1">
          <section className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">{t("sectionContacts")}</h2>
            {editing ? (
              <div className="space-y-2 text-xs">
                <label>
                  <span className="text-muted">{t("fieldEmail")}</span>
                  <input value={contact.email ?? ""} onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    onBlur={(e) => handleUpdate({ email: e.target.value || null })}
                    className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
                </label>
                <label>
                  <span className="text-muted">{t("fieldPhone")}</span>
                  <input value={contact.phone ?? ""} onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    onBlur={(e) => handleUpdate({ phone: e.target.value || null })}
                    className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
                </label>
                <label>
                  <span className="text-muted">{t("fieldAddress")}</span>
                  <input value={contact.address ?? ""} onChange={(e) => setContact({ ...contact, address: e.target.value })}
                    onBlur={(e) => handleUpdate({ address: e.target.value || null })}
                    className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
                </label>
                <label>
                  <span className="text-muted">{t("fieldBudget")}</span>
                  <div className="mt-1 flex gap-1">
                    <input type="number" value={contact.budget_min ?? ""} onChange={(e) => setContact({ ...contact, budget_min: Number(e.target.value) || null })}
                      onBlur={(e) => handleUpdate({ budget_min: e.target.value ? Number(e.target.value) : null })}
                      className="w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
                    <input type="number" value={contact.budget_max ?? ""} onChange={(e) => setContact({ ...contact, budget_max: Number(e.target.value) || null })}
                      onBlur={(e) => handleUpdate({ budget_max: e.target.value ? Number(e.target.value) : null })}
                      className="w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
                  </div>
                </label>
                <label>
                  <span className="text-muted">{t("fieldNotes")}</span>
                  <textarea value={contact.notes ?? ""} rows={3}
                    onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                    onBlur={(e) => handleUpdate({ notes: e.target.value || null })}
                    className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
                </label>
              </div>
            ) : (
              <dl className="space-y-2 text-xs">
                <div><dt className="text-muted">{t("fieldEmail")}</dt><dd className="font-mono">{contact.email ?? t("dash")}</dd></div>
                <div><dt className="text-muted">{t("fieldPhone")}</dt><dd className="font-mono">{contact.phone ?? t("dash")}</dd></div>
                {contact.address && <div><dt className="text-muted">{t("fieldAddress")}</dt><dd>{contact.address}</dd></div>}
                {(contact.budget_min || contact.budget_max) && (
                  <div>
                    <dt className="text-muted">{t("fieldBudgetDisplay")}</dt>
                    <dd className="font-mono">
                      {contact.budget_min ? formatEUR(Number(contact.budget_min)) : t("dash")} → {contact.budget_max ? formatEUR(Number(contact.budget_max)) : t("dash")}
                    </dd>
                  </div>
                )}
                {contact.tags?.length > 0 && (
                  <div>
                    <dt className="text-muted">{t("fieldTags")}</dt>
                    <dd>
                      {contact.tags.map((tag) => (
                        <span key={tag} className="mr-1 rounded-full bg-amber-50 text-amber-900 px-1.5 py-0.5 text-[10px] ring-1 ring-amber-100">{tag}</span>
                      ))}
                    </dd>
                  </div>
                )}
                {contact.notes && (
                  <div>
                    <dt className="text-muted">{t("fieldNotes")}</dt>
                    <dd className="whitespace-pre-wrap text-[11px]">{contact.notes}</dd>
                  </div>
                )}
              </dl>
            )}
          </section>

          <section className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">{t("sectionTasks")}</h2>
            <div className="grid gap-1.5 text-xs mb-3">
              <input placeholder={t("taskPlaceholder")} value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateTask(); }}
                className="rounded-md border border-card-border bg-background px-2 py-1.5" />
              <div className="flex gap-1">
                <input type="datetime-local" value={taskForm.dueAt}
                  onChange={(e) => setTaskForm({ ...taskForm, dueAt: e.target.value })}
                  className="flex-1 rounded-md border border-card-border bg-background px-2 py-1.5" />
                <select value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as typeof taskForm.priority })}
                  className="rounded-md border border-card-border bg-background px-2 py-1.5">
                  <option value="low">{t("taskPriorityLow")}</option>
                  <option value="normal">{t("taskPriorityNormal")}</option>
                  <option value="high">{t("taskPriorityHigh")}</option>
                  <option value="urgent">{t("taskPriorityUrgent")}</option>
                </select>
                <button type="button" onClick={handleCreateTask}
                  className="rounded-md bg-navy px-3 py-1.5 font-semibold text-white hover:bg-navy-light">+</button>
              </div>
            </div>
            {tasks.length === 0 ? (
              <p className="text-xs text-muted italic">{t("emptyTasks")}</p>
            ) : (
              <ul className="space-y-1.5">
                {tasks.map((task) => (
                  <li key={task.id} className={`flex items-start gap-2 rounded border border-card-border/50 p-2 text-xs ${isOverdue(task) ? "bg-rose-50 border-rose-200" : "bg-background"}`}>
                    <button
                      type="button"
                      onClick={() => handleCompleteTask(task.id)}
                      className="mt-0.5 h-4 w-4 rounded border border-card-border hover:border-emerald-500 hover:bg-emerald-50 transition-colors shrink-0"
                      title={t("taskMarkDone")}
                      aria-label={t("taskMarkDone")}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-navy truncate">{task.title}</div>
                      {task.due_at && (
                        <div className="text-[10px] text-muted">
                          {isOverdue(task) ? `⚠ ${new Date(task.due_at).toLocaleDateString(dateLocale)}` : new Date(task.due_at).toLocaleDateString(dateLocale)}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Colonne droite : timeline interactions */}
        <div className="lg:col-span-2 space-y-4">
          <section className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">{t("sectionLogInteraction")}</h2>
            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <label className="sm:col-span-2">
                <span className="text-muted">{t("fieldType")}</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(Object.keys(INTERACTION_KEY) as CrmInteractionType[])
                    .filter((k) => !["task_done", "status_change"].includes(k))
                    .map((k) => (
                    <button key={k} type="button" onClick={() => setInteractionForm({ ...interactionForm, type: k })}
                      className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                        interactionForm.type === k
                          ? "border-navy bg-navy text-white"
                          : "border-card-border bg-background text-slate hover:border-navy/40"
                      }`}>
                      {t(INTERACTION_KEY[k])}
                    </button>
                  ))}
                </div>
              </label>
              <label className="sm:col-span-2">
                <span className="text-muted">{t("fieldSubject")}</span>
                <input value={interactionForm.subject} onChange={(e) => setInteractionForm({ ...interactionForm, subject: e.target.value })}
                  placeholder={subjectPlaceholder}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-muted">{t("fieldDetails")}</span>
                <textarea value={interactionForm.body} rows={2}
                  onChange={(e) => setInteractionForm({ ...interactionForm, body: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
              <label>
                <span className="text-muted">{t("fieldOutcome")}</span>
                <input value={interactionForm.outcome} placeholder={t("placeholderOutcome")}
                  onChange={(e) => setInteractionForm({ ...interactionForm, outcome: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
              <div className="flex items-end justify-end">
                <button type="button" onClick={handleLogInteraction}
                  className="rounded-md bg-navy px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
                  {t("btnLog")}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">{t("sectionTimeline")}</h2>
            {interactions.length === 0 ? (
              <p className="text-xs text-muted italic">{t("emptyInteractions")}</p>
            ) : (
              <ol className="relative ml-4 border-l-2 border-card-border space-y-4">
                {interactions.map((inter) => (
                  <li key={inter.id} className="relative pl-4">
                    <div className="absolute -left-[7px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-navy ring-2 ring-card" />
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={INTERACTION_ICON[inter.interaction_type]} />
                      </svg>
                      <span className="font-medium text-navy">{t(INTERACTION_KEY[inter.interaction_type])}</span>
                      <span>·</span>
                      <span>{new Date(inter.occurred_at).toLocaleString(dateLocale)}</span>
                    </div>
                    {inter.subject && <div className="mt-1 text-sm font-semibold text-navy">{inter.subject}</div>}
                    {inter.body && <div className="mt-0.5 text-xs text-slate whitespace-pre-wrap">{inter.body}</div>}
                    {inter.outcome && (
                      <div className="mt-1 inline-block rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-medium">
                        {t("arrowOutcome", { outcome: inter.outcome })}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function NurtureDropdown({ contactId, onEnrolled }: { contactId: string; onEnrolled: () => void }) {
  const t = useTranslations("proaCrmContactDetail");
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const seqName = (seq: NurtureSequence): string => {
    const k = SEQ_NAME_KEY[seq.id];
    return k ? t(k) : seq.name;
  };
  const seqDesc = (seq: NurtureSequence): string => {
    const k = SEQ_DESC_KEY[seq.id];
    return k ? t(k) : seq.description;
  };

  const enroll = async (seq: NurtureSequence) => {
    if (!confirm(t("nurtureConfirm", { name: seqName(seq), n: seq.steps.length, days: estimateSequenceDuration(seq) }))) {
      return;
    }
    const r = await enrollContact(contactId, seq.id);
    if (r.ok) {
      setFlash(t("nurtureSuccess", { n: r.tasks_created }));
      setOpen(false);
      setTimeout(() => setFlash(null), 3500);
      onEnrolled();
    } else {
      setFlash(t("nurtureError", { error: r.error ?? "" }));
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-100">
        {t("btnNurture")}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-card-border bg-white shadow-lg">
            <div className="p-3 border-b border-card-border">
              <div className="text-sm font-bold text-navy">{t("nurtureTitle")}</div>
              <div className="text-xs text-muted">{t("nurtureDesc")}</div>
            </div>
            {NURTURE_SEQUENCES.map((seq) => (
              <button key={seq.id} onClick={() => enroll(seq)}
                className="w-full text-left p-3 border-b border-card-border/50 hover:bg-background">
                <div className="text-sm font-semibold text-navy">{seqName(seq)}</div>
                <div className="text-xs text-muted mt-0.5">{seqDesc(seq)}</div>
                <div className="mt-1 text-[10px] text-muted">
                  {t("nurtureMeta", { n: seq.steps.length, days: estimateSequenceDuration(seq) })}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      {flash && (
        <div className="absolute right-0 top-full mt-1 rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-semibold whitespace-nowrap shadow-lg z-50">
          {flash}
        </div>
      )}
    </div>
  );
}
