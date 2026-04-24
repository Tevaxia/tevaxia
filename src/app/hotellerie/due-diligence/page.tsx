"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import AiAnalysisCard from "@/components/AiAnalysisCard";

interface DDItem {
  id: string;
  label: string;
  category: "technique" | "commercial" | "juridique" | "fiscal" | "esg" | "rh";
  critical: boolean;
  status: "ok" | "nc" | "na" | "todo";
  notes: string;
}

const DD_STRUCTURE: Array<{ id: string; category: DDItem["category"]; critical: boolean }> = [
  { id: "t1", category: "technique", critical: true },
  { id: "t2", category: "technique", critical: true },
  { id: "t3", category: "technique", critical: true },
  { id: "t4", category: "technique", critical: false },
  { id: "t5", category: "technique", critical: true },
  { id: "t6", category: "technique", critical: false },
  { id: "t7", category: "technique", critical: false },
  { id: "t8", category: "technique", critical: false },
  { id: "t9", category: "technique", critical: true },
  { id: "t10", category: "technique", critical: false },
  { id: "c1", category: "commercial", critical: true },
  { id: "c2", category: "commercial", critical: true },
  { id: "c3", category: "commercial", critical: true },
  { id: "c4", category: "commercial", critical: false },
  { id: "c5", category: "commercial", critical: false },
  { id: "c6", category: "commercial", critical: false },
  { id: "c7", category: "commercial", critical: false },
  { id: "c8", category: "commercial", critical: false },
  { id: "j1", category: "juridique", critical: true },
  { id: "j2", category: "juridique", critical: true },
  { id: "j3", category: "juridique", critical: false },
  { id: "j4", category: "juridique", critical: true },
  { id: "j5", category: "juridique", critical: true },
  { id: "j6", category: "juridique", critical: true },
  { id: "j7", category: "juridique", critical: true },
  { id: "j8", category: "juridique", critical: false },
  { id: "f1", category: "fiscal", critical: true },
  { id: "f2", category: "fiscal", critical: false },
  { id: "f3", category: "fiscal", critical: true },
  { id: "f4", category: "fiscal", critical: true },
  { id: "f5", category: "fiscal", critical: true },
  { id: "f6", category: "fiscal", critical: false },
  { id: "e1", category: "esg", critical: true },
  { id: "e2", category: "esg", critical: true },
  { id: "e3", category: "esg", critical: false },
  { id: "e4", category: "esg", critical: false },
  { id: "e5", category: "esg", critical: false },
  { id: "e6", category: "esg", critical: false },
  { id: "e7", category: "esg", critical: false },
  { id: "e8", category: "esg", critical: false },
  { id: "r1", category: "rh", critical: true },
  { id: "r2", category: "rh", critical: false },
  { id: "r3", category: "rh", critical: true },
  { id: "r4", category: "rh", critical: false },
  { id: "r5", category: "rh", critical: true },
  { id: "r6", category: "rh", critical: true },
  { id: "r7", category: "rh", critical: false },
  { id: "r8", category: "rh", critical: false },
  { id: "r9", category: "rh", critical: false },
  { id: "r10", category: "rh", critical: false },
];

const CAT_COLORS: Record<DDItem["category"], string> = {
  technique: "bg-blue-100 text-blue-800",
  commercial: "bg-emerald-100 text-emerald-800",
  juridique: "bg-purple-100 text-purple-800",
  fiscal: "bg-amber-100 text-amber-800",
  esg: "bg-green-100 text-green-800",
  rh: "bg-rose-100 text-rose-800",
};

const pdfStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#0B2447" },
  title: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginTop: 10, marginBottom: 4, color: "#1B2A4A" },
  row: { flexDirection: "row", borderBottom: "0.5 solid #e5e7eb", paddingVertical: 2 },
  label: { width: "60%", fontSize: 8 },
  status: { width: "15%", fontSize: 8, fontWeight: "bold" },
  notes: { width: "25%", fontSize: 7, color: "#475569" },
});

