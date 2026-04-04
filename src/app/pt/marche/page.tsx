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
      Export CSV
    </button>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActiveTab = "residential" | "offices" | "retail" | "logistics" | "land" | "macro";

type SortDir = "asc" | "desc";

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "residential", label: "Residential" },
  { id: "offices", label: "Offices" },
  { id: "retail", label: "Retail" },
  { id: "logistics", label: "Logistics" },
  { id: "land", label: "Land" },
  { id: "macro", label: "Macro" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function TrendBadge({ t }: { t: "hausse" | "stable" | "baisse" }) {
  const cls =
    t === "hausse"
      ? "bg-emerald-100 text-emerald-700"
      : t === "baisse"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-600";
  const label = t === "hausse" ? "Rising" : t === "baisse" ? "Falling" : "Stable";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function RetailTypeBadge({ t }: { t: string }) {
  const map: Record<string, string> = {
    high_street: "High Street",
    centre_commercial: "Shopping Centre",
    retail_park: "Retail Park",
  };
  return (
    <span className="inline-block rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-medium text-navy">
      {map[t] ?? t}
    </span>
  );
}

function SourceList({ sources }: { sources: { nom: string; url: string; frequence: string }[] }) {
  const freqMap: Record<string, string> = {
    Trimestriel: "Quarterly",
    Semestriel: "Biannual",
    Annuel: "Annual",
    Mensuel: "Monthly",
    Live: "Live",
    Ponctuel: "Ad hoc",
    "Periodique": "Periodic",
  };
  return (
    <div className="mt-8 rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-navy">Sources</h3>
      <ul className="space-y-1.5 text-xs text-muted">
        {sources.map((s) => (
          <li key={s.nom}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-navy">
              {s.nom}
            </a>{" "}
            <span className="text-muted/70">({freqMap[s.frequence] ?? s.frequence})</span>
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
// Tab: Residential
// ---------------------------------------------------------------------------

function TabResidential() {
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
    const headers = ["Commune", "Canton", "Price/sqm existing", "Price/sqm VEFA", "Listed price", "Rent/sqm", "Transactions"];
    const rows = filtered.map((c) => [
      c.commune,
      c.canton,
      c.prixM2Existant,
      c.prixM2VEFA,
      c.prixM2Annonces,
      c.loyerM2Annonces,
      c.nbTransactions,
    ]);
    downloadCSV("market-residential.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      <PriceEvolutionChart />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by commune or canton..." />
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
              <SortableHeader label="Price/m² existing" field="prixM2Existant" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Price/m² VEFA" field="prixM2VEFA" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Listed price" field="prixM2Annonces" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Rent/m²" field="loyerM2Annonces" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
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
                <td colSpan={7} className="px-4 py-8 text-center text-muted">No commune found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SourceList
        sources={[
          { nom: "Observatoire de l'Habitat / Publicite Fonciere", url: "https://data.public.lu/en/datasets/prix-annonces-des-logements-par-commune/", frequence: "Quarterly" },
          { nom: "STATEC — House Price Indices", url: "https://lustat.statec.lu/", frequence: "Quarterly" },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Offices
// ---------------------------------------------------------------------------

function TabOffices() {
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
    const headers = ["Submarket", "Prime rent (EUR/sqm/mo)", "Average rent", "Vacancy (%)", "Stock (sqm)", "Trend"];
    const rows = filtered.map((o) => [o.nom, o.loyerPrime, o.loyerMoyen, o.vacance, o.stock, o.tendance]);
    downloadCSV("market-offices.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Annual take-up" value={`${(OFFICE_MARKET_SUMMARY.takeUpAnnuel).toLocaleString("fr-LU")} m\u00B2`} sub={OFFICE_MARKET_SUMMARY.takeUpEvolution} />
        <SummaryCard label="Prime yield" value={`${OFFICE_MARKET_SUMMARY.yieldPrime} %`} />
        <SummaryCard label="Overall vacancy" value={`${OFFICE_MARKET_SUMMARY.vacanceGlobale} %`} />
        <SummaryCard label="Under construction" value={`${(OFFICE_MARKET_SUMMARY.pipelineEnConstruction).toLocaleString("fr-LU")} m\u00B2`} />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Search a submarket..." />
        </div>
        <ExportCSVButton onClick={handleExportCSV} />
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left font-semibold text-navy hover:text-navy-light" onClick={() => handleSort("nom")}>
                <span className="inline-flex items-center gap-1">Submarket<span className="text-xs">{sortField === "nom" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B4\u25BE"}</span></span>
              </th>
              <SortableHeader label="Prime rent (EUR/sqm/mo)" field="loyerPrime" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Average rent" field="loyerMoyen" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Vacancy (%)" field="vacance" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Stock (sqm)" field="stock" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-navy">Trend</th>
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
                <td className="px-4 py-2.5 text-right"><TrendBadge t={o.tendance} /></td>
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
// Tab: Retail
// ---------------------------------------------------------------------------

function TabRetail() {
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
    const headers = ["Location", "Type", "Prime rent (EUR/sqm/mo)", "Average rent", "Trend"];
    const rows = filtered.map((r) => [r.nom, r.type, r.loyerPrime, r.loyerMoyen, r.tendance]);
    downloadCSV("market-retail.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Search a location..." />
        </div>
        <ExportCSVButton onClick={handleExportCSV} />
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left font-semibold text-navy hover:text-navy-light" onClick={() => handleSort("nom")}>
                <span className="inline-flex items-center gap-1">Location<span className="text-xs">{sortField === "nom" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B4\u25BE"}</span></span>
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-navy">Type</th>
              <SortableHeader label="Prime rent (EUR/sqm/mo)" field="loyerPrime" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Average rent" field="loyerMoyen" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-navy">Trend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.nom} className="border-b border-card-border/50 hover:bg-background/50" title={r.note}>
                <td className="px-4 py-2.5 font-medium text-navy">{r.nom}</td>
                <td className="px-4 py-2.5"><RetailTypeBadge t={r.type} /></td>
                <td className="px-4 py-2.5 text-right font-mono">{r.loyerPrime} \u20AC</td>
                <td className="px-4 py-2.5 text-right font-mono">{r.loyerMoyen} \u20AC</td>
                <td className="px-4 py-2.5 text-right"><TrendBadge t={r.tendance} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SourceList sources={[
        { nom: "INOWAI Retail Market Report", url: "https://www.inowai.com/en/real-estate-research-data/", frequence: "Biannual" },
        { nom: "JLL Annual Review", url: "https://www.jll.com/en-belux/insights/market-dynamics/luxembourg-office", frequence: "Annual" },
      ]} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Logistics
// ---------------------------------------------------------------------------

function TabLogistics() {
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
    const headers = ["Zone", "Min rent (EUR/sqm/mo)", "Max rent", "Estimated stock (sqm)", "Trend"];
    const rows = filtered.map((z) => [z.nom, z.loyerMin, z.loyerMax, z.stockEstime, z.tendance]);
    downloadCSV("market-logistics.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Search a zone..." />
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
              <SortableHeader label="Min rent (EUR/sqm/mo)" field="loyerMin" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Max rent" field="loyerMax" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Estimated stock (sqm)" field="stockEstime" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-navy">Trend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((z) => (
              <tr key={z.nom} className="border-b border-card-border/50 hover:bg-background/50" title={z.note}>
                <td className="px-4 py-2.5 font-medium text-navy">{z.nom}</td>
                <td className="px-4 py-2.5 text-right font-mono">{z.loyerMin} \u20AC</td>
                <td className="px-4 py-2.5 text-right font-mono">{z.loyerMax} \u20AC</td>
                <td className="px-4 py-2.5 text-right font-mono">{z.stockEstime.toLocaleString("fr-LU")}</td>
                <td className="px-4 py-2.5 text-right"><TrendBadge t={z.tendance} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SourceList sources={[
        { nom: "Savills Luxembourg Logistics", url: "https://www.savills.lu/research-and-news/research.aspx", frequence: "Annual" },
        { nom: "BNP Paribas RE Logistics", url: "https://www.realestate.bnpparibas.lu/en/press/logistics-capital-markets", frequence: "Annual" },
        { nom: "WarehouseRentInfo.lu", url: "https://www.warehouserentinfo.lu/", frequence: "Live" },
      ]} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Land
// ---------------------------------------------------------------------------

function TabLand() {
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
    const headers = ["Zone", "Price/sqm", "Price/are", "Change"];
    const rows = sorted.map((z) => [z.zone, z.prixM2, z.prixMedianAre, z.evolution]);
    downloadCSV("market-land.csv", headers, rows);
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
              <SortableHeader label="Price/sqm" field="prixM2" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Price/are" field="prixMedianAre" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-navy">Change</th>
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
        { nom: "Observatoire de l'Habitat — Report #19 (land prices)", url: "https://gouvernement.lu/dam-assets/images-documents/actualites/2025/10/10-observatoire-habitat-rapport/oh-rapport-analyse-19.pdf", frequence: "Annual" },
        { nom: "Observatoire de l'Habitat — Report #15 (segmentation)", url: "https://gouvernement.lu/dam-assets/images-documents/actualites/2025/02/11-observatoire-habitat/rapport-analyse-15-segmentation-foncier.pdf", frequence: "Annual" },
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
    const headers = ["Indicator", "Value", "Detail"];
    const rows = [
      ["Average mortgage rate", `${MACRO_DATA.tauxHypothecaire.taux} %`, `${MACRO_DATA.tauxHypothecaire.date} - ${MACRO_DATA.tauxHypothecaire.source}`],
      ["Construction cost index", MACRO_DATA.indiceCoutConstruction.evolution, `${MACRO_DATA.indiceCoutConstruction.date} - ${MACRO_DATA.indiceCoutConstruction.source}`],
      ["Residential rental yield", MACRO_DATA.rendementLocatifResidentiel.brut, `Gross - ${MACRO_DATA.rendementLocatifResidentiel.source}`],
      ["CRE investment 2025 - Total", String(inv.total), ""],
      ["CRE investment 2025 - Offices", `${(inv.bureaux * 100).toFixed(0)} %`, String(Math.round(inv.total * inv.bureaux))],
      ["CRE investment 2025 - Retail", `${(inv.retail * 100).toFixed(0)} %`, String(Math.round(inv.total * inv.retail))],
      ["CRE investment 2025 - Logistics", `${(inv.logistique * 100).toFixed(0)} %`, String(Math.round(inv.total * inv.logistique))],
      ["CRE investment 2025 - Other", `${(inv.autre * 100).toFixed(0)} %`, String(Math.round(inv.total * inv.autre))],
    ];
    downloadCSV("market-macro.csv", headers, rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportCSVButton onClick={handleExportCSV} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MacroCard
          label="Average mortgage rate"
          value={`${MACRO_DATA.tauxHypothecaire.taux} %`}
          sub={`${MACRO_DATA.tauxHypothecaire.date} \u2014 ${MACRO_DATA.tauxHypothecaire.source}`}
        />
        <MacroCard
          label="Construction cost index"
          value={MACRO_DATA.indiceCoutConstruction.evolution}
          sub={`${MACRO_DATA.indiceCoutConstruction.date} \u2014 ${MACRO_DATA.indiceCoutConstruction.source}`}
        />
        <MacroCard
          label="Residential rental yield"
          value={MACRO_DATA.rendementLocatifResidentiel.brut}
          sub={`Gross \u2014 ${MACRO_DATA.rendementLocatifResidentiel.source}`}
        />
        <MacroCard
          label="CRE investment 2025"
          value={formatEUR(inv.total)}
          sub="Total commercial real estate"
        />
      </div>

      {/* CRE breakdown */}
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-navy">CRE investment breakdown ({MACRO_DATA.investissementCRE2025.total > 0 ? formatEUR(inv.total) : "\u2014"})</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Offices", pct: inv.bureaux },
            { label: "Retail", pct: inv.retail },
            { label: "Logistics", pct: inv.logistique },
            { label: "Other", pct: inv.autre },
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

export default function MarketDatabasePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("residential");

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Market Database
          </h1>
          <p className="mt-2 text-muted">
            Prices, rents and indicators for the Luxembourg real estate market — All data in one place
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
        {activeTab === "residential" && <TabResidential />}
        {activeTab === "offices" && <TabOffices />}
        {activeTab === "retail" && <TabRetail />}
        {activeTab === "logistics" && <TabLogistics />}
        {activeTab === "land" && <TabLand />}
        {activeTab === "macro" && <TabMacro />}
      </div>
    </div>
  );
}
