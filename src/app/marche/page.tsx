"use client";

import { useState, useMemo } from "react";
import { getAllCommunes, getMarketDataCommune } from "@/lib/market-data";
import {
  OFFICE_SUBMARKETS,
  OFFICE_MARKET_SUMMARY,
  RETAIL_LOCATIONS,
  LOGISTICS_ZONES,
  LAND_PRICES,
  MACRO_DATA,
} from "@/lib/market-data-commercial";
import { formatEUR } from "@/lib/calculations";
import { PriceEvolutionChart } from "@/components/PriceChart";

// ---------------------------------------------------------------------------
// CSV export helper
// ---------------------------------------------------------------------------

function downloadCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportCSVButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-3 py-2 text-sm font-medium text-navy shadow-sm transition-colors hover:bg-background"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
      </svg>
      Exporter CSV
    </button>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActiveTab = "residentiel" | "bureaux" | "commerces" | "logistique" | "terrains" | "macro";

type SortDir = "asc" | "desc";

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "residentiel", label: "Résidentiel" },
  { id: "bureaux", label: "Bureaux" },
  { id: "commerces", label: "Commerces" },
  { id: "logistique", label: "Logistique" },
  { id: "terrains", label: "Terrains" },
  { id: "macro", label: "Macro" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function TendanceBadge({ t }: { t: "hausse" | "stable" | "baisse" }) {
  const cls =
    t === "hausse"
      ? "bg-emerald-100 text-emerald-700"
      : t === "baisse"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-600";
  const label = t === "hausse" ? "Hausse" : t === "baisse" ? "Baisse" : "Stable";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function RetailTypeBadge({ t }: { t: string }) {
  const map: Record<string, string> = {
    high_street: "High Street",
    centre_commercial: "Centre commercial",
    retail_park: "Retail Park",
  };
  return (
    <span className="inline-block rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-medium text-navy">
      {map[t] ?? t}
    </span>
  );
}

function SourceList({ sources }: { sources: { nom: string; url: string; frequence: string }[] }) {
  return (
    <div className="mt-8 rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-navy">Sources</h3>
      <ul className="space-y-1.5 text-xs text-muted">
        {sources.map((s) => (
          <li key={s.nom}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-navy">
              {s.nom}
            </a>{" "}
            <span className="text-muted/70">({s.frequence})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-card-border bg-white py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
      />
    </div>
  );
}

function SortableHeader({
  label,
  field,
  currentField,
  currentDir,
  onSort,
}: {
  label: string;
  field: string;
  currentField: string;
  currentDir: SortDir;
  onSort: (field: string) => void;
}) {
  const active = currentField === field;
  return (
    <th
      className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-right font-semibold text-navy hover:text-navy-light"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-xs">
          {active ? (currentDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B4\u25BE"}
        </span>
      </span>
    </th>
  );
}

// ---------------------------------------------------------------------------
// Tab: Résidentiel
// ---------------------------------------------------------------------------

function TabResidentiel() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("commune");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const data = useMemo(() => {
    const communes = getAllCommunes();
    return communes.map((name) => getMarketDataCommune(name)!).filter(Boolean);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = q ? data.filter((c) => c.commune.toLowerCase().includes(q) || c.canton.toLowerCase().includes(q)) : data;

    list = [...list].sort((a, b) => {
      const getValue = (item: typeof a) => {
        switch (sortField) {
          case "commune": return item.commune;
          case "canton": return item.canton;
          case "prixM2Existant": return item.prixM2Existant ?? 0;
          case "prixM2VEFA": return item.prixM2VEFA ?? 0;
          case "prixM2Annonces": return item.prixM2Annonces ?? 0;
          case "loyerM2Annonces": return item.loyerM2Annonces ?? 0;
          case "nbTransactions": return item.nbTransactions ?? 0;
          default: return item.commune;
        }
      };
      const va = getValue(a);
      const vb = getValue(b);
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

    return list;
  }, [data, search, sortField, sortDir]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "commune" || field === "canton" ? "asc" : "desc");
    }
  }

  const fmtPrice = (v: number | null) => (v != null ? formatEUR(v) : "\u2014");
  const fmtRent = (v: number | null) => (v != null ? `${v.toFixed(1)} \u20AC` : "\u2014");
  const fmtTx = (v: number | null) => (v != null ? v.toLocaleString("fr-LU") : "\u2014");

  function handleExportCSV() {
    const headers = ["Commune", "Canton", "Prix/m2 existant", "Prix/m2 VEFA", "Prix annonces", "Loyer/m2", "Transactions"];
    const rows = filtered.map((c) => [
      c.commune,
      c.canton,
      c.prixM2Existant,
      c.prixM2VEFA,
      c.prixM2Annonces,
      c.loyerM2Annonces,
      c.nbTransactions,
    ]);
    downloadCSV("marche-residentiel.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      <PriceEvolutionChart />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une commune ou un canton..." />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted">{filtered.length} commune{filtered.length > 1 ? "s" : ""}</p>
          <ExportCSVButton onClick={handleExportCSV} />
        </div>
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th
                className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left font-semibold text-navy hover:text-navy-light"
                onClick={() => handleSort("commune")}
              >
                <span className="inline-flex items-center gap-1">
                  Commune
                  <span className="text-xs">{sortField === "commune" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B4\u25BE"}</span>
                </span>
              </th>
              <th
                className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left font-semibold text-navy hover:text-navy-light"
                onClick={() => handleSort("canton")}
              >
                <span className="inline-flex items-center gap-1">
                  Canton
                  <span className="text-xs">{sortField === "canton" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B4\u25BE"}</span>
                </span>
              </th>
              <SortableHeader label="Prix/m² existant" field="prixM2Existant" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Prix/m² VEFA" field="prixM2VEFA" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Prix annonces" field="prixM2Annonces" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Loyer/m²" field="loyerM2Annonces" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Transactions" field="nbTransactions" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.commune} className="border-b border-card-border/50 hover:bg-background/50">
                <td className="px-4 py-2.5 font-medium text-navy">{c.commune}</td>
                <td className="px-4 py-2.5 text-muted">{c.canton}</td>
                <td className="px-4 py-2.5 text-right font-mono">{fmtPrice(c.prixM2Existant)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{fmtPrice(c.prixM2VEFA)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{fmtPrice(c.prixM2Annonces)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{fmtRent(c.loyerM2Annonces)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{fmtTx(c.nbTransactions)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">Aucune commune trouvée.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SourceList
        sources={[
          { nom: "Observatoire de l'Habitat / Publicité Foncière", url: "https://data.public.lu/en/datasets/prix-annonces-des-logements-par-commune/", frequence: "Trimestriel" },
          { nom: "STATEC — Indices des prix de l'immobilier", url: "https://lustat.statec.lu/", frequence: "Trimestriel" },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Bureaux
// ---------------------------------------------------------------------------

function TabBureaux() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("nom");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = q ? OFFICE_SUBMARKETS.filter((o) => o.nom.toLowerCase().includes(q)) : [...OFFICE_SUBMARKETS];

    list.sort((a, b) => {
      const getValue = (item: typeof a) => {
        switch (sortField) {
          case "nom": return item.nom;
          case "loyerPrime": return item.loyerPrime;
          case "loyerMoyen": return item.loyerMoyen;
          case "vacance": return item.vacance;
          case "stock": return item.stock;
          default: return item.nom;
        }
      };
      const va = getValue(a);
      const vb = getValue(b);
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

    return list;
  }, [search, sortField, sortDir]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "nom" ? "asc" : "desc");
    }
  }

  function handleExportCSV() {
    const headers = ["Sous-marche", "Loyer prime (EUR/m2/mois)", "Loyer moyen", "Vacance (%)", "Stock (m2)", "Tendance"];
    const rows = filtered.map((o) => [o.nom, o.loyerPrime, o.loyerMoyen, o.vacance, o.stock, o.tendance]);
    downloadCSV("marche-bureaux.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Take-up annuel" value={`${(OFFICE_MARKET_SUMMARY.takeUpAnnuel).toLocaleString("fr-LU")} m\u00B2`} sub={OFFICE_MARKET_SUMMARY.takeUpEvolution} />
        <SummaryCard label="Rendement prime" value={`${OFFICE_MARKET_SUMMARY.yieldPrime} %`} />
        <SummaryCard label="Vacance globale" value={`${OFFICE_MARKET_SUMMARY.vacanceGlobale} %`} />
        <SummaryCard label="Pipeline en construction" value={`${(OFFICE_MARKET_SUMMARY.pipelineEnConstruction).toLocaleString("fr-LU")} m\u00B2`} />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un sous-marché..." />
        </div>
        <ExportCSVButton onClick={handleExportCSV} />
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left font-semibold text-navy hover:text-navy-light" onClick={() => handleSort("nom")}>
                <span className="inline-flex items-center gap-1">Sous-marché<span className="text-xs">{sortField === "nom" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B4\u25BE"}</span></span>
              </th>
              <SortableHeader label="Loyer prime (€/m²/mois)" field="loyerPrime" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Loyer moyen" field="loyerMoyen" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Vacance (%)" field="vacance" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Stock (m²)" field="stock" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-navy">Tendance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.nom} className="border-b border-card-border/50 hover:bg-background/50" title={o.note}>
                <td className="px-4 py-2.5 font-medium text-navy">{o.nom}</td>
                <td className="px-4 py-2.5 text-right font-mono">{o.loyerPrime} \u20AC</td>
                <td className="px-4 py-2.5 text-right font-mono">{o.loyerMoyen} \u20AC</td>
                <td className="px-4 py-2.5 text-right font-mono">{o.vacance.toFixed(1)} %</td>
                <td className="px-4 py-2.5 text-right font-mono">{o.stock.toLocaleString("fr-LU")}</td>
                <td className="px-4 py-2.5 text-right"><TendanceBadge t={o.tendance} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SourceList sources={OFFICE_MARKET_SUMMARY.sources.map((s) => ({ nom: s.nom, url: s.url, frequence: s.frequence }))} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Commerces
// ---------------------------------------------------------------------------

function TabCommerces() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("nom");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = q ? RETAIL_LOCATIONS.filter((r) => r.nom.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)) : [...RETAIL_LOCATIONS];

    list.sort((a, b) => {
      const getValue = (item: typeof a) => {
        switch (sortField) {
          case "nom": return item.nom;
          case "loyerPrime": return item.loyerPrime;
          case "loyerMoyen": return item.loyerMoyen;
          default: return item.nom;
        }
      };
      const va = getValue(a);
      const vb = getValue(b);
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

    return list;
  }, [search, sortField, sortDir]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "nom" ? "asc" : "desc");
    }
  }

  function handleExportCSV() {
    const headers = ["Emplacement", "Type", "Loyer prime (EUR/m2/mois)", "Loyer moyen", "Tendance"];
    const rows = filtered.map((r) => [r.nom, r.type, r.loyerPrime, r.loyerMoyen, r.tendance]);
    downloadCSV("marche-commerces.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un emplacement..." />
        </div>
        <ExportCSVButton onClick={handleExportCSV} />
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left font-semibold text-navy hover:text-navy-light" onClick={() => handleSort("nom")}>
                <span className="inline-flex items-center gap-1">Emplacement<span className="text-xs">{sortField === "nom" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B4\u25BE"}</span></span>
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-navy">Type</th>
              <SortableHeader label="Loyer prime (€/m²/mois)" field="loyerPrime" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Loyer moyen" field="loyerMoyen" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-navy">Tendance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.nom} className="border-b border-card-border/50 hover:bg-background/50" title={r.note}>
                <td className="px-4 py-2.5 font-medium text-navy">{r.nom}</td>
                <td className="px-4 py-2.5"><RetailTypeBadge t={r.type} /></td>
                <td className="px-4 py-2.5 text-right font-mono">{r.loyerPrime} \u20AC</td>
                <td className="px-4 py-2.5 text-right font-mono">{r.loyerMoyen} \u20AC</td>
                <td className="px-4 py-2.5 text-right"><TendanceBadge t={r.tendance} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SourceList sources={[
        { nom: "INOWAI Retail Market Report", url: "https://www.inowai.com/en/real-estate-research-data/", frequence: "Semestriel" },
        { nom: "JLL Annual Review", url: "https://www.jll.com/en-belux/insights/market-dynamics/luxembourg-office", frequence: "Annuel" },
      ]} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Logistique
// ---------------------------------------------------------------------------

function TabLogistique() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("nom");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = q ? LOGISTICS_ZONES.filter((z) => z.nom.toLowerCase().includes(q)) : [...LOGISTICS_ZONES];

    list.sort((a, b) => {
      const getValue = (item: typeof a) => {
        switch (sortField) {
          case "nom": return item.nom;
          case "loyerMin": return item.loyerMin;
          case "loyerMax": return item.loyerMax;
          case "stockEstime": return item.stockEstime;
          default: return item.nom;
        }
      };
      const va = getValue(a);
      const vb = getValue(b);
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

    return list;
  }, [search, sortField, sortDir]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "nom" ? "asc" : "desc");
    }
  }

  function handleExportCSV() {
    const headers = ["Zone", "Loyer min (EUR/m2/mois)", "Loyer max", "Stock estime (m2)", "Tendance"];
    const rows = filtered.map((z) => [z.nom, z.loyerMin, z.loyerMax, z.stockEstime, z.tendance]);
    downloadCSV("marche-logistique.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une zone..." />
        </div>
        <ExportCSVButton onClick={handleExportCSV} />
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left font-semibold text-navy hover:text-navy-light" onClick={() => handleSort("nom")}>
                <span className="inline-flex items-center gap-1">Zone<span className="text-xs">{sortField === "nom" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B4\u25BE"}</span></span>
              </th>
              <SortableHeader label="Loyer min (€/m²/mois)" field="loyerMin" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Loyer max" field="loyerMax" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Stock estimé (m²)" field="stockEstime" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-navy">Tendance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((z) => (
              <tr key={z.nom} className="border-b border-card-border/50 hover:bg-background/50" title={z.note}>
                <td className="px-4 py-2.5 font-medium text-navy">{z.nom}</td>
                <td className="px-4 py-2.5 text-right font-mono">{z.loyerMin} \u20AC</td>
                <td className="px-4 py-2.5 text-right font-mono">{z.loyerMax} \u20AC</td>
                <td className="px-4 py-2.5 text-right font-mono">{z.stockEstime.toLocaleString("fr-LU")}</td>
                <td className="px-4 py-2.5 text-right"><TendanceBadge t={z.tendance} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SourceList sources={[
        { nom: "Savills Luxembourg Logistics", url: "https://www.savills.lu/research-and-news/research.aspx", frequence: "Annuel" },
        { nom: "BNP Paribas RE Logistics", url: "https://www.realestate.bnpparibas.lu/en/press/logistics-capital-markets", frequence: "Annuel" },
        { nom: "WarehouseRentInfo.lu", url: "https://www.warehouserentinfo.lu/", frequence: "Live" },
      ]} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Terrains
// ---------------------------------------------------------------------------

function TabTerrains() {
  const [sortField, setSortField] = useState("zone");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const list = [...LAND_PRICES];
    list.sort((a, b) => {
      const getValue = (item: typeof a) => {
        switch (sortField) {
          case "zone": return item.zone;
          case "prixM2": return item.prixM2;
          case "prixMedianAre": return item.prixMedianAre;
          default: return item.zone;
        }
      };
      const va = getValue(a);
      const vb = getValue(b);
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return list;
  }, [sortField, sortDir]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "zone" ? "asc" : "desc");
    }
  }

  function handleExportCSV() {
    const headers = ["Zone", "Prix/m2", "Prix/are", "Evolution"];
    const rows = sorted.map((z) => [z.zone, z.prixM2, z.prixMedianAre, z.evolution]);
    downloadCSV("marche-terrains.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportCSVButton onClick={handleExportCSV} />
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left font-semibold text-navy hover:text-navy-light" onClick={() => handleSort("zone")}>
                <span className="inline-flex items-center gap-1">Zone<span className="text-xs">{sortField === "zone" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B4\u25BE"}</span></span>
              </th>
              <SortableHeader label="Prix/m²" field="prixM2" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Prix/are" field="prixMedianAre" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-navy">Evolution</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((z) => (
              <tr key={z.zone} className="border-b border-card-border/50 hover:bg-background/50" title={z.note}>
                <td className="px-4 py-2.5 font-medium text-navy">{z.zone}</td>
                <td className="px-4 py-2.5 text-right font-mono">{formatEUR(z.prixM2)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{formatEUR(z.prixMedianAre)}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`text-sm font-medium ${z.evolution.startsWith("-") ? "text-red-600" : "text-emerald-600"}`}>
                    {z.evolution}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SourceList sources={[
        { nom: "Observatoire de l'Habitat — Rapport #19 (prix terrains)", url: "https://gouvernement.lu/dam-assets/images-documents/actualites/2025/10/10-observatoire-habitat-rapport/oh-rapport-analyse-19.pdf", frequence: "Annuel" },
        { nom: "Observatoire de l'Habitat — Rapport #15 (segmentation)", url: "https://gouvernement.lu/dam-assets/images-documents/actualites/2025/02/11-observatoire-habitat/rapport-analyse-15-segmentation-foncier.pdf", frequence: "Annuel" },
      ]} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Macro
// ---------------------------------------------------------------------------

function MacroCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-navy">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-lg font-bold text-navy">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

function TabMacro() {
  const inv = MACRO_DATA.investissementCRE2025;

  function handleExportCSV() {
    const headers = ["Indicateur", "Valeur", "Detail"];
    const rows = [
      ["Taux hypothecaire moyen", `${MACRO_DATA.tauxHypothecaire.taux} %`, `${MACRO_DATA.tauxHypothecaire.date} - ${MACRO_DATA.tauxHypothecaire.source}`],
      ["Indice cout de construction", MACRO_DATA.indiceCoutConstruction.evolution, `${MACRO_DATA.indiceCoutConstruction.date} - ${MACRO_DATA.indiceCoutConstruction.source}`],
      ["Rendement locatif residentiel", MACRO_DATA.rendementLocatifResidentiel.brut, `Brut - ${MACRO_DATA.rendementLocatifResidentiel.source}`],
      ["Investissement CRE 2025 - Total", String(inv.total), ""],
      ["Investissement CRE 2025 - Bureaux", `${(inv.bureaux * 100).toFixed(0)} %`, String(Math.round(inv.total * inv.bureaux))],
      ["Investissement CRE 2025 - Commerces", `${(inv.retail * 100).toFixed(0)} %`, String(Math.round(inv.total * inv.retail))],
      ["Investissement CRE 2025 - Logistique", `${(inv.logistique * 100).toFixed(0)} %`, String(Math.round(inv.total * inv.logistique))],
      ["Investissement CRE 2025 - Autre", `${(inv.autre * 100).toFixed(0)} %`, String(Math.round(inv.total * inv.autre))],
    ];
    downloadCSV("marche-macro.csv", headers, rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportCSVButton onClick={handleExportCSV} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MacroCard
          label="Taux hypothecaire moyen"
          value={`${MACRO_DATA.tauxHypothecaire.taux} %`}
          sub={`${MACRO_DATA.tauxHypothecaire.date} \u2014 ${MACRO_DATA.tauxHypothecaire.source}`}
        />
        <MacroCard
          label="Indice cout de construction"
          value={MACRO_DATA.indiceCoutConstruction.evolution}
          sub={`${MACRO_DATA.indiceCoutConstruction.date} \u2014 ${MACRO_DATA.indiceCoutConstruction.source}`}
        />
        <MacroCard
          label="Rendement locatif residentiel"
          value={MACRO_DATA.rendementLocatifResidentiel.brut}
          sub={`Brut \u2014 ${MACRO_DATA.rendementLocatifResidentiel.source}`}
        />
        <MacroCard
          label="Investissement CRE 2025"
          value={formatEUR(inv.total)}
          sub="Total immobilier commercial"
        />
      </div>

      {/* CRE breakdown */}
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-navy">Ventilation investissement CRE ({MACRO_DATA.investissementCRE2025.total > 0 ? formatEUR(inv.total) : "\u2014"})</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Bureaux", pct: inv.bureaux },
            { label: "Commerces", pct: inv.retail },
            { label: "Logistique", pct: inv.logistique },
            { label: "Autre", pct: inv.autre },
          ].map((seg) => (
            <div key={seg.label} className="text-center">
              <div className="text-2xl font-bold text-navy">{(seg.pct * 100).toFixed(0)} %</div>
              <div className="mt-1 text-sm text-muted">{seg.label}</div>
              <div className="text-xs text-muted">{formatEUR(Math.round(inv.total * seg.pct))}</div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full bg-navy" style={{ width: `${seg.pct * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SourceList sources={MACRO_DATA.sources.map((s) => ({ nom: s.nom, url: s.url, frequence: s.frequence }))} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MarchePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("residentiel");

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Base de donnees marche
          </h1>
          <p className="mt-2 text-muted">
            Prix, loyers et indicateurs du marche immobilier luxembourgeois — Toutes les donnees en un seul endroit
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "residentiel" && <TabResidentiel />}
        {activeTab === "bureaux" && <TabBureaux />}
        {activeTab === "commerces" && <TabCommerces />}
        {activeTab === "logistique" && <TabLogistique />}
        {activeTab === "terrains" && <TabTerrains />}
        {activeTab === "macro" && <TabMacro />}
      </div>
    </div>
  );
}
