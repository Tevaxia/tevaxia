// ============================================================
// SYNDIC — Bibliothèque lettres types
// ============================================================
//
// 10 modèles de courriers pour syndic de copropriété LU : opérations
// courantes (fournisseurs, copropriétaires, travaux, sinistres).

export type SyndicTemplateCategory =
  | "fournisseur" | "copropriétaire" | "travaux"
  | "sinistre" | "institutionnel" | "amiable";

export interface SyndicLetterTemplate {
  id: string;
  category: SyndicTemplateCategory;
  title: string;
  description: string;
  subject: string;
  body: string;
  variables: string[];
}

export const SYNDIC_CATEGORY_LABELS: Record<SyndicTemplateCategory, string> = {
  fournisseur: "Fournisseurs",
  copropriétaire: "Copropriétaires",
  travaux: "Travaux",
  sinistre: "Sinistres",
  institutionnel: "Institutionnel",
  amiable: "Amiable",
};

export const SYNDIC_CATEGORY_COLORS: Record<SyndicTemplateCategory, string> = {
  fournisseur: "bg-slate-100 text-slate-800",
  copropriétaire: "bg-blue-100 text-blue-900",
  travaux: "bg-amber-100 text-amber-900",
  sinistre: "bg-rose-100 text-rose-900",
  institutionnel: "bg-emerald-100 text-emerald-900",
  amiable: "bg-sky-100 text-sky-900",
};

