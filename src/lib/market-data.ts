// ============================================================
// DONNÉES DE MARCHÉ — Sources publiques luxembourgeoises
// ============================================================

// Sources :
// - data.public.lu / Observatoire de l'Habitat (prix transactions par commune)
// - STATEC (indices de prix)
// - Annonces immobilières (données agrégées via Observatoire)

export interface QuartierData {
  nom: string;
  prixM2: number;
  loyerM2: number | null;
  tendance: "hausse" | "stable" | "baisse";
  note: string; // Caractéristique du quartier
}

export interface MarketDataCommune {
  commune: string;
  canton: string;
  prixM2Existant: number | null;
  prixM2VEFA: number | null;
  prixM2Annonces: number | null;
  loyerM2Annonces: number | null;
  nbTransactions: number | null;
  nbVEFA: number | null;
  nbAnnonces: number | null;
  nbLocations: number | null;
  prixM2ExistantHorsAnnexes: number | null;
  prixM2VEFAHorsAnnexes: number | null;
  periode: string;
  source: string;
  quartiers?: QuartierData[];
}

// Import des quatre fichiers officiels CC0, publication du 24 septembre 2026
// (prix affinés : version 2 du 2 octobre 2026).
// 12 mois glissants ; valeurs non publiées (*) conservées à null.
// Aucun prix par quartier n'est déduit de ces moyennes communales.
import snapshot from "./market-data-2026t2.json";

export { MARKET_SNAPSHOT } from "./market-snapshot";
export const MARKET_SOURCES = {
  transactions: "https://data.public.lu/fr/datasets/prix-de-vente-des-appartements-par-commune/",
  horsAnnexes: "https://data.public.lu/fr/datasets/prix-de-vente-des-appartements-prix-affines-hors-annexes-par-commune/",
  annonces: "https://data.public.lu/fr/datasets/prix-annonces-des-logements-par-commune/",
  loyers: "https://data.public.lu/fr/datasets/loyers-annonces-des-logements-par-commune/",
};
const MARKET_DATA: MarketDataCommune[] = snapshot;


// Sources de données ouvertes — URLs réelles
export const DATA_SOURCES = {
  prixTransactionsParCommune: {
    label: "Prix de vente des appartements par commune",
    url: "https://data.public.lu/api/1/datasets/57f26768cc765e23279433b0/",
    directDownload: "https://download.data.public.lu/resources/prix-de-vente-des-appartements-par-commune/20260326-094317/prix-moyen-au-metre-carre-enregistre-par-commune-2025t4.xls",
    source: "Observatoire de l'Habitat / Publicité Foncière",
    format: "XLS",
    licence: "CC0",
  },
  prixAffinesParCommune: {
    label: "Prix affinés (modèle hédonique, hors annexes)",
    url: "https://data.public.lu/api/1/datasets/57f268ff111e9b0c425f9bce/",
    directDownload: "https://download.data.public.lu/resources/prix-de-vente-des-appartements-prix-affines-hors-annexes-par-commune/20260326-094517/prix-affine-au-metre-carre-par-commune-2025t4.xls",
    source: "Observatoire de l'Habitat",
    format: "XLS",
    licence: "CC0",
  },
  prixAnnoncesParCommune: {
    label: "Prix annoncés des logements par commune",
    url: "https://data.public.lu/api/1/datasets/57f254fb111e9b0c14235a94/",
    source: "Observatoire de l'Habitat",
    format: "XLS",
    licence: "CC0",
  },
  loyersAnnonces: {
    label: "Loyers annoncés des logements par commune",
    url: "https://data.public.lu/fr/datasets/loyers-annonces-des-logements-par-commune/",
    source: "Observatoire de l'Habitat",
    format: "XLS",
    licence: "CC0",
  },
  volumeTransactions: {
    label: "Nombre de ventes d'appartements, maisons et terrains",
    url: "https://data.public.lu/api/1/datasets/63b3e8c21636a0036aa081d5/",
    source: "Observatoire de l'Habitat",
    format: "XLSX",
    licence: "CC0",
  },
  indicePrixSTATEC: {
    label: "Indice des prix de l'immobilier résidentiel (STATEC)",
    url: "https://lustat.statec.lu/",
    directDownload: "https://statistiques.public.lu/dam-assets/fr/donnees-autres-formats/indicateurs-court-terme/economie-totale-prix/D4011.xls",
    source: "STATEC",
    format: "XLS / SDMX",
    licence: "CC BY 4.0",
  },
  geoportail: {
    label: "Plan cadastral numérisé (PCN)",
    url: "https://www.geoportail.lu/",
    source: "ACT (Administration du Cadastre)",
    format: "WMS/WMTS",
    licence: "CC0",
  },
};

