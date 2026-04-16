"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import AiDraftButton from "@/components/AiDraftButton";

// ============================================================
// TEGOVA EVS 2025 — Checklist d'inspection terrain
// ============================================================
// Section → items avec statut OK/NC/NA, notes et horodatage.
// Sauvegardé en localStorage pour usage offline.

interface CheckItem {
  id: string;
  labelKey: string;
}

interface CheckSection {
  id: string;
  titleKey: string;
  items: CheckItem[];
}

const CHECKLIST: CheckSection[] = [
  {
    id: "identification",
    titleKey: "sectionIdentification",
    items: [
      { id: "adresse", labelKey: "checkAdresse" },
      { id: "cadastre", labelKey: "checkCadastre" },
      { id: "acces", labelKey: "checkAcces" },
      { id: "proprietaire", labelKey: "checkProprietaire" },
      { id: "type_bien", labelKey: "checkTypeBien" },
    ],
  },
  {
    id: "environnement",
    titleKey: "sectionEnvironnement",
    items: [
      { id: "quartier", labelKey: "checkQuartier" },
      { id: "transports", labelKey: "checkTransports" },
      { id: "commerces", labelKey: "checkCommerces" },
      { id: "nuisances", labelKey: "checkNuisances" },
      { id: "zone_inondable", labelKey: "checkZoneInondable" },
      { id: "plu_pad", labelKey: "checkPluPad" },
    ],
  },
  {
    id: "exterieur",
    titleKey: "sectionExterieur",
    items: [
      { id: "facade", labelKey: "checkFacade" },
      { id: "toiture", labelKey: "checkToiture" },
      { id: "menuiseries_ext", labelKey: "checkMenuiseriesExt" },
      { id: "parties_communes", labelKey: "checkPartiesCommunes" },
      { id: "parking", labelKey: "checkParking" },
      { id: "espaces_verts", labelKey: "checkEspacesVerts" },
    ],
  },
  {
    id: "interieur",
    titleKey: "sectionInterieur",
    items: [
      { id: "surface", labelKey: "checkSurface" },
      { id: "distribution", labelKey: "checkDistribution" },
      { id: "sols", labelKey: "checkSols" },
      { id: "murs", labelKey: "checkMurs" },
      { id: "menuiseries_int", labelKey: "checkMenuiseriesInt" },
      { id: "sdb_cuisine", labelKey: "checkSdbCuisine" },
      { id: "electricite", labelKey: "checkElectricite" },
      { id: "plomberie", labelKey: "checkPlomberie" },
      { id: "chauffage", labelKey: "checkChauffage" },
      { id: "ventilation", labelKey: "checkVentilation" },
    ],
  },
  {
    id: "energetique",
    titleKey: "sectionEnergetique",
    items: [
      { id: "cpe", labelKey: "checkCpe" },
      { id: "classe_energie", labelKey: "checkClasseEnergie" },
      { id: "classe_isolation", labelKey: "checkClasseIsolation" },
      { id: "type_vitrage", labelKey: "checkTypeVitrage" },
      { id: "isolation", labelKey: "checkIsolation" },
      { id: "panneaux", labelKey: "checkPanneaux" },
    ],
  },
  {
    id: "juridique",
    titleKey: "sectionJuridique",
    items: [
      { id: "titre_propriete", labelKey: "checkTitrePropriete" },
      { id: "servitudes", labelKey: "checkServitudes" },
      { id: "reglement_copro", labelKey: "checkReglementCopro" },
      { id: "charges_copro", labelKey: "checkChargesCopro" },
      { id: "travaux_votes", labelKey: "checkTravauxVotes" },
      { id: "bail_en_cours", labelKey: "checkBailEnCours" },
    ],
  },
  {
    id: "photos",
    titleKey: "sectionPhotos",
    items: [
      { id: "photo_facade", labelKey: "checkPhotoFacade" },
      { id: "photo_rue", labelKey: "checkPhotoRue" },
      { id: "photo_sejour", labelKey: "checkPhotoSejour" },
      { id: "photo_cuisine", labelKey: "checkPhotoCuisine" },
      { id: "photo_sdb", labelKey: "checkPhotoSdb" },
      { id: "photo_chambres", labelKey: "checkPhotoChambres" },
      { id: "photo_exterieur", labelKey: "checkPhotoExterieur" },
      { id: "photo_defauts", labelKey: "checkPhotoDefauts" },
    ],
  },
];

type ItemStatus = "pending" | "ok" | "nc" | "na";

interface InspectionData {
  id: string;
  address: string;
  inspector: string;
  date: string;
  startTime: string;
  endTime: string;
  items: Record<string, { status: ItemStatus; note: string }>;
  generalNotes: string;
}

