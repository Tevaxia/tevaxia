"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "@/components/LocaleLink";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import {
  listRoomTypes, listRooms, createRoomType, createRoom,
} from "@/lib/pms/rooms";
import { listRatePlans, createRatePlan } from "@/lib/pms/rates";
import { errMsg } from "@/lib/pms/errors";
import type { PmsProperty, PmsRoomType, PmsRoom, PmsRatePlan } from "@/lib/pms/types";

interface TypeDraft {
  code: string;
  name: string;
  capacity_adults: number;
  capacity_children: number;
  base_rate: number;
  size_m2: number;
  count: number;
}

const DEFAULT_TYPES: TypeDraft[] = [
  { code: "STD", name: "Standard", capacity_adults: 2, capacity_children: 0, base_rate: 120, size_m2: 18, count: 10 },
  { code: "DLX", name: "Deluxe", capacity_adults: 2, capacity_children: 1, base_rate: 160, size_m2: 25, count: 4 },
  { code: "STE", name: "Suite", capacity_adults: 2, capacity_children: 2, base_rate: 240, size_m2: 40, count: 2 },
];

interface PlanPreset {
  code: "BAR" | "NR" | "BB";
  nameKey: "planBar" | "planNr" | "planBb";
  refundable: boolean;
  breakfast_included: boolean;
  discount_pct: number;
  min_los: number;
}

const DEFAULT_PLANS: PlanPreset[] = [
  { code: "BAR", nameKey: "planBar", refundable: true, breakfast_included: false, discount_pct: 0, min_los: 1 },
  { code: "NR", nameKey: "planNr", refundable: false, breakfast_included: false, discount_pct: 10, min_los: 1 },
  { code: "BB", nameKey: "planBb", refundable: true, breakfast_included: true, discount_pct: 0, min_los: 1 },
];