// ============================================================
// MAPPING LOCALITÉS → COMMUNES
// Luxembourg : ~100 communes, ~600 localités
// Quand l'utilisateur cherche une localité, on retourne la commune parente
// ============================================================

const LOCALITES_COMMUNES: Record<string, string> = {
  // Commune de Luxembourg (quartiers)
  "beggen": "Luxembourg", "belair": "Luxembourg", "bonnevoie": "Luxembourg",
  "cents": "Luxembourg", "cessange": "Luxembourg", "clausen": "Luxembourg",
  "dommeldange": "Luxembourg", "eich": "Luxembourg", "gare": "Luxembourg",
  "gasperich": "Luxembourg", "grund": "Luxembourg", "hamm": "Luxembourg",
  "hollerich": "Luxembourg", "kirchberg": "Luxembourg", "limpertsberg": "Luxembourg",
  "merl": "Luxembourg", "mühlenbach": "Luxembourg", "muhlenbach": "Luxembourg",
  "neudorf": "Luxembourg", "pfaffenthal": "Luxembourg", "pulvermühl": "Luxembourg",
  "pulvermuhl": "Luxembourg", "rollingergrund": "Luxembourg", "ville-haute": "Luxembourg",
  "weimershof": "Luxembourg", "weimerskirch": "Luxembourg",
  "cloche d'or": "Luxembourg", "ban de gasperich": "Luxembourg",

  // Commune de Junglinster
  "bourglinster": "Junglinster", "altlinster": "Junglinster", "eisenborn": "Junglinster",
  "eschweiler": "Junglinster", "godbrange": "Junglinster", "gonderange": "Junglinster",
  "imbringen": "Junglinster", "rodenbourg": "Junglinster",

  // Commune de Hesperange
  "alzingen": "Hesperange", "fentange": "Hesperange", "howald": "Hesperange",
  "itzig": "Hesperange",

  // Commune de Sandweiler
  // (Sandweiler = 1 seule localité principale)

  // Commune de Niederanven
  "senningen": "Niederanven", "hostert": "Niederanven", "oberanven": "Niederanven",
  "rameldange": "Niederanven", "ernster": "Niederanven",

  // Commune de Walferdange
  "bereldange": "Walferdange", "helmsange": "Walferdange",

  // Commune de Steinsel
  "heisdorf": "Steinsel", "mullendorf": "Steinsel",

  // Commune de Strassen
  // (Strassen = 1 seule localité)

  // Commune de Bertrange
  // (Bertrange = 1 seule localité principale)

  // Commune de Mamer
  "capellen": "Mamer", "holzem": "Mamer",

  // Commune de Kehlen
  "keispelt": "Kehlen", "meispelt": "Kehlen", "nospelt": "Kehlen",
  "olm": "Kehlen", "dondelange": "Kehlen",

  // Commune de Kopstal
  "bridel": "Kopstal",

  // Commune de Steinfort
  "hagen": "Steinfort", "kleinbettingen": "Steinfort", "grass": "Steinfort",

  // Commune de Garnich
  "hivange": "Garnich", "dahlem": "Garnich",

  // Commune de Leudelange
  // (1 localité principale)

  // Commune d'Esch-sur-Alzette
  "lalange": "Esch-sur-Alzette",

  // Commune de Differdange
  "oberkorn": "Differdange", "niederkorn": "Differdange", "lasauvage": "Differdange",
  "fousbann": "Differdange",

  // Commune de Sanem
  "belvaux": "Sanem", "ehlerange": "Sanem", "soleuvre": "Sanem",

  // Commune de Mondercange
  "bergem": "Mondercange", "pontpierre": "Mondercange",

  // Commune de Bettembourg
  "noertzange": "Bettembourg", "huncherange": "Bettembourg", "fennange": "Bettembourg",

  // Commune de Dudelange
  "burange": "Dudelange",

  // Commune de Schifflange
  // (1 localité principale)

  // Commune de Pétange
  "lamadelaine": "Pétange", "rodange": "Pétange",

  // Commune de Käerjeng
  "bascharage": "Käerjeng", "clemency": "Käerjeng", "fingig": "Käerjeng",
  // Commune de Kayl
  "kayl": "Kayl", "tétange": "Kayl", "tetange": "Kayl", "rumelange": "Kayl",
  // Commune de Koerich
  "koerich": "Koerich", "goetzingen": "Koerich", "goeblange": "Koerich", "windhof": "Koerich",
  // Commune de Larochette
  "larochette": "Larochette", "heffingen": "Larochette", "angelsberg": "Larochette",
  "linger": "Käerjeng",

  // Commune de Mersch
  "beringen": "Mersch", "moesdorf": "Mersch", "reckange": "Mersch",
  "rollingen": "Mersch",

  // Commune de Lintgen
  "gosseldange": "Lintgen",

  // Commune de Lorentzweiler
  "blaschette": "Lorentzweiler", "fischbach": "Lorentzweiler",

  // Commune d'Ettelbruck
  "warken": "Ettelbruck",

  // Commune de Diekirch
  "gilsdorf": "Bettendorf", "ingeldorf": "Erpeldange-sur-Sûre",

  // Commune de Wiltz
  "weidingen": "Wiltz", "niederwiltz": "Wiltz",

  // Commune de Clervaux
  "marnach": "Clervaux", "munshausen": "Clervaux", "reuler": "Clervaux",

  // Commune d'Echternach
  // (1 localité principale)

  // Commune de Grevenmacher
  // (1 localité principale)

  // Commune de Remich
  // (1 localité principale)

  // Commune de Vianden
  // (1 localité principale)

  // Commune de Mondorf-les-Bains
  "mondorf": "Mondorf-les-Bains", "mondorf-les-bains": "Mondorf-les-Bains",
  "altwies": "Mondorf-les-Bains", "ellange": "Mondorf-les-Bains",

  // Commune de Contern
  "contern": "Contern", "moutfort": "Contern", "oetrange": "Contern", "medingen": "Contern",

  // Commune de Roeser
  "roeser": "Roeser", "bivange": "Roeser", "crauthem": "Roeser", "peppange": "Roeser",

  // Commune de Weiler-la-Tour
  "weiler-la-tour": "Weiler-la-Tour", "hassel": "Weiler-la-Tour", "syren": "Weiler-la-Tour",

  // Commune de Frisange
  "frisange": "Frisange", "aspelt": "Frisange", "hellange": "Frisange",

  // Commune de Schuttrange
  "schuttrange": "Schuttrange", "munsbach": "Schuttrange", "neuhäusgen": "Schuttrange",
  "neuhausgen": "Schuttrange",

  // Commune de Wormeldange
  "wormeldange": "Wormeldange", "ahn": "Wormeldange", "ehnen": "Wormeldange",
  "machtum": "Wormeldange",

  // Commune de Flaxweiler
  "flaxweiler": "Flaxweiler", "beyren": "Flaxweiler", "gostingen": "Flaxweiler",

  // Commune de Betzdorf
  "betzdorf": "Betzdorf", "berg": "Betzdorf", "mensdorf": "Betzdorf",
  "roodt-sur-syre": "Betzdorf",

  // Commune de Stadtbredimus
  "stadtbredimus": "Stadtbredimus", "greiveldange": "Stadtbredimus",

  // Commune de Dalheim
  "dalheim": "Dalheim", "filsdorf": "Dalheim",

  // Commune de Lenningen
  "lenningen": "Lenningen", "canach": "Lenningen",

  // Commune de Bous
  "bous": "Bous-Waldbredimus", "erpeldange-bous": "Bous-Waldbredimus", "rolling": "Bous-Waldbredimus",

  // Commune de Beaufort
  "beaufort": "Beaufort", "dillingen": "Beaufort", "grundhof": "Beaufort",

  // Commune de Rosport-Mompach
  "rosport": "Rosport-Mompach", "born": "Rosport-Mompach", "dickweiler": "Rosport-Mompach",
  "moersdorf": "Rosport-Mompach", "hinkel": "Rosport-Mompach", "osweiler": "Rosport-Mompach",

  // Commune de Waldbillig
  "waldbillig": "Waldbillig", "christnach": "Waldbillig", "müllerthal": "Waldbillig",
  "mullerthal": "Waldbillig", "consdorf": "Waldbillig",

  // Commune de Berdorf
  "berdorf": "Berdorf", "bollendorf-pont": "Berdorf",

  // Commune de Bech
  "bech": "Bech",

  // Commune de Manternach
  "manternach": "Manternach", "berbourg": "Manternach",

  // Commune de Tandel
  "tandel": "Tandel", "bastendorf": "Tandel", "fouhren": "Tandel",

  // Commune de Bourscheid
  "bourscheid": "Bourscheid", "lipperscheid": "Bourscheid", "michelau": "Bourscheid",

  // Commune de Bissen
  "bissen": "Bissen",

  // Commune de Colmar-Berg
  "colmar-berg": "Colmar-Berg",

  // Commune de Feulen
  "feulen": "Feulen", "niederfeulen": "Feulen",

  // Commune de Schieren
  "schieren": "Schieren",

  // Commune d'Erpeldange-sur-Sûre
  "erpeldange-sur-sûre": "Erpeldange-sur-Sûre", "erpeldange-sur-sure": "Erpeldange-sur-Sûre",
  "erpeldange": "Erpeldange-sur-Sûre",

  // Commune de Vallée de l'Ernz
  "vallée de l'ernz": "Vallée de l'Ernz", "vallee de l'ernz": "Vallée de l'Ernz",
  "eppeldorf": "Vallée de l'Ernz", "ermsdorf": "Vallée de l'Ernz",
  "folkendange": "Vallée de l'Ernz", "medernach": "Vallée de l'Ernz",
  "stegen": "Vallée de l'Ernz",

  // Commune d'Esch-sur-Sûre
  "esch-sur-sûre": "Esch-sur-Sûre", "esch-sur-sure": "Esch-sur-Sûre",
  "heiderscheid": "Esch-sur-Sûre", "insenborn": "Esch-sur-Sûre",

  // Commune de Lac de la Haute-Sûre
  "lac de la haute-sûre": "Lac de la Haute-Sûre", "lac de la haute-sure": "Lac de la Haute-Sûre",
  "bavigne": "Lac de la Haute-Sûre", "liefrange": "Lac de la Haute-Sûre",
  "nothum": "Lac de la Haute-Sûre",

  // Commune de Winseler
  "winseler": "Winseler", "berlé": "Winseler", "berle": "Winseler",
  "pommerloch": "Winseler",

  // Commune de Parc Hosingen
  "parc hosingen": "Parc Hosingen", "hosingen": "Parc Hosingen",
  "consthum": "Parc Hosingen", "holzthum": "Parc Hosingen",

  // Commune de Weiswampach
  "weiswampach": "Weiswampach",

  // Commune de Troisvierges
  "troisvierges": "Troisvierges", "basbellain": "Troisvierges",

  // Commune de Kiischpelt
  "kiischpelt": "Kiischpelt", "kautenbach": "Kiischpelt", "wilwerwiltz": "Kiischpelt",

  // Commune de Putscheid
  "putscheid": "Putscheid", "stolzembourg": "Putscheid",

  // Commune de Grosbous
  "grosbous": "Groussbus-Wal",

  // Commune de Préizerdaul
  "préizerdaul": "Préizerdaul", "preizerdaul": "Préizerdaul",
  "pratz": "Préizerdaul", "platen": "Préizerdaul", "reimberg": "Préizerdaul",

  // Commune de Rambrouch
  "rambrouch": "Rambrouch", "arsdorf": "Rambrouch", "bigonville": "Rambrouch",
  "perlé": "Rambrouch", "perle": "Rambrouch",

  // Commune de Saeul
  "saeul": "Saeul",

  // Commune de Septfontaines
  "septfontaines": "Habscht", "roodt-septfontaines": "Habscht",

  // Commune de Beckerich
  "beckerich": "Beckerich", "noerdange": "Beckerich",

  // Commune d'Ell
  "ell": "Ell",

  // Commune de Habscht
  "habscht": "Habscht", "hobscheid": "Habscht", "eischen": "Habscht",

  // Commune de Helperknapp
  "helperknapp": "Helperknapp", "tuntange": "Helperknapp",
  "boevange-sur-attert": "Helperknapp", "bour": "Helperknapp",

  // Commune de Nommern
  "nommern": "Nommern",

  // Commune de Dippach
  "dippach": "Dippach", "schouweiler": "Dippach", "sprinkange": "Dippach",

  // Commune de Reckange-sur-Mess
  "reckange-sur-mess": "Reckange-sur-Mess",

  // Commune de Schengen
  "schengen": "Schengen", "remerschen": "Schengen", "wintrange": "Schengen",

  // Commune de Mertert
  "mertert": "Mertert", "wasserbillig": "Mertert",

  // Commune de Biwer
  "biwer": "Biwer", "wecker": "Biwer",

  // Commune de Redange (localités)
  "attert": "Redange",

  // Commune de Useldange
  "useldange": "Useldange",

  // Commune de Wahl
  "wahl": "Groussbus-Wal",

  // Commune de Vichten
  "vichten": "Vichten",
};