function DdPdf({ hotelName, items, labels }: { hotelName: string; items: DDItem[]; labels: { title: string; dateLine: string; categoryLabels: Record<DDItem["category"], string>; catPoints: (n: number) => string; statusNa: string; noNotes: string } }) {
  const byCategory = Object.keys(CAT_COLORS) as DDItem["category"][];
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{labels.title}</Text>
        <Text style={{ fontSize: 9, marginBottom: 10 }}>{labels.dateLine}</Text>
        {byCategory.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          if (catItems.length === 0) return null;
          return (
            <View key={cat} wrap={false}>
              <Text style={pdfStyles.sectionTitle}>{labels.categoryLabels[cat]} ({labels.catPoints(catItems.length)})</Text>
              {catItems.map((i) => (
                <View key={i.id} style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>{i.critical ? "★ " : ""}{i.label}</Text>
                  <Text style={pdfStyles.status}>
                    {i.status === "ok" ? "OK" : i.status === "nc" ? "NC" : i.status === "na" ? labels.statusNa : "TODO"}
                  </Text>
                  <Text style={pdfStyles.notes}>{i.notes || labels.noNotes}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}

export default function DueDiligencePage() {
  const t = useTranslations("hotelDd");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const [hotelName, setHotelName] = useState("");
  const [items, setItems] = useState<DDItem[]>(
    DD_STRUCTURE.map((it) => ({ ...it, status: "todo" as const, notes: "", label: t(`items.${it.id}`) })),
  );

  const CATEGORY_LABELS: Record<DDItem["category"], string> = {
    technique: t("catTechnique"),
    commercial: t("catCommercial"),
    juridique: t("catJuridique"),
    fiscal: t("catFiscal"),
    esg: t("catEsg"),
    rh: t("catRh"),
  };

  const progress = useMemo(() => {
    const done = items.filter((it) => it.status !== "todo").length;
    const ok = items.filter((it) => it.status === "ok").length;
    const nc = items.filter((it) => it.status === "nc").length;
    const criticalNc = items.filter((it) => it.critical && it.status === "nc").length;
    return { total: items.length, done, ok, nc, criticalNc, pct: (done / items.length) * 100 };
  }, [items]);

  const setItem = (id: string, patch: Partial<DDItem>) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...patch } : it));
  };

  const downloadPdf = async () => {
    const labels = {
      title: t("pdfTitle", { name: hotelName || t("defaultHotel") }),
      dateLine: t("pdfDate", { date: new Date().toLocaleDateString(dateLocale) }),
      categoryLabels: CATEGORY_LABELS,
      catPoints: (n: number) => t("catPoints", { n }),
      statusNa: t("statusNa"),
      noNotes: t("pdfNoNotes"),
    };
    const blob = await pdf(<DdPdf hotelName={hotelName || t("defaultHotel")} items={items} labels={labels} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `due-diligence-${(hotelName || "hotel").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 text-muted">{t("pageSubtitle")}</p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <input type="text" placeholder={t("hotelNamePlaceholder")} value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
            className="flex-1 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          <button onClick={downloadPdf}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {t("exportBtn")}
          </button>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">{t("progress")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{progress.pct.toFixed(0)}%</div>
            <div className="text-xs text-muted">{progress.done}/{progress.total}</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs text-emerald-700">{t("kpiOk")}</div>
            <div className="mt-1 text-2xl font-bold text-emerald-800">{progress.ok}</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-xs text-rose-700">{t("kpiNc")}</div>
            <div className="mt-1 text-2xl font-bold text-rose-800">{progress.nc}</div>
          </div>
          <div className="rounded-xl border border-rose-300 bg-rose-100 p-4">
            <div className="text-xs text-rose-800">{t("kpiCriticalNc")}</div>
            <div className="mt-1 text-2xl font-bold text-rose-900">{progress.criticalNc}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">{t("kpiTodo")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{progress.total - progress.done}</div>
          </div>
        </div>

        {(Object.keys(CATEGORY_LABELS) as DDItem["category"][]).map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          return (
            <div key={cat} className="mb-6 rounded-xl border border-card-border bg-card overflow-hidden">
              <div className={`px-4 py-2 ${CAT_COLORS[cat]} border-b border-card-border`}>
                <span className="text-sm font-semibold">{CATEGORY_LABELS[cat]} ({t("catPoints", { n: catItems.length })})</span>
              </div>
              <div className="divide-y divide-card-border/50">
                {catItems.map((it) => (
                  <div key={it.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-sm text-navy">
                          {it.critical && <span className="text-rose-600 mr-1">★</span>}
                          {it.label}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {(["ok", "nc", "na"] as const).map((s) => (
                          <button key={s} onClick={() => setItem(it.id, { status: it.status === s ? "todo" : s })}
                            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                              it.status === s
                                ? s === "ok" ? "bg-emerald-600 text-white" : s === "nc" ? "bg-rose-600 text-white" : "bg-slate-500 text-white"
                                : "border border-card-border text-muted"
                            }`}>
                            {s === "ok" ? t("kpiOk") : s === "nc" ? "NC" : t("statusNa")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input type="text" value={it.notes}
                      onChange={(e) => setItem(it.id, { notes: e.target.value })}
                      placeholder={t("notesPlaceholder")}
                      className="mt-1.5 w-full rounded border border-card-border/50 bg-transparent px-2 py-1 text-[11px]" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <AiAnalysisCard
          context={[
            `Due diligence hôtelière — ${hotelName || "Hôtel"}`,
            `Progrès: ${progress.done}/${progress.total} (${progress.pct.toFixed(0)}%)`,
            `OK: ${progress.ok} · NC: ${progress.nc} · ★ critiques NC: ${progress.criticalNc}`,
            "",
            `Items critiques NC:`,
            ...items.filter((i) => i.critical && i.status === "nc").map((i) => `  [${i.category.toUpperCase()}] ${i.label} — ${i.notes || "pas de note"}`),
            "",
            `Items NC non-critiques:`,
            ...items.filter((i) => !i.critical && i.status === "nc").slice(0, 10).map((i) => `  [${i.category}] ${i.label}`),
          ].join("\n")}
          prompt="Analyse cette due diligence hôtelière Luxembourg. Livre : (1) synthèse du risque global (feu vert / orange / rouge) en fonction des ★ critiques NC, (2) top 3 des points à sécuriser AVANT signature (LOI non-binding / SPA), (3) conditions suspensives recommandées, (4) impact probable sur le prix (décote/escrow/warranty selon gravité), (5) recommandation d'avancement de la transaction : go / go-conditionnel / stop. Référence HVS / Cushman & Wakefield Hospitality standards. Concret pour un investisseur/banquier."
        />
      </div>
    </div>
  );
}
