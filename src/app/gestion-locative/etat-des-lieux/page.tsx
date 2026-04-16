"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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

const DEFAULT_SECTIONS: RoomSection[] = [
  { id: "general", name: "Général / accès", items: [
    { id: "cles", label: "Clés remises (nombre + trousseau)", state: "", notes: "" },
    { id: "boite_aux_lettres", label: "Boîte aux lettres + clé", state: "", notes: "" },
    { id: "interphone", label: "Interphone / digicode", state: "", notes: "" },
  ]},
  { id: "sejour", name: "Séjour / salon", items: [
    { id: "sol", label: "Revêtement sol", state: "", notes: "" },
    { id: "murs", label: "Murs et peinture", state: "", notes: "" },
    { id: "plafond", label: "Plafond", state: "", notes: "" },
    { id: "fenetres", label: "Fenêtres et menuiseries", state: "", notes: "" },
    { id: "volets", label: "Volets / stores", state: "", notes: "" },
    { id: "prises", label: "Prises électriques", state: "", notes: "" },
    { id: "luminaires", label: "Luminaires", state: "", notes: "" },
  ]},
  { id: "cuisine", name: "Cuisine", items: [
    { id: "meubles", label: "Meubles hauts et bas", state: "", notes: "" },
    { id: "plan_travail", label: "Plan de travail", state: "", notes: "" },
    { id: "evier", label: "Évier et robinetterie", state: "", notes: "" },
    { id: "hotte", label: "Hotte aspirante", state: "", notes: "" },
    { id: "plaques", label: "Plaques de cuisson", state: "", notes: "" },
    { id: "four", label: "Four / micro-ondes", state: "", notes: "" },
    { id: "frigo", label: "Réfrigérateur", state: "", notes: "" },
    { id: "lave_vaisselle", label: "Lave-vaisselle", state: "", notes: "" },
  ]},
  { id: "chambre1", name: "Chambre 1", items: [
    { id: "sol", label: "Revêtement sol", state: "", notes: "" },
    { id: "murs", label: "Murs et peinture", state: "", notes: "" },
    { id: "placards", label: "Placards intégrés", state: "", notes: "" },
    { id: "fenetres", label: "Fenêtres et volets", state: "", notes: "" },
  ]},
  { id: "sdb", name: "Salle de bains / WC", items: [
    { id: "sol", label: "Revêtement sol", state: "", notes: "" },
    { id: "faience", label: "Faïence et joints", state: "", notes: "" },
    { id: "lavabo", label: "Lavabo et robinetterie", state: "", notes: "" },
    { id: "douche", label: "Douche / baignoire", state: "", notes: "" },
    { id: "wc", label: "WC", state: "", notes: "" },
    { id: "seche_serviette", label: "Sèche-serviettes / radiateur", state: "", notes: "" },
    { id: "vmc", label: "VMC / aération", state: "", notes: "" },
  ]},
  { id: "chauffage", name: "Chauffage / énergie", items: [
    { id: "chaudiere", label: "Chaudière / PAC (état, entretien)", state: "", notes: "" },
    { id: "radiateurs", label: "Radiateurs", state: "", notes: "" },
    { id: "compteur_elec", label: "Compteur électrique (relevé)", state: "", notes: "" },
    { id: "compteur_gaz", label: "Compteur gaz (relevé)", state: "", notes: "" },
    { id: "compteur_eau", label: "Compteur eau (relevé)", state: "", notes: "" },
  ]},
  { id: "exterieur", name: "Extérieurs (balcon, terrasse, jardin, cave)", items: [
    { id: "balcon", label: "Balcon / terrasse", state: "", notes: "" },
    { id: "cave", label: "Cave", state: "", notes: "" },
    { id: "parking", label: "Parking / garage", state: "", notes: "" },
  ]},
];

const STATE_LABELS: Record<RoomItem["state"], { label: string; color: string }> = {
  "": { label: "—", color: "bg-gray-100 text-gray-500" },
  neuf: { label: "Neuf", color: "bg-emerald-100 text-emerald-800" },
  bon: { label: "Bon état", color: "bg-green-100 text-green-700" },
  usage: { label: "État d'usage", color: "bg-amber-100 text-amber-800" },
  a_remplacer: { label: "À remplacer / dégradé", color: "bg-rose-100 text-rose-800" },
};

// PDF styles
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
}

