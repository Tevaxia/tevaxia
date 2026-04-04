"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CLASSES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;
type Classe = (typeof CLASSES)[number];

const IMPACT_ENERGIE: Record<string, number> = {
  A: 8, B: 5, C: 2, D: 0, E: -3, F: -7, G: -12, H: -18, I: -25,
};

const CONSO_PAR_CLASSE: Record<string, number> = {
  A: 35, B: 60, C: 93, D: 130, E: 180, F: 255, G: 350, H: 450, I: 550,
};

const CLASS_COLORS: Record<string, string> = {
  A: "bg-green-600 text-white",
  B: "bg-green-500 text-white",
  C: "bg-lime-500 text-white",
  D: "bg-yellow-400 text-gray-900",
  E: "bg-orange-400 text-white",
  F: "bg-orange-600 text-white",
  G: "bg-red-600 text-white",
  H: "bg-red-700 text-white",
  I: "bg-red-900 text-white",
};

const BAR_COLORS: Record<string, string> = {
  A: "bg-green-600",
  B: "bg-green-500",
  C: "bg-lime-500",
  D: "bg-yellow-400",
  E: "bg-orange-400",
  F: "bg-orange-600",
  G: "bg-red-600",
  H: "bg-red-700",
  I: "bg-red-900",
};

const TYPE_KEYS = ["apartment", "house", "commercial"] as const;
const TYPE_VALUES = ["Appartement", "Maison", "Commercial"] as const;

const STORAGE_KEY = "tevaxia_energy_portfolio";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Property {
  id: string;
  nom: string;
  classe: string;
  surface: number;
  valeur: number;
  type: string;
  annee: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number): string {
  return n.toLocaleString("fr-LU", { maximumFractionDigits: 0 });
}