export const SYNDIC_LETTER_TEMPLATES: SyndicLetterTemplate[] = [
  {
    id: "demande_devis",
    category: "fournisseur",
    title: "Demande de devis",
    description: "Consultation fournisseur pour travaux ou prestations.",
    subject: "Demande de devis — {copropriete} — {objet}",
    body: `Madame, Monsieur,

Dans le cadre de la gestion de la copropriété {copropriete} située {adresse_copropriete}, nous vous consultons pour l'établissement d'un devis concernant :

{objet}

Précisions techniques :
{details}

Merci de nous faire parvenir votre devis sous 15 jours, en mentionnant :
- Prix HT et TTC (TVA LU 17 %)
- Délai d'intervention
- Durée de garantie
- Modalités de paiement
- Références sur des travaux similaires

Votre devis sera étudié en comité et soumis au vote en assemblée générale si nécessaire.

Cordialement,
{syndic_nom}
Syndic de {copropriete}`,
    variables: ["copropriete", "adresse_copropriete", "objet", "details", "syndic_nom"],
  },
  {
    id: "accord_devis",
    category: "travaux",
    title: "Accord sur devis",
    description: "Confirmation de commande après validation en AG.",
    subject: "Accord de commande — {objet} — {copropriete}",
    body: `Madame, Monsieur,

Suite à l'assemblée générale de la copropriété {copropriete} tenue le {date_ag}, votre devis n° {ref_devis} d'un montant de {montant} (TTC) a été approuvé à la majorité requise.

Les travaux concernent :
{objet}

Modalités
- Début d'intervention souhaité : {date_debut}
- Coordinateur copropriété : {syndic_nom}
- Paiement : {modalites_paiement}
- Garantie : tel que stipulé dans votre devis

Merci de nous faire parvenir votre accord de commande ainsi que la date précise de démarrage sous 7 jours.

Pour toute question, vous pouvez me joindre directement.

Cordialement,
{syndic_nom}`,
    variables: ["copropriete", "date_ag", "ref_devis", "montant", "objet", "date_debut", "modalites_paiement", "syndic_nom"],
  },
  {
    id: "convocation_ag",
    category: "copropriétaire",
    title: "Convocation AG (lettre d'accompagnement)",
    description: "Email accompagnant l'envoi de la convocation officielle AG.",
    subject: "Convocation AG {copropriete} — {date_ag}",
    body: `Madame, Monsieur,

Vous trouverez ci-joint la convocation officielle à l'assemblée générale ordinaire de la copropriété {copropriete}, qui se tiendra :

📅 Date : {date_ag}
🕐 Heure : {heure_ag}
📍 Lieu : {lieu_ag}
💻 Lien visioconférence (si applicable) : {lien_visio}

La convocation comprend :
- L'ordre du jour détaillé (X résolutions à voter)
- Les annexes comptables (5 annexes réglementaires)
- Le rapport du conseil syndical
- Les devis à voter pour les travaux proposés
- Le formulaire de procuration (si vous ne pouvez pas être présent)

Vous pouvez également voter en ligne depuis votre espace copropriétaire (lien personnel envoyé séparément).

Conformément à la loi du 16 mai 1975, cette convocation vous parvient au moins 15 jours avant la date de l'AG.

Je reste à votre disposition pour toute question.

Cordialement,
{syndic_nom}`,
    variables: ["copropriete", "date_ag", "heure_ag", "lieu_ag", "lien_visio", "syndic_nom"],
  },
  {
    id: "appel_fonds_accompagnement",
    category: "copropriétaire",
    title: "Accompagnement appel de fonds",
    description: "Email accompagnant un appel de fonds trimestriel.",
    subject: "Votre appel de fonds {periode} — {copropriete}",
    body: `Madame, Monsieur,

Vous trouverez ci-joint votre appel de fonds pour la période {periode} de la copropriété {copropriete} :

• Montant appelé : {montant}
• Date d'échéance : {date_echeance}
• Référence paiement : {reference}
• Coordonnées bancaires :
  - IBAN : {iban}
  - BIC : {bic}
  - Bénéficiaire : {beneficiaire}

Pour un règlement rapide et un rapprochement automatique, merci d'utiliser la référence {reference} dans votre virement bancaire.

Votre compte copropriétaire personnel (solde, historique, annexes) est consultable 24/7 depuis votre espace dédié : {lien_portail}

Cordialement,
{syndic_nom}`,
    variables: ["periode", "copropriete", "montant", "date_echeance", "reference", "iban", "bic", "beneficiaire", "lien_portail", "syndic_nom"],
  },
  {
    id: "sinistre_information",
    category: "sinistre",
    title: "Information sinistre copropriétaires",
    description: "Communication d'urgence à tous les copropriétaires.",
    subject: "⚠️ Sinistre {copropriete} — {date_sinistre}",
    body: `Madame, Monsieur,

Nous vous informons qu'un sinistre est survenu dans la copropriété {copropriete} le {date_sinistre} :

Nature du sinistre : {nature_sinistre}
Zone impactée : {zone}
Actions engagées :
- Déclaration immédiate à notre assurance ({assureur})
- Expert mandaté : {expert}
- Travaux conservatoires en cours par {prestataire}

Recommandations pour les occupants concernés
{recommandations}

Les frais sont couverts par la police d'assurance de la copropriété (franchise : {franchise}). Aucune participation supplémentaire n'est demandée aux copropriétaires sauf décision contraire de l'AG.

Un point sera fait lors de la prochaine AG avec détails comptables et timeline de réparation.

Pour toute urgence, contactez directement : {contact_urgence}

{syndic_nom}`,
    variables: ["copropriete", "date_sinistre", "nature_sinistre", "zone", "assureur", "expert", "prestataire", "recommandations", "franchise", "contact_urgence", "syndic_nom"],
  },
  {
    id: "nuisance_rappel",
    category: "amiable",
    title: "Rappel règlement (nuisance)",
    description: "Rappel à l'ordre amiable suite à plainte entre copropriétaires.",
    subject: "Rappel des dispositions du règlement de copropriété",
    body: `Madame, Monsieur,

En ma qualité de syndic de la copropriété {copropriete}, je me dois de vous rappeler certaines dispositions du règlement de copropriété, suite à des observations portées à ma connaissance concernant :

{nature_probleme}

Le règlement de copropriété (article {article}) stipule :

« {citation_reglement} »

Je vous invite à prendre les dispositions nécessaires pour que cette situation soit résolue dans les meilleurs délais. Je reste à votre disposition pour en discuter à l'amiable.

Si la situation perdure, je serais contraint de la porter à l'ordre du jour de la prochaine AG, voire d'engager les procédures prévues par la loi du 16 mai 1975.

Je vous prie de croire, Madame, Monsieur, en l'assurance de ma considération distinguée.

{syndic_nom}`,
    variables: ["copropriete", "nature_probleme", "article", "citation_reglement", "syndic_nom"],
  },
  {
    id: "changement_syndic",
    category: "institutionnel",
    title: "Information changement syndic",
    description: "Annonce à adresser aux copropriétaires après décision AG changement syndic.",
    subject: "Changement de syndic — {copropriete}",
    body: `Madame, Monsieur,

Suite à la décision prise en assemblée générale du {date_ag}, la copropriété {copropriete} change de syndic :

• Syndic sortant : {syndic_sortant}
• Syndic entrant : {syndic_entrant}, enregistré sous n° {numero_rc}
• Date effective de transfert : {date_transfert}

Pendant la période de transition
- Les appels de fonds existants sont à régler selon les modalités inchangées jusqu'au {date_fin_ancien_rib}.
- À partir du {date_nouveau_rib}, un nouveau RIB et de nouvelles références de paiement vous seront communiqués.
- Tous les dossiers (contrats, archives, comptes bancaires) sont transférés sur la période {date_transfert_dossier}.

Vos espaces personnels (portail copropriétaire) restent actifs et seront migrés sans perte de données.

Pour toute question durant la transition : {contact_transition}

Nous vous remercions pour votre confiance.

{syndic_entrant}`,
    variables: ["copropriete", "date_ag", "syndic_sortant", "syndic_entrant", "numero_rc", "date_transfert", "date_fin_ancien_rib", "date_nouveau_rib", "date_transfert_dossier", "contact_transition"],
  },
  {
    id: "refus_devis",
    category: "fournisseur",
    title: "Refus de devis",
    description: "Notification polie à un fournisseur non retenu.",
    subject: "Votre devis n° {ref_devis} — {objet}",
    body: `Madame, Monsieur,

Je vous remercie pour le devis n° {ref_devis} concernant {objet} pour la copropriété {copropriete}.

Après analyse comparative de plusieurs propositions et soumission en assemblée générale, votre devis n'a pas été retenu. La décision s'est portée sur {raison_choix} (prix / délai / références / expertise technique).

Nous ne manquerons pas de vous solliciter pour de futures consultations.

Cordialement,
{syndic_nom}`,
    variables: ["ref_devis", "objet", "copropriete", "raison_choix", "syndic_nom"],
  },
  {
    id: "travaux_information",
    category: "travaux",
    title: "Information travaux à venir",
    description: "Préavis aux copropriétaires avant démarrage travaux.",
    subject: "Démarrage travaux {objet} — {date_debut}",
    body: `Madame, Monsieur,

Les travaux suivants, votés en AG du {date_ag}, vont démarrer dans la copropriété {copropriete} :

Objet : {objet}
Entreprise : {entreprise}
Date de démarrage : {date_debut}
Durée prévisionnelle : {duree}

Impacts prévisibles
{impacts}

Dispositions pratiques
- Les accès communs seront balisés et sécurisés.
- Une réunion de chantier hebdomadaire est prévue tous les {jour_reunion}.
- Le suivi qualité est assuré par {suivi_qualite}.

N'hésitez pas à signaler toute problématique rencontrée pendant les travaux via {contact_travaux}.

Cordialement,
{syndic_nom}`,
    variables: ["date_ag", "copropriete", "objet", "entreprise", "date_debut", "duree", "impacts", "jour_reunion", "suivi_qualite", "contact_travaux", "syndic_nom"],
  },
  {
    id: "AG_resultats",
    category: "institutionnel",
    title: "Résultats de vote AG",
    description: "Communication des résultats post-assemblée générale.",
    subject: "Résultats AG {copropriete} — {date_ag}",
    body: `Madame, Monsieur,

L'assemblée générale {type_ag} de la copropriété {copropriete} s'est tenue le {date_ag}.

Quorum : {quorum}% des tantièmes exprimés

Résolutions votées (liste complète dans le PV joint)
{resume_resolutions}

Le procès-verbal officiel vous sera adressé sous 30 jours, accompagné des annexes comptables définitives.

Prochaines étapes
- Mise en œuvre des décisions approuvées
- Envoi des appels de fonds correspondants aux décisions votées
- Programmation des travaux selon le calendrier voté

Je vous remercie pour votre présence / votre participation au vote en ligne. Les procurations ont également été prises en compte.

Cordialement,
{syndic_nom}`,
    variables: ["copropriete", "type_ag", "date_ag", "quorum", "resume_resolutions", "syndic_nom"],
  },
];

// ============================================================
// Helpers
// ============================================================

export function renderSyndicTemplate(
  template: SyndicLetterTemplate,
  vars: Record<string, string>,
): { subject: string; body: string } {
  const render = (s: string): string =>
    s.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
  return {
    subject: render(template.subject),
    body: render(template.body),
  };
}

export function buildSyndicMailto(
  template: SyndicLetterTemplate,
  recipientEmail: string,
  vars: Record<string, string>,
): string {
  const { subject, body } = renderSyndicTemplate(template, vars);
  return `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function syndicTemplatesByCategory(): Record<SyndicTemplateCategory, SyndicLetterTemplate[]> {
  const out = {
    fournisseur: [], "copropriétaire": [], travaux: [],
    sinistre: [], institutionnel: [], amiable: [],
  } as Record<SyndicTemplateCategory, SyndicLetterTemplate[]>;
  for (const t of SYNDIC_LETTER_TEMPLATES) out[t.category].push(t);
  return out;
}
