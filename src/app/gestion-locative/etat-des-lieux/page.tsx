"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface RoomItem {
  id: string;
  label: string;
  state: "neuf" | "bon" | "usage" | "a_remplacer" | "";
  notes: string;
}

interface RoomSection {
  id: string;
  name: string;
  items: RoomItem[];
}

const pdfStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#0B2447" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  subtitle: { fontSize: 10, color: "#475569", marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginTop: 10, marginBottom: 4, color: "#1B2A4A" },
  row: { flexDirection: "row", borderBottom: "0.5 solid #e5e7eb", paddingVertical: 3 },
  label: { width: "50%", fontSize: 9 },
  state: { width: "20%", fontSize: 9, fontWeight: "bold" },
  notes: { width: "30%", fontSize: 8, color: "#475569" },
  signBlock: { marginTop: 16, flexDirection: "row", justifyContent: "space-between" },
  signBox: { width: "45%", borderTop: "1 solid #334155", paddingTop: 4, fontSize: 9 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#6B7280", textAlign: "center" },
});

interface EdlPdfProps {
  meta: { lotName: string; address: string; type: "entree" | "sortie"; date: string; bailleur: string; locataire: string };
  sections: RoomSection[];
  notesGeneral: string;
  keysCount: number;
  waterMeter: string;
  elecMeter: string;
  gasMeter: string;
  stateLabels: Record<string, string>;
  labels: {
    title: string;
    landlord: string;
    tenant: string;
    keysMeters: string;
    obsGeneral: string;
    signLandlord: string;
    signTenant: string;
    footer: string;
  };
}

function EdlPdf({ meta, sections, notesGeneral, keysCount, waterMeter, elecMeter, gasMeter, stateLabels, labels }: EdlPdfProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{labels.title}</Text>
        <Text style={pdfStyles.subtitle}>
          {meta.lotName} · {meta.address} · {meta.date}
        </Text>
        <Text style={pdfStyles.subtitle}>
          {labels.landlord} · {labels.tenant}
        </Text>

        <Text style={pdfStyles.sectionTitle}>{labels.keysMeters.split(":")[0].trim()}</Text>
        <Text style={{ fontSize: 9 }}>{labels.keysMeters}</Text>
        {void keysCount /* referenced via labels */}{void waterMeter}{void elecMeter}{void gasMeter}

        {sections.map((sec) => (
          <View key={sec.id} wrap={false}>
            <Text style={pdfStyles.sectionTitle}>{sec.name}</Text>
            {sec.items.filter((it) => it.state || it.notes).map((it) => (
              <View key={it.id} style={pdfStyles.row}>
                <Text style={pdfStyles.label}>{it.label}</Text>
                <Text style={pdfStyles.state}>{stateLabels[it.state] ?? "—"}</Text>
                <Text style={pdfStyles.notes}>{it.notes || ""}</Text>
              </View>
            ))}
          </View>
        ))}

        {notesGeneral && (
          <>
            <Text style={pdfStyles.sectionTitle}>{labels.obsGeneral}</Text>
            <Text style={{ fontSize: 9 }}>{notesGeneral}</Text>
          </>
        )}

        <View style={pdfStyles.signBlock}>
          <View style={pdfStyles.signBox}>
            <Text>{labels.signLandlord}</Text>
            <Text style={{ marginTop: 2, fontSize: 8, color: "#475569" }}>{meta.bailleur}</Text>
          </View>
          <View style={pdfStyles.signBox}>
            <Text>{labels.signTenant}</Text>
            <Text style={{ marginTop: 2, fontSize: 8, color: "#475569" }}>{meta.locataire}</Text>
          </View>
        </View>

        <Text style={pdfStyles.footer}>{labels.footer}</Text>
      </Page>
    </Document>
  );
}

