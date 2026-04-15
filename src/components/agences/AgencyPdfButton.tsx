"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listMyOrganizations, type Organization } from "@/lib/orgs";
import type {
  AgencyPdfEstimation,
  AgencyPdfFees,
  AgencyPdfAides,
  AgencyPdfProspect,
} from "./AgencyEstimationPdf";

interface Props {
  estimation: AgencyPdfEstimation;
  fees?: AgencyPdfFees;
  aides?: AgencyPdfAides;
  prospect?: AgencyPdfProspect;
  className?: string;
}

export default function AgencyPdfButton({ estimation, fees, aides, prospect, className }: Props) {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    listMyOrganizations()
      .then((list) => {
        setOrgs(list);
        if (list.length > 0) setActiveOrgId(list[0].id);
      })
      .catch(() => {});
  }, [user]);

  if (!user || !isSupabaseConfigured || orgs.length === 0) return null;

  const handleGenerate = async () => {
    if (!activeOrgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/agences/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: activeOrgId, estimation, fees, aides, prospect }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estimation-${estimation.commune}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de génération PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {orgs.length > 1 && (
          <select
            value={activeOrgId ?? ""}
            onChange={(e) => setActiveOrgId(e.target.value)}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs"
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading || !activeOrgId}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-muted transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          {loading ? "Génération…" : "PDF agence"}
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-rose-700">{error}</div>}
    </div>
  );
}
