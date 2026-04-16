/**
 * User profile types — multi-select stored in user_preferences.profile_types.
 * Drives the 'Mes espaces' grid filtering on /profil.
 */

export type ProfileType =
  | "particulier"
  | "expert"
  | "syndic"
  | "hotelier"
  | "investisseur"
  | "agence"
  | "promoteur"
  | "api";

export interface ProfileTypeMeta {
  value: ProfileType;
  label: string;
  emoji: string;
  description: string;
}

export const PROFILE_TYPES: ProfileTypeMeta[] = [
  { value: "particulier", label: "Particulier", emoji: "🏠", description: "Achat, location, résidence principale" },
  { value: "expert", label: "Expert évaluateur", emoji: "📐", description: "TEGOVA REV/TRV, MRICS, expert judiciaire" },
  { value: "syndic", label: "Syndic", emoji: "🏛", description: "Gestion de copropriétés" },
  { value: "hotelier", label: "Hôtelier", emoji: "🏨", description: "Exploitant ou acquéreur hôtelier" },
  { value: "investisseur", label: "Investisseur", emoji: "📊", description: "Asset manager, family office, fonds" },
  { value: "agence", label: "Agence immo", emoji: "🤝", description: "Agent immobilier, négociateur" },
  { value: "promoteur", label: "Promoteur", emoji: "🏗", description: "Promotion, marchand de biens" },
  { value: "api", label: "Intégrateur API", emoji: "🔌", description: "PropTech, banque, fintech" },
];

/**
 * Map each workspace tile href to the set of profile types for which it is
 * relevant. If a user has no profile selected, all tiles show.
 */
export const WORKSPACE_PROFILE_MAP: Record<string, ProfileType[]> = {
  "mes-evaluations": ["particulier", "expert", "syndic", "hotelier", "investisseur", "agence", "promoteur"],
  "portfolio": ["investisseur", "expert", "agence", "promoteur"],
  "energy/portfolio": ["investisseur", "expert", "syndic", "promoteur"],
  "syndic/coproprietes": ["syndic"],
  "hotellerie/groupe": ["hotelier", "investisseur"],
  "profil/organisation": ["agence", "expert", "syndic"],
  "profil/api": ["api"],
  "api-docs": ["api", "investisseur", "agence"],
};

/**
 * Return true if the tile at `slug` should be shown for the given selection.
 * An empty or null selection means "show all".
 */
export function isWorkspaceVisible(slug: string, selected: ProfileType[] | null): boolean {
  if (!selected || selected.length === 0) return true;
  const relevantFor = WORKSPACE_PROFILE_MAP[slug];
  if (!relevantFor) return true;
  return selected.some((p) => relevantFor.includes(p));
}
