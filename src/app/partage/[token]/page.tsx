"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { fetchSharedLinkByToken, postSharedLinkComment, type SharedLinkPublic } from "@/lib/shared-links";
import { isSupabaseConfigured } from "@/lib/supabase";

function CommentForm({ token }: { token: string }) {
  const t = useTranslations("partage");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errKey, setErrKey] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");
    const res = await postSharedLinkComment({
      token,
      message: message.trim(),
      visitorName: name.trim() || undefined,
      visitorEmail: email.trim() || undefined,
    });
    if (res.success) {
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } else {
      setStatus("error");
      setErrKey(res.error ?? "unknown");
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-card-border bg-card p-5 shadow-sm print:hidden">
      <h3 className="text-sm font-semibold text-navy">{t("commentFormTitle")}</h3>
      <p className="mt-0.5 text-xs text-muted">{t("commentFormSubtitle")}</p>
      <form onSubmit={onSubmit} className="mt-3 space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("commentName")}
            maxLength={100}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("commentEmail")}
            maxLength={200}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
          />
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("commentMessage")}
          rows={3}
          maxLength={4000}
          required
          className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted">
            {status === "sent" && <span className="text-emerald-700 font-medium">{t("commentSent")}</span>}
            {status === "error" && errKey === "rate_limited" && <span className="text-amber-700">{t("commentRateLimited")}</span>}
            {status === "error" && errKey !== "rate_limited" && <span className="text-rose-700">{t("commentError")}</span>}
            {status === "idle" && t("commentCharCount", { count: message.length })}
          </p>
          <button
            type="submit"
            disabled={status === "sending" || !message.trim()}
            className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "sending" ? t("commentSending") : t("commentSend")}
          </button>
        </div>
      </form>
    </div>
  );
}

