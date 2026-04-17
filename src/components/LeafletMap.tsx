"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { MarketDataCommune } from "@/lib/market-data";
import { COMMUNE_COORDS } from "@/lib/communes-coords";
import { formatEUR } from "@/lib/calculations";
import { getGeoportailWMSUrl } from "@/lib/geoportail";

// Leaflet est importé dynamiquement côté client uniquement
let L: typeof import("leaflet") | null = null;

function getPriceColor(prix: number | null): string {
  if (!prix) return "#9CA3AF";
  if (prix >= 10000) return "#DC2626";
  if (prix >= 9000) return "#EA580C";
  if (prix >= 8000) return "#D97706";
  if (prix >= 7000) return "#CA8A04";
  if (prix >= 6000) return "#65A30D";
  if (prix >= 5000) return "#16A34A";
  return "#059669";
}

function getRadius(nbTransactions: number | null): number {
  if (!nbTransactions) return 8;
  if (nbTransactions > 200) return 18;
  if (nbTransactions > 100) return 14;
  if (nbTransactions > 50) return 11;
  if (nbTransactions > 20) return 9;
  return 7;
}

type PriceField = "prixM2Existant" | "prixM2VEFA" | "prixM2Annonces";
type ViewMode = PriceField | "rendement";

function computeYield(commune: MarketDataCommune): number | null {
  if (!commune.loyerM2Annonces || !commune.prixM2Existant) return null;
  return (commune.loyerM2Annonces * 12) / commune.prixM2Existant * 100;
}

function getYieldMarkerColor(yieldPct: number | null): string {
  if (yieldPct == null) return "#9CA3AF";
  if (yieldPct >= 4) return "#16A34A"; // green
  if (yieldPct >= 3) return "#D97706"; // amber
  return "#DC2626"; // red
}

interface LeafletMapProps {
  communes: MarketDataCommune[];
  onSelectCommune: (commune: MarketDataCommune) => void;
  selectedCommune?: string;
  priceField?: PriceField;
  viewMode?: ViewMode;
  /** Allow the parent to control the cadastre overlay externally */
  showCadastre?: boolean;
  /** Callback when the cadastre toggle changes */
  onToggleCadastre?: (show: boolean) => void;
  /** Translated label for the cadastre toggle */
  cadastreLabel?: string;
}

