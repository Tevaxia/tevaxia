"use client";

export default function ConfidenceGauge({ level, note }: { level: "forte" | "moyenne" | "faible"; note: string }) {
  const segments = [
    { key: "faible", label: "Faible", color: "#DC2626" },
    { key: "moyenne", label: "Moyenne", color: "#D97706" },
    { key: "forte", label: "Forte", color: "#059669" },
  ];

  const activeIndex = segments.findIndex((s) => s.key === level);

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <div className="text-xs text-muted mb-3">Indice de confiance</div>
      <div className="flex gap-1.5 mb-2">
        {segments.map((s, i) => (
          <div key={s.key} className="flex-1">
            <div
              className="h-3 rounded-full transition-all"
              style={{
                backgroundColor: i <= activeIndex ? s.color : "#E5E7EB",
                opacity: i <= activeIndex ? 1 : 0.3,
              }}
            />
            <div
              className="text-center mt-1 text-[10px] font-medium"
              style={{ color: i === activeIndex ? s.color : "#9CA3AF" }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <div
        className="text-sm font-semibold text-center mt-1"
        style={{ color: segments[activeIndex]?.color }}
      >
        {segments[activeIndex]?.label}
      </div>
      <p className="mt-2 text-xs text-muted leading-relaxed">{note}</p>
    </div>
  );
}
