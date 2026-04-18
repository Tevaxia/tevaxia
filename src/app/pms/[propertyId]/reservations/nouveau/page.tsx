"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listRoomTypes } from "@/lib/pms/rooms";
import { listRatePlans, listSeasonalRates, computeStayTotal } from "@/lib/pms/rates";
import { createReservation } from "@/lib/pms/reservations";
import { createGuest, listGuests } from "@/lib/pms/guests";
import { errMsg } from "@/lib/pms/errors";
import type {
  PmsProperty, PmsRoomType, PmsRatePlan, PmsSeasonalRate, PmsGuest, PmsReservationSource,
} from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";

const SOURCES: PmsReservationSource[] = ["direct","website","booking","expedia","airbnb","gha","corporate","tour_operator","other"];

export default function NewReservationPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const router = useRouter();
  const tc = useTranslations("pms.common");
  const t = useTranslations("pms.newReservation");
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [ratePlans, setRatePlans] = useState<PmsRatePlan[]>([]);
  const [seasonalRates, setSeasonalRates] = useState<PmsSeasonalRate[]>([]);
  const [guests, setGuests] = useState<PmsGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    check_in: "",
    check_out: "",
    nb_adults: 2,
    nb_children: 0,
    room_type_id: "",
    rate_plan_id: "",
    source: "direct" as PmsReservationSource,
    external_ref: "",
    guest_id: "",
    booker_name: "",
    booker_email: "",
    booker_phone: "",
    special_requests: "",
    notes: "",
    new_guest_first: "",
    new_guest_last: "",
    new_guest_email: "",
  });

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const [p, types, plans, rates, gs] = await Promise.all([
        getProperty(propertyId),
        listRoomTypes(propertyId),
        listRatePlans(propertyId),
        listSeasonalRates(propertyId),
        listGuests(propertyId),
      ]);
      setProperty(p);
      setRoomTypes(types);
      setRatePlans(plans);
      setSeasonalRates(rates);
      setGuests(gs);
      if (types.length > 0) setForm((f) => ({ ...f, room_type_id: types[0].id }));
      if (plans.length > 0) setForm((f) => ({ ...f, rate_plan_id: plans[0].id }));
      setLoading(false);
    })();
  }, [propertyId, user, authLoading]);

  const rt = roomTypes.find((r) => r.id === form.room_type_id);
  const rp = ratePlans.find((r) => r.id === form.rate_plan_id);

  const preview = (() => {
    if (!form.check_in || !form.check_out || !rt || !rp) return null;
    if (form.check_out <= form.check_in) return null;
    return computeStayTotal({
      checkIn: form.check_in,
      checkOut: form.check_out,
      roomTypeId: rt.id,
      ratePlanId: rp.id,
      baseRate: Number(rt.base_rate),
      ratePlanDiscountPct: Number(rp.discount_pct),
      seasonalRates,
    });
  })();

  const taxeSejour = (() => {
    if (!property || !preview) return 0;
    return Number(property.taxe_sejour_eur ?? 0) * form.nb_adults * preview.nights;
  })();

  const handleSubmit = async () => {
    if (!form.check_in || !form.check_out) { setError(t("errDates")); return; }
    if (form.check_out <= form.check_in) { setError(t("errDateOrder")); return; }
    if (!form.room_type_id || !form.rate_plan_id) { setError(t("errTypeRate")); return; }
    if (!preview) { setError(t("errCalc")); return; }

    setSaving(true);
    setError(null);
    try {
      let guestId = form.guest_id || null;
      if (!guestId && form.new_guest_first && form.new_guest_last) {
        const g = await createGuest({
          property_id: propertyId,
          first_name: form.new_guest_first,
          last_name: form.new_guest_last,
          email: form.new_guest_email || null,
        });
        guestId = g.id;
      }

      const bookerName = form.booker_name ||
        (form.new_guest_first && form.new_guest_last
          ? `${form.new_guest_first} ${form.new_guest_last}`
          : guests.find((g) => g.id === guestId)?.last_name ?? "");

      const totalAmount = preview.total + taxeSejour;
      const res = await createReservation(
        {
          property_id: propertyId,
          check_in: form.check_in,
          check_out: form.check_out,
          nb_adults: form.nb_adults,
          nb_children: form.nb_children,
          source: form.source,
          external_ref: form.external_ref || null,
          guest_id: guestId,
          booker_name: bookerName || null,
          booker_email: form.booker_email || null,
          booker_phone: form.booker_phone || null,
          special_requests: form.special_requests || null,
          notes: form.notes || null,
          total_amount: totalAmount,
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        },
        [
          {
            room_type_id: rt!.id,
            rate_plan_id: rp!.id,
            nightly_rate: preview.avgNightly,
            nb_nights: preview.nights,
            nb_adults: form.nb_adults,
            nb_children: form.nb_children,
            line_total: preview.total,
          },
        ],
      );
      router.push(`/pms/${propertyId}/reservations/${res.id}`);
    } catch (e) {
      setError(errMsg(e));
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">{tc("loading")}</div>;
  if (!user || !property) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">{tc("signInLink")}</Link></div>;

  if (roomTypes.length === 0 || ratePlans.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href={`/pms/${propertyId}`} className="text-xs text-navy hover:underline">← {property.name}</Link>
        <div className="mt-4 rounded-xl border border-navy bg-navy text-white p-6">
          <h2 className="text-lg font-bold">{t("configNeededTitle")}</h2>
          <p className="mt-2 text-sm text-white/80">{t("configNeededDesc")}</p>
          <ul className="mt-3 space-y-1 text-xs text-white/70">
            <li>{roomTypes.length > 0 ? "✅" : "◯"} {t("configCheckTypes")}</li>
            <li>{roomTypes.length > 0 ? "✅" : "◯"} {t("configCheckRooms")}</li>
            <li>{ratePlans.length > 0 ? "✅" : "◯"} {t("configCheckPlan")}</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/pms/${propertyId}/setup`}
              className="rounded-md bg-gold px-4 py-2 text-sm font-bold text-navy hover:brightness-105"
            >
              {t("ctaWizard")}
            </Link>
            <Link
              href={`/pms/${propertyId}/chambres`}
              className="rounded-md border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              {t("ctaManual")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href={`/pms/${propertyId}/reservations`} className="text-xs text-navy hover:underline">← {t("backToList")}</Link>
      <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Partie gauche : formulaire */}
        <div className="lg:col-span-2 space-y-5 rounded-xl border border-card-border bg-card p-5">
          <section>
            <h2 className="text-sm font-semibold text-navy mb-3">{t("stay")}</h2>
            <div className="grid gap-3 sm:grid-cols-4 text-xs">
              <label>
                <span className="text-muted">{t("arrival")}</span>
                <input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
              <label>
                <span className="text-muted">{t("departure")}</span>
                <input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
              <label>
                <span className="text-muted">{t("adults")}</span>
                <input type="number" min="1" value={form.nb_adults} onChange={(e) => setForm({ ...form, nb_adults: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
              <label>
                <span className="text-muted">{t("children")}</span>
                <input type="number" min="0" value={form.nb_children} onChange={(e) => setForm({ ...form, nb_children: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-navy mb-3">{t("rate")}</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <label>
                <span className="text-muted">{t("roomType")}</span>
                <select value={form.room_type_id} onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5">
                  {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.code} — {rt.name}</option>)}
                </select>
              </label>
              <label>
                <span className="text-muted">{t("ratePlan")}</span>
                <select value={form.rate_plan_id} onChange={(e) => setForm({ ...form, rate_plan_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5">
                  {ratePlans.filter((rp) => rp.active).map((rp) => <option key={rp.id} value={rp.id}>{rp.code} — {rp.name}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-navy mb-3">{t("client")}</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <label className="sm:col-span-2">
                <span className="text-muted">{t("existingClient")}</span>
                <select value={form.guest_id} onChange={(e) => {
                  const g = guests.find((gg) => gg.id === e.target.value);
                  setForm({
                    ...form,
                    guest_id: e.target.value,
                    booker_name: g ? `${g.first_name} ${g.last_name}` : form.booker_name,
                    booker_email: g?.email ?? form.booker_email,
                    booker_phone: g?.phone ?? form.booker_phone,
                  });
                }} className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5">
                  <option value="">{t("newClient")}</option>
                  {guests.map((g) => <option key={g.id} value={g.id}>{g.last_name}, {g.first_name} {g.email ? `(${g.email})` : ""}</option>)}
                </select>
              </label>
              {!form.guest_id && (
                <>
                  <label>
                    <span className="text-muted">{t("firstName")}</span>
                    <input value={form.new_guest_first} onChange={(e) => setForm({ ...form, new_guest_first: e.target.value })}
                      className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
                  </label>
                  <label>
                    <span className="text-muted">{t("lastName")}</span>
                    <input value={form.new_guest_last} onChange={(e) => setForm({ ...form, new_guest_last: e.target.value })}
                      className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="text-muted">{t("clientEmail")}</span>
                    <input type="email" value={form.new_guest_email} onChange={(e) => setForm({ ...form, new_guest_email: e.target.value })}
                      className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
                  </label>
                </>
              )}
              <label>
                <span className="text-muted">{t("bookerName")}</span>
                <input value={form.booker_name} onChange={(e) => setForm({ ...form, booker_name: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
              <label>
                <span className="text-muted">{t("bookerPhone")}</span>
                <input value={form.booker_phone} onChange={(e) => setForm({ ...form, booker_phone: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-navy mb-3">{t("sourceAndNotes")}</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <label>
                <span className="text-muted">{t("source")}</span>
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as PmsReservationSource })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5">
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>
                <span className="text-muted">{t("externalRef")}</span>
                <input value={form.external_ref} onChange={(e) => setForm({ ...form, external_ref: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-muted">{t("specialRequests")}</span>
                <textarea rows={2} value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-muted">{t("internalNotes")}</span>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5" />
              </label>
            </div>
          </section>
        </div>

        {/* Partie droite : récap */}
        <aside className="lg:col-span-1">
          <div className="sticky top-4 rounded-xl border border-navy bg-navy text-white p-5 space-y-3">
            <h2 className="text-sm font-semibold">{t("recapTitle")}</h2>
            {!preview ? (
              <p className="text-xs text-white/70 italic">{t("recapEmpty")}</p>
            ) : (
              <>
                <div className="text-xs text-white/70">{rt?.name} · {rp?.name}</div>
                <div className="flex items-center justify-between text-xs">
                  <span>{t("recapNights")}</span>
                  <span className="font-mono">{preview.nights}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>{t("recapNightAvg")}</span>
                  <span className="font-mono">{formatEUR(preview.avgNightly)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>{t("recapLodgingSubtotal")}</span>
                  <span className="font-mono">{formatEUR(preview.total)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>{t("recapTaxe", { amount: property.taxe_sejour_eur ?? 0, adults: form.nb_adults, nights: preview.nights })}</span>
                  <span className="font-mono">{formatEUR(taxeSejour)}</span>
                </div>
                <div className="my-2 border-t border-white/20" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t("recapTotalTtc")}</span>
                  <span className="font-mono text-lg font-bold">{formatEUR(preview.total + taxeSejour)}</span>
                </div>
                <div className="text-[10px] text-white/60">
                  {t("recapTvaNote", { rate: property.tva_rate })}
                </div>
              </>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !preview}
              className="mt-4 w-full rounded-md bg-gold px-4 py-2 text-sm font-bold text-navy shadow-sm hover:brightness-105 disabled:opacity-50"
            >
              {saving ? t("saving") : t("submit")}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
