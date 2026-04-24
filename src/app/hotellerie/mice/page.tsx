"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { formatEUR, formatPct } from "@/lib/calculations";

interface MiceInputs {
  nbRooms: number;
  nbMeetingRooms: number;
  avgRfqPerMonth: number;
  conversionRate: number;
  avgGroupSize: number;
  avgGroupNights: number;
  adrGroup: number;
  fbCaptureRate: number;
  avgFbPerPax: number;
  meetingRoomHireFee: number;
  meetingRoomDaysPerGroup: number;
  seasonalityFactor: number;
}

function computeMice(i: MiceInputs) {
  const groupsPerYear = Math.round(i.avgRfqPerMonth * 12 * i.conversionRate);
  const roomNightsPerYear = groupsPerYear * i.avgGroupSize * i.avgGroupNights / 2;
  const roomRevenuePerYear = Math.round(roomNightsPerYear * i.adrGroup * i.seasonalityFactor);

  const totalPax = groupsPerYear * i.avgGroupSize;
  const fbRevenuePerYear = Math.round(
    totalPax * i.fbCaptureRate * i.avgFbPerPax * i.avgGroupNights,
  );

  const meetingRoomRevenue = Math.round(
    groupsPerYear * i.meetingRoomHireFee * i.meetingRoomDaysPerGroup,
  );

  const totalRevenue = roomRevenuePerYear + fbRevenuePerYear + meetingRoomRevenue;

  const gopRooms = Math.round(roomRevenuePerYear * 0.45);
  const gopFb = Math.round(fbRevenuePerYear * 0.25);
  const gopMeeting = Math.round(meetingRoomRevenue * 0.75);
  const totalGop = gopRooms + gopFb + gopMeeting;

  const revPerGroup = groupsPerYear > 0 ? totalRevenue / groupsPerYear : 0;
  const avgGroupSpend = groupsPerYear > 0 ? totalRevenue / groupsPerYear : 0;

  const roomNightsCapacity = i.nbRooms * 365;
  const miceShareOfRoomNights = roomNightsCapacity > 0 ? roomNightsPerYear / roomNightsCapacity : 0;

  return {
    groupsPerYear, roomNightsPerYear, roomRevenuePerYear,
    totalPax, fbRevenuePerYear, meetingRoomRevenue, totalRevenue,
    gopRooms, gopFb, gopMeeting, totalGop, gopMargin: totalRevenue > 0 ? totalGop / totalRevenue : 0,
    revPerGroup, avgGroupSpend, miceShareOfRoomNights,
  };
}