function fmtDec(n: number, digits = 1): string {
  return n.toLocaleString("fr-LU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function classeIndex(c: string): number {
  const idx = CLASSES.indexOf(c as Classe);
  return idx >= 0 ? idx + 1 : 4; // default D=4
}

function indexToClasse(idx: number): string {
  const clamped = Math.max(1, Math.min(9, Math.round(idx)));
  return CLASSES[clamped - 1];
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString();
}

/* ------------------------------------------------------------------ */
/*  Sort types                                                         */
/* ------------------------------------------------------------------ */

type SortKey = "nom" | "classe" | "surface" | "valeur" | "conso" | "co2" | "impact";
type SortDir = "asc" | "desc";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PortfolioPage() {
  const t = useTranslations("energy.portfolio");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [nom, setNom] = useState("");
  const [classe, setClasse] = useState<string>("D");
  const [surface, setSurface] = useState<number | "">("");
  const [valeur, setValeur] = useState<number | "">("");
  const [type, setType] = useState<string>("Appartement");
  const [annee, setAnnee] = useState<number | "">(1990);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>("nom");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Type options with translated labels
  const TYPE_OPTIONS = TYPE_KEYS.map((key, i) => ({
    key,
    value: TYPE_VALUES[i],
    label: t(`type_${key}`),
  }));

  /* ---- localStorage persistence ---------------------------------- */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setProperties(parsed);
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  }, [properties, loaded]);

  /* ---- Add property ---------------------------------------------- */

  function handleAdd() {
    if (!nom.trim() || !surface || !valeur || !annee) return;
    const newProp: Property = {
      id: generateId(),
      nom: nom.trim(),
      classe,
      surface: Number(surface),
      valeur: Number(valeur),
      type,
      annee: Number(annee),
    };
    setProperties((prev) => [...prev, newProp]);
    // Reset form
    setNom("");
    setClasse("D");
    setSurface("");
    setValeur("");
    setType("Appartement");
    setAnnee(1990);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }

  /* ---- Computed portfolio stats ---------------------------------- */

  const stats = useMemo(() => {
    if (properties.length < 2) return null;

    const totalSurface = properties.reduce((s, p) => s + p.surface, 0);
    const totalValeur = properties.reduce((s, p) => s + p.valeur, 0);

    // Weighted average class
    const weightedIdx = totalSurface > 0
      ? properties.reduce((s, p) => s + classeIndex(p.classe) * p.surface, 0) / totalSurface
      : 4;

    // Répartition by class (by surface)
    const repartition: Record<string, number> = {};
    for (const c of CLASSES) repartition[c] = 0;
    for (const p of properties) {
      repartition[p.classe] = (repartition[p.classe] || 0) + p.surface;
    }

    // Energy impact on total value
    const valeurAjustee = properties.reduce((s, p) => {
      const pct = IMPACT_ENERGIE[p.classe] || 0;
      return s + p.valeur * (1 + pct / 100);
    }, 0);
    // Baseline value (if all were D class = 0%)
    const valeurBase = properties.reduce((s, p) => {
      const pct = IMPACT_ENERGIE[p.classe] || 0;
      return s + p.valeur / (1 + pct / 100);
    }, 0);
    const impactTotal = valeurAjustee - valeurBase;
    // Gain if all pass to B
    const valeurSiB = properties.reduce((s, p) => {
      const pctActuel = IMPACT_ENERGIE[p.classe] || 0;
      const base = p.valeur / (1 + pctActuel / 100);
      return s + base * (1 + IMPACT_ENERGIE["B"] / 100);
    }, 0);
    const gainSiB = valeurSiB - totalValeur;

    // Consumption
    const totalConsoKwh = properties.reduce(
      (s, p) => s + (CONSO_PAR_CLASSE[p.classe] || 130) * p.surface,
      0,
    );
    const totalCO2 = totalConsoKwh * 0.75 * 300 / 1000;

    // EPBD risk
    const worstPerformers = properties.filter((p) =>
      ["F", "G", "H", "I"].includes(p.classe),
    );

    return {
      totalSurface,
      totalValeur,
      weightedIdx,
      weightedClasse: indexToClasse(weightedIdx),
      repartition,
      impactTotal,
      gainSiB,
      totalConsoKwh,
      totalCO2,
      worstPerformers,
    };
  }, [properties]);

  /* ---- Sort logic for comparison table --------------------------- */

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedProperties = useMemo(() => {
    const arr = [...properties];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "nom": return a.nom.localeCompare(b.nom) * dir;
        case "classe": return (classeIndex(a.classe) - classeIndex(b.classe)) * dir;
        case "surface": return (a.surface - b.surface) * dir;
        case "valeur": return (a.valeur - b.valeur) * dir;
        case "conso": return (
          (CONSO_PAR_CLASSE[a.classe] || 130) * a.surface -
          (CONSO_PAR_CLASSE[b.classe] || 130) * b.surface
        ) * dir;
        case "co2": {
          const co2A = (CONSO_PAR_CLASSE[a.classe] || 130) * a.surface * 0.75 * 300 / 1000;
          const co2B = (CONSO_PAR_CLASSE[b.classe] || 130) * b.surface * 0.75 * 300 / 1000;
          return (co2A - co2B) * dir;
        }
        case "impact": return ((IMPACT_ENERGIE[a.classe] || 0) - (IMPACT_ENERGIE[b.classe] || 0)) * dir;
        default: return 0;
      }
    });
    return arr;
  }, [properties, sortKey, sortDir]);

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " \u25B2" : " \u25BC") : "";

  /* ---- Helper to get translated type label ----------------------- */

  function typeLabel(storedValue: string): string {
    const opt = TYPE_OPTIONS.find((o) => o.value === storedValue);
    return opt ? opt.label : storedValue;
  }

  /* ---- Render ---------------------------------------------------- */

  if (!loaded) return null;

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        {/* ============================================================ */}
        {/*  EMPTY STATE                                                  */}
        {/* ============================================================ */}
        {properties.length === 0 && !showForm && (
          <div className="rounded-2xl border border-card-border bg-card p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t("emptyTitle")}
            </h2>
            <p className="text-muted mb-6 max-w-md mx-auto">
              {t("emptyDescription")}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-energy px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-energy/90 transition-colors"
            >
              + {t("addFirstProperty")}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  ADD PROPERTY BUTTON + COLLAPSIBLE FORM                       */}
        {/* ============================================================ */}
        {(properties.length > 0 || showForm) && (
          <div className="mb-8">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-energy px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-energy/90 transition-colors"
              >
                + {t("addProperty")}
              </button>
            )}

            {showForm && (
              <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-foreground">
                    {t("addProperty")}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-muted hover:text-foreground text-sm"
                  >
                    {t("close")}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Nom / adresse */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t("labelNom")}
                    </label>
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder={t("placeholderNom")}
                      className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground placeholder:text-muted/50"
                    />
                  </div>

                  {/* Classe energie */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t("labelClasse")}
                    </label>
                    <div className="flex gap-1.5">
                      {CLASSES.map((c) => (
                        <button
                          key={c}
                          onClick={() => setClasse(c)}
                          className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                            classe === c
                              ? `${CLASS_COLORS[c]} ring-2 ring-offset-2 ring-energy`
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Surface */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t("labelSurface")}
                    </label>
                    <input
                      type="number"
                      value={surface}
                      onChange={(e) =>
                        setSurface(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="120"
                      className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground"
                      min={1}
                    />
                  </div>

                  {/* Valeur estimée */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t("labelValeur")}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={valeur}
                        onChange={(e) =>
                          setValeur(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        placeholder="750 000"
                        className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 pr-10 text-foreground"
                        min={0}
                        step={10000}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                        EUR
                      </span>
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t("labelType")}
                    </label>
                    <div className="flex gap-1.5">
                      {TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setType(opt.value)}
                          className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition-all ${
                            type === opt.value
                              ? "bg-energy text-white ring-2 ring-offset-1 ring-energy"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Annee construction */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t("labelAnnee")}
                    </label>
                    <input
                      type="number"
                      value={annee}
                      onChange={(e) =>
                        setAnnee(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="1990"
                      className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground"
                      min={1800}
                      max={2026}
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleAdd}
                    disabled={!nom.trim() || !surface || !valeur || !annee}
                    className="inline-flex items-center gap-2 rounded-xl bg-energy px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-energy/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t("btnAdd")}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-card-border px-6 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 transition-colors"
                  >
                    {t("btnCancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/*  PROPERTIES CARDS                                             */}
        {/* ============================================================ */}
        {properties.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-foreground mb-4">
              {t("yourProperties", { count: properties.length })}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-card-border bg-card p-5 shadow-sm relative group"
                >
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title={t("delete")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold shrink-0 ${CLASS_COLORS[p.classe]}`}
                    >
                      {p.classe}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {p.nom}
                      </div>
                      <div className="text-xs text-muted">
                        {typeLabel(p.type)} · {p.annee}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{fmt(p.surface)} m²</span>
                    <span className="font-semibold text-foreground">
                      {fmt(p.valeur)} EUR
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  PORTFOLIO SUMMARY (2+ properties)                            */}
        {/* ============================================================ */}
        {stats && (
          <div className="space-y-6 mb-8">
            {/* ---- Score moyen pondéré -------------------------------- */}
            <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
                <h2 className="font-semibold text-foreground">
                  {t("weightedScore")}
                </h2>
              </div>
              <div className="p-6 flex items-center gap-6">
                <span
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl text-2xl font-bold ${CLASS_COLORS[stats.weightedClasse]}`}
                >
                  {stats.weightedClasse}
                </span>
                <div>
                  <div className="text-sm text-muted">
                    {t("averageScore", { score: fmtDec(stats.weightedIdx) })}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {t("weightedBySurface", { surface: fmt(stats.totalSurface) })}
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Répartition par classe ----------------------------- */}
            <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
                <h2 className="font-semibold text-foreground">
                  {t("distributionByClass")}
                </h2>
              </div>
              <div className="p-6">
                {/* Stacked bar */}
                <div className="h-10 rounded-xl overflow-hidden flex">
                  {CLASSES.map((c) => {
                    const pct =
                      stats.totalSurface > 0
                        ? (stats.repartition[c] / stats.totalSurface) * 100
                        : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={c}
                        className={`${BAR_COLORS[c]} flex items-center justify-center text-xs font-bold text-white transition-all`}
                        style={{ width: `${pct}%` }}
                        title={t("classPercent", { classe: c, percent: fmtDec(pct) })}
                      >
                        {pct >= 8 && `${c} ${Math.round(pct)}%`}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {CLASSES.map((c) => {
                    const pct =
                      stats.totalSurface > 0
                        ? (stats.repartition[c] / stats.totalSurface) * 100
                        : 0;
                    if (pct === 0) return null;
                    return (
                      <div key={c} className="flex items-center gap-1.5 text-xs">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${CLASS_COLORS[c]}`}
                        >
                          {c}
                        </span>
                        <span className="text-muted">
                          {fmtDec(pct)}% ({fmt(stats.repartition[c])} m²)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ---- Valeur totale + impact energie --------------------- */}
            <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
                <h2 className="font-semibold text-foreground">
                  {t("totalValueAndImpact")}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-card-border p-4 text-center">
                    <div className="text-xs text-muted uppercase tracking-wider">
                      {t("totalValue")}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-foreground">
                      {fmt(stats.totalValeur)} EUR
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {t("propertiesCount", { count: properties.length })}
                    </div>
                  </div>
                  <div className="rounded-xl border border-card-border p-4 text-center">
                    <div className="text-xs text-muted uppercase tracking-wider">
                      {t("energyImpact")}
                    </div>
                    <div
                      className={`mt-1 text-2xl font-bold ${
                        stats.impactTotal >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stats.impactTotal >= 0 ? "+" : ""}
                      {fmt(Math.round(stats.impactTotal))} EUR
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {t("greenPremiumBrownDiscount")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-card-border p-4 text-center">
                    <div className="text-xs text-muted uppercase tracking-wider">
                      {t("potentialGainClassB")}
                    </div>
                    <div
                      className={`mt-1 text-2xl font-bold ${
                        stats.gainSiB > 0 ? "text-green-600" : "text-muted"
                      }`}
                    >
                      {stats.gainSiB > 0 ? "+" : ""}
                      {fmt(Math.round(stats.gainSiB))} EUR
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {t("ifAllClassB")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Consommation totale estimée ------------------------ */}
            <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
                <h2 className="font-semibold text-foreground">
                  {t("estimatedTotalConsumption")}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-card-border p-4 text-center">
                    <div className="text-xs text-muted uppercase tracking-wider">
                      {t("annualConsumption")}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-energy">
                      {fmt(stats.totalConsoKwh)} kWh/an
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {t("consumptionDetail", {
                        surface: fmt(stats.totalSurface),
                        average: fmt(Math.round(stats.totalConsoKwh / stats.totalSurface)),
                      })}
                    </div>
                  </div>
                  <div className="rounded-xl border border-card-border p-4 text-center">
                    <div className="text-xs text-muted uppercase tracking-wider">
                      {t("co2Emissions")}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-orange-600">
                      {fmt(Math.round(stats.totalCO2))} kg/an
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {t("co2TonsPerYear", { tons: fmtDec(stats.totalCO2 / 1000) })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Risque EPBD ---------------------------------------- */}
            {stats.worstPerformers.length > 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-red-200 bg-gradient-to-r from-red-500/10 to-transparent">
                  <h2 className="font-semibold text-red-800">{t("epbdRisk")}</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5 text-red-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-red-800">
                        {t("epbdWarning", {
                          worst: stats.worstPerformers.length,
                          total: properties.length,
                        })}
                      </div>
                      <div className="mt-2 text-sm text-red-700">
                        {t("epbdDescription")}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stats.worstPerformers.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 border border-red-200 px-3 py-1 text-xs"
                          >
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${CLASS_COLORS[p.classe]}`}
                            >
                              {p.classe}
                            </span>
                            <span className="text-red-800 font-medium">
                              {p.nom}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/*  COMPARISON TABLE                                             */}
        {/* ============================================================ */}
        {properties.length >= 2 && (
          <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
              <h2 className="font-semibold text-foreground">
                {t("comparisonTitle")}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left">
                    <th
                      className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground select-none"
                      onClick={() => toggleSort("nom")}
                    >
                      {t("colNom")}{sortArrow("nom")}
                    </th>
                    <th
                      className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground select-none text-center"
                      onClick={() => toggleSort("classe")}
                    >
                      {t("colClasse")}{sortArrow("classe")}
                    </th>
                    <th
                      className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground select-none text-right"
                      onClick={() => toggleSort("surface")}
                    >
                      {t("colSurface")}{sortArrow("surface")}
                    </th>
                    <th
                      className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground select-none text-right"
                      onClick={() => toggleSort("valeur")}
                    >
                      {t("colValeur")}{sortArrow("valeur")}
                    </th>
                    <th
                      className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground select-none text-right"
                      onClick={() => toggleSort("conso")}
                    >
                      {t("colConso")}{sortArrow("conso")}
                    </th>
                    <th
                      className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground select-none text-right"
                      onClick={() => toggleSort("co2")}
                    >
                      {t("colCO2")}{sortArrow("co2")}
                    </th>
                    <th
                      className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground select-none text-right"
                      onClick={() => toggleSort("impact")}
                    >
                      {t("colImpact")}{sortArrow("impact")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProperties.map((p) => {
                    const conso =
                      (CONSO_PAR_CLASSE[p.classe] || 130) * p.surface;
                    const co2 = (conso * 0.75 * 300) / 1000;
                    const impactPct = IMPACT_ENERGIE[p.classe] || 0;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-card-border last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-foreground font-medium max-w-[200px] truncate">
                          {p.nom}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${CLASS_COLORS[p.classe]}`}
                          >
                            {p.classe}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {fmt(p.surface)} m²
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          {fmt(p.valeur)} EUR
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {fmt(conso)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {fmt(Math.round(co2))}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          <span
                            className={
                              impactPct > 0
                                ? "text-green-600"
                                : impactPct < 0
                                  ? "text-red-600"
                                  : "text-muted"
                            }
                          >
                            {impactPct > 0 ? "+" : ""}
                            {impactPct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
