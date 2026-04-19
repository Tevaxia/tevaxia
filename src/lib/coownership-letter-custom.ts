// ============================================================
// SYNDIC — gestion des modèles personnalisés (localStorage)
// ============================================================
//
// Les templates « officiels » (SYNDIC_LETTER_TEMPLATES) sont versionnés
// dans le code. Les templates personnalisés (édités ou importés par
// l'utilisateur) sont stockés en localStorage côté navigateur pour
// éviter un aller-retour serveur et préserver la vie privée.
//
// Structure de stockage : clé unique `tevaxia-syndic-templates-custom`
// contient un tableau JSON d'objets SyndicLetterTemplate (même shape).

import type { SyndicLetterTemplate, SyndicTemplateCategory } from "./coownership-letter-templates";

const STORAGE_KEY = "tevaxia-syndic-templates-custom";

export function loadCustomTemplates(): SyndicLetterTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyndicLetterTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(list: SyndicLetterTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch { /* quota */ }
}

/** Extrait automatiquement les variables {foo} du texte. */
export function extractVariables(body: string, subject = ""): string[] {
  const matches = [...body.matchAll(/\{(\w+)\}/g), ...subject.matchAll(/\{(\w+)\}/g)];
  return Array.from(new Set(matches.map((m) => m[1])));
}

export function upsertCustomTemplate(t: SyndicLetterTemplate): void {
  const list = loadCustomTemplates();
  const idx = list.findIndex((x) => x.id === t.id);
  if (idx >= 0) list[idx] = t; else list.push(t);
  saveAll(list);
}

export function deleteCustomTemplate(id: string): void {
  const list = loadCustomTemplates().filter((t) => t.id !== id);
  saveAll(list);
}

export function createCustomTemplateFromText(params: {
  title: string;
  category: SyndicTemplateCategory;
  description?: string;
  subject: string;
  body: string;
}): SyndicLetterTemplate {
  const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    category: params.category,
    title: params.title,
    description: params.description ?? "",
    subject: params.subject,
    body: params.body,
    variables: extractVariables(params.body, params.subject),
  };
}