Object.assign(LOCALITES_COMMUNES, {
  "belair": "Luxembourg",
  "limpertsberg": "Luxembourg",
  "kirchberg": "Luxembourg",
  "ville-haute": "Luxembourg",
  "centre": "Esch-sur-Alzette",
  "merl": "Luxembourg",
  "neudorf": "Luxembourg",
  "weimershof": "Luxembourg",
  "clausen": "Luxembourg",
  "gasperich": "Luxembourg",
  "cloche d'or": "Luxembourg",
  "cessange": "Luxembourg",
  "cents": "Luxembourg",
  "pfaffenthal": "Luxembourg",
  "eich": "Luxembourg",
  "rollingergrund": "Luxembourg",
  "mühlenbach": "Luxembourg",
  "bonnevoie": "Luxembourg",
  "hollerich": "Luxembourg",
  "gare": "Luxembourg",
  "hamm": "Luxembourg",
  "dommeldange": "Luxembourg",
  "beggen": "Luxembourg",
  "weimerskirch": "Luxembourg",
  "pulvermühl": "Luxembourg",
  "grund": "Luxembourg",
  "centre mamer": "Mamer",
  "capellen": "Mamer",
  "holzem": "Mamer",
  "brillplaz": "Esch-sur-Alzette",
  "belval": "Esch-sur-Alzette",
  "raemerich": "Esch-sur-Alzette",
  "wobrecken": "Esch-sur-Alzette",
  "lallange": "Esch-sur-Alzette",
  "centre differdange": "Differdange",
  "oberkorn": "Differdange",
  "niederkorn": "Differdange",
  "fousbann": "Differdange",
  "centre dudelange": "Dudelange",
  "burange": "Dudelange",
  "brill": "Dudelange",
  "italie": "Dudelange",
  "centre bettembourg": "Bettembourg",
  "noertzange": "Bettembourg",
  "huncherange": "Bettembourg",
  "belvaux": "Sanem",
  "soleuvre": "Sanem",
  "ehlerange": "Sanem",
  "centre pétange": "Pétange",
  "rodange": "Pétange",
  "lamadelaine": "Pétange",
  "centre mersch": "Mersch",
  "beringen": "Mersch",
  "rollingen": "Mersch",
  "centre ettelbruck": "Ettelbruck",
  "warken": "Ettelbruck",
  "ingeldorf": "Erpeldange-sur-Sûre"
});

