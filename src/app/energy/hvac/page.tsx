"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import SliderField from "@/components/SliderField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";
import Breadcrumbs from "@/components/Breadcrumbs";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TypeBatiment =
  | "maison_individuelle"
  | "maison_jumelee"
  | "appartement"
  | "immeuble_collectif";

type ClasseEnergetique = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

type NiveauIsolation =
  | "non_isole"
  | "partiellement"
  | "bien_isole"
  | "tres_bien_isole";

type TypeVitrage = "simple" | "double" | "triple";

type Region =
  | "luxembourg_ville"
  | "sud"
  | "centre"
  | "nord_ardennes";

type TypeSysteme =
  | "pac_air_eau"
  | "pac_geothermique"
  | "chaudiere_pellets"
  | "chaudiere_gaz_condensation"
  | "hybride_pac_gaz";

type TypeEmetteur =
  | "plancher_chauffant"
  | "radiateurs_bt"
  | "radiateurs_ht"
  | "mixte";

type TypeVMC =
  | "aucune"
  | "simple_flux"
  | "double_flux"
  | "double_flux_premium";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LOT_COLORS: Record<string, string> = {
  lot1: "#dc2626",
  lot2: "#2563eb",
  lot3: "#16a34a",
  lot4: "#0891b2",
  lot5: "#7c3aed",
  lot6: "#d97706",
  lot7: "#6b7280",
};