export default function MicePage() {
  const t = useTranslations("hotelMice");
  const locale = useLocale();
  const numLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const [nbRooms, setNbRooms] = useState(80);
  const [nbMeetingRooms, setNbMeetingRooms] = useState(3);
  const [avgRfqPerMonth, setAvgRfqPerMonth] = useState(25);
  const [conversionRate, setConversionRate] = useState(0.25);
  const [avgGroupSize, setAvgGroupSize] = useState(20);
  const [avgGroupNights, setAvgGroupNights] = useState(2);
  const [adrGroup, setAdrGroup] = useState(135);
  const [fbCaptureRate, setFbCaptureRate] = useState(0.70);
  const [avgFbPerPax, setAvgFbPerPax] = useState(55);
  const [meetingRoomHireFee, setMeetingRoomHireFee] = useState(350);
  const [meetingRoomDaysPerGroup, setMeetingRoomDaysPerGroup] = useState(1.5);
  const [seasonalityFactor, setSeasonalityFactor] = useState(1.0);

  const result = useMemo(() => computeMice({
    nbRooms, nbMeetingRooms, avgRfqPerMonth, conversionRate, avgGroupSize,
    avgGroupNights, adrGroup, fbCaptureRate, avgFbPerPax,
    meetingRoomHireFee, meetingRoomDaysPerGroup, seasonalityFactor,
  }), [nbRooms, nbMeetingRooms, avgRfqPerMonth, conversionRate, avgGroupSize, avgGroupNights, adrGroup, fbCaptureRate, avgFbPerPax, meetingRoomHireFee, meetingRoomDaysPerGroup, seasonalityFactor]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 text-muted">{t("pageSubtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionHotel")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("inputRooms")} value={nbRooms} onChange={(v) => setNbRooms(Number(v))} />
                <InputField label={t("inputMeetingRooms")} value={nbMeetingRooms} onChange={(v) => setNbMeetingRooms(Number(v))} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionPipeline")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("inputRfq")} value={avgRfqPerMonth} onChange={(v) => setAvgRfqPerMonth(Number(v))} hint={t("inputRfqHint")} />
                <InputField label={t("inputConv")} value={Math.round(conversionRate * 100)} onChange={(v) => setConversionRate(Number(v) / 100)} suffix="%" hint={t("inputConvHint")} />
                <InputField label={t("inputGroupSize")} value={avgGroupSize} onChange={(v) => setAvgGroupSize(Number(v))} suffix={t("suffixPax")} />
                <InputField label={t("inputGroupNights")} value={avgGroupNights} onChange={(v) => setAvgGroupNights(Number(v))} />
                <InputField label={t("inputSeason")} value={seasonalityFactor} onChange={(v) => setSeasonalityFactor(Number(v))} hint={t("inputSeasonHint")} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionPricing")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("inputAdrGroup")} value={adrGroup} onChange={(v) => setAdrGroup(Number(v))} suffix={t("suffixPerNight")} hint={t("inputAdrGroupHint")} />
                <InputField label={t("inputFbCapture")} value={Math.round(fbCaptureRate * 100)} onChange={(v) => setFbCaptureRate(Number(v) / 100)} suffix="%" hint={t("inputFbCaptureHint")} />
                <InputField label={t("inputFbAvg")} value={avgFbPerPax} onChange={(v) => setAvgFbPerPax(Number(v))} suffix="€" hint={t("inputFbAvgHint")} />
                <InputField label={t("inputMeetFee")} value={meetingRoomHireFee} onChange={(v) => setMeetingRoomHireFee(Number(v))} suffix="€" />
                <InputField label={t("inputMeetDays")} value={meetingRoomDaysPerGroup} onChange={(v) => setMeetingRoomDaysPerGroup(Number(v))} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-700 p-8 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/70">{t("revenueBadge")}</div>
              <div className="mt-2 text-4xl font-bold">{formatEUR(result.totalRevenue)}</div>
              <div className="mt-1 text-sm text-white/70">
                {t("revenueDetail", { groups: result.groupsPerYear, pax: result.totalPax, gop: formatEUR(result.totalGop), margin: formatPct(result.gopMargin) })}
              </div>
            </div>

            <ResultPanel
              title={t("panelBreakdown")}
              lines={[
                { label: t("lineRooms"), value: formatEUR(result.roomRevenuePerYear), highlight: true },
                { label: t("lineFb"), value: formatEUR(result.fbRevenuePerYear), highlight: true },
                { label: t("lineMeeting"), value: formatEUR(result.meetingRoomRevenue), highlight: true },
                { label: t("lineTotal"), value: formatEUR(result.totalRevenue), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title={t("panelGop")}
              lines={[
                { label: t("lineGopRooms"), value: formatEUR(result.gopRooms) },
                { label: t("lineGopFb"), value: formatEUR(result.gopFb) },
                { label: t("lineGopMeeting"), value: formatEUR(result.gopMeeting) },
                { label: t("lineGopTotal"), value: `${formatEUR(result.totalGop)} (${formatPct(result.gopMargin)})`, highlight: true },
              ]}
            />

            <ResultPanel
              title={t("panelMetrics")}
              lines={[
                { label: t("metricGroups"), value: String(result.groupsPerYear) },
                { label: t("metricRoomNights"), value: result.roomNightsPerYear.toLocaleString(numLocale) },
                { label: t("metricShareNights"), value: formatPct(result.miceShareOfRoomNights) },
                { label: t("metricPaxTotal"), value: result.totalPax.toLocaleString(numLocale) },
                { label: t("metricRevPerGroup"), value: formatEUR(Math.round(result.revPerGroup)) },
              ]}
            />

            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold text-navy">{t("seasonTitle")}</h3>
              <p className="mt-0.5 text-xs text-muted mb-3">{t("seasonSubtitle")}</p>
              {(() => {
                const MICE_SEASONALITY = [
                  { month: t("monthJan"), idx: 80, label: t("seasonJan") },
                  { month: t("monthFeb"), idx: 95, label: t("seasonFeb") },
                  { month: t("monthMar"), idx: 115, label: t("seasonMar") },
                  { month: t("monthApr"), idx: 120, label: t("seasonApr") },
                  { month: t("monthMay"), idx: 125, label: t("seasonMay") },
                  { month: t("monthJun"), idx: 110, label: t("seasonJun") },
                  { month: t("monthJul"), idx: 55, label: t("seasonJul") },
                  { month: t("monthAug"), idx: 40, label: t("seasonAug") },
                  { month: t("monthSep"), idx: 115, label: t("seasonSep") },
                  { month: t("monthOct"), idx: 130, label: t("seasonOct") },
                  { month: t("monthNov"), idx: 115, label: t("seasonNov") },
                  { month: t("monthDec"), idx: 65, label: t("seasonDec") },
                ];
                const revenueByMonth = MICE_SEASONALITY.map((m) => ({
                  ...m,
                  revenue: Math.round(result.totalRevenue / 12 * (m.idx / 100)),
                }));
                return (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={revenueByMonth} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip
                        formatter={(v: unknown, name: unknown) => typeof v === "number" && name === "revenue" ? formatEUR(v) : "—"}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                        labelFormatter={(label: unknown, payload: unknown) => {
                          const arr = payload as Array<{ payload?: { label?: string } }> | undefined;
                          return `${label} · ${arr?.[0]?.payload?.label ?? ""}`;
                        }}
                      />
                      <ReferenceLine y={result.totalRevenue / 12} stroke="#b8860b" strokeDasharray="4 4" strokeWidth={1.5} />
                      <Bar dataKey="revenue" fill="#7c3aed" name={t("chartLegendRev")} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
              <p className="mt-2 text-[10px] text-muted">
                {t("seasonSource")}
              </p>
            </div>

            <AiAnalysisCard
              context={[
                `Modèle MICE — hôtel ${nbRooms} ch · ${nbMeetingRooms} salles`,
                `${avgRfqPerMonth} RFP/mois × ${(conversionRate * 100).toFixed(0)}% conversion = ${result.groupsPerYear} groupes/an`,
                `Groupe moyen: ${avgGroupSize} pax × ${avgGroupNights} nuits, ADR ${adrGroup}€`,
                `F&B capture ${(fbCaptureRate * 100).toFixed(0)}% × ${avgFbPerPax}€/pax/j`,
                `Saisonnalité: ${seasonalityFactor.toFixed(2)}×`,
                "",
                `Revenu total: ${formatEUR(result.totalRevenue)} (Rooms ${formatEUR(result.roomRevenuePerYear)}, F&B ${formatEUR(result.fbRevenuePerYear)}, Meeting ${formatEUR(result.meetingRoomRevenue)})`,
                `GOP: ${formatEUR(result.totalGop)} (${formatPct(result.gopMargin)})`,
                `MICE share room nights: ${formatPct(result.miceShareOfRoomNights)}`,
              ].join("\n")}
              prompt="Analyse ce modèle MICE hôtelier au Luxembourg. Livre : (1) réalisme taux conversion RFP vs benchmark LU (20-30% standard, 35%+ si compétitif, <15% si mal positionné), (2) optimisations revenu : améliorer F&B capture rate (plans forfaits demi-pension 70%→85%), upseller banqueting, packages équipement AV inclus, (3) positionnement compétitif vs hôtels Kirchberg/aéroport (corporate européen 10-40 pax), Luxembourg-Ville (smaller executive), Mondorf (events wellness), (4) saisonnalité à exploiter : sept-nov + mai-juin pics corporate, combler juillet-août via leisure group/mariage/famille, (5) calcul marge nette vs transient : les groupes à -20% ADR mais F&B capture 70% vs 30% transient peuvent être plus profitables sur le total revenue per guest. Référence HOTREC Luxembourg + HVS MICE reports."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
