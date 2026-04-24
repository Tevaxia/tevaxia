"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getCoownership, listUnits, type Coownership, type CoownershipUnit } from "@/lib/coownerships";
import {
  listAllocationKeys, listUnitAllocations,
  createAllocationKey, deleteAllocationKey, upsertUnitAllocation,
  createFromTemplate, validateKeyCode,
  LU_ALLOCATION_TEMPLATES,
  type AllocationKey, type UnitAllocation,
} from "@/lib/coownership-allocations";
import { errMsg } from "@/lib/errors";

export default function AllocationKeysPage() {
  const t = useTranslations("syndicCles");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const numberLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [units, setUnits] = useState<CoownershipUnit[]>([]);
  const [keys, setKeys] = useState<AllocationKey[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [allocs, setAllocs] = useState<UnitAllocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, number>>({});

  const [newKeyOpen, setNewKeyOpen] = useState(false);
  const [newKey, setNewKey] = useState({ code: "", label: "", description: "" });

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, u, k] = await Promise.all([getCoownership(id), listUnits(id), listAllocationKeys(id)]);
      setCoown(c); setUnits(u); setKeys(k);
      if (!activeKeyId && k.length > 0) setActiveKeyId(k[0].id);
    } catch (e) {
      setError(errMsg(e, t("errorGeneric")));
    }
    setLoading(false);
  }, [id, activeKeyId, t]);

  useEffect(() => { if (user) void reload(); }, [user, reload]);

  useEffect(() => {
    if (activeKeyId) {
      listUnitAllocations(activeKeyId).then(setAllocs);
    } else {
      setAllocs([]);
    }
  }, [activeKeyId]);

  const activeKey = useMemo(() => keys.find((k) => k.id === activeKeyId) ?? null, [keys, activeKeyId]);

  const getShares = (unitId: string): number => {
    if (editing[unitId] !== undefined) return editing[unitId];
    return Number(allocs.find((a) => a.unit_id === unitId)?.shares ?? 0);
  };

  const saveShares = async (unitId: string, shares: number) => {
    if (!activeKeyId) return;
    try {
      await upsertUnitAllocation({ unit_id: unitId, key_id: activeKeyId, shares });
      const { [unitId]: _omit, ...rest } = editing;
      setEditing(rest);
      const fresh = await listUnitAllocations(activeKeyId);
      setAllocs(fresh);
      await reload();
    } catch (e) {
      setError(errMsg(e, t("errorGeneric")));
    }
  };

  const totalShares = useMemo(
    () => units.reduce((s, u) => s + getShares(u.id), 0),
    [units, allocs, editing],  // eslint-disable-line react-hooks/exhaustive-deps
  );

  const createCustomKey = async () => {
    const codeErr = validateKeyCode(newKey.code);
    if (codeErr) { setError(codeErr); return; }
    if (!newKey.label.trim()) { setError(t("labelRequired")); return; }
    try {
      const k = await createAllocationKey({
        coownership_id: id,
        code: newKey.code.trim(),
        label: newKey.label.trim(),
        description: newKey.description || undefined,
      });
      setNewKeyOpen(false);
      setNewKey({ code: "", label: "", description: "" });
      setActiveKeyId(k.id);
      await reload();
    } catch (e) {
      setError(errMsg(e, t("errorCreate")));
    }
  };

  const addTemplate = async (tplCode: string) => {
    const tpl = LU_ALLOCATION_TEMPLATES.find((tp) => tp.code === tplCode);
    if (!tpl) return;
    try {
      const k = await createFromTemplate(id, tpl);
      setActiveKeyId(k.id);
      await reload();
    } catch (e) {
      setError(errMsg(e, t("errorGeneric")));
    }
  };

  const removeKey = async (k: AllocationKey) => {
    if (k.is_system) { alert(t("systemCantDelete")); return; }
    if (!confirm(t("confirmDeleteKey", { label: k.label }))) return;
    try {
      await deleteAllocationKey(k.id);
      if (activeKeyId === k.id) setActiveKeyId(null);
      await reload();
    } catch (e) {
      setError(errMsg(e, t("errorDelete")));
    }
  };

  const availableTemplates = LU_ALLOCATION_TEMPLATES.filter(
    (tp) => !keys.some((k) => k.code === tp.code),
  );

  if (loading || !coown) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }

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

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Sidebar clés */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                {t("sidebarCount", { n: keys.length })}
              </h2>
              <button onClick={() => setNewKeyOpen(!newKeyOpen)}
                className="rounded-lg bg-navy px-3 py-1 text-xs font-semibold text-white hover:bg-navy-light">
                {newKeyOpen ? t("btnCancel") : t("btnAddCustom")}
              </button>
            </div>

            {newKeyOpen && (
              <div className="mb-3 rounded-xl border border-navy/20 bg-navy/5 p-3 space-y-2">
                <input type="text" placeholder={t("newKeyCodePlaceholder")}
                  value={newKey.code}
                  onChange={(e) => setNewKey({ ...newKey, code: e.target.value.toLowerCase() })}
                  className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs font-mono" />
                <input type="text" placeholder={t("newKeyLabelPlaceholder")}
                  value={newKey.label}
                  onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
                  className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
                <input type="text" placeholder={t("newKeyDescPlaceholder")}
                  value={newKey.description}
                  onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                  className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
                <button onClick={createCustomKey}
                  className="w-full rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                  {t("btnCreate")}
                </button>
              </div>
            )}

            <div className="space-y-1">
              {keys.map((k) => (
                <button key={k.id} onClick={() => setActiveKeyId(k.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    activeKeyId === k.id
                      ? "border-navy bg-navy/5 ring-1 ring-navy"
                      : "border-card-border bg-card hover:bg-background"
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-navy truncate flex items-center gap-1">
                        {k.label}
                        {k.is_system && <span className="text-[9px] text-emerald-700">●</span>}
                      </div>
                      <div className="mt-0.5 text-[10px] font-mono text-muted truncate">{k.code}</div>
                      <div className="mt-1 text-[11px] text-muted">
                        {t("keyTotalLabel", { n: Number(k.total_shares).toLocaleString(numberLocale) })}
                      </div>
                    </div>
                    {!k.is_system && (
                      <span onClick={(e) => { e.stopPropagation(); void removeKey(k); }}
                        className="cursor-pointer text-xs text-rose-700 hover:underline">
                        ×
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Templates suggérés */}
            {availableTemplates.length > 0 && (
              <div className="mt-5">
                <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
                  {t("templatesTitle")}
                </div>
                <div className="space-y-1">
                  {availableTemplates.map((tp) => (
                    <button key={tp.code} onClick={() => addTemplate(tp.code)}
                      className="w-full text-left rounded-lg border border-dashed border-navy/30 bg-background p-2 hover:bg-navy/5 transition-colors">
                      <div className="text-xs font-semibold text-navy">{t("templateAdd", { label: tp.label })}</div>
                      <div className="text-[10px] text-muted mt-0.5">{tp.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main : table parts */}
          <div>
            {!activeKey ? (
              <div className="rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
                {t("emptyActive")}
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-card-border bg-card p-5">
                  <h2 className="text-lg font-bold text-navy">{activeKey.label}</h2>
                  {activeKey.description && (
                    <p className="mt-1 text-xs text-muted">{activeKey.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <span className="rounded-full bg-background px-3 py-1">
                      {t("activeKeyCode")} <span className="font-mono font-semibold text-navy">{activeKey.code}</span>
                    </span>
                    <span className="rounded-full bg-background px-3 py-1">
                      {t("activeKeyTotal")} <span className="font-mono font-semibold text-navy">{Number(activeKey.total_shares).toLocaleString(numberLocale)}</span>
                    </span>
                    {activeKey.is_system && (
                      <span className="rounded-full bg-emerald-100 text-emerald-900 px-3 py-1">
                        {t("systemBadge")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-card-border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-card-border bg-background/60">
                          <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colLot")}</th>
                          <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colType")}</th>
                          <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">{t("colOwner")}</th>
                          <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colTantiemes")}</th>
                          <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colSharesFor", { label: activeKey.label })}</th>
                          <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">{t("colPct")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {units.map((u) => {
                          const shares = getShares(u.id);
                          const pct = totalShares > 0 ? (shares / totalShares) * 100 : 0;
                          return (
                            <tr key={u.id} className="border-b border-card-border/40 hover:bg-background/40">
                              <td className="px-3 py-2 font-medium text-navy">{u.lot_number}</td>
                              <td className="px-3 py-2 text-xs text-muted">{u.unit_type}</td>
                              <td className="px-3 py-2 text-xs">{u.owner_name || t("dash")}</td>
                              <td className="px-3 py-2 text-right font-mono text-xs text-muted">
                                {u.tantiemes.toLocaleString(numberLocale)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input type="number" step="0.01"
                                  value={editing[u.id] !== undefined ? editing[u.id] : (shares || "")}
                                  placeholder={t("sharesPlaceholder")}
                                  disabled={activeKey.is_system && activeKey.code === "tantiemes_generaux"}
                                  title={activeKey.is_system && activeKey.code === "tantiemes_generaux"
                                    ? t("sharesDisabledTitle")
                                    : ""}
                                  onChange={(e) => setEditing({ ...editing, [u.id]: Number(e.target.value) || 0 })}
                                  onBlur={async () => {
                                    if (editing[u.id] !== undefined) {
                                      await saveShares(u.id, editing[u.id]);
                                    }
                                  }}
                                  className="w-24 rounded border border-input-border bg-input-bg px-2 py-1 text-right text-xs font-mono disabled:opacity-60" />
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-xs">
                                {pct > 0 ? `${pct.toFixed(2)}%` : t("dash")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-card-border bg-background font-semibold">
                          <td colSpan={3} className="px-3 py-2 text-right">{t("totalLabel")}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {units.reduce((s, u) => s + u.tantiemes, 0).toLocaleString(numberLocale)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-navy">
                            {totalShares.toLocaleString(numberLocale, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {totalShares > 0 ? "100.00%" : t("dash")}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {activeKey.code === "tantiemes_generaux" && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                    <strong>{t("systemNoteTitle")}</strong> {t("systemNoteBody")}
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
                  <strong>{t("usageTitle")}</strong> {t("usageBody1")}<Link href={`${lp}/syndic/coproprietes/${id}/budget`} className="underline font-semibold">{t("usageLinkBudget")}</Link>{t("usageBody2")}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