export default function LeafletMap({
  communes,
  onSelectCommune,
  priceField = "prixM2Existant",
  viewMode,
  showCadastre: externalShowCadastre,
  onToggleCadastre,
  cadastreLabel = "Cadastre",
}: LeafletMapProps) {
  const isRendement = viewMode === "rendement";
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const cadastreLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const [ready, setReady] = useState(false);
  const [internalShowCadastre, setInternalShowCadastre] = useState(false);
  const [basemap, setBasemap] = useState<"osm" | "satellite">("osm");

  // If parent controls cadastre, use that; otherwise use internal state
  const showCadastre = externalShowCadastre ?? internalShowCadastre;

  const handleToggleCadastre = useCallback(
    (val: boolean) => {
      if (onToggleCadastre) {
        onToggleCadastre(val);
      } else {
        setInternalShowCadastre(val);
      }
    },
    [onToggleCadastre],
  );

  useEffect(() => {
    // Import dynamique Leaflet + CSS
    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([leaflet]) => {
      L = leaflet.default || leaflet;
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready || !L || !mapRef.current) return;

    // Clean up previous map instance before recreating
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      cadastreLayerRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [49.75, 6.15],
      zoom: 9,
      zoomControl: true,
      attributionControl: true,
    });

    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    });
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        maxZoom: 19,
      }
    );
    const activeLayer = basemap === "satellite" ? satelliteLayer : osmLayer;
    activeLayer.addTo(map);
    baseLayerRef.current = activeLayer;

    // Ajouter les marqueurs
    for (const commune of communes) {
      const coords = COMMUNE_COORDS[commune.commune];
      if (!coords) continue;

      const prix = commune[priceField];
      const yieldPct = computeYield(commune);
      const color = isRendement ? getYieldMarkerColor(yieldPct) : getPriceColor(prix);
      const radius = getRadius(commune.nbTransactions);

      const marker = L.circleMarker(coords, {
        radius,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.8,
      }).addTo(map);

      const tooltipContent = isRendement
        ? `<strong>${commune.commune}</strong><br/>${yieldPct != null ? yieldPct.toFixed(2) + " % rendement" : "—"}`
        : `<strong>${commune.commune}</strong><br/>${prix ? formatEUR(prix) + "/m²" : "—"}`;

      marker.bindTooltip(tooltipContent, { direction: "top", offset: [0, -radius] });

      marker.on("click", () => onSelectCommune(commune));
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      cadastreLayerRef.current = null;
      baseLayerRef.current = null;
    };
  }, [ready, communes, onSelectCommune, priceField, isRendement, basemap]);

  // Manage cadastre overlay layer independently so toggling doesn't recreate the whole map
  useEffect(() => {
    if (!ready || !L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (showCadastre && !cadastreLayerRef.current) {
      try {
        const { url, options } = getGeoportailWMSUrl("cadastre");
        cadastreLayerRef.current = L.tileLayer.wms(url, {
          ...options,
          maxZoom: 20,
        } as L.WMSOptions).addTo(map);
      } catch {
        // Graceful degradation: if layer fails, ignore
      }
    } else if (!showCadastre && cadastreLayerRef.current) {
      map.removeLayer(cadastreLayerRef.current);
      cadastreLayerRef.current = null;
    }
  }, [ready, showCadastre]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-xl border border-card-border bg-card">
        <p className="text-muted text-sm">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="h-[500px] rounded-xl border border-card-border shadow-sm" />
      {/* Basemap toggle */}
      <div className="absolute top-3 left-3 z-[1000] flex gap-0.5 rounded-lg bg-white/90 backdrop-blur-sm border border-card-border p-0.5 shadow-sm">
        <button
          onClick={() => setBasemap("osm")}
          className={`rounded px-2.5 py-1 text-[10px] font-medium transition-colors ${
            basemap === "osm" ? "bg-navy text-white" : "text-slate hover:bg-background"
          }`}
        >
          Carte
        </button>
        <button
          onClick={() => setBasemap("satellite")}
          className={`rounded px-2.5 py-1 text-[10px] font-medium transition-colors ${
            basemap === "satellite" ? "bg-navy text-white" : "text-slate hover:bg-background"
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Cadastre overlay toggle */}
      <div className="absolute top-3 right-3 z-[1000]">
        <label className="flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur-sm border border-card-border px-3 py-1.5 shadow-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showCadastre}
            onChange={(e) => handleToggleCadastre(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs font-medium text-slate">{cadastreLabel}</span>
        </label>
      </div>

      {/* Légende gradient (heatmap 0-15k €/m²) */}
      {!isRendement && (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/95 backdrop-blur-sm border border-card-border px-3 py-2 shadow-sm">
          <div className="text-[10px] font-semibold text-navy mb-1">€/m² existant</div>
          <div className="flex items-center gap-1">
            <div
              className="h-3 w-36 rounded"
              style={{
                background: "linear-gradient(90deg, #059669 0%, #16A34A 20%, #65A30D 35%, #CA8A04 55%, #D97706 70%, #EA580C 85%, #DC2626 100%)",
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-muted font-mono">
            <span>&lt; 5k</span>
            <span>7k</span>
            <span>9k</span>
            <span>11k</span>
            <span>&gt; 13k</span>
          </div>
          <div className="mt-1 text-[9px] text-muted italic">Taille = nb. transactions</div>
        </div>
      )}
      {isRendement && (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/95 backdrop-blur-sm border border-card-border px-3 py-2 shadow-sm">
          <div className="text-[10px] font-semibold text-navy mb-1">Rendement brut</div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#DC2626" }} /> &lt; 3 %
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#D97706" }} /> 3-4 %
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#16A34A" }} /> &gt; 4 %
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
