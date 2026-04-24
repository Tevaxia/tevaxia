"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import AiAnalysisCard from "@/components/AiAnalysisCard";

interface CriterionScore {
  id: string;
  category: string;
  label: string;
  points: number;
  achieved: boolean;
}

const GREEN_KEY_CRITERIA: Omit<CriterionScore, "achieved">[] = [
  { id: "mgt1", category: "Management", label: "Politique environnementale écrite signée", points: 3 },
  { id: "mgt2", category: "Management", label: "Coordinateur environnemental nommé", points: 2 },
  { id: "mgt3", category: "Management", label: "Comité environnemental actif", points: 2 },
  { id: "mgt4", category: "Management", label: "Formation staff développement durable", points: 2 },
  { id: "mgt5", category: "Management", label: "Objectifs annuels quantifiés (eau, énergie, déchets)", points: 3 },
  { id: "eau1", category: "Eau", label: "Économiseurs d'eau dans toutes les SDB", points: 2 },
  { id: "eau2", category: "Eau", label: "Réutilisation serviettes / draps proposée", points: 2 },
  { id: "eau3", category: "Eau", label: "Recyclage eau grise ou pluie", points: 3 },
  { id: "eau4", category: "Eau", label: "Relevé consommation mensuel", points: 2 },
  { id: "eau5", category: "Eau", label: "Consommation < benchmark 250L/pax/nuit", points: 3 },
  { id: "en1", category: "Énergie", label: "LED dans > 90% des luminaires", points: 3 },
  { id: "en2", category: "Énergie", label: "Isolation thermique (CPE classe A ou B)", points: 3 },
  { id: "en3", category: "Énergie", label: "Chauffage renouvelable (PAC, biomasse, solaire)", points: 3 },
  { id: "en4", category: "Énergie", label: "Panneaux photovoltaïques", points: 2 },
  { id: "en5", category: "Énergie", label: "Détecteurs de présence parties communes", points: 2 },
  { id: "en6", category: "Énergie", label: "Clés magnétiques pour couper l'élec chambre", points: 2 },
  { id: "dec1", category: "Déchets", label: "Tri sélectif complet (papier, verre, plastique, bio)", points: 3 },
  { id: "dec2", category: "Déchets", label: "Suppression produits jetables (savonnettes, bouteilles plastique)", points: 2 },
  { id: "dec3", category: "Déchets", label: "Compost déchets organiques F&B", points: 2 },
  { id: "dec4", category: "Déchets", label: "Partenariat anti-gaspillage alimentaire", points: 3 },
  { id: "fb1", category: "F&B", label: "Produits bio ou locaux > 30%", points: 2 },
  { id: "fb2", category: "F&B", label: "Option végétarienne / végane menu", points: 2 },
  { id: "fb3", category: "F&B", label: "Café / thé commerce équitable", points: 2 },
  { id: "fb4", category: "F&B", label: "Suppression pailles plastiques, vaisselle jetable", points: 2 },
  { id: "tr1", category: "Transport", label: "Bornes de recharge véhicules électriques", points: 2 },
  { id: "tr2", category: "Transport", label: "Location vélos ou accord loueur local", points: 2 },
  { id: "tr3", category: "Transport", label: "Info transport en commun (carte, horaires CFL)", points: 2 },
  { id: "com1", category: "Communication", label: "Affichage actions durables visibles (hall, chambres)", points: 2 },
  { id: "com2", category: "Communication", label: "Newsletter ou rapport annuel ESG", points: 2 },
];

const GK_THRESHOLD = 40;

