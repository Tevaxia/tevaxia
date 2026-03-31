export function getMarketCycle(tendance: "hausse" | "stable" | "baisse"): {
  phase: string;
  color: string;
  icon: string;
} {
  if (tendance === "hausse") return { phase: "Expansion", color: "text-success", icon: "\u2197" };
  if (tendance === "baisse") return { phase: "Contraction", color: "text-error", icon: "\u2198" };
  return { phase: "Stable", color: "text-muted", icon: "\u2192" };
}
