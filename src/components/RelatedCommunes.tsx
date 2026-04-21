"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import LocaleLink from "./LocaleLink";
import { slugifyCommune, type MarketDataCommune } from "@/lib/market-data";
import { COMMUNE_COORDS } from "@/lib/communes-coords";

type Props = {
  current: MarketDataCommune;
  pool: MarketDataCommune[];
  max?: number;
};

function haversine(a: [number, number], b: [number, number]): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function RelatedCommunes({ current, pool, max = 6 }: Props) {
  const t = useTranslations("commune");

  const neighbours = useMemo(() => {
    const currentCoords = COMMUNE_COORDS[current.commune];
    const others = pool.filter((c) => c.commune !== current.commune);

    const sameCanton = others.filter((c) => c.canton === current.canton);
    const otherCantons = others.filter((c) => c.canton !== current.canton);

    const scored = [
      ...sameCanton.map((c) => ({ c, score: 0, dist: distance(currentCoords, c) })),
      ...otherCantons.map((c) => ({ c, score: 1, dist: distance(currentCoords, c) })),
    ];

    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.dist - b.dist;
    });

    return scored.slice(0, max).map(({ c }) => c);
  }, [current, pool, max]);

  if (neighbours.length === 0) return null;

  return (
    <section className="mt-10 border-t border-card-border pt-8">
      <h2 className="text-lg font-semibold text-navy">{t("relatedTitle")}</h2>
      <p className="mt-1 text-sm text-muted">{t("relatedSubtitle", { canton: current.canton })}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {neighbours.map((c) => (
          <LocaleLink
            key={c.commune}
            href={`/commune/${slugifyCommune(c.commune)}`}
            className="group rounded-xl border border-card-border bg-card p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-sm font-semibold text-navy group-hover:text-gold transition-colors">
                {c.commune}
              </div>
              <div className="text-xs text-muted">{c.canton}</div>
            </div>
            {c.prixM2Existant && (
              <div className="mt-1 text-xs text-slate">
                {c.prixM2Existant.toLocaleString("fr-LU")} EUR/m²
              </div>
            )}
          </LocaleLink>
        ))}
      </div>
    </section>
  );
}

function distance(origin: [number, number] | undefined, target: MarketDataCommune): number {
  if (!origin) return Number.POSITIVE_INFINITY;
  const coords = COMMUNE_COORDS[target.commune];
  if (!coords) return Number.POSITIVE_INFINITY;
  return haversine(origin, coords);
}