function EdlPdf({ meta, sections, notesGeneral, keysCount, waterMeter, elecMeter, gasMeter }: EdlPdfProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>État des lieux — {meta.type === "entree" ? "Entrée" : "Sortie"}</Text>
        <Text style={pdfStyles.subtitle}>
          {meta.lotName} · {meta.address} · {meta.date}
        </Text>
        <Text style={pdfStyles.subtitle}>
          Bailleur : {meta.bailleur} · Locataire : {meta.locataire}
        </Text>

        <Text style={pdfStyles.sectionTitle}>Clés et relevés compteurs</Text>
        <Text style={{ fontSize: 9 }}>Clés remises : {keysCount} · Eau : {waterMeter || "—"} · Électricité : {elecMeter || "—"} · Gaz : {gasMeter || "—"}</Text>

        {sections.map((sec) => (
          <View key={sec.id} wrap={false}>
            <Text style={pdfStyles.sectionTitle}>{sec.name}</Text>
            {sec.items.filter((it) => it.state || it.notes).map((it) => (
              <View key={it.id} style={pdfStyles.row}>
                <Text style={pdfStyles.label}>{it.label}</Text>
                <Text style={pdfStyles.state}>{STATE_LABELS[it.state].label}</Text>
                <Text style={pdfStyles.notes}>{it.notes || ""}</Text>
              </View>
            ))}
          </View>
        ))}

        {notesGeneral && (
          <>
            <Text style={pdfStyles.sectionTitle}>Observations générales</Text>
            <Text style={{ fontSize: 9 }}>{notesGeneral}</Text>
          </>
        )}

        <View style={pdfStyles.signBlock}>
          <View style={pdfStyles.signBox}>
            <Text>Le bailleur</Text>
            <Text style={{ marginTop: 2, fontSize: 8, color: "#475569" }}>{meta.bailleur}</Text>
          </View>
          <View style={pdfStyles.signBox}>
            <Text>Le locataire</Text>
            <Text style={{ marginTop: 2, fontSize: 8, color: "#475569" }}>{meta.locataire}</Text>
          </View>
        </View>

        <Text style={pdfStyles.footer}>
          État des lieux conforme à la loi modifiée du 21 septembre 2006 (art. 9) — document contradictoire entre bailleur et locataire
        </Text>
      </Page>
    </Document>
  );
}

export default function EtatDesLieuxPage() {
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
    const blob = await pdf(
      <EdlPdf
        meta={{ lotName, address, type, date, bailleur, locataire }}
        sections={sections}
        notesGeneral={notesGeneral}
        keysCount={keysCount}
        waterMeter={waterMeter}
        elecMeter={elecMeter}
        gasMeter={gasMeter}
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
        <Link href="/gestion-locative" className="text-xs text-muted hover:text-navy">&larr; Gestion locative</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">État des lieux (mobile-friendly)</h1>
          <p className="mt-1 text-sm text-muted">
            Checklist contradictoire conforme à l&apos;art. 9 de la loi du 21 septembre 2006 sur le bail d&apos;habitation LU.
            Optimisé pour saisie sur smartphone/tablette sur site.
          </p>
        </div>

        {/* Header / méta */}
        <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Type</label>
              <div className="flex rounded-lg border border-input-border overflow-hidden">
                {(["entree", "sortie"] as const).map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex-1 py-2 text-sm font-medium ${type === t ? "bg-navy text-white" : "bg-background text-muted hover:bg-slate-50"}`}>
                    {t === "entree" ? "Entrée" : "Sortie"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Nom du bien</label>
              <input type="text" value={lotName} onChange={(e) => setLotName(e.target.value)}
                placeholder="Ex: Appartement 2 rue de la Gare, Luxembourg"
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Adresse complète</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Bailleur</label>
              <input type="text" value={bailleur} onChange={(e) => setBailleur(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Locataire</label>
              <input type="text" value={locataire} onChange={(e) => setLocataire(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* Clés + compteurs */}
        <div className="mt-4 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy mb-3">Clés et relevés compteurs</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Nb clés</label>
              <input type="number" value={keysCount} onChange={(e) => setKeysCount(Number(e.target.value))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Compteur eau (m³)</label>
              <input type="text" value={waterMeter} onChange={(e) => setWaterMeter(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Compteur électrique (kWh)</label>
              <input type="text" value={elecMeter} onChange={(e) => setElecMeter(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Compteur gaz (m³)</label>
              <input type="text" value={gasMeter} onChange={(e) => setGasMeter(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 rounded-xl border border-card-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">{progress.done}/{progress.total} items évalués</span>
            <span className="font-medium text-navy">{progress.pct}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>

        {/* Navigation sections (scroll horizontal sur mobile) */}
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

        {/* Active section items */}
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
                    placeholder="Notes (ex: rayure 20cm plan de travail)"
                    className="mt-2 w-full rounded border border-card-border bg-transparent px-2 py-1 text-xs" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes générales */}
        <div className="mt-4 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <label className="block text-sm font-semibold text-navy mb-2">Observations générales</label>
          <textarea value={notesGeneral} onChange={(e) => setNotesGeneral(e.target.value)}
            rows={4}
            placeholder="Points particuliers, accords sur petites réparations à la charge du bailleur, etc."
            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={handleExportPDF}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            📄 Générer PDF contradictoire
          </button>
        </div>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Conforme à la loi modifiée du 21 septembre 2006 sur le bail à usage d&apos;habitation (art. 9 : état des lieux obligatoire, établi contradictoirement).
          En l&apos;absence d&apos;état des lieux d&apos;entrée, le locataire est présumé avoir reçu le logement en bon état (art. 1731 Code civil LU).
        </div>
      </div>
    </div>
  );
}
