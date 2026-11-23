import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import type { DemoProduct } from "@/lib/demo-request";

// Aperçus du produit reconstruits en HTML, avec des données fictives. Ils
// montrent la forme des écrans réels (assemblée générale, planning, portefeuille
// locatif, pipeline des mandats) sans compte de démonstration ni image à
// maintenir. Chaque aperçu est légendé comme illustratif.

type Translator = Awaited<ReturnType<typeof getTranslations>>;

const NUMBER_LOCALE: Record<string, string> = { fr: "fr-LU", en: "en-GB", de: "de-LU", pt: "pt-PT", lb: "de-LU" };

function formatters(locale: string) {
  const tag = NUMBER_LOCALE[locale] ?? "fr-LU";
  const euro = new Intl.NumberFormat(tag, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat(tag, { style: "percent", maximumFractionDigits: 0 });
  return { euro: (value: number) => euro.format(value), percent: (value: number) => percent.format(value), tag };
}

function Frame({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <figure className="min-w-0" data-product-preview>
      <div className="overflow-hidden rounded-xl border border-card-border bg-white text-left shadow-xl">
        <div className="flex items-center gap-2 border-b border-card-border bg-slate-50 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </span>
          <span className="truncate text-xs font-semibold text-navy">{title}</span>
        </div>
        <div className="p-4 text-navy sm:p-5">{children}</div>
      </div>
      <figcaption className="mt-2 text-center text-xs opacity-80">{caption}</figcaption>
    </figure>
  );
}

const badge = "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold";

function SyndicPreview({ t, locale }: { t: Translator; locale: string }) {
  const { euro } = formatters(locale);
  const votes = [
    { label: t("syndic.for"), shares: 612, bar: "bg-emerald-500" },
    { label: t("syndic.against"), shares: 254, bar: "bg-rose-400" },
    { label: t("syndic.abstain"), shares: 134, bar: "bg-slate-300" },
  ];
  // Budget trimestriel fictif de 15 000 €, réparti selon les millièmes.
  const calls = [
    { lot: "A1", shares: 86, status: t("syndic.paid"), tone: "bg-emerald-100 text-emerald-800" },
    { lot: "A2", shares: 74, status: t("syndic.paid"), tone: "bg-emerald-100 text-emerald-800" },
    { lot: "B3", shares: 112, status: t("syndic.reminder"), tone: "bg-amber-100 text-amber-800" },
  ];
  return (
    <Frame title={t("syndic.window")} caption={t("caption")}>
      <p className="text-xs text-muted">{t("syndic.building")}</p>
      <div className="mt-3 rounded-lg border border-card-border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{t("syndic.resolution")}</p>
          <span className={`${badge} bg-emerald-100 text-emerald-800`}>{t("syndic.adopted")}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted">{t("syndic.majority")}</p>
        <div className="mt-3 space-y-1.5">
          {votes.map(vote => (
            <div key={vote.label} className="flex items-center gap-2 text-xs">
              <span className="w-20 shrink-0 sm:w-24">{vote.label}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full ${vote.bar}`} style={{ width: `${vote.shares / 10}%` }} /></span>
              <span className="w-12 shrink-0 text-right tabular-nums">{vote.shares} ‰</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold">{t("syndic.callsTitle")}</p>
      <table className="mt-2 w-full text-xs">
        <thead>
          <tr className="border-b border-card-border text-left text-muted">
            <th className="py-1.5 font-medium">{t("syndic.lot")}</th>
            <th className="py-1.5 text-right font-medium">{t("syndic.shares")}</th>
            <th className="py-1.5 text-right font-medium">{t("syndic.amount")}</th>
            <th className="py-1.5 text-right font-medium">{t("syndic.status")}</th>
          </tr>
        </thead>
        <tbody>
          {calls.map(call => (
            <tr key={call.lot} className="border-b border-card-border/60 last:border-0">
              <td className="py-1.5 font-medium">{call.lot}</td>
              <td className="py-1.5 text-right tabular-nums">{call.shares} ‰</td>
              <td className="py-1.5 text-right tabular-nums">{euro(15000 * call.shares / 1000)}</td>
              <td className="py-1.5 text-right"><span className={`${badge} ${call.tone}`}>{call.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

function PmsPreview({ t, locale }: { t: Translator; locale: string }) {
  const { euro, percent, tag } = formatters(locale);
  const occupancy = 0.78, adr = 142;
  const kpis = [
    { label: t("pms.occupancy"), value: percent(occupancy) },
    { label: t("pms.adr"), value: euro(adr) },
    { label: t("pms.revpar"), value: euro(Math.round(occupancy * adr)) },
    { label: t("pms.arrivals"), value: "6" },
  ];
  // Semaine fictive, du lundi au dimanche.
  const weekday = new Intl.DateTimeFormat(tag, { weekday: "short", timeZone: "UTC" });
  const days = Array.from({ length: 7 }, (_, index) => ({ name: weekday.format(new Date(Date.UTC(2026, 8, 14 + index))), number: 14 + index }));
  const week = "grid grid-cols-[5rem_repeat(7,minmax(0,1fr))]";
  const tones = { confirmed: "bg-navy text-white", checkedIn: "bg-emerald-600 text-white", quote: "border border-dashed border-slate-400 bg-slate-50 text-slate-700" };
  const rooms: { room: string; stays: { from: number; nights: number; guest: string; status: keyof typeof tones }[] }[] = [
    { room: `101 · ${t("pms.double")}`, stays: [{ from: 1, nights: 3, guest: "Weber", status: "checkedIn" }, { from: 5, nights: 2, guest: "Da Silva", status: "confirmed" }] },
    { room: `102 · ${t("pms.twin")}`, stays: [{ from: 2, nights: 4, guest: "Schmit", status: "confirmed" }] },
    { room: `201 · ${t("pms.suite")}`, stays: [{ from: 1, nights: 2, guest: "Müller", status: "checkedIn" }, { from: 4, nights: 3, guest: "Lambert", status: "quote" }] },
    { room: `202 · ${t("pms.double")}`, stays: [{ from: 3, nights: 5, guest: "Hoffmann", status: "confirmed" }] },
  ];
  return (
    <Frame title={t("pms.window")} caption={t("caption")}>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="min-w-0 rounded-lg border border-card-border px-3 py-2">
            <dt className="break-words text-[11px] leading-tight text-muted">{kpi.label}</dt>
            <dd className="text-lg font-bold tabular-nums">{kpi.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[16rem] space-y-1.5 text-[11px]">
          <div className={`${week} items-end`}>
            <span className="text-muted">{t("pms.room")}</span>
            {days.map(label => <span key={label.number} className="text-center leading-tight text-muted">{label.name}<br />{label.number}</span>)}
          </div>
          {rooms.map(row => (
            <div key={row.room} className={`${week} items-center rounded bg-slate-50 py-1`}>
              <span className="truncate pl-1.5 font-medium" style={{ gridRow: 1 }}>{row.room}</span>
              {row.stays.map(stay => (
                <span key={stay.guest} className={`mx-0.5 truncate rounded px-1.5 py-1 font-medium ${tones[stay.status]}`} style={{ gridRow: 1, gridColumn: `${stay.from + 1} / span ${stay.nights}` }}>
                  {stay.guest}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <li><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-600" />{t("pms.checkedIn")}</li>
        <li><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-navy" />{t("pms.confirmed")}</li>
        <li><span className="mr-1 inline-block h-2 w-2 rounded-sm border border-dashed border-slate-400" />{t("pms.quote")}</li>
      </ul>
    </Frame>
  );
}

function RentalPreview({ t, locale }: { t: Translator; locale: string }) {
  const { euro } = formatters(locale);
  const lots = [
    { name: t("rental.lot1"), rent: 1850, cap: 2040, late: false },
    { name: t("rental.lot2"), rent: 1150, cap: 1020, late: false },
    { name: t("rental.lot3"), rent: 3200, cap: 3450, late: true },
  ];
  const total = lots.reduce((sum, lot) => sum + lot.rent, 0);
  return (
    <Frame title={t("rental.window")} caption={t("caption")}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-card-border text-left text-muted">
            <th className="py-1.5 font-medium">{t("rental.lot")}</th>
            <th className="py-1.5 text-right font-medium">{t("rental.rent")}</th>
            <th className="py-1.5 text-right font-medium">{t("rental.cap")}</th>
            <th className="py-1.5 text-right font-medium">{t("rental.payment")}</th>
          </tr>
        </thead>
        <tbody>
          {lots.map(lot => (
            <tr key={lot.name} className="border-b border-card-border/60 align-top last:border-0">
              <td className="py-2 pr-2 font-medium">
                {lot.name}
                {lot.rent > lot.cap && <span className={`${badge} ml-0 mt-1 block w-fit bg-amber-100 text-amber-800`}>{t("rental.above")}</span>}
              </td>
              <td className="py-2 text-right tabular-nums">{euro(lot.rent)}</td>
              <td className="py-2 text-right tabular-nums">{euro(lot.cap)}</td>
              <td className="py-2 text-right">
                <span className={`${badge} ${lot.late ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>{lot.late ? t("rental.late") : t("rental.received")}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-muted">{t("rental.summary", { total: euro(total) })}</p>
    </Frame>
  );
}

function CrmPreview({ t, locale }: { t: Translator; locale: string }) {
  const { euro } = formatters(locale);
  const columns = [
    { title: t("crm.prospect"), cards: [{ name: t("crm.card1"), price: 895000, type: t("crm.simple") }, { name: t("crm.card2"), price: 1450000, type: t("crm.simple") }] },
    { title: t("crm.signed"), cards: [{ name: t("crm.card3"), price: 465000, type: t("crm.exclusive") }] },
    { title: t("crm.visiting"), cards: [{ name: t("crm.card4"), price: 620000, type: t("crm.exclusive") }, { name: t("crm.card5"), price: 1180000, type: t("crm.simple") }] },
    { title: t("crm.agreed"), cards: [{ name: t("crm.card6"), price: 1950000, type: t("crm.exclusive") }] },
  ];
  return (
    <Frame title={t("crm.window")} caption={t("caption")}>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {columns.map(column => (
          <div key={column.title} className="min-w-0 rounded-lg bg-slate-50 p-2">
            <p className="flex items-center justify-between text-[11px] font-semibold">
              <span className="truncate">{column.title}</span>
              <span className="ml-1 rounded-full bg-white px-1.5 text-muted">{column.cards.length}</span>
            </p>
            <div className="mt-2 space-y-2">
              {column.cards.map(card => (
                <div key={card.name} className="rounded-md border border-card-border bg-white p-2 text-[11px]">
                  <p className="font-medium leading-snug">{card.name}</p>
                  <p className="mt-1 tabular-nums text-muted">{euro(card.price)}</p>
                  <span className={`${badge} mt-1 bg-slate-100 px-1.5 text-slate-700`}>{card.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export default async function ProductPreview({ product }: { product: DemoProduct }) {
  const [t, locale] = await Promise.all([getTranslations("productPreview"), getLocale()]);
  if (product === "syndic") return <SyndicPreview t={t} locale={locale} />;
  if (product === "pms") return <PmsPreview t={t} locale={locale} />;
  if (product === "rental") return <RentalPreview t={t} locale={locale} />;
  return <CrmPreview t={t} locale={locale} />;
}
