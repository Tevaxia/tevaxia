"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { listTasks, completeTask, deleteTask, createTask, updateTask, isOverdue } from "@/lib/crm/tasks";
import type { CrmTask, CrmTaskPriority, CrmTaskStatus } from "@/lib/crm";
import { errMsg } from "@/lib/errors";

const PRIORITY_STYLE: Record<CrmTaskPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  normal: "bg-blue-50 text-blue-800 ring-1 ring-blue-100",
  high: "bg-amber-50 text-amber-900 ring-1 ring-amber-100",
  urgent: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
};

export default function TasksPage() {
  const t = useTranslations("proaCrmTasks");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [filter, setFilter] = useState<"all" | "todo" | "overdue" | "done">("todo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const STATUS_LABEL: Record<CrmTaskStatus, string> = {
    todo: t("statusTodo"),
    in_progress: t("statusInProgress"),
    done: t("statusDone"),
    cancelled: t("statusCancelled"),
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueAt: "",
    priority: "normal" as CrmTaskPriority,
  });

  const reload = useCallback(async () => {
    let ts: CrmTask[];
    if (filter === "done") {
      ts = await listTasks({ status: ["done"] });
    } else if (filter === "overdue") {
      ts = await listTasks({ overdueOnly: true });
    } else if (filter === "todo") {
      ts = await listTasks({ status: ["todo", "in_progress"] });
    } else {
      ts = await listTasks();
    }
    setTasks(ts);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    if (authLoading || !user) return;
    void reload();
  }, [user, authLoading, reload]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      await createTask({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueAt: form.dueAt || undefined,
        priority: form.priority,
      });
      setForm({ title: "", description: "", dueAt: "", priority: "normal" });
      setError(null);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href={`${lp}/connexion`} className="text-navy underline">{t("loginPrompt")}</Link></div>;

  const filterLabel = (f: "todo" | "overdue" | "done" | "all") =>
    f === "todo" ? t("filterTodo") :
    f === "overdue" ? t("filterOverdue") :
    f === "done" ? t("filterDone") : t("filterAll");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Link href={`${lp}/pro-agences/crm`} className="text-xs text-muted hover:text-navy">{t("backCrm")}</Link>
      <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      {/* Création rapide */}
      <section className="mt-5 rounded-xl border border-card-border bg-card p-4">
        <div className="grid gap-2 sm:grid-cols-4 text-xs">
          <input
            placeholder={t("placeholderTitle")}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            className="rounded-md border border-card-border bg-background px-2 py-1.5 sm:col-span-2"
          />
          <input
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5"
          />
          <div className="flex gap-1">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as CrmTaskPriority })}
              className="flex-1 rounded-md border border-card-border bg-background px-2 py-1.5">
              <option value="low">{t("priorityLow")}</option>
              <option value="normal">{t("priorityNormal")}</option>
              <option value="high">{t("priorityHigh")}</option>
              <option value="urgent">{t("priorityUrgent")}</option>
            </select>
            <button type="button" onClick={handleCreate}
              className="rounded-md bg-navy px-3 py-1.5 font-semibold text-white hover:bg-navy-light">+</button>
          </div>
        </div>
      </section>

      {/* Filtres */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(["todo", "overdue", "done", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f
                ? "bg-navy text-white"
                : "border border-card-border text-slate hover:border-navy"
            }`}
          >
            {filterLabel(f)}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-muted self-center">{t("countSuffix", { n: tasks.length })}</span>
      </div>

      <div className="mt-4 rounded-xl border border-card-border bg-card p-3">
        {tasks.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted italic">{t("emptyList")}</p>
        ) : (
          <ul className="divide-y divide-card-border/50">
            {tasks.map((task) => {
              const overdue = isOverdue(task);
              return (
                <li key={task.id} className={`flex items-start gap-3 p-3 text-xs transition-colors ${overdue ? "bg-rose-50/50" : ""}`}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (task.status === "done") return;
                      await completeTask(task.id);
                      await reload();
                    }}
                    className={`mt-0.5 h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
                      task.status === "done"
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-card-border hover:border-emerald-500 hover:bg-emerald-50"
                    }`}
                    title={t("markDone")}
                    aria-label={t("markDone")}
                  >
                    {task.status === "done" && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold ${task.status === "done" ? "text-muted line-through" : "text-navy"}`}>
                      {task.title}
                    </div>
                    {task.description && <div className="mt-0.5 text-[11px] text-muted">{task.description}</div>}
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      {task.due_at && (
                        <span className={overdue ? "text-rose-700 font-semibold" : "text-muted"}>
                          {overdue ? "⚠ " : "📅 "}
                          {new Date(task.due_at).toLocaleString(dateLocale, { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      )}
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${PRIORITY_STYLE[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-muted">{STATUS_LABEL[task.status]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {task.status !== "done" && task.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={async () => { await updateTask(task.id, { status: "cancelled" }); await reload(); }}
                        className="text-[10px] text-muted hover:text-slate-800 px-2 py-1"
                      >
                        {t("btnCancel")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(t("confirmDelete"))) return;
                        await deleteTask(task.id);
                        await reload();
                      }}
                      className="text-[10px] text-rose-700 hover:underline px-2 py-1"
                    >
                      {t("btnDelete")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
