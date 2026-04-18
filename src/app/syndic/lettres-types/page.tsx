"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SYNDIC_LETTER_TEMPLATES, SYNDIC_CATEGORY_LABELS, SYNDIC_CATEGORY_COLORS,
  renderSyndicTemplate, syndicTemplatesByCategory,
  type SyndicLetterTemplate, type SyndicTemplateCategory,
} from "@/lib/coownership-letter-templates";

export default function SyndicLetterTemplatesPage() {
  const [filter, setFilter] = useState<SyndicTemplateCategory | "all">("all");
  const [selected, setSelected] = useState<SyndicLetterTemplate | null>(null);
  const [vars, setVars] = useState<Record<string, string>>({
    copropriete: "Résidence Les Jardins",
    adresse_copropriete: "15 rue de la Paix, Luxembourg",
    syndic_nom: "Jean Martin, Syndic",
    date_ag: "jeudi 15 mai 2026",
    heure_ag: "18h30",
    lieu_ag: "Salle commune, rez-de-chaussée",
    objet: "Rénovation façade nord",
    details: "Surface : environ 200 m². Enduit existant à reprendre.",
    montant: "45 000 EUR TTC",
    iban: "LU28 0019 4006 4475 0000",
    bic: "BCEELULL",
    beneficiaire: "Syndicat copropriété",
    reference: "COPRO-LOT12-2026T1",
  });

  const byCat = syndicTemplatesByCategory();
  const filtered = filter === "all" ? SYNDIC_LETTER_TEMPLATES : byCat[filter];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/syndic" className="text-xs text-muted hover:text-navy">← Syndic</Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Bibliothèque lettres types syndic</h1>
      <p className="mt-1 text-sm text-muted">
        10 modèles de courriers pré-rédigés pour les opérations courantes
        syndic copropriété LU : demandes de devis, convocations AG, appels de
        fonds, sinistres, mises en demeure amiables.
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            filter === "all" ? "bg-navy text-white" : "bg-card border border-card-border text-slate"
          }`}>
          Tous ({SYNDIC_LETTER_TEMPLATES.length})
        </button>
        {(Object.entries(SYNDIC_CATEGORY_LABELS) as [SyndicTemplateCategory, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === k ? "bg-navy text-white" : SYNDIC_CATEGORY_COLORS[k]
            }`}>
            {l} ({byCat[k].length})
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* Liste */}
        <div className="space-y-3">
          {filtered.map((t) => (
            <button key={t.id} onClick={() => setSelected(t)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                selected?.id === t.id
                  ? "border-navy bg-navy/5 ring-1 ring-navy"
                  : "border-card-border bg-card hover:bg-background"
              }`}>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${SYNDIC_CATEGORY_COLORS[t.category]}`}>
                  {SYNDIC_CATEGORY_LABELS[t.category]}
                </span>
              </div>
              <h3 className="mt-1 text-sm font-bold text-navy">{t.title}</h3>
              <p className="mt-0.5 text-xs text-muted">{t.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.variables.slice(0, 6).map((v) => (
                  <span key={v} className="rounded bg-background px-1.5 py-0.5 text-[9px] font-mono text-muted">
                    {`{${v}}`}
                  </span>
                ))}
                {t.variables.length > 6 && (
                  <span className="text-[9px] text-muted">+{t.variables.length - 6}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          {selected ? (
            <SyndicTemplatePreview
              template={selected}
              vars={vars}
              onChangeVar={(key, val) => setVars({ ...vars, [key]: val })}
            />
          ) : (
            <div className="rounded-xl border-2 border-dashed border-card-border p-8 text-center text-sm text-muted">
              Sélectionnez un modèle à gauche.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Usage :</strong> adapter les variables selon le contexte de la
        copropriété / fournisseur / copropriétaire, puis copier-coller dans
        votre email ou générer un mailto. Les templates sont versionnés dans le
        code (pas de DB) — demander ajouts/modifs via vos canaux habituels.
      </div>
    </div>
  );
}

function SyndicTemplatePreview({ template, vars, onChangeVar }: {
  template: SyndicLetterTemplate;
  vars: Record<string, string>;
  onChangeVar: (key: string, val: string) => void;
}) {
  const rendered = renderSyndicTemplate(template, vars);
  const [email, setEmail] = useState("");

  const mailtoUrl = () => {
    const addr = email || "destinataire@example.com";
    return `mailto:${addr}?subject=${encodeURIComponent(rendered.subject)}&body=${encodeURIComponent(rendered.body)}`;
  };

  const copyBody = async () => {
    try {
      await navigator.clipboard.writeText(rendered.body);
      alert("Corps copié ✓");
    } catch { /* fallback silence */ }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
          Modèle sélectionné
        </div>
        <h3 className="mt-0.5 text-sm font-bold text-navy">{template.title}</h3>
      </div>

      <div className="border-t border-card-border pt-3">
        <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
          Variables ({template.variables.length})
        </div>
        <div className="grid grid-cols-1 gap-2">
          {template.variables.map((v) => (
            <label key={v} className="text-[10px]">
              <span className="text-muted font-mono">{`{${v}}`}</span>
              <input type="text" value={vars[v] ?? ""}
                onChange={(e) => onChangeVar(v, e.target.value)}
                className="mt-0.5 w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-card-border pt-3">
        <label className="text-[10px]">
          <span className="text-muted font-semibold uppercase tracking-wider">Email destinataire</span>
          <input type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="destinataire@example.com"
            className="mt-0.5 w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-xs" />
        </label>
      </div>

      <div className="border-t border-card-border pt-3">
        <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">Aperçu</div>
        <div className="rounded border border-card-border/50 bg-background p-3 text-xs">
          <div className="font-semibold text-navy mb-1">{rendered.subject}</div>
          <pre className="whitespace-pre-wrap font-sans text-slate text-[11px] leading-relaxed max-h-80 overflow-y-auto">
            {rendered.body}
          </pre>
        </div>
      </div>

      <div className="border-t border-card-border pt-3 flex gap-2">
        <a href={mailtoUrl()}
          className="flex-1 rounded-lg bg-navy px-3 py-2 text-center text-xs font-semibold text-white hover:bg-navy-light">
          📧 Mail
        </a>
        <button onClick={copyBody}
          className="rounded-lg border border-navy bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-navy/5">
          📋 Copier
        </button>
      </div>
    </div>
  );
}
