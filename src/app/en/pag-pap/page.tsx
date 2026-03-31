"use client";

import { useState } from "react";
import { ZONES_PAG, PAP_TYPES, type ZonePAG } from "@/lib/pag-pap";

export default function PagPap() {
  const [selectedZone, setSelectedZone] = useState<ZonePAG | null>(null);
  const [activeTab, setActiveTab] = useState<"zones" | "pap" | "servitudes">("zones");

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Urban Planning — PAG / PAP</h1>
          <p className="mt-2 text-muted">Zoning designations, buildability, development procedures in Luxembourg</p>
        </div>

        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1">
          {[
            { id: "zones" as const, label: "PAG Zones" },
            { id: "pap" as const, label: "PAP (NQ / QE)" },
            { id: "servitudes" as const, label: "Easements & Deadlines" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id ? "bg-navy text-white shadow-sm" : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "zones" && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border bg-background">
                      <th className="px-4 py-3 text-left font-semibold text-navy">Zone</th>
                      <th className="px-4 py-3 text-center font-semibold text-navy">Buildable</th>
                      <th className="px-4 py-3 text-right font-semibold text-navy">COS</th>
                      <th className="px-4 py-3 text-right font-semibold text-navy">CMU</th>
                      <th className="px-4 py-3 text-right font-semibold text-navy">Max height</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ZONES_PAG.map((zone) => (
                      <tr
                        key={zone.code}
                        onClick={() => setSelectedZone(zone)}
                        className={`border-b border-card-border/50 cursor-pointer transition-colors hover:bg-background/50 ${
                          selectedZone?.code === zone.code ? "bg-navy/5" : ""
                        }`}
                      >
                        <td className="px-4 py-2">
                          <div className="font-medium text-navy">{zone.code}</div>
                          <div className="text-xs text-muted">{zone.nom}</div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            zone.constructible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {zone.constructible ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-sm">{zone.cosTypique}</td>
                        <td className="px-4 py-2 text-right font-mono text-sm">{zone.cmuTypique}</td>
                        <td className="px-4 py-2 text-right text-xs">{zone.hauteurMax}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              {selectedZone ? (
                <div className="sticky top-20 rounded-xl border border-card-border bg-card p-6 shadow-sm space-y-4">
                  <div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      selectedZone.constructible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {selectedZone.code}
                    </span>
                    <h2 className="mt-2 text-lg font-bold text-navy">{selectedZone.nom}</h2>
                    <p className="mt-1 text-sm text-muted">{selectedZone.description}</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-navy uppercase tracking-wider mb-2">Permitted uses</h3>
                    <ul className="space-y-1">
                      {selectedZone.usagesPermis.map((u) => (
                        <li key={u} className="text-sm text-slate flex items-start gap-2">
                          <svg className="h-4 w-4 shrink-0 text-success mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {u}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedZone.constructible && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-navy/5 p-2"><span className="text-muted">COS</span><br/><span className="font-semibold">{selectedZone.cosTypique}</span></div>
                      <div className="rounded-lg bg-navy/5 p-2"><span className="text-muted">CMU</span><br/><span className="font-semibold">{selectedZone.cmuTypique}</span></div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-semibold text-navy uppercase tracking-wider mb-1">Easements</h3>
                    <p className="text-xs text-muted">{selectedZone.servitudes}</p>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs text-amber-800">{selectedZone.observations}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-card-border p-8 text-center">
                  <p className="text-sm text-muted">Click on a zone to see details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "pap" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {PAP_TYPES.map((pap) => (
              <div key={pap.type} className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                  pap.type === "NQ" ? "bg-navy/10 text-navy" : "bg-gold/20 text-gold-dark"
                }`}>
                  PAP {pap.type}
                </span>
                <h2 className="mt-3 text-lg font-bold text-navy">{pap.nom}</h2>
                <p className="mt-1 text-sm text-muted">{pap.description}</p>

                <h3 className="mt-4 text-xs font-semibold text-navy uppercase tracking-wider">Procedure</h3>
                <ol className="mt-2 space-y-1">
                  {pap.procedure.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-bold text-navy">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>

                <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                  <span>Typical timeframe: <strong className="text-slate">{pap.delaiTypique}</strong></span>
                </div>

                <h3 className="mt-4 text-xs font-semibold text-navy uppercase tracking-wider">Required documents</h3>
                <ul className="mt-2 space-y-1">
                  {pap.documentsRequis.map((doc) => (
                    <li key={doc} className="text-xs text-muted">• {doc}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {activeTab === "servitudes" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-navy mb-4">Development and construction easements</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg bg-navy/5 p-5">
                  <h3 className="text-base font-semibold text-navy">CTV — Development easement</h3>
                  <p className="mt-2 text-sm text-muted">
                    The owner of land classified as buildable must carry out its development
                    (connection to utility networks) within a <strong className="text-slate">period of 6 years</strong> from
                    the entry into force of the PAG.
                  </p>
                  <p className="mt-2 text-sm text-error font-medium">
                    Penalty: automatic reclassification to non-buildable zone upon expiry of the deadline.
                  </p>
                </div>
                <div className="rounded-lg bg-navy/5 p-5">
                  <h3 className="text-base font-semibold text-navy">CTL — Construction easement</h3>
                  <p className="mt-2 text-sm text-muted">
                    Once the land has been developed, the owner has a <strong className="text-slate">period
                    of 3 years</strong> to begin construction works.
                  </p>
                  <p className="mt-2 text-sm text-error font-medium">
                    Penalty: automatic reclassification to non-buildable zone.
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800">
                  <strong>Impact on value:</strong> Land subject to a CTV/CTL easement nearing expiry
                  suffers a significant discount because the buyer inherits the obligation. Always verify the remaining
                  deadlines before acquiring any building plot.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-navy mb-4">Sources and resources</h2>
              <div className="space-y-2 text-sm">
                <a href="https://www.geoportail.lu/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-navy hover:underline">
                  <span className="rounded bg-navy/10 px-2 py-0.5 text-xs">Map</span>
                  Geoportail.lu — View PAG maps online
                </a>
                <a href="https://logement.public.lu/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-navy hover:underline">
                  <span className="rounded bg-navy/10 px-2 py-0.5 text-xs">Law</span>
                  Ministry of Housing — Urban planning legislation
                </a>
                <a href="https://mint.gouvernement.lu/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-navy hover:underline">
                  <span className="rounded bg-navy/10 px-2 py-0.5 text-xs">Regulation</span>
                  Ministry of the Interior — Spatial planning
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
