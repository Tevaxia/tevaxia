"use client";

import { useEffect, useState, use, useCallback, useRef } from "react";
import Link from "@/components/LocaleLink";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listReservations } from "@/lib/pms/reservations";
import { getFolioByReservation } from "@/lib/pms/folios";
import ChargeEntry from "@/components/pms/ChargeEntry";
import type {
  PmsProperty, PmsReservation, PmsFolio,
} from "@/lib/pms/types";

import { errMsg } from "@/lib/pms/errors";

function PosScreen(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const t = useTranslations("pmsPos");
  const te = useTranslations("pmsChargeEntry");
  const locale = useLocale();
  const formatEUR = (n: number) => new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const dateLocale = locale === "fr" ? "fr-FR" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [reservations, setReservations] = useState<PmsReservation[]>([]);
  const [folios, setFolios] = useState<Record<string, PmsFolio | null>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  const reload = useCallback(async () => {
    if (!propertyId) return;
    const current = ++request.current;
    setLoading(true); setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [p, res] = await Promise.all([
        getProperty(propertyId),
        listReservations(propertyId, {
          fromDate: today,
          toDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          status: ["checked_in"],
        }),
      ]);
      if (!p) throw new Error("Property unavailable");
      // Load folios in parallel
      const foliosMap: Record<string, PmsFolio | null> = {};
      await Promise.all(res.map(async (r) => {
        foliosMap[r.id] = await getFolioByReservation(r.id);
      }));
      if (current !== request.current) return;
      setProperty(p); setReservations(res); setFolios(foliosMap);
    } catch (e) {
      if (current === request.current) setError(errMsg(e));
    }
    if (current === request.current) setLoading(false);
  }, [propertyId]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const selected = reservations.find((r) => r.id === selectedId) ?? null;
  const selectedFolio = selected ? folios[selected.id] : null;

  const filtered = reservations.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.reservation_number.toLowerCase().includes(q)
      || (r.booker_name?.toLowerCase().includes(q) ?? false)
      || (r.booker_email?.toLowerCase().includes(q) ?? false);
  });

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (error && !property) return <div className="p-6"><p role="alert">{te("error")}</p><button className="mt-3 underline" onClick={() => { void reload(); }}>{te("retry")}</button></div>;
  if (!user || !property) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">{t("signIn")}</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-navy">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}
      <div className="mt-5 grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Liste clients in-house */}
        <div className="rounded-xl border border-card-border bg-card p-3">
          <div className="text-xs font-bold uppercase tracking-wider text-navy mb-2">
            {t("inHouseTitle", { count: reservations.length })}
          </div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPh")}
            className="mb-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted italic">
              {search ? t("noClient") : t("noInHouse")}
            </div>
          ) : (
            <ul className="space-y-1 max-h-[500px] overflow-y-auto">
              {filtered.map((r) => {
                const f = folios[r.id];
                return (
                  <li key={r.id}>
                    <button onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left rounded-lg p-2 transition-colors ${
                        selectedId === r.id ? "bg-navy text-white" : "hover:bg-background"
                      }`}>
                      <div className={`font-semibold text-sm ${selectedId === r.id ? "" : "text-navy"}`}>
                        {r.booker_name ?? r.reservation_number}
                      </div>
                      <div className={`text-[10px] ${selectedId === r.id ? "text-white/70" : "text-muted"}`}>
                        {r.reservation_number} · {t("departureLabel", { date: new Date(r.check_out).toLocaleDateString(dateLocale, { day: "2-digit", month: "short" }) })}
                      </div>
                      {f && (
                        <div className={`text-xs font-mono ${selectedId === r.id ? "text-white" : "text-navy"}`}>
                          {formatEUR(Number(f.total_ttc))} {t("ttc")}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* POS grid */}
        <div>
          {!selected ? (
            <div className="rounded-xl border-2 border-dashed border-card-border py-16 text-center text-sm text-muted">
              👈 {t("pickClientHint")}
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-navy bg-navy/5 p-4 mb-4">
                <div className="text-xs text-muted">{t("selectedClient")}</div>
                <div className="text-lg font-bold text-navy">
                  {selected.booker_name ?? "—"} ({selected.reservation_number})
                </div>
                <div className="text-xs text-muted">
                  {t("arrivalDeparture", {
                    checkIn: new Date(selected.check_in).toLocaleDateString(dateLocale),
                    checkOut: new Date(selected.check_out).toLocaleDateString(dateLocale),
                  })}
                </div>
                {selectedFolio && (
                  <div className="mt-2 text-sm">
                    {t("folioOpen")} <span className="font-bold text-navy">{formatEUR(Number(selectedFolio.total_ttc))}</span> {t("ttc")}
                    · {t("balanceRemaining")} <span className="font-bold text-rose-700">{formatEUR(Number(selectedFolio.balance_due))}</span>
                  </div>
                )}
                <Link href={`${locale === "fr" ? "" : `/${locale}`}/pms/${propertyId}/reservations/${selected.id}/folio`}
                  className="mt-2 inline-block text-xs text-navy underline">
                  {t("seeFolio")}
                </Link>
              </div>

              {selectedFolio?.status === "open" ? <ChargeEntry key={selectedFolio.id} userId={user.id} folioId={selectedFolio.id} onPosted={() => { void reload(); }} /> : <p className="rounded-lg border p-4">{te("openFolioFirst")}</p>}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        {te("scope")}
      </div>
    </div>
  );
}

export default function PosPage(props: { params: Promise<{ propertyId: string }> }) {
  const ids = use(props.params), { user, loading } = useAuth();
  const t = useTranslations("pmsPos"), locale = useLocale();
  if (loading) return <p className="p-6">{t("loading")}</p>;
  if (!user) return <div className="p-6"><h1 className="text-2xl font-bold">{t("title")}</h1><Link className="mt-4 inline-block underline" href={`${locale === "fr" ? "" : `/${locale}`}/connexion`}>{t("signIn")}</Link></div>;
  return <PosScreen key={`${user.id}:${ids.propertyId}`} {...props} />;
}