export interface SearchResult {
  commune: MarketDataCommune;
  matchedOn: string;
  isLocalite: boolean;
  quartier?: QuartierData; // Si on a matché un quartier spécifique
}

export function rechercherCommune(query: string): SearchResult[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  // 1. Match direct sur le nom de commune
  for (const c of MARKET_DATA) {
    if (c.commune.toLowerCase().includes(q)) {
      results.push({ commune: c, matchedOn: c.commune, isLocalite: false });
      seen.add(c.commune);
    }
  }

  // 2. Match sur les quartiers (données intra-communales)
  for (const c of MARKET_DATA) {
    if (c.quartiers && !seen.has(c.commune)) {
      for (const qr of c.quartiers) {
        if (qr.nom.toLowerCase().includes(q)) {
          results.push({
            commune: c,
            matchedOn: qr.nom,
            isLocalite: true,
            quartier: qr,
          });
          seen.add(c.commune + ":" + qr.nom);
        }
      }
    }
  }

  // 3. Match sur les localités → retourne la commune parente
  for (const [localite, communeName] of Object.entries(LOCALITES_COMMUNES)) {
    if (localite.includes(q) && !seen.has(communeName)) {
      const communeData = MARKET_DATA.find((c) => c.commune === communeName);
      if (communeData) {
        results.push({
          commune: communeData,
          matchedOn: localite.charAt(0).toUpperCase() + localite.slice(1),
          isLocalite: true,
        });
        seen.add(communeName);
      }
    }
  }

  return results.sort((a, b) => Number(b.commune.commune.toLowerCase() === q) - Number(a.commune.commune.toLowerCase() === q));
}

