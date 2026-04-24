"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import {
  getCoownership, updateCoownership,
  listWorksFundMovements, addWorksFundMovement, deleteWorksFundMovement,
  type Coownership, type WorksFundMovement,
} from "@/lib/coownerships";
import { formatEUR } from "@/lib/calculations";
import AiAnalysisCard from "@/components/AiAnalysisCard";

const MOVEMENT_COLORS: Record<WorksFundMovement["movement_type"], string> = {
  contribution: "text-emerald-700 bg-emerald-50",
  withdrawal: "text-rose-700 bg-rose-50",
  adjustment: "text-amber-700 bg-amber-50",
  interest: "text-blue-700 bg-blue-50",
};

export default function FondsTravauxPage() {
  const t = useTranslations("syndicFondsTravaux");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const params = useParams();
  const id = String(params?.id ?? "");
  const { user } = useAuth();

  const MOVEMENT_LABELS: Record<WorksFundMovement["movement_type"], string> = useMemo(() => ({
    contribution: t("mvContribution"),
    withdrawal: t("mvWithdrawal"),
    adjustment: t("mvAdjustment"),
    interest: t("mvInterest"),
  }), [t]);

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [movements, setMovements] = useState<WorksFundMovement[]>([]);
  const [targetPct, setTargetPct] = useState(5);
  const [annualContribution, setAnnualContribution] = useState(0);
  const [savingTarget, setSavingTarget] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newMv, setNewMv] = useState<{ type: WorksFundMovement["movement_type"]; amount: number; description: string; project: string; date: string }>({
    type: "contribution",
    amount: 0,
    description: "",
    project: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const refresh = useCallback(async () => {
    if (!id || !user) return;
    const [c, mvs] = await Promise.all([getCoownership(id), listWorksFundMovements(id)]);
    setCoown(c);
    setMovements(mvs);
    if (c) {
      setTargetPct(c.works_fund_target_pct ?? 5);
      setAnnualContribution(c.works_fund_annual_contribution ?? 0);
    }
  }, [id, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSaveTarget = async () => {
    setSavingTarget(true);
    try {
      await updateCoownership(id, {
        works_fund_target_pct: targetPct,
        works_fund_annual_contribution: annualContribution,
      });
      await refresh();
    } finally {
      setSavingTarget(false);
    }
  };

  const handleAddMovement = async () => {
    if (!newMv.amount || newMv.amount <= 0) return;
    await addWorksFundMovement({
      coownership_id: id,
      movement_date: newMv.date,
      movement_type: newMv.type,
      amount: newMv.amount,
      description: newMv.description || null,
      related_works_project: newMv.project || null,
    });
    setNewMv({ type: "contribution", amount: 0, description: "", project: "", date: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
    await refresh();
  };

  const handleDelete = async (mvId: string) => {
    if (!confirm(t("confirmDelete"))) return;
    await deleteWorksFundMovement(mvId);
    await refresh();
  };

  if (!coown) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }

  const balance = coown.works_fund_balance ?? 0;
  const nbLots = coown.nb_lots || 1;
  const balancePerLot = balance / nbLots;
  const recommendedAnnual = annualContribution > 0 ? annualContribution : 0;
  const yearsOfReserves = recommendedAnnual > 0 ? balance / recommendedAnnual : 0;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes/${id}`} className="text-xs text-muted hover:text-navy">{t("backCoown", { name: coown.name })}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("pageSubtitle")}
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 text-white shadow-lg">
            <div className="text-xs uppercase tracking-wider text-white/60">{t("kpiBalance")}</div>
            <div className="mt-2 text-3xl font-bold">{formatEUR(balance)}</div>
            <div className="mt-1 text-xs text-white/60">
              {t("kpiPerLot", { amount: formatEUR(Math.round(balancePerLot)), n: nbLots })}
            </div>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted">{t("kpiAnnual")}</div>
            <div className="mt-2 text-3xl font-bold text-navy">{formatEUR(annualContribution)}</div>
            <div className="mt-1 text-xs text-muted">{t("kpiAnnualHint", { pct: targetPct.toFixed(1) })}</div>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted">{t("kpiCoverage")}</div>
            <div className="mt-2 text-3xl font-bold text-emerald-700">{t("kpiCoverageValue", { n: yearsOfReserves.toFixed(1) })}</div>
            <div className="mt-1 text-xs text-muted">{t("kpiCoverageHint")}</div>
          </div>
        </div>

        {/* Paramétrage */}
        <div className="mt-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy">{t("paramsTitle")}</h2>
          <p className="mt-1 text-xs text-muted">
            {t("paramsHint")}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate mb-1">{t("fieldPctBudget")}</label>
              <input
                type="number"
                value={targetPct}
                onChange={(e) => setTargetPct(Number(e.target.value))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                min={0}
                max={100}
                step={0.5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate mb-1">{t("fieldAnnualContrib")}</label>
              <input
                type="number"
                value={annualContribution}
                onChange={(e) => setAnnualContribution(Number(e.target.value))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                min={0}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveTarget}
              disabled={savingTarget}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60"
            >
              {savingTarget ? t("btnSaving") : t("btnSave")}
            </button>
          </div>
        </div>

        {/* Mouvements */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy">{t("historyTitle")}</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {showForm ? t("btnCancel") : t("btnNewMovement")}
            </button>
          </div>

          {showForm && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">{t("formType")}</label>
                  <select
                    value={newMv.type}
                    onChange={(e) => setNewMv({ ...newMv, type: e.target.value as WorksFundMovement["movement_type"] })}
                    className="w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm"
                  >
                    {Object.entries(MOVEMENT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">{t("formDate")}</label>
                  <input
                    type="date"
                    value={newMv.date}
                    onChange={(e) => setNewMv({ ...newMv, date: e.target.value })}
                    className="w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">{t("formAmount")}</label>
                  <input
                    type="number"
                    value={newMv.amount}
                    onChange={(e) => setNewMv({ ...newMv, amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">{t("formProject")}</label>
                  <input
                    type="text"
                    value={newMv.project}
                    onChange={(e) => setNewMv({ ...newMv, project: e.target.value })}
                    placeholder={t("formProjectPlaceholder")}
                    className="w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate mb-1">{t("formDescription")}</label>
                  <input
                    type="text"
                    value={newMv.description}
                    onChange={(e) => setNewMv({ ...newMv, description: e.target.value })}
                    placeholder={t("formDescriptionPlaceholder")}
                    className="w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleAddMovement}
                  disabled={!newMv.amount}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  {t("btnAddMovement")}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
            {movements.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">
                {t("emptyMovements")}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-background text-left">
                    <th className="px-4 py-2 font-semibold text-slate">{t("colDate")}</th>
                    <th className="px-4 py-2 font-semibold text-slate">{t("colTypeHeader")}</th>
                    <th className="px-4 py-2 font-semibold text-slate">{t("colProject")}</th>
                    <th className="px-4 py-2 font-semibold text-slate">{t("colDescription")}</th>
                    <th className="px-4 py-2 font-semibold text-slate text-right">{t("colAmount")}</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mv) => (
                    <tr key={mv.id} className="border-b border-card-border/50">
                      <td className="px-4 py-2 font-mono text-xs">{mv.movement_date}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${MOVEMENT_COLORS[mv.movement_type]}`}>
                          {MOVEMENT_LABELS[mv.movement_type]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted">{mv.related_works_project ?? t("dash")}</td>
                      <td className="px-4 py-2 text-xs text-muted truncate max-w-[200px]">{mv.description ?? t("dash")}</td>
                      <td className={`px-4 py-2 text-right font-mono font-semibold ${mv.movement_type === "withdrawal" ? "text-rose-700" : "text-emerald-700"}`}>
                        {mv.movement_type === "withdrawal" ? "-" : "+"}{formatEUR(mv.amount)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleDelete(mv.id)}
                          className="text-muted hover:text-rose-600 text-xs"
                        >
                          {t("btnDelete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="mt-8">
          <AiAnalysisCard
            context={[
              `Fonds de travaux copropriété Luxembourg`,
              `Copropriété: ${coown.name} (${coown.nb_lots} lots, ${coown.year_built ? `construite en ${coown.year_built}` : "année construction inconnue"})`,
              `Commune: ${coown.commune ?? "—"}, ${coown.has_elevator ? "avec ascenseur" : "sans ascenseur"}, ${coown.nb_floors ?? "?"} étages`,
              "",
              `Solde actuel fonds: ${formatEUR(balance)} (${formatEUR(Math.round(balancePerLot))}/lot)`,
              `Cotisation annuelle votée: ${formatEUR(annualContribution)} (${targetPct}% budget annuel visé)`,
              `Couverture actuelle: ${yearsOfReserves.toFixed(1)} ans de cotisations`,
              `Nombre mouvements enregistrés: ${movements.length}`,
            ].join("\n")}
            prompt="Analyse la santé du fonds de travaux de cette copropriété luxembourgeoise. Livre : (1) diagnostic capitalisation vs benchmark (5% budget projet loi 7763, mais ajustable selon âge bâti : 3% pour neuf <10 ans, 5-8% pour 10-30 ans, 10-15% pour >30 ans ou défaillant), (2) travaux probables à anticiper selon âge et type (toiture cycle 25 ans, façade 15-20 ans, ascenseur cycle 30 ans, VMC 20 ans, chauffage selon type), (3) suffisance actuelle pour absorber un gros chantier type sans appel de fonds exceptionnel, (4) recommandation cotisation annuelle si actuelle est insuffisante, (5) bonnes pratiques gouvernance : compte bancaire dédié séparé, placement taux 0 (sécurité), rapport annuel AG, accord conseil syndical avant tout prélèvement. Concret pour un syndic LU."
          />
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>{t("regulatoryTitle")}</strong> {t("regulatoryBody")}
        </div>
      </div>
    </div>
  );
}