export default function GreenKeyCalculator() {
  const t = useTranslations("hotelCertifsEsg");
  const [achieved, setAchieved] = useState<Record<string, boolean>>({});
  const [hotelName, setHotelName] = useState("");

  const toggle = (id: string) => setAchieved((prev) => ({ ...prev, [id]: !prev[id] }));

  const stats = useMemo(() => {
    const achievedItems = GREEN_KEY_CRITERIA.filter((c) => achieved[c.id]);
    const score = achievedItems.reduce((s, c) => s + c.points, 0);
    const maxScore = GREEN_KEY_CRITERIA.reduce((s, c) => s + c.points, 0);
    const byCategory: Record<string, { got: number; max: number }> = {};
    for (const c of GREEN_KEY_CRITERIA) {
      if (!byCategory[c.category]) byCategory[c.category] = { got: 0, max: 0 };
      byCategory[c.category].max += c.points;
      if (achieved[c.id]) byCategory[c.category].got += c.points;
    }
    const eligible = score >= GK_THRESHOLD;
    return { score, maxScore, pct: (score / maxScore) * 100, byCategory, eligible };
  }, [achieved]);

  const categories = useMemo(() => {
    const set = new Set(GREEN_KEY_CRITERIA.map((c) => c.category));
    return Array.from(set);
  }, []);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 text-muted">{t("pageSubtitle", { threshold: GK_THRESHOLD })}</p>
        </div>

        <div className="mb-6">
          <input type="text" placeholder={t("hotelNamePlaceholder")} value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
            className="w-full max-w-md rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
        </div>

        <div className={`rounded-2xl p-6 text-white shadow-lg ${stats.eligible ? "bg-gradient-to-br from-emerald-600 to-green-600" : "bg-gradient-to-br from-slate-600 to-slate-700"}`}>
          <div className="text-xs uppercase tracking-wider text-white/70">{stats.eligible ? t("eligibleLabel") : t("notEligibleLabel")}</div>
          <div className="mt-1 text-4xl font-bold">{stats.score} / {stats.maxScore}</div>
          <div className="mt-1 text-sm text-white/70">
            {t("scoreExplain", { pct: stats.pct.toFixed(0), threshold: GK_THRESHOLD })}
          </div>
          {!stats.eligible && (
            <div className="mt-2 text-sm text-white/80">
              {t("missingPoints", { n: GK_THRESHOLD - stats.score })}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {Object.entries(stats.byCategory).map(([cat, s]) => (
            <div key={cat} className="rounded-xl border border-card-border bg-card p-4">
              <div className="text-xs text-muted">{cat}</div>
              <div className="mt-1 text-lg font-bold text-navy">{s.got} / {s.max}</div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s.max > 0 ? (s.got / s.max) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        {categories.map((cat) => (
          <div key={cat} className="mt-6 rounded-xl border border-card-border bg-card overflow-hidden">
            <div className="border-b border-card-border bg-background px-4 py-2">
              <h2 className="text-sm font-semibold text-navy">{cat} {t("categoryCount", { n: GREEN_KEY_CRITERIA.filter((c) => c.category === cat).length })}</h2>
            </div>
            <div className="divide-y divide-card-border/50">
              {GREEN_KEY_CRITERIA.filter((c) => c.category === cat).map((c) => (
                <label key={c.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-background">
                  <input type="checkbox" checked={!!achieved[c.id]} onChange={() => toggle(c.id)}
                    className="h-4 w-4 rounded" />
                  <span className={`flex-1 text-sm ${achieved[c.id] ? "text-navy font-medium" : "text-slate"}`}>{c.label}</span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">{c.points} pt</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6">
          <AiAnalysisCard
            context={[
              `Pré-diagnostic Green Key — ${hotelName || "Hôtel"}`,
              `Score: ${stats.score}/${stats.maxScore} (${stats.pct.toFixed(0)}%)`,
              `Éligibilité label (seuil ${GK_THRESHOLD} pts) : ${stats.eligible ? "OUI" : "NON"}`,
              "",
              `Détail par catégorie:`,
              ...Object.entries(stats.byCategory).map(([k, v]) => `  ${k}: ${v.got}/${v.max}`),
            ].join("\n")}
            prompt="Analyse ce pré-diagnostic Green Key au Luxembourg. Livre : (1) catégories à prioriser pour franchir le seuil (meilleur rapport points/effort), (2) investissements concrets par catégorie (LED 2-5k€, bornes VE 3-10k€, PAC 15-40k€, panneaux PV 1000€/kWc), (3) aides LU pour financer la démarche (myenergy audit, Klimabonus, PRIMe House, aides communales), (4) impact marketing/RevPAR du label (études montrent +3-8% ADR sur segment conscient), (5) certifications complémentaires pertinentes LU (LENOZ bâtiment neuf, BREEAM In-Use pour existant, EcoLabel UE, ISO 14001, B Corp). Référence Green Key Foundation + myenergy + IMS Luxembourg."
          />
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>{t("aboutStrong")}</strong> {t("aboutBody")}{" "}
          <a href="https://www.greenkey.global/" target="_blank" rel="noopener" className="underline">greenkey.global</a>{" "}
          · IMS Luxembourg (<a href="https://www.imslux.lu" target="_blank" rel="noopener" className="underline">imslux.lu</a>).
        </div>
      </div>
    </div>
  );
}
