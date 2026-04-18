"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listRoomTypes, listRooms } from "@/lib/pms/rooms";
import {
  getReservation, listReservationLines, listPayments, recordPayment,
  checkInReservation, checkOutReservation, cancelReservation,
} from "@/lib/pms/reservations";
import { getGuest } from "@/lib/pms/guests";
import { createInvoice } from "@/lib/pms/invoices";
import { errMsg } from "@/lib/pms/errors";
import type {
  PmsProperty, PmsRoomType, PmsRoom, PmsReservation, PmsReservationRoom,
  PmsPayment, PmsPaymentMethod, PmsGuest,
} from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { useRouter } from "next/navigation";

const METHODS: PmsPaymentMethod[] = ["cash","card","bank_transfer","ota_virtual","voucher","invoice"];

export default function ReservationDetailPage(props: { params: Promise<{ propertyId: string; resId: string }> }) {
  const { propertyId, resId } = use(props.params);
  const router = useRouter();
  const tc = useTranslations("pms.common");
  const ts = useTranslations("pms.reservationStatus");
  const t = useTranslations("pms.reservation");
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [reservation, setReservation] = useState<PmsReservation | null>(null);
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [lines, setLines] = useState<PmsReservationRoom[]>([]);
  const [payments, setPayments] = useState<PmsPayment[]>([]);
  const [guest, setGuest] = useState<PmsGuest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [p, r, rt, rr] = await Promise.all([
      getProperty(propertyId),
      getReservation(resId),
      listRoomTypes(propertyId),
      listRooms(propertyId),
    ]);
    setProperty(p);
    setReservation(r);
    setRoomTypes(rt);
    setRooms(rr);
    if (r) {
      const [ls, pys] = await Promise.all([
        listReservationLines(r.id),
        listPayments(r.id),
      ]);
      setLines(ls);
      setPayments(pys);
      if (r.guest_id) setGuest(await getGuest(r.guest_id));
    }
    setLoading(false);
  }, [propertyId, resId]);

  useEffect(() => {
    if (authLoading || !user) return;
    void reload();
  }, [user, authLoading, reload]);

  const [assignments, setAssignments] = useState<Record<string, string>>({}); // lineId → roomId
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PmsPaymentMethod>("card");
  const [payRef, setPayRef] = useState<string>("");

  if (authLoading || loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{tc("loading")}</div>;
  if (!user || !property || !reservation) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted">{tc("propertyNotFound")}</div>;

  const balance = Number(reservation.total_amount || 0) - Number(reservation.amount_paid || 0);

  const availableRoomsFor = (typeId: string) =>
    rooms.filter((r) => r.room_type_id === typeId && r.active && !["out_of_order", "maintenance"].includes(r.status));

  const handleCheckIn = async () => {
    const assignmentsList = lines.map((l) => ({
      lineId: l.id,
      roomId: assignments[l.id] || l.room_id || "",
    })).filter((a) => a.roomId);
    if (assignmentsList.length !== lines.length) {
      setError(t("errAssignAll"));
      return;
    }
    try {
      await checkInReservation(reservation.id, assignmentsList);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleCheckOut = async () => {
    try {
      await checkOutReservation(reservation.id);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleCancel = async () => {
    const reason = prompt(t("cancelPrompt"));
    if (reason === null) return;
    try {
      await cancelReservation(reservation.id, reason);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleRecordPayment = async () => {
    if (payAmount <= 0) { setError(t("errAmount")); return; }
    try {
      await recordPayment({
        reservationId: reservation.id,
        amount: payAmount,
        method: payMethod,
        reference: payRef || undefined,
      });
      setPayAmount(0);
      setPayRef("");
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleGenerateInvoice = async () => {
    const total = Number(reservation.total_amount || 0);
    const taxeSejour = Number(property.taxe_sejour_eur || 0) * reservation.nb_adults * reservation.nb_nights;
    const hebergementTtc = total - taxeSejour;
    const tvaRate = Number(property.tva_rate);
    const hebergementHt = Math.round((hebergementTtc / (1 + tvaRate / 100)) * 100) / 100;
    const hebergementTva = Math.round((hebergementTtc - hebergementHt) * 100) / 100;

    try {
      const inv = await createInvoice({
        property_id: propertyId,
        reservation_id: reservation.id,
        guest_id: reservation.guest_id,
        customer_name: reservation.booker_name ?? (guest ? `${guest.first_name} ${guest.last_name}` : "Client"),
        customer_address: guest?.address ?? null,
        hebergement_ht: hebergementHt,
        hebergement_tva_rate: tvaRate,
        hebergement_tva: hebergementTva,
        fb_ht: 0,
        fb_tva_rate: Number(property.tva_rate_fb ?? 17),
        fb_tva: 0,
        other_ht: 0,
        other_tva_rate: Number(property.tva_rate_fb ?? 17),
        other_tva: 0,
        taxe_sejour: taxeSejour,
        total_ht: hebergementHt,
        total_tva: hebergementTva,
        total_ttc: total,
        legal_footer: property.legal_footer,
      });
      router.push(`/pms/${propertyId}/factures?highlight=${inv.id}`);
    } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href={`/pms/${propertyId}/reservations`} className="text-xs text-navy hover:underline">← {t("backToList")}</Link>
      <div className="mt-1 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{reservation.reservation_number}</h1>
          <p className="mt-1 text-xs text-muted">
            {t("headerDates", {
              ci: reservation.check_in,
              co: reservation.check_out,
              nights: reservation.nb_nights,
              ad: reservation.nb_adults,
              ch: reservation.nb_children,
              source: reservation.source,
            })}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(reservation.status)}`}>
          {ts(reservation.status)}
        </span>
      </div>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {reservation.status === "confirmed" && (
          <button type="button" onClick={handleCheckIn} className="rounded-md bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700">
            {t("actionCheckIn")}
          </button>
        )}
        {reservation.status === "checked_in" && (
          <button type="button" onClick={handleCheckOut} className="rounded-md bg-slate-700 px-3 py-1.5 font-semibold text-white hover:bg-slate-800">
            {t("actionCheckOut")}
          </button>
        )}
        {!["cancelled", "checked_out", "no_show"].includes(reservation.status) && (
          <button type="button" onClick={handleCancel} className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 font-semibold text-rose-900 hover:bg-rose-100">
            {t("actionCancel")}
          </button>
        )}
        <button
          type="button"
          onClick={handleGenerateInvoice}
          className="rounded-md border border-navy bg-navy/5 px-3 py-1.5 font-semibold text-navy hover:bg-navy/10"
        >
          {t("actionGenerateInvoice")}
        </button>
      </div>

      {/* Client */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy mb-2">{t("clientSection")}</h2>
        <div className="grid gap-2 sm:grid-cols-2 text-xs">
          <div>{t("bookerName")} : <span className="font-mono">{reservation.booker_name ?? "—"}</span></div>
          <div>{t("bookerEmail")} : <span className="font-mono">{reservation.booker_email ?? "—"}</span></div>
          <div>{t("bookerPhone")} : <span className="font-mono">{reservation.booker_phone ?? "—"}</span></div>
          {guest && (
            <div className="sm:col-span-2 mt-2 rounded border border-card-border/50 bg-background/50 p-2">
              {t("crmClient")} : <Link href={`/pms/${propertyId}/guests?highlight=${guest.id}`} className="text-navy underline">{guest.last_name}, {guest.first_name}</Link>
              {guest.total_stays > 0 && <span className="ml-2 text-[10px] text-muted">{t("priorStays", { n: guest.total_stays })}</span>}
            </div>
          )}
        </div>
      </section>

      {/* Lignes + assignation chambre */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy mb-3">{t("linesSection")}</h2>
        {lines.length === 0 ? (
          <p className="text-xs text-muted italic">{t("linesEmpty")}</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-card-border">
                <th className="py-1 pr-2 text-left font-medium text-muted">{t("colType")}</th>
                <th className="py-1 pr-2 text-left font-medium text-muted">{t("colRatePlan")}</th>
                <th className="py-1 px-2 text-right font-medium text-muted">{t("colNightlyRate")}</th>
                <th className="py-1 px-2 text-right font-medium text-muted">{t("colNights")}</th>
                <th className="py-1 px-2 text-right font-medium text-muted">{t("colLineTotal")}</th>
                <th className="py-1 pl-2 text-left font-medium text-muted">{t("colAssignedRoom")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const rt = roomTypes.find((r) => r.id === l.room_type_id);
                const assigned = l.room_id ? rooms.find((r) => r.id === l.room_id) : null;
                const available = availableRoomsFor(l.room_type_id);
                return (
                  <tr key={l.id} className="border-b border-card-border/40">
                    <td className="py-1 pr-2 font-mono">{rt?.code ?? "?"}</td>
                    <td className="py-1 pr-2 text-[10px] text-muted">{l.rate_plan_id.slice(0, 8)}</td>
                    <td className="py-1 px-2 text-right font-mono">{formatEUR(Number(l.nightly_rate))}</td>
                    <td className="py-1 px-2 text-right font-mono">{l.nb_nights}</td>
                    <td className="py-1 px-2 text-right font-mono">{formatEUR(Number(l.line_total))}</td>
                    <td className="py-1 pl-2">
                      {assigned ? (
                        <span className="font-mono text-emerald-700">{assigned.number}</span>
                      ) : (
                        <select
                          value={assignments[l.id] ?? ""}
                          onChange={(e) => setAssignments({ ...assignments, [l.id]: e.target.value })}
                          className="rounded border border-card-border bg-background px-1 py-0.5"
                        >
                          <option value="">{t("assignPlaceholder")}</option>
                          {available.map((r) => <option key={r.id} value={r.id}>{r.number} ({r.status})</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Finances */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs text-muted">{t("financesTotal")}</div>
            <div className="text-xl font-bold text-navy">{formatEUR(Number(reservation.total_amount || 0))}</div>
          </div>
          <div>
            <div className="text-xs text-muted">{t("financesPaid")}</div>
            <div className="text-xl font-bold text-emerald-700">{formatEUR(Number(reservation.amount_paid || 0))}</div>
          </div>
          <div>
            <div className="text-xs text-muted">{t("financesBalance")}</div>
            <div className={`text-xl font-bold ${balance > 0 ? "text-rose-700" : "text-emerald-700"}`}>
              {formatEUR(balance)}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-xs font-semibold text-navy mb-2">{t("recordPaymentTitle")}</h3>
          <div className="grid gap-2 sm:grid-cols-5 text-xs">
            <input
              type="number" step="0.01" placeholder={t("amountPlaceholder")}
              value={payAmount || ""}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="rounded-md border border-card-border bg-background px-2 py-1.5"
            />
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PmsPaymentMethod)}
              className="rounded-md border border-card-border bg-background px-2 py-1.5"
            >
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              placeholder={t("referencePlaceholder")}
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              className="rounded-md border border-card-border bg-background px-2 py-1.5 sm:col-span-2"
            />
            <button type="button" onClick={handleRecordPayment}
              className="rounded-md bg-navy px-3 py-1.5 font-semibold text-white hover:bg-navy-light">
              {t("recordBtn")}
            </button>
          </div>

          {payments.length > 0 && (
            <table className="mt-3 min-w-full text-xs">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="py-1 pr-2 text-left font-medium text-muted">{t("paymentsColDate")}</th>
                  <th className="py-1 pr-2 text-left font-medium text-muted">{t("paymentsColMethod")}</th>
                  <th className="py-1 px-2 text-right font-medium text-muted">{t("paymentsColAmount")}</th>
                  <th className="py-1 pl-2 text-left font-medium text-muted">{t("paymentsColRef")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-card-border/40">
                    <td className="py-1 pr-2 font-mono">{new Date(p.paid_at).toLocaleString()}</td>
                    <td className="py-1 pr-2">{p.method}</td>
                    <td className="py-1 px-2 text-right font-mono">{formatEUR(Number(p.amount))}</td>
                    <td className="py-1 pl-2 text-[10px] text-muted">{p.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Notes / demandes */}
      {(reservation.special_requests || reservation.notes) && (
        <section className="mt-6 rounded-xl border border-card-border bg-card p-5 space-y-3 text-xs">
          {reservation.special_requests && (
            <div>
              <h3 className="font-semibold text-navy">{t("specialRequestsTitle")}</h3>
              <p className="mt-1 whitespace-pre-wrap text-muted">{reservation.special_requests}</p>
            </div>
          )}
          {reservation.notes && (
            <div>
              <h3 className="font-semibold text-navy">{t("internalNotesTitle")}</h3>
              <p className="mt-1 whitespace-pre-wrap text-muted">{reservation.notes}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function statusClass(s: PmsReservation["status"]): string {
  switch (s) {
    case "confirmed": return "bg-blue-100 text-blue-900";
    case "checked_in": return "bg-emerald-100 text-emerald-900";
    case "checked_out": return "bg-slate-100 text-slate-800";
    case "cancelled": return "bg-rose-100 text-rose-900";
    case "no_show": return "bg-amber-100 text-amber-900";
    case "quote": return "bg-navy/10 text-navy";
  }
}