const STORAGE_KEY = "tevaxia_inspection_draft";

function loadDraft(): InspectionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(data: InspectionData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId(): string {
  return `INS-${Date.now().toString(36).toUpperCase()}`;
}

function emptyInspection(): InspectionData {
  const items: Record<string, { status: ItemStatus; note: string }> = {};
  for (const section of CHECKLIST) {
    for (const item of section.items) {
      items[item.id] = { status: "pending", note: "" };
    }
  }
  return {
    id: generateId(),
    address: "",
    inspector: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: new Date().toTimeString().slice(0, 5),
    endTime: "",
    items,
    generalNotes: "",
  };
}

export function InspectionClient() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("inspectionTegova");

  const [data, setData] = useState<InspectionData>(emptyInspection);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft) setData(draft);
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<InspectionData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      saveDraft(next);
      return next;
    });
  }, []);

  const setItemStatus = useCallback((itemId: string, status: ItemStatus) => {
    setData((prev) => {
      const next = {
        ...prev,
        items: { ...prev.items, [itemId]: { ...prev.items[itemId], status } },
      };
      saveDraft(next);
      return next;
    });
  }, []);

  const setItemNote = useCallback((itemId: string, note: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        items: { ...prev.items, [itemId]: { ...prev.items[itemId], note } },
      };
      saveDraft(next);
      return next;
    });
  }, []);

  const handleReset = () => {
    if (!confirm(t("confirmReset"))) return;
    const fresh = emptyInspection();
    setData(fresh);
    saveDraft(fresh);
  };

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inspection-${data.id}-${data.date}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    let text = `${t("exportHeader")}\n`;
    text += `${"=".repeat(60)}\n\n`;
    text += `${t("exportReference")} : ${data.id}\n`;
    text += `${t("exportAdresse")} : ${data.address || "—"}\n`;
    text += `${t("exportInspecteur")} : ${data.inspector || "—"}\n`;
    text += `${t("exportDate")} : ${data.date} · ${data.startTime || "—"} → ${data.endTime || "—"}\n\n`;

    for (const section of CHECKLIST) {
      text += `\n${t(section.titleKey as Parameters<typeof t>[0])}\n${"-".repeat(50)}\n`;
      for (const item of section.items) {
        const d = data.items[item.id];
        const statusLabel = d?.status === "ok" ? t("exportStatusOk") : d?.status === "nc" ? t("exportStatusNc") : d?.status === "na" ? t("exportStatusNa") : t("exportStatusPending");
        text += `  [${statusLabel}] ${t(item.labelKey as Parameters<typeof t>[0])}`;
        if (d?.note) text += ` · ${t("exportNote")} ${d.note}`;
        text += "\n";
      }
    }

    if (data.generalNotes) {
      text += `\n${t("exportNotesGenerales")}\n${"-".repeat(50)}\n${data.generalNotes}\n`;
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inspection-${data.id}-${data.date}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!loaded) return null;

  const allItems = CHECKLIST.flatMap((s) => s.items);
  const completed = allItems.filter((i) => data.items[i.id]?.status !== "pending").length;
  const okCount = allItems.filter((i) => data.items[i.id]?.status === "ok").length;
  const ncCount = allItems.filter((i) => data.items[i.id]?.status === "nc").length;
  const progressPct = allItems.length > 0 ? (completed / allItems.length) * 100 : 0;

  return (
    <div className="bg-background min-h-screen py-6 sm:py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link href={`${lp}/`} className="text-xs text-muted hover:text-navy">{t("backLink")}</Link>
        <h1 className="mt-2 text-xl font-bold text-navy sm:text-2xl">{t("pageTitle")}</h1>
        <p className="mt-1 text-xs text-muted">
          {t("pageDescription")}
        </p>

        {/* Header info */}
        <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("labelAdresse")}</label>
              <input type="text" value={data.address} onChange={(e) => update({ address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                placeholder={t("placeholderAdresse")} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("labelInspecteur")}</label>
              <input type="text" value={data.inspector} onChange={(e) => update({ inspector: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                placeholder={t("placeholderInspecteur")} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("labelDate")}</label>
              <input type="date" value={data.date} onChange={(e) => update({ date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("labelHeureDebut")}</label>
                <input type="time" value={data.startTime} onChange={(e) => update({ startTime: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("labelHeureFin")}</label>
                <input type="time" value={data.endTime} onChange={(e) => update({ endTime: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted">{t("refLabel")} {data.id}</div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">{t("progressLabel")} {completed}/{allItems.length} {t("progressPoints")}</span>
            <span className="font-medium text-navy">{progressPct.toFixed(0)} %</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-2 flex gap-3 text-[10px]">
            <span className="text-emerald-700">{okCount} {t("okLabel")}</span>
            <span className="text-rose-700">{ncCount} {t("ncLabel")}</span>
            <span className="text-muted">{allItems.length - completed} {t("enAttente")}</span>
          </div>
        </div>

        {/* Checklist sections */}
        {CHECKLIST.map((section) => (
          <div key={section.id} className="mt-4 rounded-xl border border-card-border bg-card">
            <div className="border-b border-card-border bg-background px-4 py-2">
              <h2 className="text-sm font-semibold text-navy">{t(section.titleKey as Parameters<typeof t>[0])}</h2>
            </div>
            <div className="divide-y divide-card-border/50">
              {section.items.map((item) => {
                const d = data.items[item.id] ?? { status: "pending", note: "" };
                return (
                  <div key={item.id} className={`px-4 py-3 ${d.status === "nc" ? "bg-rose-50/40" : d.status === "ok" ? "bg-emerald-50/20" : ""}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-navy">{t(item.labelKey as Parameters<typeof t>[0])}</span>
                      <div className="flex gap-1">
                        {(["ok", "nc", "na"] as ItemStatus[]).map((s) => (
                          <button key={s} onClick={() => setItemStatus(item.id, d.status === s ? "pending" : s)}
                            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                              d.status === s
                                ? s === "ok" ? "bg-emerald-600 text-white" : s === "nc" ? "bg-rose-600 text-white" : "bg-slate-500 text-white"
                                : "border border-card-border text-muted hover:bg-slate-50"
                            }`}>
                            {s === "ok" ? "OK" : s === "nc" ? "NC" : "N/A"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input type="text" value={d.note}
                      onChange={(e) => setItemNote(item.id, e.target.value)}
                      placeholder={t("notePlaceholder")}
                      className="mt-1.5 w-full rounded border border-card-border/50 bg-transparent px-2 py-1 text-[11px] text-muted placeholder:text-slate-300 focus:border-navy focus:outline-none" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* General notes */}
        <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
          <label className="text-sm font-semibold text-navy">{t("notesGenerales")}</label>
          <textarea value={data.generalNotes} onChange={(e) => update({ generalNotes: e.target.value })}
            className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
            rows={10} placeholder={t("notesPlaceholder")} />
          <div className="mt-2">
            <AiDraftButton
              context={[
                `Inspection terrain — TEGOVA EVS 2025`,
                `Adresse: ${data.address || "—"}`,
                `Inspecteur: ${data.inspector || "—"}`,
                `Date: ${data.date}`,
                `Score: ${okCount} OK / ${ncCount} NC / ${allItems.length - completed} en attente`,
                "",
                `— Détail par section —`,
                ...CHECKLIST.map((section) => {
                  const sectionLines = section.items.map((it) => {
                    const d = data.items[it.id] ?? { status: "pending" as ItemStatus, note: "" };
                    const statusTxt = d.status === "ok" ? "OK" : d.status === "nc" ? "NC" : d.status === "na" ? "N/A" : "—";
                    return `  [${statusTxt}] ${it.id}${d.note ? ` — ${d.note}` : ""}`;
                  });
                  return `${section.id}:\n${sectionLines.join("\n")}`;
                }),
                data.generalNotes ? `\nNotes manuelles existantes:\n${data.generalNotes}` : "",
              ].join("\n")}
              prompt="Rédige un rapport d'inspection terrain structuré conforme TEGOVA EVS 2025 à partir de cette checklist. Structure : (1) synthèse exécutive (3-4 phrases) sur l'état général du bien et les points clés ; (2) observations par grande section (identification, environnement, extérieur, intérieur, énergétique, juridique) avec mise en évidence des non-conformités et leur gravité ; (3) recommandations hiérarchisées (travaux urgents, à prévoir, cosmétiques) ; (4) limites de l'inspection (items en attente, accès non effectué, expertise technique complémentaire). Ton professionnel, factuel, prêt à l'intégration dans un rapport EVS. Pas de markdown lourd."
              onResult={(text) => update({ generalNotes: text })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={handleExportText}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {t("btnExportTxt")}
          </button>
          <button onClick={handleExport}
            className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50">
            {t("btnExportJson")}
          </button>
          <button onClick={handleReset}
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100">
            {t("btnNouvelle")}
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>{t("legalTitle")}</strong> {t("legalText")}
        </div>
      </div>
    </div>
  );
}
