"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { INDICES_PRIX_ANNUELS } from "@/lib/adjustments";

const data = Object.entries(INDICES_PRIX_ANNUELS).map(([annee, variation]) => ({
  annee: Number(annee),
  variation,
}));

// Calculer l'indice cumulé (base 100 en 2015)
let indice = 100;
const dataWithIndex = data.map((d) => {
  indice = indice * (1 + d.variation / 100);
  return { ...d, indice: Math.round(indice * 10) / 10 };
});

export function PriceEvolutionChart({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "" : "rounded-xl border border-card-border bg-card p-4 shadow-sm"}>
      {!compact && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-navy">Évolution des prix résidentiels au Luxembourg</h3>
          <p className="text-[10px] text-muted">Variation annuelle en % — Source : STATEC / Observatoire de l'Habitat</p>
        </div>
      )}
      <ResponsiveContainer width="100%" height={compact ? 120 : 200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="colorVar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1B2A4A" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#1B2A4A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="annee" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            formatter={(value) => [`${Number(value) > 0 ? "+" : ""}${value}%`, "Variation"]}
            labelFormatter={(label) => `Année ${label}`}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e2db" }}
          />
          <ReferenceLine y={0} stroke="#DC2626" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Area type="monotone" dataKey="variation" stroke="#1B2A4A" fill="url(#colorVar)" strokeWidth={2} dot={{ r: 3, fill: "#1B2A4A" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriceIndexChart() {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-navy">Indice des prix (base 100 = 2015)</h3>
        <p className="text-[10px] text-muted">Évolution cumulée — Source : STATEC</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={dataWithIndex} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="colorIdx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C8A951" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#C8A951" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="annee" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [Number(value).toFixed(1), "Indice"]}
            labelFormatter={(label) => `Année ${label}`}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e2db" }}
          />
          <ReferenceLine y={100} stroke="#6B7280" strokeDasharray="3 3" strokeOpacity={0.3} label={{ value: "Base 100", fontSize: 9, fill: "#6B7280" }} />
          <Area type="monotone" dataKey="indice" stroke="#C8A951" fill="url(#colorIdx)" strokeWidth={2} dot={{ r: 3, fill: "#C8A951" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