function formatEUR(n: number | undefined | null): string {
  if (n == null || !isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function formatPct(n: number | undefined | null, digits = 1): string {
  if (n == null || !isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)} %`;
}

interface BilanPromoteurPayload {
  inputs: Record<string, unknown>;
  results: {
    caTotal: number;
    caLogements: number;
    caParkings: number;
    coutTerrain: number;
    totalConstruction: number;
    totalFrais: number;
    margeMontant: number;
    margeEffective: number;
    chargeFonciere: number;
    chargeFonciereM2Terrain: number;
    coutsConstruction: number;
    coutsArchitecte: number;
    coutsBET: number;
    coutsEtudes: number;
    coutsAleas: number;
    fFinanciers: number;
    fCommerciaux: number;
    fAssurances: number;
    fGestion: number;
    ratioConstructionCA: number;
    ratioFraisCA: number;
  };
}

function BilanPromoteurView({ payload, title }: { payload: BilanPromoteurPayload; title: string | null | undefined }) {
  const { results, inputs } = payload;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 p-6 text-white shadow-lg">
        <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">Bilan promoteur</div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold">{title || "Opération immobilière"}</div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <div className="text-xs text-white/70">Charge foncière</div>
            <div className="text-lg font-bold">{formatEUR(results.chargeFonciere)}</div>
          </div>
          <div>
            <div className="text-xs text-white/70">CA total</div>
            <div className="text-lg font-bold">{formatEUR(results.caTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-white/70">Marge brute</div>
            <div className="text-lg font-bold">{formatEUR(results.margeMontant)}</div>
          </div>
          <div>
            <div className="text-xs text-white/70">% marge effective</div>
            <div className="text-lg font-bold">{formatPct(results.margeEffective)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Hypothèses opération</h3>
          <dl className="mt-3 divide-y divide-card-border/50 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-muted">Type</dt><dd className="font-medium text-navy">{String(inputs.typeOperation ?? "—")}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Surface vendable</dt><dd className="font-medium text-navy">{String(inputs.surfaceVendable ?? "—")} m²</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Prix de vente</dt><dd className="font-medium text-navy">{formatEUR(Number(inputs.prixVenteM2))} /m²</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Parkings</dt><dd className="font-medium text-navy">{String(inputs.nbParkings ?? 0)} × {formatEUR(Number(inputs.prixParking))}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Surface terrain</dt><dd className="font-medium text-navy">{String(inputs.surfaceTerrain ?? "—")} m²</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Coût construction</dt><dd className="font-medium text-navy">{formatEUR(Number(inputs.coutConstructionM2))} /m²</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Marge promoteur cible</dt><dd className="font-medium text-navy">{Number(inputs.margePromoteur ?? 0)} % CA</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Pré-commercialisation</dt><dd className="font-medium text-navy">{Number(inputs.tauxPreCommercialisation ?? 0)} %</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Compte de résultat</h3>
          <dl className="mt-3 divide-y divide-card-border/50 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-muted">Recettes logements</dt><dd className="font-medium text-navy">{formatEUR(results.caLogements)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Recettes parkings</dt><dd className="font-medium text-navy">{formatEUR(results.caParkings)}</dd></div>
            <div className="flex justify-between py-1.5 font-semibold"><dt className="text-navy">Total recettes</dt><dd className="text-navy">{formatEUR(results.caTotal)}</dd></div>
            {results.coutTerrain > 0 && (
              <div className="flex justify-between py-1.5"><dt className="text-muted">- Terrain</dt><dd className="font-medium text-rose-700">- {formatEUR(results.coutTerrain)}</dd></div>
            )}
            <div className="flex justify-between py-1.5"><dt className="text-muted">- Construction ({formatPct(results.ratioConstructionCA)})</dt><dd className="font-medium text-rose-700">- {formatEUR(results.totalConstruction)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">- Frais & honoraires ({formatPct(results.ratioFraisCA)})</dt><dd className="font-medium text-rose-700">- {formatEUR(results.totalFrais)}</dd></div>
            <div className="flex justify-between py-1.5 font-semibold border-t border-card-border mt-1 pt-2"><dt className="text-navy">Marge brute</dt><dd className="text-amber-700">{formatEUR(results.margeMontant)} ({formatPct(results.margeEffective)})</dd></div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5">
        <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Détail des coûts</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
          <div className="flex justify-between py-1"><span className="text-muted">Construction (gros œuvre)</span><span className="font-medium text-navy">{formatEUR(results.coutsConstruction)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Honoraires architecte</span><span className="font-medium text-navy">{formatEUR(results.coutsArchitecte)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Honoraires BET</span><span className="font-medium text-navy">{formatEUR(results.coutsBET)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Études autres</span><span className="font-medium text-navy">{formatEUR(results.coutsEtudes)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Aléas</span><span className="font-medium text-navy">{formatEUR(results.coutsAleas)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Frais financiers</span><span className="font-medium text-navy">{formatEUR(results.fFinanciers)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Frais commerciaux</span><span className="font-medium text-navy">{formatEUR(results.fCommerciaux)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Assurances</span><span className="font-medium text-navy">{formatEUR(results.fAssurances)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Frais de gestion</span><span className="font-medium text-navy">{formatEUR(results.fGestion)}</span></div>
        </div>
      </div>
    </div>
  );
}

interface HotelValorisationPayload {
  inputs: Record<string, unknown>;
  results: {
    valeurCentrale: number;
    fourchetteBasse: number;
    fourchetteHaute: number;
    valeurDCF: number;
    valeurMultipleParChambre: number;
    multipleEbitda: number;
    revPAR: number;
    revenuRoomsAnnuel: number;
    revenuTotalAnnuel: number;
    breakdown: { fb: number; autres: number };
    charges: { staff: number; energy: number; other: number; total: number };
    gop: number;
    gopMargin: number;
    ffe: number;
    ebitda: number;
    ebitdaMargin: number;
    capRateUsed: number;
    pricePerKeyUsed: number;
  };
}

function HotelValorisationView({ payload, title }: { payload: HotelValorisationPayload; title: string | null | undefined }) {
  const { results, inputs } = payload;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-purple-700 to-purple-900 p-6 text-white shadow-lg">
        <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">Valorisation hôtelière</div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold">{title || "Hôtel"}</div>
        <div className="mt-3 text-sm text-white/70">Valeur de marché estimée</div>
        <div className="mt-1 text-3xl sm:text-4xl font-bold">{formatEUR(results.valeurCentrale)}</div>
        <div className="mt-2 text-sm text-white/80">
          Fourchette : {formatEUR(results.fourchetteBasse)} – {formatEUR(results.fourchetteHaute)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1">DCF : {formatEUR(results.valeurDCF)}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Multiple : {formatEUR(results.valeurMultipleParChambre)}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">x{results.multipleEbitda?.toFixed?.(1) ?? "—"} EBITDA</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Caractéristiques</h3>
          <dl className="mt-3 divide-y divide-card-border/50 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-muted">Chambres</dt><dd className="font-medium text-navy">{String(inputs.nbChambres ?? "—")}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Catégorie</dt><dd className="font-medium text-navy">{String(inputs.category ?? "—")}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">ADR</dt><dd className="font-medium text-navy">{formatEUR(Number(inputs.adr))} /nuit</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Occupation</dt><dd className="font-medium text-navy">{Math.round(Number(inputs.occupancy ?? 0) * 100)} %</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">RevPAR</dt><dd className="font-medium text-navy">{formatEUR(results.revPAR)} /nuit/chambre</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Compte d&apos;exploitation</h3>
          <dl className="mt-3 divide-y divide-card-border/50 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-muted">Revenu chambres</dt><dd className="font-medium text-navy">{formatEUR(results.revenuRoomsAnnuel)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">F&amp;B</dt><dd className="font-medium text-navy">{formatEUR(results.breakdown?.fb)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Autres (MICE, spa…)</dt><dd className="font-medium text-navy">{formatEUR(results.breakdown?.autres)}</dd></div>
            <div className="flex justify-between py-1.5 font-semibold"><dt className="text-navy">Revenu total</dt><dd className="text-navy">{formatEUR(results.revenuTotalAnnuel)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">- Charges totales</dt><dd className="font-medium text-rose-700">- {formatEUR(results.charges?.total)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">GOP ({formatPct(results.gopMargin)})</dt><dd className="font-medium text-emerald-700">{formatEUR(results.gop)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">- Réserve FF&amp;E</dt><dd className="font-medium text-rose-700">- {formatEUR(results.ffe)}</dd></div>
            <div className="flex justify-between py-1.5 font-semibold border-t border-card-border mt-1 pt-2"><dt className="text-navy">EBITDA ({formatPct(results.ebitdaMargin)})</dt><dd className="text-purple-700">{formatEUR(results.ebitda)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5">
        <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Méthodologie</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
          <div className="flex justify-between py-1"><span className="text-muted">Cap rate appliqué</span><span className="font-medium text-navy">{formatPct(results.capRateUsed, 2)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Prix/chambre comparable</span><span className="font-medium text-navy">{formatEUR(results.pricePerKeyUsed)}</span></div>
        </div>
      </div>
    </div>
  );
}

interface HotelDscrPayload {
  inputs: Record<string, unknown>;
  results: {
    dscrCentral: number;
    dscrStressOccupation: number;
    dscrStressADR: number;
    dscrStressDouble: number;
    diagnostic: string;
    diagnosticLabel: string;
    montantDette: number;
    ltv: number;
    mensualite: number;
    serviceDetteAnnuel: number;
    maxEmpruntable: number;
    totalInterets: number;
    coutTotalCredit: number;
  };
}

function HotelDscrView({ payload, title }: { payload: HotelDscrPayload; title: string | null | undefined }) {
  const { results, inputs } = payload;
  const diagColors: Record<string, string> = {
    critique: "from-rose-600 to-rose-800",
    limite: "from-amber-600 to-amber-800",
    sain: "from-emerald-600 to-emerald-800",
    fort: "from-emerald-700 to-emerald-900",
  };
  const grad = diagColors[results.diagnostic] ?? "from-blue-700 to-blue-900";

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl bg-gradient-to-br ${grad} p-6 text-white shadow-lg`}>
        <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">DSCR &amp; financement hôtel</div>
        <div className="mt-2 text-xl font-semibold">{title || "Simulation de financement"}</div>
        <div className="mt-4 text-sm text-white/80">DSCR central</div>
        <div className="mt-1 text-5xl font-bold">{results.dscrCentral?.toFixed?.(2)}</div>
        <div className="mt-1 text-sm text-white/90">{results.diagnosticLabel}</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Stress tests</h3>
          <dl className="mt-3 divide-y divide-card-border/50 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-muted">Central</dt><dd className="font-semibold text-navy">{results.dscrCentral?.toFixed?.(2)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Occupation -10 pts</dt><dd className={`font-medium ${results.dscrStressOccupation < 1 ? "text-rose-700" : "text-navy"}`}>{results.dscrStressOccupation?.toFixed?.(2)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">ADR -10 %</dt><dd className={`font-medium ${results.dscrStressADR < 1 ? "text-rose-700" : "text-navy"}`}>{results.dscrStressADR?.toFixed?.(2)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Double choc</dt><dd className={`font-medium ${results.dscrStressDouble < 1 ? "text-rose-700" : "text-navy"}`}>{results.dscrStressDouble?.toFixed?.(2)}</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Structure de financement</h3>
          <dl className="mt-3 divide-y divide-card-border/50 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-muted">Total projet</dt><dd className="font-medium text-navy">{formatEUR(Number(inputs.prixAcquisition ?? 0) + Number(inputs.travaux ?? 0))}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Apport</dt><dd className="font-medium text-navy">{formatEUR(Number(inputs.apport))}</dd></div>
            <div className="flex justify-between py-1.5 font-semibold"><dt className="text-navy">Dette</dt><dd className="text-navy">{formatEUR(results.montantDette)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">LTV</dt><dd className={`font-medium ${results.ltv > 0.75 ? "text-rose-700" : "text-navy"}`}>{formatPct(results.ltv, 1)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Mensualité</dt><dd className="font-medium text-navy">{formatEUR(results.mensualite)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Service dette annuel</dt><dd className="font-medium text-navy">{formatEUR(results.serviceDetteAnnuel)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5">
        <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Capacité d&apos;emprunt &amp; coût du crédit</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
          <div className="flex justify-between py-1"><span className="text-muted">Max empruntable (DSCR {Number(inputs.dscrCible ?? 0).toFixed(2)})</span><span className="font-semibold text-navy">{formatEUR(results.maxEmpruntable)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Capital emprunté</span><span className="font-medium text-navy">{formatEUR(results.montantDette)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Total intérêts</span><span className="font-medium text-navy">{formatEUR(results.totalInterets)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Coût total crédit</span><span className="font-semibold text-navy">{formatEUR(results.coutTotalCredit)}</span></div>
        </div>
      </div>
    </div>
  );
}

interface EstimationPayload {
  inputs: Record<string, unknown>;
  results: {
    estimationBasse: number;
    estimationCentrale: number;
    estimationHaute: number;
    prixM2Ajuste: number;
    confiance: string;
    ajustements: Array<{ label: string; pct: number }>;
  };
}

function EstimationView({ payload, title }: { payload: EstimationPayload; title: string | null | undefined }) {
  const { results, inputs } = payload;
  const confBg: Record<string, string> = {
    forte: "from-emerald-600 to-emerald-800",
    moyenne: "from-amber-500 to-amber-700",
    faible: "from-rose-500 to-rose-700",
  };
  return (
    <div className="space-y-6">
      <div className={`rounded-2xl bg-gradient-to-br ${confBg[results.confiance] ?? "from-navy to-navy-light"} p-6 text-white shadow-lg`}>
        <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">Estimation immobilière</div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold">{title || "Estimation"}</div>
        <div className="mt-4 text-sm text-white/80">Estimation centrale</div>
        <div className="mt-1 text-4xl font-bold">{formatEUR(results.estimationCentrale)}</div>
        <div className="mt-2 text-sm text-white/90">
          Fourchette : {formatEUR(results.estimationBasse)} – {formatEUR(results.estimationHaute)}
        </div>
        <div className="mt-2 text-xs text-white/80">
          Prix au m² ajusté : <span className="font-semibold">{formatEUR(results.prixM2Ajuste)}</span>
          {" · Confiance : "}<span className="font-semibold capitalize">{results.confiance}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Bien</h3>
          <dl className="mt-3 divide-y divide-card-border/50 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-muted">Commune</dt><dd className="font-medium text-navy">{String(inputs.commune ?? "—")}</dd></div>
            {inputs.quartier ? <div className="flex justify-between py-1.5"><dt className="text-muted">Quartier</dt><dd className="font-medium text-navy">{String(inputs.quartier)}</dd></div> : null}
            <div className="flex justify-between py-1.5"><dt className="text-muted">Surface</dt><dd className="font-medium text-navy">{String(inputs.surface ?? "—")} m²</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Chambres</dt><dd className="font-medium text-navy">{String(inputs.nbChambres ?? "—")}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Étage</dt><dd className="font-medium text-navy">{String(inputs.etage ?? "—")}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">État</dt><dd className="font-medium text-navy">{String(inputs.etat ?? "—")}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Classe énergie</dt><dd className="font-medium text-navy">{String(inputs.classeEnergie ?? "—")}</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Ajustements appliqués</h3>
          {(results.ajustements ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted">Aucun ajustement.</p>
          ) : (
            <ul className="mt-3 divide-y divide-card-border/50 text-sm">
              {results.ajustements.map((a, i) => (
                <li key={i} className="flex justify-between py-1.5">
                  <span className="text-muted">{a.label}</span>
                  <span className={`font-medium ${a.pct > 0 ? "text-emerald-700" : a.pct < 0 ? "text-rose-700" : "text-navy"}`}>
                    {a.pct > 0 ? "+" : ""}{a.pct}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

interface DcfMultiPayload {
  inputs: Record<string, unknown>;
  results: {
    valeurDCF: number;
    irr: number;
    wault: number;
    loyerTotalAnnuel: number;
    surfaceTotale: number;
    loyerMoyenM2: number;
    ervMoyenM2: number;
    tauxOccupation: number;
    potentielReversion: number;
    totalNOIActualise: number;
    noiStabilise: number;
    valeurTerminaleBrute: number;
    valeurTerminaleActualisee: number;
    fraisCession: number;
    leaseDetails: Array<{ locataire: string; surface: number; loyerM2: number; ervM2: number; ecartERV: number; dureeRestante: number; pctLoyer: number }>;
  };
}

function DcfMultiView({ payload, title }: { payload: DcfMultiPayload; title: string | null | undefined }) {
  const { results } = payload;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-white shadow-lg">
        <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">DCF multi-locataires</div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold">{title || "Analyse DCF"}</div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <div className="text-xs text-white/70">Valeur DCF</div>
            <div className="text-lg font-bold">{formatEUR(results.valeurDCF)}</div>
          </div>
          <div>
            <div className="text-xs text-white/70">TRI / IRR</div>
            <div className="text-lg font-bold">{formatPct(results.irr, 2)}</div>
          </div>
          <div>
            <div className="text-xs text-white/70">WAULT</div>
            <div className="text-lg font-bold">{results.wault?.toFixed?.(1)} ans</div>
          </div>
          <div>
            <div className="text-xs text-white/70">Occupation</div>
            <div className="text-lg font-bold">{results.tauxOccupation?.toFixed?.(0)}%</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">État locatif</h3>
          <dl className="mt-3 divide-y divide-card-border/50 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-muted">Surface totale</dt><dd className="font-medium text-navy">{results.surfaceTotale} m²</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Loyer annuel</dt><dd className="font-medium text-navy">{formatEUR(results.loyerTotalAnnuel)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Loyer moyen /m²</dt><dd className="font-medium text-navy">{formatEUR(results.loyerMoyenM2)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">ERV moyen /m²</dt><dd className="font-medium text-navy">{formatEUR(results.ervMoyenM2)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Potentiel de reversion</dt><dd className="font-medium text-navy">{results.potentielReversion > 0 ? "+" : ""}{results.potentielReversion?.toFixed?.(1)}%</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Composantes de la valeur</h3>
          <dl className="mt-3 divide-y divide-card-border/50 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-muted">NOI actualisés</dt><dd className="font-medium text-navy">{formatEUR(results.totalNOIActualise)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">NOI stabilisé</dt><dd className="font-medium text-navy">{formatEUR(results.noiStabilise)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Valeur terminale brute</dt><dd className="font-medium text-navy">{formatEUR(results.valeurTerminaleBrute)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">- Frais de cession</dt><dd className="font-medium text-rose-700">- {formatEUR(results.fraisCession)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-muted">Valeur terminale actualisée</dt><dd className="font-medium text-navy">{formatEUR(results.valeurTerminaleActualisee)}</dd></div>
            <div className="flex justify-between py-1.5 font-semibold border-t border-card-border mt-1 pt-2"><dt className="text-navy">Valeur DCF totale</dt><dd className="text-slate-800">{formatEUR(results.valeurDCF)}</dd></div>
          </dl>
        </div>
      </div>

      {(results.leaseDetails?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-card-border bg-card p-5 overflow-x-auto">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">Baux</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="px-2 py-2 text-left font-medium">Locataire</th>
                <th className="px-2 py-2 text-right font-medium">Surface</th>
                <th className="px-2 py-2 text-right font-medium">Loyer /m²</th>
                <th className="px-2 py-2 text-right font-medium">ERV /m²</th>
                <th className="px-2 py-2 text-right font-medium">Écart ERV</th>
                <th className="px-2 py-2 text-right font-medium">Durée restante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/50">
              {results.leaseDetails.map((d, i) => (
                <tr key={i}>
                  <td className="px-2 py-2 text-navy font-medium">{d.locataire}</td>
                  <td className="px-2 py-2 text-right">{d.surface} m²</td>
                  <td className="px-2 py-2 text-right">{formatEUR(d.loyerM2)}</td>
                  <td className="px-2 py-2 text-right">{formatEUR(d.ervM2)}</td>
                  <td className={`px-2 py-2 text-right ${d.ecartERV > 0 ? "text-emerald-700" : d.ecartERV < -5 ? "text-rose-700" : ""}`}>{d.ecartERV > 0 ? "+" : ""}{d.ecartERV?.toFixed?.(1)}%</td>
                  <td className={`px-2 py-2 text-right ${d.dureeRestante < 2 ? "text-rose-700 font-semibold" : ""}`}>{d.dureeRestante?.toFixed?.(1)} ans</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface ValorisationPayload {
  inputs: Record<string, unknown>;
  results: {
    valeurComparaison?: number;
    valeurCapitalisation?: number;
    valeurDCF?: number;
    valeurRetenue?: number;
  };
}

function ValorisationView({ payload, title }: { payload: ValorisationPayload; title: string | null | undefined }) {
  const { results, inputs } = payload;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-gold to-amber-700 p-6 text-white shadow-lg">
        <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">Valorisation TEGOVA</div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold">{title || "Rapport de valorisation"}</div>
        {results.valeurRetenue ? (
          <>
            <div className="mt-4 text-sm text-white/80">Valeur retenue</div>
            <div className="mt-1 text-4xl font-bold">{formatEUR(results.valeurRetenue)}</div>
          </>
        ) : null}
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5">
        <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Paramètres</h3>
        <dl className="mt-3 divide-y divide-card-border/50 text-sm">
          <div className="flex justify-between py-1.5"><dt className="text-muted">Commune</dt><dd className="font-medium text-navy">{String(inputs.commune ?? "—")}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-muted">Type d&apos;actif</dt><dd className="font-medium text-navy">{String(inputs.assetType ?? "—")}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-muted">Type de valeur (EVS)</dt><dd className="font-medium text-navy">{String(inputs.evsType ?? "—")}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-muted">Surface</dt><dd className="font-medium text-navy">{String(inputs.surface ?? "—")} m²</dd></div>
          {inputs.prixM2Commune ? <div className="flex justify-between py-1.5"><dt className="text-muted">Prix /m² commune (réf.)</dt><dd className="font-medium text-navy">{formatEUR(Number(inputs.prixM2Commune))}</dd></div> : null}
        </dl>
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5">
        <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Approches de valeur</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {results.valeurComparaison ? (
            <div className="rounded-lg border border-card-border bg-background p-4">
              <div className="text-xs uppercase text-muted">Comparaison</div>
              <div className="mt-1 text-lg font-bold text-navy">{formatEUR(results.valeurComparaison)}</div>
            </div>
          ) : null}
          {results.valeurCapitalisation ? (
            <div className="rounded-lg border border-card-border bg-background p-4">
              <div className="text-xs uppercase text-muted">Capitalisation</div>
              <div className="mt-1 text-lg font-bold text-navy">{formatEUR(results.valeurCapitalisation)}</div>
            </div>
          ) : null}
          {results.valeurDCF ? (
            <div className="rounded-lg border border-card-border bg-background p-4">
              <div className="text-xs uppercase text-muted">DCF</div>
              <div className="mt-1 text-lg font-bold text-navy">{formatEUR(results.valeurDCF)}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GenericPayloadView({ payload }: { payload: Record<string, unknown> }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">Données partagées</h3>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-background p-3 text-xs text-navy">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}

export default function SharedPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("partage");
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-FR" : locale === "en" ? "en-GB" : locale === "de" ? "de-DE" : locale === "pt" ? "pt-PT" : "fr-FR";
  const token = String(params?.token ?? "");

  const [data, setData] = useState<SharedLinkPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !isSupabaseConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    fetchSharedLinkByToken(token).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          {t("noService")}
        </div>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          {data?.error === "expired" && t("errorExpired")}
          {data?.error === "view_limit_reached" && t("errorViewLimit")}
          {data?.error === "not_found" && t("errorNotFound")}
          {!data?.error && t("errorInvalid")}
        </div>
        <Link href={`${lp}/`} className="mt-4 inline-flex text-sm text-navy hover:underline">{t("backHome")}</Link>
      </div>
    );
  }

  const viewCount = data.view_count ?? 0;
  const viewsLabel = viewCount > 1 ? t("viewsMany", { count: viewCount }) : t("viewsOne", { count: viewCount });
  const expiresLabel = data.expires_at
    ? t("expiresOn", { date: new Date(data.expires_at).toLocaleDateString(dateLocale) })
    : t("expiresOn", { date: "—" });

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between print:hidden">
          <div>
            <Link href={`${lp}/`} className="text-xs text-muted hover:text-navy">← tevaxia.lu</Link>
            <h1 className="mt-2 text-2xl font-bold text-navy">{t("publicShare")} : {data.title || t("defaultTitle")}</h1>
            <p className="mt-1 text-xs text-muted">
              {t("readOnly")} · {viewsLabel} · {expiresLabel}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-navy/5"
            title={t("printTitle")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
            </svg>
            {t("printButton")}
          </button>
        </div>

        {data.tool_type === "bilan-promoteur" && data.payload ? (
          <BilanPromoteurView payload={data.payload as unknown as BilanPromoteurPayload} title={data.title} />
        ) : data.tool_type === "hotel-valorisation" && data.payload ? (
          <HotelValorisationView payload={data.payload as unknown as HotelValorisationPayload} title={data.title} />
        ) : data.tool_type === "hotel-dscr" && data.payload ? (
          <HotelDscrView payload={data.payload as unknown as HotelDscrPayload} title={data.title} />
        ) : data.tool_type === "estimation" && data.payload ? (
          <EstimationView payload={data.payload as unknown as EstimationPayload} title={data.title} />
        ) : data.tool_type === "dcf-multi" && data.payload ? (
          <DcfMultiView payload={data.payload as unknown as DcfMultiPayload} title={data.title} />
        ) : data.tool_type === "valorisation" && data.payload ? (
          <ValorisationView payload={data.payload as unknown as ValorisationPayload} title={data.title} />
        ) : (
          <GenericPayloadView payload={data.payload ?? {}} />
        )}

        <div className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900 print:mt-6">
          <strong>{t("disclaimerStrong")}</strong> · {t("disclaimerBody")}{" "}
          <Link href={`${lp}/bilan-promoteur`} className="underline hover:no-underline">{t("openCalculator")}</Link>.
        </div>

        <CommentForm token={token} />
      </div>
    </div>
  );
}