/* Number formatters for the bordereau table */
const fmtPU = new Intl.NumberFormat("fr-LU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtQte = new Intl.NumberFormat("fr-LU", { maximumFractionDigits: 1 });
const fmtTotal = new Intl.NumberFormat("fr-LU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/* ------------------------------------------------------------------ */
/*  Heat loss W/m² data (EN 12831 simplified)                         */
/* ------------------------------------------------------------------ */

type AgeBracket = "pre1960" | "1960-1980" | "1980-2000" | "2000-2012" | "post2012";

const DEPERDITIONS_WM2: Record<NiveauIsolation, Record<AgeBracket, number>> = {
  non_isole: { pre1960: 180, "1960-1980": 150, "1980-2000": 120, "2000-2012": 80, post2012: 50 },
  partiellement: { pre1960: 140, "1960-1980": 110, "1980-2000": 85, "2000-2012": 60, post2012: 40 },
  bien_isole: { pre1960: 100, "1960-1980": 80, "1980-2000": 60, "2000-2012": 45, post2012: 30 },
  tres_bien_isole: { pre1960: 70, "1960-1980": 55, "1980-2000": 40, "2000-2012": 30, post2012: 20 },
};

function getAgeBracket(annee: number): AgeBracket {
  if (annee < 1960) return "pre1960";
  if (annee < 1980) return "1960-1980";
  if (annee < 2000) return "1980-2000";
  if (annee < 2012) return "2000-2012";
  return "post2012";
}

const VITRAGE_FACTOR: Record<TypeVitrage, number> = {
  simple: 1.15,
  double: 1.0,
  triple: 0.90,
};

const REGION_TEMP: Record<Region, number> = {
  luxembourg_ville: -10,
  sud: -10,
  centre: -11,
  nord_ardennes: -12,
};

/* ------------------------------------------------------------------ */
/*  Product catalogues                                                 */
/* ------------------------------------------------------------------ */

interface Produit {
  marque: string;
  modele: string;
  puissanceMin: number;
  puissanceMax: number;
  cop?: number;
  scop?: number;
  refrigerant?: string;
  bruit?: number;
  prixMin: number;
  prixMax: number;
  prixInstall: number;
  source: string;
  eligible_klimabonus: boolean;
}

const PRODUITS_PAC_AIR_EAU: Produit[] = [
  { marque: "Viessmann", modele: "Vitocal 250-A", puissanceMin: 2.6, puissanceMax: 13.4, cop: 5.3, scop: 5.01, refrigerant: "R290", bruit: 52, prixMin: 6000, prixMax: 10000, prixInstall: 6000, source: "viessmann.lu", eligible_klimabonus: true },
  { marque: "Daikin", modele: "Altherma 3 H HT", puissanceMin: 6, puissanceMax: 16, cop: 4.6, scop: 4.56, refrigerant: "R32", bruit: 55, prixMin: 7000, prixMax: 13000, prixInstall: 5500, source: "reckinger-alfred.lu", eligible_klimabonus: true },
  { marque: "Vaillant", modele: "aroTHERM plus", puissanceMin: 3, puissanceMax: 12, cop: 5.1, scop: 4.8, refrigerant: "R290", bruit: 50, prixMin: 6000, prixMax: 10000, prixInstall: 5000, source: "vanmarcke.com/fr-lu", eligible_klimabonus: true },
  { marque: "Mitsubishi", modele: "Ecodan Zubadan", puissanceMin: 4, puissanceMax: 14, cop: 4.2, scop: 4.1, refrigerant: "R32", bruit: 48, prixMin: 7000, prixMax: 15000, prixInstall: 6000, source: "sonepar.com", eligible_klimabonus: true },
  { marque: "Panasonic", modele: "Aquarea T-CAP", puissanceMin: 6, puissanceMax: 16, cop: 4.5, scop: 4.3, refrigerant: "R32", bruit: 53, prixMin: 6000, prixMax: 12000, prixInstall: 6000, source: "general-technic.lu", eligible_klimabonus: true },
  { marque: "Buderus", modele: "Logatherm WLW196i", puissanceMin: 4, puissanceMax: 15, cop: 4.8, scop: 4.5, refrigerant: "R410A", bruit: 55, prixMin: 5000, prixMax: 12000, prixInstall: 5500, source: "buderus.lu", eligible_klimabonus: true },
  { marque: "LG", modele: "Therma V Monobloc S", puissanceMin: 5, puissanceMax: 16, cop: 4.7, scop: 4.67, refrigerant: "R32", bruit: 50, prixMin: 5000, prixMax: 11000, prixInstall: 5000, source: "geoplanete.fr", eligible_klimabonus: true },
  { marque: "Bosch", modele: "Compress 7000i AW", puissanceMin: 5, puissanceMax: 13, cop: 4.5, scop: 4.3, refrigerant: "R410A", bruit: 54, prixMin: 4000, prixMax: 10000, prixInstall: 5000, source: "mon-energie.lu", eligible_klimabonus: true },
  { marque: "Hoval", modele: "Belaria PRO", puissanceMin: 4, puissanceMax: 15, cop: 4.9, scop: 4.6, refrigerant: "R290", bruit: 42, prixMin: 7000, prixMax: 14000, prixInstall: 6000, source: "infogreen.lu", eligible_klimabonus: true },
  { marque: "Wolf", modele: "CHA Monobloc", puissanceMin: 7, puissanceMax: 10, cop: 4.8, scop: 4.5, refrigerant: "R290", bruit: 40, prixMin: 7000, prixMax: 11000, prixInstall: 5500, source: "wolf.eu", eligible_klimabonus: true },
  { marque: "Atlantic", modele: "Alfea Excellia Duo", puissanceMin: 5, puissanceMax: 16, cop: 4.3, scop: 4.25, refrigerant: "R32", bruit: 55, prixMin: 5000, prixMax: 12000, prixInstall: 5500, source: "atlantic.fr", eligible_klimabonus: true },
  { marque: "De Dietrich", modele: "Alezio S R32", puissanceMin: 4, puissanceMax: 11, cop: 5.1, scop: 4.8, refrigerant: "R32", bruit: 52, prixMin: 5500, prixMax: 11000, prixInstall: 5500, source: "vanmarcke.com/fr-lu", eligible_klimabonus: true },
];

const PRODUITS_PAC_GEO: Produit[] = [
  { marque: "Viessmann", modele: "Vitocal 222-G", puissanceMin: 5, puissanceMax: 17, cop: 5.0, scop: 4.8, prixMin: 12000, prixMax: 18000, prixInstall: 18000, source: "viessmann.lu", eligible_klimabonus: true },
  { marque: "Buderus", modele: "Logatherm WSW186i", puissanceMin: 6, puissanceMax: 16, cop: 4.8, scop: 4.5, prixMin: 10000, prixMax: 16000, prixInstall: 20000, source: "buderus.lu", eligible_klimabonus: true },
  { marque: "Weishaupt", modele: "WWP S", puissanceMin: 6, puissanceMax: 22, cop: 4.5, scop: 4.3, prixMin: 10000, prixMax: 18000, prixInstall: 22000, source: "weishaupt.fr", eligible_klimabonus: true },
];

const PRODUITS_PELLETS: Produit[] = [
  { marque: "Froling", modele: "PE1", puissanceMin: 7, puissanceMax: 25, prixMin: 8700, prixMax: 11000, prixInstall: 5000, source: "tsd.lu", eligible_klimabonus: true },
  { marque: "Okofen", modele: "Pellematic", puissanceMin: 8, puissanceMax: 32, prixMin: 9000, prixMax: 16000, prixInstall: 6000, source: "hellowatt.fr", eligible_klimabonus: true },
  { marque: "Windhager", modele: "BioWIN2", puissanceMin: 3, puissanceMax: 60, prixMin: 10000, prixMax: 20000, prixInstall: 6000, source: "windhager.com", eligible_klimabonus: true },
];

const PRODUITS_GAZ: Produit[] = [
  { marque: "Viessmann", modele: "Vitodens 200-W", puissanceMin: 11, puissanceMax: 150, prixMin: 3000, prixMax: 6000, prixInstall: 2500, source: "crs.lu", eligible_klimabonus: false },
  { marque: "Buderus", modele: "Logamax plus GB192i", puissanceMin: 14, puissanceMax: 25, prixMin: 2500, prixMax: 4000, prixInstall: 2000, source: "crs.lu", eligible_klimabonus: false },
  { marque: "Weishaupt", modele: "WTC-GW", puissanceMin: 15, puissanceMax: 60, prixMin: 3000, prixMax: 5000, prixInstall: 2500, source: "crs.lu", eligible_klimabonus: false },
];

function getProductsForSystem(typeSysteme: TypeSysteme): Produit[] {
  switch (typeSysteme) {
    case "pac_air_eau":
    case "hybride_pac_gaz":
      return PRODUITS_PAC_AIR_EAU;
    case "pac_geothermique":
      return PRODUITS_PAC_GEO;
    case "chaudiere_pellets":
      return PRODUITS_PELLETS;
    case "chaudiere_gaz_condensation":
      return PRODUITS_GAZ;
  }
}

/* ------------------------------------------------------------------ */
/*  VMC products                                                       */
/* ------------------------------------------------------------------ */

interface ProduitVMC {
  marque: string;
  modele: string;
  debitMax: number;
  rendement: number;
  prixMin: number;
  prixMax: number;
  source: string;
}

const PRODUITS_VMC: ProduitVMC[] = [
  { marque: "Zehnder", modele: "ComfoAir Q350", debitMax: 350, rendement: 97, prixMin: 4000, prixMax: 6000, source: "fiabishop.com" },
  { marque: "Zehnder", modele: "ComfoAir Q450", debitMax: 450, rendement: 97, prixMin: 4500, prixMax: 6500, source: "fiabishop.com" },
  { marque: "Helios", modele: "KWL EC 370W", debitMax: 370, rendement: 93, prixMin: 3500, prixMax: 5500, source: "helios.de" },
  { marque: "Brink", modele: "Renovent Excellent 400", debitMax: 400, rendement: 95, prixMin: 3000, prixMax: 5000, source: "brinkclimatesystems.nl" },
];

/* ------------------------------------------------------------------ */
/*  Klimabonus                                                         */
/* ------------------------------------------------------------------ */

function calculerKlimabonus(
  typeSysteme: TypeSysteme,
  typeBatiment: TypeBatiment,
  remplaceFossile: boolean,
): number {
  if (typeSysteme === "pac_air_eau" || typeSysteme === "hybride_pac_gaz") {
    if (remplaceFossile) return typeBatiment === "immeuble_collectif" ? 8000 : 10000;
    return typeBatiment === "immeuble_collectif" ? 5000 : 6000;
  }
  if (typeSysteme === "pac_geothermique") {
    if (remplaceFossile) return typeBatiment === "immeuble_collectif" ? 10000 : 12000;
    return typeBatiment === "immeuble_collectif" ? 5000 : 8000;
  }
  if (typeSysteme === "chaudiere_pellets") {
    if (remplaceFossile) return 8000;
    return 4000;
  }
  return 0;
}

/* ------------------------------------------------------------------ */
/*  Reference documents                                                */
/* ------------------------------------------------------------------ */

const REFERENCE_DOCS = [
  { labelKey: "ref0" as const, url: "https://guichet.public.lu/fr/citoyens/logement/aides-logement/klimabonus.html" },
  { labelKey: "ref1" as const, url: "https://www.klima-agence.lu" },
  { labelKey: "ref2" as const, url: "https://www.en-standard.eu/bs-en-12831-1-2017/" },
  { labelKey: "ref3" as const, url: "https://legilux.public.lu/eli/etat/leg/rgd/2021/06/09/a481/jo" },
  { labelKey: "ref4" as const, url: "https://www.batiprix.com" },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function HVACSimulator() {
  const t = useTranslations("hvac");

  /* ======== Methodology stepper ======== */
  const STEPS = [
    { id: 0, label: t("steps.step0") },
    { id: 1, label: t("steps.step1") },
    { id: 2, label: t("steps.step2") },
    { id: 3, label: t("steps.step3") },
    { id: 4, label: t("steps.step4") },
    { id: 5, label: t("steps.step5") },
  ];

  const STEP_NOTES: Record<number, string> = {
    0: t("steps.stepNote0"),
    1: t("steps.stepNote1"),
    2: t("steps.stepNote2"),
    3: t("steps.stepNote3"),
    4: t("steps.stepNote4"),
    5: t("steps.stepNote5"),
  };

  /* ======== Stepper state ======== */
  const [currentStep, setCurrentStep] = useState(0);

  /* ======== Step 0: Batiment ======== */
  const [typeBatiment, setTypeBatiment] = useState<TypeBatiment>("maison_individuelle");
  const [surface, setSurface] = useState(150);
  const [anneeConstruction, setAnneeConstruction] = useState(1990);
  const [classeActuelle, setClasseActuelle] = useState<ClasseEnergetique>("D");
  const [classeCible, setClasseCible] = useState<ClasseEnergetique>("B");
  const [nbPieces, setNbPieces] = useState(6);
  const [hauteurSousPlafond, setHauteurSousPlafond] = useState(2.5);
  const [niveauIsolation, setNiveauIsolation] = useState<NiveauIsolation>("partiellement");
  const [typeVitrage, setTypeVitrage] = useState<TypeVitrage>("double");
  const [region, setRegion] = useState<Region>("luxembourg_ville");

  /* ======== Step 2: Systeme de chauffage ======== */
  const [typeSysteme, setTypeSysteme] = useState<TypeSysteme>("pac_air_eau");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  /* ======== Step 3: Emetteurs et distribution ======== */
  const [typeEmetteur, setTypeEmetteur] = useState<TypeEmetteur>("plancher_chauffant");
  const [surfacePlancher, setSurfacePlancher] = useState(150);
  const [nbRadiateurs, setNbRadiateurs] = useState(6);
  const [ballonTampon, setBallonTampon] = useState(300);
  const [ballonECS, setBallonECS] = useState(200);
  const [circulateur, setCirculateur] = useState(true);
  const [vannesMelangeuses, setVannesMelangeuses] = useState(1);

  /* ======== Step 4: Ventilation ======== */
  const [typeVMC, setTypeVMC] = useState<TypeVMC>("double_flux");
  const [selectedVMC, setSelectedVMC] = useState(0);

  /* ======== Step 5: Chiffrage et aides ======== */
  const [remplaceFossile, setRemplaceFossile] = useState(true);
  const [retraitCuve, setRetraitCuve] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Calculations                                                     */
  /* ---------------------------------------------------------------- */

  const result = useMemo(() => {
    /* --- Heat loss calculation --- */
    const ageBracket = getAgeBracket(anneeConstruction);
    const depWm2 = DEPERDITIONS_WM2[niveauIsolation][ageBracket];
    const vitrFactor = VITRAGE_FACTOR[typeVitrage];
    const tempExt = REGION_TEMP[region];
    const regionFactor = (20 - tempExt) / 30;

    const puissanceKW = (surface * depWm2 * vitrFactor * regionFactor) / 1000;
    const puissanceECS = nbPieces * 0.15;
    const puissanceTotale = puissanceKW + puissanceECS;

    /* --- Product selection --- */
    const products = getProductsForSystem(typeSysteme);
    const selected = selectedProduct !== null && selectedProduct < products.length
      ? products[selectedProduct]
      : null;

    /* --- Prix materiel generateur --- */
    const prixMaterielGen = selected
      ? Math.round((selected.prixMin + selected.prixMax) / 2)
      : 0;
    const prixInstallGen = selected ? selected.prixInstall : 0;

    /* Hybride: add gas boiler */
    const prixHybride = typeSysteme === "hybride_pac_gaz" ? 3500 : 0;
    const prixInstallHybride = typeSysteme === "hybride_pac_gaz" ? 1500 : 0;

    /* --- Lot 1: Generateur de chaleur --- */
    const totalLot1 = prixMaterielGen + prixInstallGen + prixHybride + prixInstallHybride;

    /* --- Lot 2: Distribution hydraulique --- */
    const mlTuyauterie = Math.round(surface * 0.3);
    const prixTuyauterieML = 20; // avg 15-25
    const coutTuyauterie = mlTuyauterie * prixTuyauterieML;
    const coutCirculateur = circulateur ? 450 : 0;
    const coutVannes = vannesMelangeuses * 350;
    const totalLot2 = coutTuyauterie + coutCirculateur + coutVannes;

    /* --- Lot 3: Emetteurs --- */
    let coutPlancher = 0;
    let coutRadiateurs = 0;
    if (typeEmetteur === "plancher_chauffant" || typeEmetteur === "mixte") {
      const surfPC = typeEmetteur === "mixte" ? Math.round(surfacePlancher * 0.7) : surfacePlancher;
      coutPlancher = surfPC * 125; // avg 100-150
    }
    if (typeEmetteur === "radiateurs_bt" || typeEmetteur === "radiateurs_ht" || typeEmetteur === "mixte") {
      const nbRad = typeEmetteur === "mixte" ? Math.max(1, Math.round(nbRadiateurs * 0.4)) : nbRadiateurs;
      const prixUnitRad = typeEmetteur === "radiateurs_ht" ? 400 : 550; // HT: 200-600 avg 400, BT: 300-800 avg 550
      coutRadiateurs = nbRad * prixUnitRad;
    }
    const totalLot3 = coutPlancher + coutRadiateurs;

    /* --- Lot 4: Production ECS --- */
    const coutBallonTampon = ballonTampon <= 200 ? 800
      : ballonTampon <= 400 ? 1200
      : ballonTampon <= 600 ? 2000
      : 2800;
    const coutBallonECS = ballonECS <= 150 ? 1000
      : ballonECS <= 250 ? 1500
      : ballonECS <= 350 ? 2000
      : 2300;
    const totalLot4 = coutBallonTampon + coutBallonECS;

    /* --- Lot 5: Ventilation --- */
    let coutVMCUnit = 0;
    let coutVMCInstall = 0;
    const debitTotal = nbPieces * 30;
    if (typeVMC === "simple_flux") {
      coutVMCUnit = 500;
      coutVMCInstall = 1500;
    } else if (typeVMC === "double_flux" || typeVMC === "double_flux_premium") {
      const vmcProduit = PRODUITS_VMC[selectedVMC] || PRODUITS_VMC[0];
      coutVMCUnit = Math.round((vmcProduit.prixMin + vmcProduit.prixMax) / 2);
      coutVMCInstall = typeVMC === "double_flux_premium" ? 5000 : 3500;
    }
    const totalLot5 = coutVMCUnit + coutVMCInstall;

    /* --- Lot 6: Regulation --- */
    const coutRegulation = 1200; // thermostat connecte + sondes
    const coutRaccordElec = 800;
    const totalLot6 = coutRegulation + coutRaccordElec;

    /* --- Lot 7: Mise en service --- */
    const coutMiseEnService = 800;
    const coutFormation = 200;
    const totalLot7 = coutMiseEnService + coutFormation;

    /* --- Total travaux --- */
    const totalTravaux = totalLot1 + totalLot2 + totalLot3 + totalLot4 + totalLot5 + totalLot6 + totalLot7;

    /* --- Aides financieres --- */
    const klimabonus = calculerKlimabonus(typeSysteme, typeBatiment, remplaceFossile);
    const enoprimes = (typeSysteme === "pac_air_eau" || typeSysteme === "pac_geothermique" || typeSysteme === "hybride_pac_gaz") ? 1500 : typeSysteme === "chaudiere_pellets" ? 1000 : 0;
    const coutRetraitCuve = retraitCuve ? 1500 : 0;
    const batimentAncien = anneeConstruction <= 2016;
    const tva3Economie = batimentAncien ? Math.round(totalTravaux * 0.14) : 0; // 17% - 3% = 14% saving
    const totalAides = klimabonus + enoprimes + tva3Economie;
    const resteACharge = totalTravaux + coutRetraitCuve - totalAides;

    /* --- Rentabilite --- */
    const copMoyen = selected?.scop || selected?.cop || 3.5;
    // Old system: gas boiler ~90% efficiency, ~0.08 EUR/kWh gas
    // New PAC: COP * electricity cost
    const consoAncienneKWh = surface * depWm2 * vitrFactor * regionFactor * 2000 / 1000000; // hours de chauffe ~2000h
    const prixGaz = 0.08;
    const prixElec = 0.22;
    const coutAncien = consoAncienneKWh * prixGaz / 0.9;
    const coutNouveau = typeSysteme === "chaudiere_gaz_condensation"
      ? consoAncienneKWh * prixGaz / 0.98
      : typeSysteme === "chaudiere_pellets"
      ? consoAncienneKWh * 0.06 / 0.92 // pellets ~0.06 EUR/kWh
      : consoAncienneKWh * prixElec / copMoyen;
    const economieAnnuelle = Math.max(0, coutAncien - coutNouveau);
    const payback = economieAnnuelle > 0 ? Math.round(resteACharge / economieAnnuelle * 10) / 10 : 99;
    const economieCO2 = Math.round(consoAncienneKWh * 0.227 - (typeSysteme.startsWith("pac") || typeSysteme === "hybride_pac_gaz" ? consoAncienneKWh / copMoyen * 0.061 : typeSysteme === "chaudiere_pellets" ? consoAncienneKWh * 0.03 : consoAncienneKWh * 0.227 * 0.05));

    const coutM2 = surface > 0 ? totalTravaux / surface : 0;

    /* --- Lots array --- */
    const lots = [
      { num: 1, nom: t("lots.lot1"), total: totalLot1, color: LOT_COLORS.lot1 },
      { num: 2, nom: t("lots.lot2"), total: totalLot2, color: LOT_COLORS.lot2 },
      { num: 3, nom: t("lots.lot3"), total: totalLot3, color: LOT_COLORS.lot3 },
      { num: 4, nom: t("lots.lot4"), total: totalLot4, color: LOT_COLORS.lot4 },
      { num: 5, nom: t("lots.lot5"), total: totalLot5, color: LOT_COLORS.lot5 },
      { num: 6, nom: t("lots.lot6"), total: totalLot6, color: LOT_COLORS.lot6 },
      { num: 7, nom: t("lots.lot7"), total: totalLot7, color: LOT_COLORS.lot7 },
    ];

    /* --- Bordereau rows --- */
    type BRow = {
      type: "header" | "line" | "subtotal" | "grandtotal";
      lotNum?: number;
      lotNom?: string;
      lotColor?: string;
      num?: string;
      designation?: string;
      unite?: string;
      quantite?: number;
      pu?: number;
      total?: number;
    };

    const bordereau: BRow[] = [];

    // LOT 1 — Generateur de chaleur
    bordereau.push({ type: "header", lotNum: 1, lotNom: t("lots.lot1"), lotColor: LOT_COLORS.lot1 });
    if (selected) {
      bordereau.push({
        type: "line", num: "1.1",
        designation: `${selected.marque} ${selected.modele} (${selected.puissanceMin}-${selected.puissanceMax} kW)`,
        unite: "u", quantite: 1, pu: prixMaterielGen, total: prixMaterielGen,
      });
      bordereau.push({
        type: "line", num: "1.2",
        designation: t("bordereau.installationGenerateur"),
        unite: "ft", quantite: 1, pu: prixInstallGen, total: prixInstallGen,
      });
    }
    if (typeSysteme === "hybride_pac_gaz") {
      bordereau.push({
        type: "line", num: "1.3",
        designation: t("bordereau.chaudiereAppoint"),
        unite: "u", quantite: 1, pu: prixHybride, total: prixHybride,
      });
      bordereau.push({
        type: "line", num: "1.4",
        designation: t("bordereau.installationAppoint"),
        unite: "ft", quantite: 1, pu: prixInstallHybride, total: prixInstallHybride,
      });
    }
    bordereau.push({ type: "subtotal", lotNum: 1, lotNom: t("lots.lot1"), lotColor: LOT_COLORS.lot1, total: totalLot1 });

    // LOT 2 — Distribution hydraulique
    bordereau.push({ type: "header", lotNum: 2, lotNom: t("lots.lot2"), lotColor: LOT_COLORS.lot2 });
    bordereau.push({
      type: "line", num: "2.1",
      designation: t("bordereau.tuyauterie"),
      unite: "ml", quantite: mlTuyauterie, pu: prixTuyauterieML, total: coutTuyauterie,
    });
    if (circulateur) {
      bordereau.push({
        type: "line", num: "2.2",
        designation: t("bordereau.circulateur"),
        unite: "u", quantite: 1, pu: coutCirculateur, total: coutCirculateur,
      });
    }
    bordereau.push({
      type: "line", num: circulateur ? "2.3" : "2.2",
      designation: t("bordereau.vannes3voies"),
      unite: "u", quantite: vannesMelangeuses, pu: 350, total: coutVannes,
    });
    bordereau.push({ type: "subtotal", lotNum: 2, lotNom: t("lots.lot2"), lotColor: LOT_COLORS.lot2, total: totalLot2 });

    // LOT 3 — Emetteurs
    bordereau.push({ type: "header", lotNum: 3, lotNom: t("lots.lot3"), lotColor: LOT_COLORS.lot3 });
    let lineNum3 = 1;
    if (typeEmetteur === "plancher_chauffant" || typeEmetteur === "mixte") {
      const surfPC = typeEmetteur === "mixte" ? Math.round(surfacePlancher * 0.7) : surfacePlancher;
      bordereau.push({
        type: "line", num: `3.${lineNum3}`,
        designation: t("bordereau.plancherChauffant"),
        unite: "m²", quantite: surfPC, pu: 125, total: coutPlancher,
      });
      lineNum3++;
    }
    if (typeEmetteur === "radiateurs_bt" || typeEmetteur === "radiateurs_ht" || typeEmetteur === "mixte") {
      const nbRad = typeEmetteur === "mixte" ? Math.max(1, Math.round(nbRadiateurs * 0.4)) : nbRadiateurs;
      const prixUnitRad = typeEmetteur === "radiateurs_ht" ? 400 : 550;
      const labelRad = typeEmetteur === "radiateurs_ht" ? t("bordereau.radiateursHT") : t("bordereau.radiateursBT");
      bordereau.push({
        type: "line", num: `3.${lineNum3}`,
        designation: labelRad,
        unite: "u", quantite: nbRad, pu: prixUnitRad, total: coutRadiateurs,
      });
    }
    bordereau.push({ type: "subtotal", lotNum: 3, lotNom: t("lots.lot3"), lotColor: LOT_COLORS.lot3, total: totalLot3 });

    // LOT 4 — Production ECS
    bordereau.push({ type: "header", lotNum: 4, lotNom: t("lots.lot4"), lotColor: LOT_COLORS.lot4 });
    bordereau.push({
      type: "line", num: "4.1",
      designation: t("bordereau.ballonTampon", { litres: ballonTampon }),
      unite: "u", quantite: 1, pu: coutBallonTampon, total: coutBallonTampon,
    });
    bordereau.push({
      type: "line", num: "4.2",
      designation: t("bordereau.ballonECS", { litres: ballonECS }),
      unite: "u", quantite: 1, pu: coutBallonECS, total: coutBallonECS,
    });
    bordereau.push({ type: "subtotal", lotNum: 4, lotNom: t("lots.lot4"), lotColor: LOT_COLORS.lot4, total: totalLot4 });

    // LOT 5 — Ventilation
    bordereau.push({ type: "header", lotNum: 5, lotNom: t("lots.lot5"), lotColor: LOT_COLORS.lot5 });
    if (typeVMC !== "aucune") {
      const vmcLabel = typeVMC === "simple_flux"
        ? t("bordereau.vmcSimpleFlux")
        : `${PRODUITS_VMC[selectedVMC]?.marque || "VMC"} ${PRODUITS_VMC[selectedVMC]?.modele || ""}`;
      bordereau.push({
        type: "line", num: "5.1",
        designation: vmcLabel,
        unite: "u", quantite: 1, pu: coutVMCUnit, total: coutVMCUnit,
      });
      bordereau.push({
        type: "line", num: "5.2",
        designation: t("bordereau.vmcInstallation"),
        unite: "ft", quantite: 1, pu: coutVMCInstall, total: coutVMCInstall,
      });
    }
    bordereau.push({ type: "subtotal", lotNum: 5, lotNom: t("lots.lot5"), lotColor: LOT_COLORS.lot5, total: totalLot5 });

    // LOT 6 — Regulation
    bordereau.push({ type: "header", lotNum: 6, lotNom: t("lots.lot6"), lotColor: LOT_COLORS.lot6 });
    bordereau.push({
      type: "line", num: "6.1",
      designation: t("bordereau.regulationConnectee"),
      unite: "ft", quantite: 1, pu: coutRegulation, total: coutRegulation,
    });
    bordereau.push({
      type: "line", num: "6.2",
      designation: t("bordereau.raccordementElectrique"),
      unite: "ft", quantite: 1, pu: coutRaccordElec, total: coutRaccordElec,
    });
    bordereau.push({ type: "subtotal", lotNum: 6, lotNom: t("lots.lot6"), lotColor: LOT_COLORS.lot6, total: totalLot6 });

    // LOT 7 — Mise en service
    bordereau.push({ type: "header", lotNum: 7, lotNom: t("lots.lot7"), lotColor: LOT_COLORS.lot7 });
    bordereau.push({
      type: "line", num: "7.1",
      designation: t("bordereau.miseEnService"),
      unite: "ft", quantite: 1, pu: coutMiseEnService, total: coutMiseEnService,
    });
    bordereau.push({
      type: "line", num: "7.2",
      designation: t("bordereau.formationUtilisateur"),
      unite: "ft", quantite: 1, pu: coutFormation, total: coutFormation,
    });
    bordereau.push({ type: "subtotal", lotNum: 7, lotNom: t("lots.lot7"), lotColor: LOT_COLORS.lot7, total: totalLot7 });

    // Grand total
    bordereau.push({ type: "grandtotal", total: totalTravaux });

    return {
      depWm2,
      vitrFactor,
      tempExt,
      regionFactor,
      puissanceKW,
      puissanceECS,
      puissanceTotale,
      products,
      selected,
      prixMaterielGen,
      prixInstallGen,
      totalLot1,
      totalLot2,
      totalLot3,
      totalLot4,
      totalLot5,
      totalLot6,
      totalLot7,
      totalTravaux,
      coutM2,
      klimabonus,
      enoprimes,
      tva3Economie,
      totalAides,
      coutRetraitCuve,
      resteACharge,
      economieAnnuelle,
      consoAncienneKWh,
      payback,
      economieCO2,
      lots,
      bordereau,
      debitTotal,
      batimentAncien,
    };
  }, [
    t,
    typeBatiment, surface, anneeConstruction, niveauIsolation, typeVitrage, region,
    nbPieces, hauteurSousPlafond,
    typeSysteme, selectedProduct,
    typeEmetteur, surfacePlancher, nbRadiateurs, ballonTampon, ballonECS, circulateur, vannesMelangeuses,
    typeVMC, selectedVMC,
    remplaceFossile, retraitCuve,
    classeActuelle, classeCible,
  ]);

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */

  function MethodologyNote({ step }: { step: number }) {
    const note = STEP_NOTES[step];
    if (!note) return null;
    return (
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
        {note}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step 0: Batiment                                                 */
  /* ---------------------------------------------------------------- */

  function renderStep0() {
    const classeOptions: { value: string; label: string }[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I"].map(
      (c) => ({ value: c, label: `${t("labels.classe")} ${c}` }),
    );

    return (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">
          1 &mdash; {t("steps.step0")}
        </h2>
        <MethodologyNote step={0} />
        <div className="space-y-4">
          <InputField
            label={t("labels.typeBatiment")}
            type="select"
            value={typeBatiment}
            onChange={(v) => setTypeBatiment(v as TypeBatiment)}
            options={[
              { value: "maison_individuelle", label: t("labels.maisonIndividuelle") },
              { value: "maison_jumelee", label: t("labels.maisonJumelee") },
              { value: "appartement", label: t("labels.appartement") },
              { value: "immeuble_collectif", label: t("labels.immeubleCollectif") },
            ]}
          />
          <InputField
            label={t("labels.surface")}
            value={surface}
            onChange={(v) => { setSurface(Number(v)); setSurfacePlancher(Number(v)); }}
            suffix="m²"
            min={20}
            max={1000}
            step={10}
          />
          <InputField
            label={t("labels.anneeConstruction")}
            value={anneeConstruction}
            onChange={(v) => setAnneeConstruction(Number(v))}
            min={1900}
            max={2026}
            step={1}
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label={t("labels.classeActuelle")}
              type="select"
              value={classeActuelle}
              onChange={(v) => setClasseActuelle(v as ClasseEnergetique)}
              options={classeOptions}
            />
            <InputField
              label={t("labels.classeCible")}
              type="select"
              value={classeCible}
              onChange={(v) => setClasseCible(v as ClasseEnergetique)}
              options={classeOptions}
            />
          </div>
          <InputField
            label={t("labels.nbPieces")}
            value={nbPieces}
            onChange={(v) => setNbPieces(Number(v))}
            min={1}
            max={20}
            step={1}
          />
          <SliderField
            label={t("labels.hauteurSousPlafond")}
            value={hauteurSousPlafond}
            onChange={setHauteurSousPlafond}
            min={2.3}
            max={3.5}
            step={0.1}
            suffix="m"
          />
          <InputField
            label={t("labels.niveauIsolation")}
            type="select"
            value={niveauIsolation}
            onChange={(v) => setNiveauIsolation(v as NiveauIsolation)}
            options={[
              { value: "non_isole", label: t("labels.nonIsole") },
              { value: "partiellement", label: t("labels.partiellement") },
              { value: "bien_isole", label: t("labels.bienIsole") },
              { value: "tres_bien_isole", label: t("labels.tresBienIsole") },
            ]}
            hint={t("hints.niveauIsolation")}
          />
          <InputField
            label={t("labels.typeVitrage")}
            type="select"
            value={typeVitrage}
            onChange={(v) => setTypeVitrage(v as TypeVitrage)}
            options={[
              { value: "simple", label: t("labels.simpleVitrage") },
              { value: "double", label: t("labels.doubleVitrage") },
              { value: "triple", label: t("labels.tripleVitrage") },
            ]}
          />
          <InputField
            label={t("labels.region")}
            type="select"
            value={region}
            onChange={(v) => setRegion(v as Region)}
            options={[
              { value: "luxembourg_ville", label: t("labels.luxembourgVille") },
              { value: "sud", label: t("labels.sud") },
              { value: "centre", label: t("labels.centre") },
              { value: "nord_ardennes", label: t("labels.nordArdennes") },
            ]}
            hint={t("hints.region")}
          />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step 1: Deperditions thermiques (calculated, no inputs)          */
  /* ---------------------------------------------------------------- */

  function renderStep1() {
    return (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">
          2 &mdash; {t("steps.step1")}
        </h2>
        <MethodologyNote step={1} />

        <div className="space-y-3">
          {/* Deperditions par transmission */}
          <div className="flex items-center justify-between rounded-lg bg-background/50 px-4 py-3">
            <span className="text-sm text-slate">{t("calc.deperditionsTransmission")}</span>
            <span className="font-mono font-semibold text-foreground">{result.depWm2} W/m²</span>
          </div>

          {/* Facteur vitrage */}
          <div className="flex items-center justify-between rounded-lg bg-background/50 px-4 py-3">
            <span className="text-sm text-slate">{t("calc.facteurVitrage")}</span>
            <span className="font-mono font-semibold text-foreground">×{result.vitrFactor.toFixed(2)}</span>
          </div>

          {/* Facteur region */}
          <div className="flex items-center justify-between rounded-lg bg-background/50 px-4 py-3">
            <span className="text-sm text-slate">{t("calc.facteurRegion")}</span>
            <span className="font-mono font-semibold text-foreground">
              {result.tempExt}°C &rarr; ×{result.regionFactor.toFixed(2)}
            </span>
          </div>

          {/* Puissance chauffage */}
          <div className="flex items-center justify-between rounded-lg border-2 border-navy/20 bg-navy/5 px-4 py-3">
            <span className="text-sm font-semibold text-navy">{t("calc.puissanceChauffage")}</span>
            <span className="font-mono text-lg font-bold text-navy">{result.puissanceKW.toFixed(1)} kW</span>
          </div>

          {/* Puissance ECS */}
          <div className="flex items-center justify-between rounded-lg bg-background/50 px-4 py-3">
            <span className="text-sm text-slate">{t("calc.puissanceECS")}</span>
            <span className="font-mono font-semibold text-foreground">{result.puissanceECS.toFixed(1)} kW</span>
          </div>

          {/* Puissance totale */}
          <div className="flex items-center justify-between rounded-xl border-2 border-gold bg-gold/10 px-4 py-4">
            <span className="text-base font-bold text-navy">{t("calc.puissanceTotale")}</span>
            <span className="font-mono text-2xl font-bold text-navy">{result.puissanceTotale.toFixed(1)} kW</span>
          </div>
        </div>

        {/* Methodology breakdown */}
        <div className="mt-4 rounded-lg border border-card-border/50 bg-background/30 p-3">
          <p className="text-[11px] leading-relaxed text-muted">
            {t("calc.formuleExplication", {
              surface: surface,
              depWm2: result.depWm2,
              vitr: result.vitrFactor.toFixed(2),
              region: result.regionFactor.toFixed(2),
              result: result.puissanceKW.toFixed(1),
            })}
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step 2: Systeme de chauffage — Product selection                 */
  /* ---------------------------------------------------------------- */

  function renderStep2() {
    const products = result.products;

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">
            3 &mdash; {t("steps.step2")}
          </h2>
          <MethodologyNote step={2} />

          <InputField
            label={t("labels.typeSysteme")}
            type="select"
            value={typeSysteme}
            onChange={(v) => { setTypeSysteme(v as TypeSysteme); setSelectedProduct(null); }}
            options={[
              { value: "pac_air_eau", label: t("labels.pacAirEau") },
              { value: "pac_geothermique", label: t("labels.pacGeothermique") },
              { value: "chaudiere_pellets", label: t("labels.chaudierePellets") },
              { value: "chaudiere_gaz_condensation", label: t("labels.chaudiereGaz") },
              { value: "hybride_pac_gaz", label: t("labels.hybridePacGaz") },
            ]}
            hint={t("hints.typeSysteme")}
          />
        </div>

        {/* Product catalogue table */}
        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
          <div className="p-6 pb-3">
            <h3 className="text-base font-semibold text-navy">{t("labels.catalogueProduits")}</h3>
            <p className="mt-1 text-xs text-muted">
              {t("labels.catalogueHint", { kw: result.puissanceTotale.toFixed(1) })}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border bg-background/80">
                  <th className="px-2 py-2 text-left font-semibold text-slate">{t("table.marque")}</th>
                  <th className="px-2 py-2 text-left font-semibold text-slate">{t("table.modele")}</th>
                  <th className="px-2 py-2 text-center font-semibold text-slate">{t("table.puissance")}</th>
                  {(typeSysteme === "pac_air_eau" || typeSysteme === "pac_geothermique" || typeSysteme === "hybride_pac_gaz") && (
                    <>
                      <th className="px-2 py-2 text-center font-semibold text-slate">COP</th>
                      <th className="px-2 py-2 text-center font-semibold text-slate">SCOP</th>
                    </>
                  )}
                  {(typeSysteme === "pac_air_eau" || typeSysteme === "hybride_pac_gaz") && (
                    <>
                      <th className="px-2 py-2 text-center font-semibold text-slate">{t("table.refrigerant")}</th>
                      <th className="px-2 py-2 text-center font-semibold text-slate">dB(A)</th>
                    </>
                  )}
                  <th className="px-2 py-2 text-right font-semibold text-slate">{t("table.prixMateriel")}</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate">{t("table.prixInstall")}</th>
                  <th className="px-2 py-2 text-center font-semibold text-slate">{t("table.source")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const covers = p.puissanceMin <= result.puissanceTotale && p.puissanceMax >= result.puissanceTotale;
                  const isSelected = selectedProduct === i;
                  return (
                    <tr
                      key={i}
                      onClick={() => setSelectedProduct(i)}
                      className={`cursor-pointer border-b border-card-border/30 transition-colors ${
                        isSelected
                          ? "bg-navy/10 ring-2 ring-inset ring-navy/30"
                          : covers
                          ? "bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40"
                          : "hover:bg-background/50"
                      }`}
                    >
                      <td className={`px-2 py-2 ${covers ? "font-bold" : ""}`}>
                        {p.marque}
                        {covers && (
                          <span className="ml-1 inline-block rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {t("table.recommande")}
                          </span>
                        )}
                      </td>
                      <td className={`px-2 py-2 ${covers ? "font-bold" : ""}`}>{p.modele}</td>
                      <td className="px-2 py-2 text-center font-mono">{p.puissanceMin}-{p.puissanceMax} kW</td>
                      {(typeSysteme === "pac_air_eau" || typeSysteme === "pac_geothermique" || typeSysteme === "hybride_pac_gaz") && (
                        <>
                          <td className="px-2 py-2 text-center font-mono">{p.cop ?? "-"}</td>
                          <td className="px-2 py-2 text-center font-mono">{p.scop ?? "-"}</td>
                        </>
                      )}
                      {(typeSysteme === "pac_air_eau" || typeSysteme === "hybride_pac_gaz") && (
                        <>
                          <td className="px-2 py-2 text-center">{p.refrigerant ?? "-"}</td>
                          <td className="px-2 py-2 text-center font-mono">{p.bruit ?? "-"}</td>
                        </>
                      )}
                      <td className="px-2 py-2 text-right font-mono">
                        {fmtTotal.format(p.prixMin)}-{fmtTotal.format(p.prixMax)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono">{fmtTotal.format(p.prixInstall)}</td>
                      <td className="px-2 py-2 text-center">
                        <a
                          href={`https://${p.source}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-navy underline decoration-navy/30 underline-offset-2 hover:text-navy-light"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.source}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step 3: Emetteurs et distribution                                */
  /* ---------------------------------------------------------------- */

  function renderStep3() {
    const defaultBallon = Math.round(result.puissanceKW * 30 / 50) * 50;
    if (ballonTampon !== defaultBallon && ballonTampon === 300) {
      // auto-set only on first render
    }

    return (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">
          4 &mdash; {t("steps.step3")}
        </h2>
        <MethodologyNote step={3} />
        <div className="space-y-4">
          <InputField
            label={t("labels.typeEmetteur")}
            type="select"
            value={typeEmetteur}
            onChange={(v) => setTypeEmetteur(v as TypeEmetteur)}
            options={[
              { value: "plancher_chauffant", label: t("labels.plancherChauffant") },
              { value: "radiateurs_bt", label: t("labels.radiateursBT") },
              { value: "radiateurs_ht", label: t("labels.radiateursHT") },
              { value: "mixte", label: t("labels.mixte") },
            ]}
            hint={t("hints.typeEmetteur")}
          />

          {(typeEmetteur === "plancher_chauffant" || typeEmetteur === "mixte") && (
            <InputField
              label={t("labels.surfacePlancher")}
              value={surfacePlancher}
              onChange={(v) => setSurfacePlancher(Number(v))}
              suffix="m²"
              min={10}
              max={1000}
              step={10}
              hint={t("hints.surfacePlancher")}
            />
          )}

          {(typeEmetteur === "radiateurs_bt" || typeEmetteur === "radiateurs_ht" || typeEmetteur === "mixte") && (
            <InputField
              label={t("labels.nbRadiateurs")}
              value={nbRadiateurs}
              onChange={(v) => setNbRadiateurs(Number(v))}
              min={1}
              max={30}
              step={1}
              hint={t("hints.nbRadiateurs")}
            />
          )}

          <SliderField
            label={t("labels.ballonTampon")}
            value={ballonTampon}
            onChange={setBallonTampon}
            min={100}
            max={800}
            step={50}
            suffix="L"
            hint={t("hints.ballonTampon", { defaut: Math.round(result.puissanceKW * 30) })}
          />

          <SliderField
            label={t("labels.ballonECS")}
            value={ballonECS}
            onChange={setBallonECS}
            min={100}
            max={500}
            step={50}
            suffix="L"
            hint={t("hints.ballonECS")}
          />

          <ToggleField
            label={t("labels.circulateur")}
            checked={circulateur}
            onChange={setCirculateur}
            hint={t("hints.circulateur")}
          />

          <InputField
            label={t("labels.vannesMelangeuses")}
            value={vannesMelangeuses}
            onChange={(v) => setVannesMelangeuses(Number(v))}
            min={0}
            max={5}
            step={1}
            hint={t("hints.vannesMelangeuses")}
          />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step 4: Ventilation                                              */
  /* ---------------------------------------------------------------- */

  function renderStep4() {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">
            5 &mdash; {t("steps.step4")}
          </h2>
          <MethodologyNote step={4} />
          <div className="space-y-4">
            <InputField
              label={t("labels.typeVMC")}
              type="select"
              value={typeVMC}
              onChange={(v) => setTypeVMC(v as TypeVMC)}
              options={[
                { value: "aucune", label: t("labels.vmcAucune") },
                { value: "simple_flux", label: t("labels.vmcSimpleFlux") },
                { value: "double_flux", label: t("labels.vmcDoubleFlux") },
                { value: "double_flux_premium", label: t("labels.vmcDoubleFluxPremium") },
              ]}
              hint={t("hints.typeVMC")}
            />

            {/* Debit calcule */}
            <div className="flex items-center justify-between rounded-lg bg-background/50 px-4 py-3">
              <span className="text-sm text-slate">{t("labels.debitTotal")}</span>
              <span className="font-mono font-semibold text-foreground">{result.debitTotal} m³/h</span>
            </div>

            {(typeVMC === "double_flux" || typeVMC === "double_flux_premium") && (
              <>
                <InputField
                  label={t("labels.marqueVMC")}
                  type="select"
                  value={String(selectedVMC)}
                  onChange={(v) => setSelectedVMC(Number(v))}
                  options={PRODUITS_VMC.map((p, i) => ({
                    value: String(i),
                    label: `${p.marque} ${p.modele} (${p.debitMax} m³/h, ${p.rendement}%)`,
                  }))}
                />

                {/* VMC product card */}
                {PRODUITS_VMC[selectedVMC] && (
                  <div className="rounded-lg border border-card-border/50 bg-background/50 p-4">
                    <h4 className="text-sm font-medium text-slate mb-2">
                      {PRODUITS_VMC[selectedVMC].marque} {PRODUITS_VMC[selectedVMC].modele}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted">{t("vmc.debitMax")}: </span>
                        <span className="font-mono font-semibold">{PRODUITS_VMC[selectedVMC].debitMax} m³/h</span>
                      </div>
                      <div>
                        <span className="text-muted">{t("vmc.rendement")}: </span>
                        <span className="font-mono font-semibold">{PRODUITS_VMC[selectedVMC].rendement}%</span>
                      </div>
                      <div>
                        <span className="text-muted">{t("vmc.prix")}: </span>
                        <span className="font-mono font-semibold">
                          {formatEUR(PRODUITS_VMC[selectedVMC].prixMin)}-{formatEUR(PRODUITS_VMC[selectedVMC].prixMax)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted">{t("vmc.source")}: </span>
                        <a
                          href={`https://${PRODUITS_VMC[selectedVMC].source}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-navy underline decoration-navy/30 underline-offset-2"
                        >
                          {PRODUITS_VMC[selectedVMC].source}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Airflow breakdown */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-navy">{t("vmc.debitParPiece")}</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between px-2 py-1 rounded bg-background/50">
              <span className="text-slate">{t("vmc.sejour")}</span>
              <span className="font-mono">30 m³/h</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-background/50">
              <span className="text-slate">{t("vmc.chambre")}</span>
              <span className="font-mono">22 m³/h</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-background/50">
              <span className="text-slate">{t("vmc.cuisine")}</span>
              <span className="font-mono">75 m³/h</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-background/50">
              <span className="text-slate">{t("vmc.sdb")}</span>
              <span className="font-mono">45 m³/h</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-background/50">
              <span className="text-slate">{t("vmc.wc")}</span>
              <span className="font-mono">30 m³/h</span>
            </div>
            <div className="flex justify-between px-2 py-2 rounded border border-navy/20 bg-navy/5 font-semibold">
              <span className="text-navy">{t("vmc.totalEstime")}</span>
              <span className="font-mono text-navy">{result.debitTotal} m³/h</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step 5: Chiffrage et aides                                       */
  /* ---------------------------------------------------------------- */

  function renderStep5() {
    return (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">
          6 &mdash; {t("steps.step5")}
        </h2>
        <MethodologyNote step={5} />
        <div className="space-y-4">
          <ToggleField
            label={t("labels.remplaceFossile")}
            checked={remplaceFossile}
            onChange={setRemplaceFossile}
            hint={t("hints.remplaceFossile")}
          />
          <ToggleField
            label={t("labels.retraitCuve")}
            checked={retraitCuve}
            onChange={setRetraitCuve}
            hint={t("hints.retraitCuve")}
          />

          {/* Summary des aides */}
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-950/30">
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-3">
              {t("aides.titre")}
            </h4>
            <div className="space-y-2 text-sm">
              {result.klimabonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">{t("aides.klimabonus")}</span>
                  <span className="font-mono font-semibold text-green-800 dark:text-green-200">-{formatEUR(result.klimabonus)}</span>
                </div>
              )}
              {result.enoprimes > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">{t("aides.enoprimes")}</span>
                  <span className="font-mono font-semibold text-green-800 dark:text-green-200">-{formatEUR(result.enoprimes)}</span>
                </div>
              )}
              {result.tva3Economie > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">{t("aides.tva3")}</span>
                  <span className="font-mono font-semibold text-green-800 dark:text-green-200">-{formatEUR(result.tva3Economie)}</span>
                </div>
              )}
              {retraitCuve && (
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">{t("aides.retraitCuve")}</span>
                  <span className="font-mono font-semibold text-red-600">+{formatEUR(result.coutRetraitCuve)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-green-300 dark:border-green-800 pt-2 font-bold">
                <span className="text-green-800 dark:text-green-200">{t("aides.totalAides")}</span>
                <span className="font-mono text-green-800 dark:text-green-200">-{formatEUR(result.totalAides)}</span>
              </div>
            </div>
          </div>

          {/* TVA 3% note */}
          {result.batimentAncien && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              {t("aides.noteTVA3")}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step renderer switch                                             */
  /* ---------------------------------------------------------------- */

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ====================================================== */}
          {/*  LEFT COLUMN -- INPUTS                                  */}
          {/* ====================================================== */}
          <div className="space-y-6">
            {/* ---- Methodology stepper ---- */}
            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-1 overflow-x-auto">
                {STEPS.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      currentStep === step.id
                        ? "bg-navy text-white shadow-sm"
                        : "bg-background text-slate hover:bg-navy/10"
                    }`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      currentStep === step.id
                        ? "bg-white/20 text-white"
                        : "bg-navy/10 text-navy"
                    }`}>
                      {step.id + 1}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ---- Current step content ---- */}
            {renderCurrentStep()}

            {/* ---- Navigation buttons ---- */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium text-slate shadow-sm transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("nav.previous")}
              </button>
              <span className="text-xs text-muted">
                {t("nav.stepOf", { current: currentStep + 1, total: STEPS.length })}
              </span>
              <button
                type="button"
                disabled={currentStep === STEPS.length - 1}
                onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("nav.next")}
              </button>
            </div>
          </div>

          {/* ====================================================== */}
          {/*  RIGHT COLUMN -- RESULTS                                */}
          {/* ====================================================== */}
          <div className="space-y-6">
            {/* Hero total */}
            <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-8 text-center text-white shadow-lg">
              <div className="text-sm text-white/60">
                {t("results.heroTitle")}
              </div>
              <div className="mt-2 text-5xl font-bold">
                {formatEUR(result.totalTravaux)}
              </div>
              <div className="mt-3 flex items-center justify-center gap-6 text-sm text-white/70">
                <span>{formatEUR(Math.round(result.coutM2))} / m²</span>
              </div>
              {result.klimabonus > 0 && (
                <div className="mt-2 text-sm font-semibold text-green-200">
                  Klimabonus: -{formatEUR(result.klimabonus)}
                </div>
              )}
            </div>

            {/* ResultPanel Dimensionnement */}
            <ResultPanel
              title={t("results.dimensionnement")}
              lines={[
                {
                  label: t("results.deperditions"),
                  value: `${result.depWm2} W/m²`,
                },
                {
                  label: t("results.puissanceChauffage"),
                  value: `${result.puissanceKW.toFixed(1)} kW`,
                  highlight: true,
                },
                {
                  label: t("results.puissanceECS"),
                  value: `${result.puissanceECS.toFixed(1)} kW`,
                },
                {
                  label: t("results.puissanceTotale"),
                  value: `${result.puissanceTotale.toFixed(1)} kW`,
                  highlight: true,
                  large: true,
                },
              ]}
            />

            {/* ResultPanel Systeme selectionne */}
            {result.selected && (
              <ResultPanel
                title={t("results.systemeSelectionne")}
                lines={[
                  {
                    label: t("results.marqueModele"),
                    value: `${result.selected.marque} ${result.selected.modele}`,
                  },
                  {
                    label: t("results.puissanceRange"),
                    value: `${result.selected.puissanceMin}-${result.selected.puissanceMax} kW`,
                  },
                  ...(result.selected.cop
                    ? [{
                        label: "COP (A7/W35)",
                        value: String(result.selected.cop),
                      }]
                    : []),
                  ...(result.selected.scop
                    ? [{
                        label: "SCOP (35°C)",
                        value: String(result.selected.scop),
                      }]
                    : []),
                  ...(result.selected.refrigerant
                    ? [{
                        label: t("results.refrigerant"),
                        value: result.selected.refrigerant,
                      }]
                    : []),
                  {
                    label: t("results.prixMateriel"),
                    value: formatEUR(result.prixMaterielGen),
                  },
                  {
                    label: t("results.prixInstallation"),
                    value: formatEUR(result.prixInstallGen),
                    highlight: true,
                  },
                ]}
              />
            )}

            {/* Recapitulatif par lot */}
            <ResultPanel
              title={t("results.recapTitle")}
              lines={[
                ...result.lots.map((lot) => ({
                  label: `Lot ${lot.num} — ${lot.nom}`,
                  value: `${formatEUR(lot.total)} (${result.totalTravaux > 0 ? ((lot.total / result.totalTravaux) * 100).toFixed(1) : "0"} %)`,
                })),
                {
                  label: t("results.totalTravaux"),
                  value: formatEUR(result.totalTravaux),
                  highlight: true,
                  large: true,
                },
              ]}
            />

            {/* Stacked bar */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">
                {t("results.repartitionLot")}
              </h3>
              <div className="flex h-8 w-full overflow-hidden rounded-full">
                {result.lots.map((lot) => {
                  const pct =
                    result.totalTravaux > 0
                      ? (lot.total / result.totalTravaux) * 100
                      : 0;
                  if (pct < 0.5) return null;
                  return (
                    <div
                      key={lot.num}
                      className="transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: lot.color,
                      }}
                      title={`Lot ${lot.num} — ${lot.nom}: ${pct.toFixed(1)} %`}
                    />
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {result.lots.map((lot) => {
                  const pct =
                    result.totalTravaux > 0
                      ? (lot.total / result.totalTravaux) * 100
                      : 0;
                  return (
                    <div key={lot.num} className="flex items-center gap-2 text-xs">
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: lot.color }}
                      />
                      <span className="text-slate">
                        {lot.nom} ({pct.toFixed(1)} %)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ====================================================== */}
            {/*  BORDEREAU DETAILLE                                     */}
            {/* ====================================================== */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
              <div className="p-6 pb-3">
                <h3 className="text-base font-semibold text-navy">
                  {t("results.bordereauTitle")}
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {t("results.bordereauSubtitle")}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border bg-background/80">
                      <th className="px-3 py-2.5 text-left font-semibold text-slate w-[52px]">
                        {t("results.colNo")}
                      </th>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate">
                        {t("results.colDesignation")}
                      </th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate w-[48px]">
                        {t("results.colUnite")}
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate w-[80px]">
                        {t("results.colQte")}
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate w-[90px]">
                        {t("results.colPU")}
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate w-[110px]">
                        {t("results.colTotal")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.bordereau.map((row, i) => {
                      if (row.type === "header") {
                        return (
                          <tr key={i}>
                            <td
                              colSpan={6}
                              className="px-3 py-2.5 text-sm font-bold text-white"
                              style={{ backgroundColor: row.lotColor }}
                            >
                              LOT {row.lotNum} &mdash; {row.lotNom?.toUpperCase()}
                            </td>
                          </tr>
                        );
                      }
                      if (row.type === "subtotal") {
                        return (
                          <tr
                            key={i}
                            className="font-semibold"
                            style={{ backgroundColor: `${row.lotColor}15` }}
                          >
                            <td className="px-3 py-2" />
                            <td className="px-3 py-2 text-slate" colSpan={4}>
                              {t("results.subtotalLot", { num: row.lotNum ?? 0 })}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-navy">
                              {fmtTotal.format(row.total ?? 0)}
                            </td>
                          </tr>
                        );
                      }
                      if (row.type === "grandtotal") {
                        return (
                          <tr
                            key={i}
                            className="text-white font-bold"
                            style={{ backgroundColor: "#166534" }}
                          >
                            <td className="px-3 py-3" />
                            <td className="px-3 py-3" colSpan={4}>
                              {t("results.grandTotal")}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-lg">
                              {fmtTotal.format(row.total ?? 0)}
                            </td>
                          </tr>
                        );
                      }
                      /* type === "line" */
                      return (
                        <tr
                          key={i}
                          className={`border-b border-card-border/30 ${
                            i % 2 === 0 ? "bg-card" : "bg-background/30"
                          }`}
                        >
                          <td className="px-3 py-1.5 text-muted">{row.num}</td>
                          <td className="px-3 py-1.5 text-slate">{row.designation}</td>
                          <td className="px-3 py-1.5 text-center text-muted">{row.unite}</td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            {fmtQte.format(row.quantite ?? 0)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            {fmtPU.format(row.pu ?? 0)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-medium">
                            {fmtTotal.format(row.total ?? 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ResultPanel Aides financieres */}
            <ResultPanel
              title={t("results.aidesTitle")}
              lines={[
                ...(result.klimabonus > 0
                  ? [{
                      label: t("results.klimabonus2026"),
                      value: `-${formatEUR(result.klimabonus)}`,
                    }]
                  : []),
                ...(result.enoprimes > 0
                  ? [{
                      label: t("results.enoprimes"),
                      value: `-${formatEUR(result.enoprimes)}`,
                    }]
                  : []),
                ...(result.tva3Economie > 0
                  ? [{
                      label: t("results.tva3Economie"),
                      value: `-${formatEUR(result.tva3Economie)}`,
                    }]
                  : []),
                ...(retraitCuve
                  ? [{
                      label: t("results.retraitCuve"),
                      value: `+${formatEUR(result.coutRetraitCuve)}`,
                      warning: true as const,
                    }]
                  : []),
                {
                  label: t("results.totalAides"),
                  value: `-${formatEUR(result.totalAides)}`,
                  highlight: true,
                },
                {
                  label: t("results.resteACharge"),
                  value: formatEUR(result.resteACharge),
                  highlight: true,
                  large: true,
                },
              ]}
            />

            {/* ResultPanel Rentabilite */}
            <ResultPanel
              title={t("results.rentabiliteTitle")}
              lines={[
                {
                  label: t("results.economieEnergie"),
                  value: `${Math.round(result.consoAncienneKWh).toLocaleString("fr-LU")} kWh = ${formatEUR(Math.round(result.economieAnnuelle))}/an`,
                },
                {
                  label: t("results.payback"),
                  value: `${result.payback} ${t("results.annees")}`,
                  highlight: true,
                },
                {
                  label: t("results.economieCO2"),
                  value: `${result.economieCO2.toLocaleString("fr-LU")} kg/an`,
                },
              ]}
            />

            {/* ====================================================== */}
            {/*  SOURCES                                                */}
            {/* ====================================================== */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">
                {t("results.refsTitle")}
              </h3>
              <ul className="space-y-2">
                {REFERENCE_DOCS.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 text-muted">&#8226;</span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-navy underline decoration-navy/30 underline-offset-2 transition-colors hover:text-navy-light hover:decoration-navy-light/50"
                    >
                      {t(`refs.${doc.labelKey}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sources text */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <p className="text-xs leading-relaxed text-muted">
                <strong>{t("sources.title")}</strong> {t("sources.text")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