export default function EtatDesLieuxPage() {
  const t = useTranslations("glEdl");

  const DEFAULT_SECTIONS: RoomSection[] = [
    { id: "general", name: t("sectionGeneral"), items: [
      { id: "cles", label: t("itemCles"), state: "", notes: "" },
      { id: "boite_aux_lettres", label: t("itemBoite"), state: "", notes: "" },
      { id: "interphone", label: t("itemInterphone"), state: "", notes: "" },
    ]},
    { id: "sejour", name: t("sectionSejour"), items: [
      { id: "sol", label: t("itemSol"), state: "", notes: "" },
      { id: "murs", label: t("itemMurs"), state: "", notes: "" },
      { id: "plafond", label: t("itemPlafond"), state: "", notes: "" },
      { id: "fenetres", label: t("itemFenetres"), state: "", notes: "" },
      { id: "volets", label: t("itemVolets"), state: "", notes: "" },
      { id: "prises", label: t("itemPrises"), state: "", notes: "" },
      { id: "luminaires", label: t("itemLuminaires"), state: "", notes: "" },
    ]},
    { id: "cuisine", name: t("sectionCuisine"), items: [
      { id: "meubles", label: t("itemMeubles"), state: "", notes: "" },
      { id: "plan_travail", label: t("itemPlanTravail"), state: "", notes: "" },
      { id: "evier", label: t("itemEvier"), state: "", notes: "" },
      { id: "hotte", label: t("itemHotte"), state: "", notes: "" },
      { id: "plaques", label: t("itemPlaques"), state: "", notes: "" },
      { id: "four", label: t("itemFour"), state: "", notes: "" },
      { id: "frigo", label: t("itemFrigo"), state: "", notes: "" },
      { id: "lave_vaisselle", label: t("itemLaveVaisselle"), state: "", notes: "" },
    ]},
    { id: "chambre1", name: t("sectionChambre1"), items: [
      { id: "sol", label: t("itemSol"), state: "", notes: "" },
      { id: "murs", label: t("itemMurs"), state: "", notes: "" },
      { id: "placards", label: t("itemPlacards"), state: "", notes: "" },
      { id: "fenetres", label: t("itemFenetresVolets"), state: "", notes: "" },
    ]},
    { id: "sdb", name: t("sectionSdb"), items: [
      { id: "sol", label: t("itemSol"), state: "", notes: "" },
      { id: "faience", label: t("itemFaience"), state: "", notes: "" },
      { id: "lavabo", label: t("itemLavabo"), state: "", notes: "" },
      { id: "douche", label: t("itemDouche"), state: "", notes: "" },
      { id: "wc", label: t("itemWc"), state: "", notes: "" },
      { id: "seche_serviette", label: t("itemSecheServiette"), state: "", notes: "" },
      { id: "vmc", label: t("itemVmc"), state: "", notes: "" },
    ]},
    { id: "chauffage", name: t("sectionChauffage"), items: [
      { id: "chaudiere", label: t("itemChaudiere"), state: "", notes: "" },
      { id: "radiateurs", label: t("itemRadiateurs"), state: "", notes: "" },
      { id: "compteur_elec", label: t("itemCompteurElec"), state: "", notes: "" },
      { id: "compteur_gaz", label: t("itemCompteurGaz"), state: "", notes: "" },
      { id: "compteur_eau", label: t("itemCompteurEau"), state: "", notes: "" },
    ]},
    { id: "exterieur", name: t("sectionExterieur"), items: [
      { id: "balcon", label: t("itemBalcon"), state: "", notes: "" },
      { id: "cave", label: t("itemCave"), state: "", notes: "" },
      { id: "parking", label: t("itemParking"), state: "", notes: "" },
    ]},
  ];

  const STATE_LABELS: Record<RoomItem["state"], { label: string; color: string }> = {
    "": { label: t("stateEmpty"), color: "bg-gray-100 text-gray-500" },
    neuf: { label: t("stateNeuf"), color: "bg-emerald-100 text-emerald-800" },
    bon: { label: t("stateBon"), color: "bg-green-100 text-green-700" },
    usage: { label: t("stateUsage"), color: "bg-amber-100 text-amber-800" },
    a_remplacer: { label: t("stateARemplacer"), color: "bg-rose-100 text-rose-800" },
  };

  const [sections, setSections] = useState<RoomSection[]>(DEFAULT_SECTIONS);
  const [lotName, setLotName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<"entree" | "sortie">("entree");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bailleur, setBailleur] = useState("");
  const [locataire, setLocataire] = useState("");
  const [notesGeneral, setNotesGeneral] = useState("");
  const [keysCount, setKeysCount] = useState(2);
  const [waterMeter, setWaterMeter] = useState("");
  const [elecMeter, setElecMeter] = useState("");
  const [gasMeter, setGasMeter] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(DEFAULT_SECTIONS[0].id);

  const activeSection = useMemo(() => sections.find((s) => s.id === activeSectionId), [sections, activeSectionId]);

  const setItem = (sectionId: string, itemId: string, patch: Partial<RoomItem>) => {
    setSections((prev) => prev.map((s) =>
      s.id !== sectionId ? s : { ...s, items: s.items.map((it) => it.id !== itemId ? it : { ...it, ...patch }) },
    ));
  };

  const progress = useMemo(() => {
    const all = sections.flatMap((s) => s.items);
    const done = all.filter((it) => it.state !== "").length;
    return { done, total: all.length, pct: all.length > 0 ? Math.round((done / all.length) * 100) : 0 };
  }, [sections]);

  const handleExportPDF = async () => {
    const stateLabelsFlat: Record<string, string> = {
      "": t("stateEmpty"),
      neuf: t("stateNeuf"),
      bon: t("stateBon"),
      usage: t("stateUsage"),
      a_remplacer: t("stateARemplacer"),
    };
    const labels = {
      title: type === "entree" ? t("pdfTitleEntree") : t("pdfTitleSortie"),
      landlord: t("pdfBailleur", { name: bailleur }),
      tenant: t("pdfLocataire", { name: locataire }),
      keysMeters: t("pdfKeysMeters", { keys: keysCount, water: waterMeter || "—", elec: elecMeter || "—", gas: gasMeter || "—" }),
      obsGeneral: t("pdfObsGeneral"),
      signLandlord: t("pdfSignLandlord"),
      signTenant: t("pdfSignTenant"),
      footer: t("pdfFooter"),
    };
    const blob = await pdf(
      <EdlPdf
        meta={{ lotName, address, type, date, bailleur, locataire }}
        sections={sections}
        notesGeneral={notesGeneral}
        keysCount={keysCount}
        waterMeter={waterMeter}
        elecMeter={elecMeter}
        gasMeter={gasMeter}
        stateLabels={stateLabelsFlat}
        labels={labels}
      />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `etat-des-lieux-${type}-${safe(lotName || "bien")}-${date}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background min-h-screen py-6 sm:py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link href="/gestion-locative" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("pageSubtitle")}</p>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("typeLabel")}</label>
              <div className="flex rounded-lg border border-input-border overflow-hidden">
                {(["entree", "sortie"] as const).map((opt) => (
                  <button key={opt} onClick={() => setType(opt)}
                    className={`flex-1 py-2 text-sm font-medium ${type === opt ? "bg-navy text-white" : "bg-background text-muted hover:bg-slate-50"}`}>
                    {opt === "entree" ? t("typeEntree") : t("typeSortie")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("dateLabel")}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("nameLabel")}</label>
              <input type="text" value={lotName} onChange={(e) => setLotName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("addressLabel")}</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("landlordLabel")}</label>
              <input type="text" value={bailleur} onChange={(e) => setBailleur(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("tenantLabel")}</label>
              <input type="text" value={locataire} onChange={(e) => setLocataire(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy mb-3">{t("metersTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("nbKeysLabel")}</label>
              <input type="number" value={keysCount} onChange={(e) => setKeysCount(Number(e.target.value))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("waterLabel")}</label>
              <input type="text" value={waterMeter} onChange={(e) => setWaterMeter(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("elecLabel")}</label>
              <input type="text" value={elecMeter} onChange={(e) => setElecMeter(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("gasLabel")}</label>
              <input type="text" value={gasMeter} onChange={(e) => setGasMeter(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-card-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">{t("progressDone", { done: progress.done, total: progress.total })}</span>
            <span className="font-medium text-navy">{progress.pct}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {sections.map((s) => {
            const filled = s.items.filter((it) => it.state).length;
            const total = s.items.length;
            return (
              <button key={s.id} onClick={() => setActiveSectionId(s.id)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap ${
                  activeSectionId === s.id ? "border-navy bg-navy text-white" : "border-card-border bg-card text-slate hover:bg-slate-50"
                }`}>
                {s.name} <span className="ml-1 opacity-70">{filled}/{total}</span>
              </button>
            );
          })}
        </div>

        {activeSection && (
          <div className="mt-4 rounded-xl border border-card-border bg-card">
            <div className="border-b border-card-border bg-background px-4 py-2">
              <h2 className="text-sm font-semibold text-navy">{activeSection.name}</h2>
            </div>
            <div className="divide-y divide-card-border/50">
              {activeSection.items.map((item) => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-navy flex-1">{item.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATE_LABELS[item.state].color}`}>
                      {STATE_LABELS[item.state].label}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(["neuf", "bon", "usage", "a_remplacer"] as const).map((s) => (
                      <button key={s} onClick={() => setItem(activeSection.id, item.id, { state: s })}
                        className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                          item.state === s ? STATE_LABELS[s].color + " ring-2 ring-navy/20" : "border border-card-border bg-background text-muted"
                        }`}>
                        {STATE_LABELS[s].label}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={item.notes}
                    onChange={(e) => setItem(activeSection.id, item.id, { notes: e.target.value })}
                    placeholder={t("notesPlaceholder")}
                    className="mt-2 w-full rounded border border-card-border bg-transparent px-2 py-1 text-xs" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <label className="block text-sm font-semibold text-navy mb-2">{t("generalNotesLabel")}</label>
          <textarea value={notesGeneral} onChange={(e) => setNotesGeneral(e.target.value)}
            rows={4}
            placeholder={t("generalNotesPlaceholder")}
            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={handleExportPDF}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {t("exportBtn")}
          </button>
        </div>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          {t("legalBody")}
        </div>
      </div>
    </div>
  );
}