export function getMarketDataCommune(commune: string): MarketDataCommune | undefined {
  return MARKET_DATA.find((c) => c.commune.toLowerCase() === commune.toLowerCase());
}

export function slugifyCommune(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function getCommuneBySlug(slug: string): MarketDataCommune | undefined {
  const normSlug = slugifyCommune(decodeURIComponent(slug));
  return MARKET_DATA.find((c) => slugifyCommune(c.commune) === normSlug);
}

export function getAllCommunes(): string[] {
  return MARKET_DATA.map((c) => c.commune).sort();
}

export function getAllMarketData(): MarketDataCommune[] {
  return MARKET_DATA;
}

export function getCommunesParCanton(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const c of MARKET_DATA) {
    if (!result[c.canton]) result[c.canton] = [];
    result[c.canton].push(c.commune);
  }
  return result;
}

// Auto-suggestion de comparables depuis les données marché
// Retourne les communes du même canton + communes limitrophes avec prix similaire
export function suggestComparables(communeName: string, nbMax: number = 5): {
  commune: string;
  prixM2: number;
  source: string;
  quartier?: string;
}[] {
  const target = MARKET_DATA.find((c) => c.commune.toLowerCase() === communeName.toLowerCase());
  if (!target || !target.prixM2Existant) return [];

  const targetPrix = target.prixM2Existant;
  const suggestions: { commune: string; prixM2: number; source: string; quartier?: string; score: number }[] = [];

  // 1. Quartiers de la même commune (meilleur match)
  if (target.quartiers) {
    for (const q of target.quartiers) {
      suggestions.push({
        commune: target.commune,
        prixM2: q.prixM2,
        source: `${q.nom}, ${target.commune} — ${target.periode}`,
        quartier: q.nom,
        score: 100 - Math.abs(q.prixM2 - targetPrix) / targetPrix * 50, // Proximité de prix
      });
    }
  }

  // 2. Communes du même canton
  for (const c of MARKET_DATA) {
    if (c.commune === target.commune || !c.prixM2Existant) continue;
    const prixProximite = 1 - Math.abs(c.prixM2Existant - targetPrix) / targetPrix;
    const memeCanton = c.canton === target.canton ? 30 : 0;
    suggestions.push({
      commune: c.commune,
      prixM2: c.prixM2Existant,
      source: `${c.commune} — ${c.periode}`,
      score: prixProximite * 50 + memeCanton,
    });
  }

  // Trier par score et prendre les N meilleurs
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, nbMax)
    .map(({ score: _s, ...rest }) => rest);
}

/** Une commune dont aucune valeur de prix ou de loyer n'est publiée (moins de
 * 10 ventes, moins de 30 annonces) n'a pas de contenu propre à présenter aux
 * moteurs : sa page reste consultable mais n'est ni indexée ni au sitemap. */
export function hasPublishedPrices(commune: MarketDataCommune): boolean {
  return [commune.prixM2Existant, commune.prixM2VEFA, commune.prixM2ExistantHorsAnnexes,
    commune.prixM2VEFAHorsAnnexes, commune.prixM2Annonces, commune.loyerM2Annonces].some(value => value !== null);
}