export default function SetupPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const tc = useTranslations("pms.common");
  const t = useTranslations("pms.setup");
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [existingTypes, setExistingTypes] = useState<PmsRoomType[]>([]);
  const [existingRooms, setExistingRooms] = useState<PmsRoom[]>([]);
  const [existingPlans, setExistingPlans] = useState<PmsRatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [typesDraft, setTypesDraft] = useState<TypeDraft[]>(DEFAULT_TYPES);
  const [roomStartNumber, setRoomStartNumber] = useState(101);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, boolean>>({
    BAR: true, NR: true, BB: false,
  });

  const reload = useCallback(async () => {
    const [p, types, rooms, plans] = await Promise.all([
      getProperty(propertyId),
      listRoomTypes(propertyId),
      listRooms(propertyId),
      listRatePlans(propertyId),
    ]);
    setProperty(p);
    setExistingTypes(types);
    setExistingRooms(rooms);
    setExistingPlans(plans);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    if (authLoading || !user) return;
    void reload();
  }, [user, authLoading, reload]);

  const updateType = (i: number, patch: Partial<TypeDraft>) => {
    setTypesDraft(typesDraft.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  };

  const removeType = (i: number) => {
    setTypesDraft(typesDraft.filter((_, idx) => idx !== i));
  };

  const addType = () => {
    setTypesDraft([...typesDraft, { code: "", name: "", capacity_adults: 2, capacity_children: 0, base_rate: 100, size_m2: 20, count: 1 }]);
  };

  const createTypesAndRooms = async () => {
    setSaving(true);
    setError(null);
    try {
      let roomNum = roomStartNumber;
      const activeTypes = typesDraft.filter((d) => d.code.trim() && d.count > 0);
      if (activeTypes.length === 0) {
        setError(t("step1Error"));
        setSaving(false);
        return;
      }
      for (const d of activeTypes) {
        const createdType = await createRoomType({
          property_id: propertyId,
          code: d.code.trim().toUpperCase(),
          name: d.name.trim() || d.code,
          capacity_adults: d.capacity_adults,
          capacity_children: d.capacity_children,
          base_rate: d.base_rate,
          size_m2: d.size_m2 || null,
        });
        for (let i = 0; i < d.count; i++) {
          await createRoom({
            property_id: propertyId,
            room_type_id: createdType.id,
            number: String(roomNum),
            floor: Math.floor(roomNum / 100),
          });
          roomNum++;
        }
      }
      await reload();
      setStep(2);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const createPlans = async () => {
    setSaving(true);
    setError(null);
    try {
      const chosen = DEFAULT_PLANS.filter((p) => selectedPlans[p.code]);
      if (chosen.length === 0) {
        setError(t("step2Error"));
        setSaving(false);
        return;
      }
      for (const p of chosen) {
        await createRatePlan({
          property_id: propertyId,
          code: p.code,
          name: t(p.nameKey),
          refundable: p.refundable,
          breakfast_included: p.breakfast_included,
          discount_pct: p.discount_pct,
          min_los: p.min_los,
        });
      }
      await reload();
      setStep(3);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">{tc("loading")}</div>;
  if (!user || !property) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted">
        <Link href="/connexion" className="text-navy underline">{tc("signInLink")}</Link> — {tc("loginRequired")}
      </div>
    );
  }

  const hasTypes = existingTypes.length > 0;
  const hasRooms = existingRooms.length > 0;
  const hasPlans = existingPlans.length > 0;
  const fullyConfigured = hasTypes && hasRooms && hasPlans;
  const totalRoomsCreated = typesDraft.reduce((s, d) => s + (d.count || 0), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href={`/pms/${propertyId}`} className="text-xs text-navy hover:underline">← {property.name}</Link>
      <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("intro")}</p>

      {fullyConfigured && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          ✅ {t("alreadyConfigured", { types: existingTypes.length, rooms: existingRooms.length, plans: existingPlans.length })}
          <Link href={`/pms/${propertyId}`} className="ml-2 underline font-semibold">{t("backDashboard")}</Link>
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-6 flex items-center gap-2">
        <StepDot n={1} current={step} done={hasTypes && hasRooms} label={t("stepRooms")} />
        <div className="h-0.5 flex-1 bg-card-border" />
        <StepDot n={2} current={step} done={hasPlans} label={t("stepRates")} />
        <div className="h-0.5 flex-1 bg-card-border" />
        <StepDot n={3} current={step} done={false} label={t("stepDone")} />
      </div>

      {error && <div className="mt-4 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      {/* Step 1 : Types + chambres */}
      {step === 1 && (
        <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-base font-semibold text-navy">{t("step1Title")}</h2>
          <p className="mt-1 text-xs text-muted">{t("step1Intro")}</p>

          {hasTypes && (
            <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              ⚠ {t("step1Warning", { types: existingTypes.length, rooms: existingRooms.length })}{" "}
              <Link href={`/pms/${propertyId}/chambres`} className="underline font-semibold">{t("step1EditLink")}</Link>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {typesDraft.map((d, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-8 text-xs rounded-md border border-card-border bg-background p-2">
                <label className="sm:col-span-1">
                  <span className="text-muted text-[10px]">{t("step1Code")}</span>
                  <input
                    value={d.code}
                    onChange={(e) => updateType(i, { code: e.target.value.toUpperCase() })}
                    className="mt-0.5 w-full rounded border border-card-border px-1.5 py-1 font-mono"
                    maxLength={6}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-muted text-[10px]">{t("step1Name")}</span>
                  <input
                    value={d.name}
                    onChange={(e) => updateType(i, { name: e.target.value })}
                    className="mt-0.5 w-full rounded border border-card-border px-1.5 py-1"
                  />
                </label>
                <label>
                  <span className="text-muted text-[10px]">{t("step1Adults")}</span>
                  <input
                    type="number" min="1" value={d.capacity_adults}
                    onChange={(e) => updateType(i, { capacity_adults: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded border border-card-border px-1.5 py-1"
                  />
                </label>
                <label>
                  <span className="text-muted text-[10px]">{t("step1Children")}</span>
                  <input
                    type="number" min="0" value={d.capacity_children}
                    onChange={(e) => updateType(i, { capacity_children: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded border border-card-border px-1.5 py-1"
                  />
                </label>
                <label>
                  <span className="text-muted text-[10px]">{t("step1Rate")}</span>
                  <input
                    type="number" min="0" value={d.base_rate}
                    onChange={(e) => updateType(i, { base_rate: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded border border-card-border px-1.5 py-1"
                  />
                </label>
                <label>
                  <span className="text-muted text-[10px]">{t("step1Size")}</span>
                  <input
                    type="number" min="0" value={d.size_m2}
                    onChange={(e) => updateType(i, { size_m2: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded border border-card-border px-1.5 py-1"
                  />
                </label>
                <label className="flex items-end gap-1">
                  <div className="flex-1">
                    <span className="text-muted text-[10px]">{t("step1Count")}</span>
                    <input
                      type="number" min="0" value={d.count}
                      onChange={(e) => updateType(i, { count: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded border border-card-border px-1.5 py-1 font-semibold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeType(i)}
                    title={t("step1RemoveType")}
                    className="h-[30px] w-[30px] rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  >
                    ×
                  </button>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={addType}
              className="rounded-md border border-card-border bg-background px-3 py-1.5 text-xs font-medium text-slate hover:border-navy"
            >
              {t("step1AddType")}
            </button>
            <label className="text-xs flex items-center gap-2">
              <span className="text-muted">{t("step1StartNumber")}</span>
              <input
                type="number"
                value={roomStartNumber}
                onChange={(e) => setRoomStartNumber(Number(e.target.value))}
                className="w-20 rounded border border-card-border bg-background px-1.5 py-1 font-mono"
              />
            </label>
            <span className="ml-auto text-[11px] text-muted">
              {t("step1Total", { count: totalRoomsCreated })}
            </span>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-md border border-card-border px-3 py-1.5 text-xs text-slate hover:border-navy"
            >
              {t("stepSkip")}
            </button>
            <button
              type="button"
              onClick={createTypesAndRooms}
              disabled={saving}
              className="rounded-md bg-navy px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-navy-light disabled:opacity-50"
            >
              {saving ? t("stepCreating") : t("stepCreateContinue")}
            </button>
          </div>
        </section>
      )}

      {/* Step 2 : Rate plans */}
      {step === 2 && (
        <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-base font-semibold text-navy">{t("step2Title")}</h2>
          <p className="mt-1 text-xs text-muted">{t("step2Intro")}</p>

          {hasPlans && (
            <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              ⚠ {t("step2Warning", { count: existingPlans.length, codes: existingPlans.map((p) => p.code).join(", ") })}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {DEFAULT_PLANS.map((p) => (
              <label
                key={p.code}
                className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                  selectedPlans[p.code] ? "border-navy bg-navy/5" : "border-card-border bg-background hover:border-navy/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!selectedPlans[p.code]}
                  onChange={(e) => setSelectedPlans({ ...selectedPlans, [p.code]: e.target.checked })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <span className="font-mono rounded bg-card px-1.5 py-0.5 text-xs">{p.code}</span>
                    {t(p.nameKey)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    {p.refundable ? t("step2Refundable") : t("step2NonRefundable")}
                    {" · "}{p.breakfast_included ? t("step2Breakfast") : t("step2NoBreakfast")}
                    {p.discount_pct > 0 && ` · ${t("step2Discount", { pct: p.discount_pct })}`}
                    {" · "}{t("step2MinLos", { n: p.min_los })}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border border-card-border px-3 py-1.5 text-xs text-slate hover:border-navy"
            >
              {t("stepBack")}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-md border border-card-border px-3 py-1.5 text-xs text-slate hover:border-navy"
              >
                {t("stepSkip")}
              </button>
              <button
                type="button"
                onClick={createPlans}
                disabled={saving}
                className="rounded-md bg-navy px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-navy-light disabled:opacity-50"
              >
                {saving ? t("stepCreating") : t("stepCreateContinue")}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Step 3 : terminé */}
      {step === 3 && (
        <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-base font-semibold text-emerald-900">{t("step3Title")}</h2>
          <p className="mt-1 text-sm text-emerald-900">{t("step3Intro")}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              href={`/pms/${propertyId}/reservations/nouveau`}
              className="rounded-md border border-navy bg-navy/5 p-3 text-sm text-navy hover:bg-navy/10"
            >
              <div className="font-semibold">{t("step3FirstRes")}</div>
              <div className="text-[11px] text-muted">{t("step3FirstResSub")}</div>
            </Link>
            <Link
              href={`/pms/${propertyId}/tarifs`}
              className="rounded-md border border-card-border bg-background p-3 text-sm text-navy hover:border-navy"
            >
              <div className="font-semibold">{t("step3SeasonalRates")}</div>
              <div className="text-[11px] text-muted">{t("step3SeasonalRatesSub")}</div>
            </Link>
            <Link
              href={`/pms/${propertyId}/calendrier`}
              className="rounded-md border border-card-border bg-background p-3 text-sm text-navy hover:border-navy"
            >
              <div className="font-semibold">{t("step3Calendar")}</div>
              <div className="text-[11px] text-muted">{t("step3CalendarSub")}</div>
            </Link>
            <Link
              href={`/pms/${propertyId}`}
              className="rounded-md border border-card-border bg-background p-3 text-sm text-navy hover:border-navy"
            >
              <div className="font-semibold">{t("step3Dashboard")}</div>
              <div className="text-[11px] text-muted">{t("step3DashboardSub")}</div>
            </Link>
          </div>

          <div className="mt-4 text-[11px] text-emerald-900 border-t border-emerald-200 pt-3">
            {t("step3Next")}
          </div>
        </section>
      )}
    </div>
  );
}

function StepDot({ n, current, done, label }: { n: number; current: number; done: boolean; label: string }) {
  const active = n === current;
  const cls = done
    ? "bg-emerald-500 text-white border-emerald-600"
    : active
    ? "bg-navy text-white border-navy"
    : "bg-background text-muted border-card-border";
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${cls}`}>
        {done ? "✓" : n}
      </div>
      <span className={`text-xs font-medium ${active ? "text-navy" : done ? "text-emerald-700" : "text-muted"}`}>
        {label}
      </span>
    </div>
  );
}
