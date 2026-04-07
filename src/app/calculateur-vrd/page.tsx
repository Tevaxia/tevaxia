"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import SliderField from "@/components/SliderField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

type TypeProjet =
  | "lotissement"
  | "voirie_communale"
  | "voirie_etatique"
  | "zone_activites"
  | "amenagement_exterieur"
  | "parking";

type Pente = "plat" | "pente_legere" | "forte_pente";

const PENTE_MULTIPLIER: Record<Pente, number> = {
  plat: 1.0,
  pente_legere: 1.15,
  forte_pente: 1.35,
};

const SOL_ROCHEUX_MULTIPLIER = 1.25;

const LOT_COLORS: Record<string, string> = {
  installation: "#4b5563",
  terrassement: "#8B4513",
  voirie: "#1e3a5f",
  bordures: "#6b7280",
  eu: "#2563eb",
  ep: "#0891b2",
  reseauxSecs: "#d97706",
  amenagements: "#16a34a",
  signalisation: "#7c3aed",
};

/* Number formatters for the bordereau table */
const fmtPU = new Intl.NumberFormat("fr-LU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtQte = new Intl.NumberFormat("fr-LU", { maximumFractionDigits: 0 });
const fmtTotal = new Intl.NumberFormat("fr-LU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/* ------------------------------------------------------------------ */
/*  Methodology stepper                                                */
/* ------------------------------------------------------------------ */

const STEPS = [
  { id: 0, label: "Projet" },
  { id: 1, label: "Terrassement" },
  { id: 2, label: "Voirie" },
  { id: 3, label: "Assainissement" },
  { id: 4, label: "Réseaux secs" },
  { id: 5, label: "Aménagements" },
  { id: 6, label: "Études" },
] as const;

const STEP_NOTES: Record<number, string> = {
  0: "Phase APS — Définissez le périmètre du projet : type d'opération, emprise, commune. Ces paramètres déterminent les normes applicables (voirie communale vs étatique, CTG 002/009).",
  1: "Lot 0-1 — Installation de chantier et mouvement de terres. Le terrassement représente typiquement 10-15 % du budget VRD. Réf. : CTG 002 (terrassement), CSDC-CT §2 (couche de forme).",
  2: "Lot 2-3 — Structure de chaussée et bordures. La structure est définie par le CSDC-CT (Ponts & Chaussées). Épaisseurs types : 6 cm BB + 5 cm GB + 20 cm GNT + 30 cm fondation.",
  3: "Lots 4-5 — Réseaux EU/EP selon CTG 009 (canalisation). Diamètres EU : DN200-400, EP : DN300-600. Bassin de rétention obligatoire pour projets >0,5 ha (RGD assainissement).",
  4: "Lot 6 — Tranchée commune (élec/télécom/gaz) + éclairage public. Réf. : Creos catalogue raccordement, POST Technologies, dispositions techniques communales.",
  5: "Lots 7-8 — Espaces verts, signalisation, mobilier urbain. Batiprix 2026 vol. 2 pour les prix de référence.",
  6: "Honoraires et études annexes. Phases APS/APD/DCE selon OAI CTA Privé. Honoraires BE : 8-12 % typique, libre négociation (décision Conseil de la concurrence 2024).",
};

/* ------------------------------------------------------------------ */
/*  Référence documents                                                */
/* ------------------------------------------------------------------ */

const REFERENCE_DOCS = [
  {
    label: "CTG 002 — Terrassement (PDF)",
    url: "https://marches.public.lu",
  },
  {
    label: "CTG 009 — Canalisation (PDF)",
    url: "https://marches.public.lu",
  },
  {
    label: "CSDC-CT — Clauses techniques Ponts & Chaussées (PDF)",
    url: "https://travaux.public.lu",
  },
  {
    label: "Guide permissions de voirie (oct. 2018) (PDF)",
    url: "https://pch.gouvernement.lu",
  },
  {
    label: "Dispositions techniques VdL (PDF)",
    url: "https://www.vdl.lu",
  },
  {
    label: "ASS-TabAVIS 9100 — Template assainissement (XLSX)",
    url: "https://eau.gouvernement.lu",
  },
  {
    label: "STATEC — Indices prix construction (oct. 2025)",
    url: "https://statistiques.public.lu",
  },
  {
    label: "CRTIB — Révision prix matériaux (REVPRIX)",
    url: "https://revprix.crtib.lu",
  },
  {
    label: "Batiprix 2026 vol. 2 — VRD, Espaces verts",
    url: "https://www.batiprix.com",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CalculateurVRD() {
  /* ======== Stepper state ======== */
  const [currentStep, setCurrentStep] = useState(0);

  /* ======== Section 0: Projet ======== */
  const [nomProjet, setNomProjet] = useState("");
  const [typeProjet, setTypeProjet] = useState<TypeProjet>("lotissement");
  const [commune, setCommune] = useState("");
  const [surfaceTotale, setSurfaceTotale] = useState(10000);

  /* ======== Topographie ======== */
  const [pente, setPente] = useState<Pente>("plat");
  const [solRocheux, setSolRocheux] = useState(false);

  /* ======== Lot 0: Installation de chantier ======== */
  const [installationChantier, setInstallationChantier] = useState(15000);

  /* ======== Section 1: Terrassement ======== */
  const [surfaceDecapage, setSurfaceDecapage] = useState(8000);
  const [profondeurDecapage, setProfondeurDecapage] = useState(0.3);
  const [volumeDeblais, setVolumeDeblais] = useState(2000);
  const [volumeRemblais, setVolumeRemblais] = useState(1500);
  const [evacuationExcedent, setEvacuationExcedent] = useState(true);
  const [distanceDecharge, setDistanceDecharge] = useState(15);
  const [prixDecapage, setPrixDecapage] = useState(5);
  const [prixDeblais, setPrixDeblais] = useState(15);
  const [prixRemblais, setPrixRemblais] = useState(18);
  const [prixEvacuation, setPrixEvacuation] = useState(22);

  /* ======== Section 2: Voirie et chaussée ======== */
  const [longueurVoirie, setLongueurVoirie] = useState(500);
  const [largeurChaussee, setLargeurChaussee] = useState(6);
  const [nbTrottoirs, setNbTrottoirs] = useState(2);
  const [largeurTrottoir, setLargeurTrottoir] = useState(1.5);
  const [epRevetement, setEpRevetement] = useState(6);
  const [epLiaison, setEpLiaison] = useState(5);
  const [epBase, setEpBase] = useState(20);
  const [epFondation, setEpFondation] = useState(30);
  const [epSousFondation, setEpSousFondation] = useState(20);
  const [prixEnrobe, setPrixEnrobe] = useState(12);
  const [prixGraveBitume, setPrixGraveBitume] = useState(8);
  const [prixFondation, setPrixFondation] = useState(22);
  const [prixTrottoir, setPrixTrottoir] = useState(60);

  /* ======== Section 2b: Bordures et caniveaux ======== */
  const [mlBorduresT2, setMlBorduresT2] = useState(800);
  const [prixBordureT2, setPrixBordureT2] = useState(25);
  const [mlBorduresCS1, setMlBorduresCS1] = useState(200);
  const [prixBordureCS1, setPrixBordureCS1] = useState(30);
  const [mlCaniveaux, setMlCaniveaux] = useState(400);
  const [prixCaniveau, setPrixCaniveau] = useState(32);

  /* ======== Section 3: Réseaux eaux usées (EU) ======== */
  const [mlEU_DN200, setMlEU_DN200] = useState(300);
  const [mlEU_DN300, setMlEU_DN300] = useState(150);
  const [mlEU_DN400, setMlEU_DN400] = useState(0);
  const [nbRegardsEU, setNbRegardsEU] = useState(15);
  const [nbBranchements, setNbBranchements] = useState(20);
  const [prixEU_DN200, setPrixEU_DN200] = useState(110);
  const [prixEU_DN300, setPrixEU_DN300] = useState(160);
  const [prixEU_DN400, setPrixEU_DN400] = useState(220);
  const [prixRegardEU, setPrixRegardEU] = useState(1200);
  const [prixBranchement, setPrixBranchement] = useState(800);

  /* ======== Section 3b: Réseaux eaux pluviales (EP) ======== */
  const [mlEP_DN300, setMlEP_DN300] = useState(200);
  const [mlEP_DN400, setMlEP_DN400] = useState(300);
  const [mlEP_DN600, setMlEP_DN600] = useState(100);
  const [nbRegardsEP, setNbRegardsEP] = useState(12);
  const [nbAvaloirs, setNbAvaloirs] = useState(20);
  const [bassinRetention, setBassinRetention] = useState(true);
  const [volumeBassin, setVolumeBassin] = useState(150);
  const [prixEP_DN300, setPrixEP_DN300] = useState(140);
  const [prixEP_DN400, setPrixEP_DN400] = useState(200);
  const [prixEP_DN600, setPrixEP_DN600] = useState(300);
  const [prixRegardEP, setPrixRegardEP] = useState(1400);
  const [prixAvaloir, setPrixAvaloir] = useState(600);
  const [prixBassin, setPrixBassin] = useState(250);

  /* ======== Section 4: Réseaux secs ======== */
  const [mlTrancheeCommune, setMlTrancheeCommune] = useState(400);
  const [profondeurTranchee, setProfondeurTranchee] = useState(0.8);
  const [largeurTranchee, setLargeurTranchee] = useState(0.6);
  const [prixTranchee, setPrixTranchee] = useState(50);
  const [nbCoffrets, setNbCoffrets] = useState(20);
  const [prixCoffret, setPrixCoffret] = useState(500);
  const [nbCandelabres, setNbCandelabres] = useState(25);
  const [prixCandelabre, setPrixCandelabre] = useState(3200);

  /* ======== Section 5: Aménagements ======== */
  const [surfaceEspacesVerts, setSurfaceEspacesVerts] = useState(2000);
  const [prixEspaceVert, setPrixEspaceVert] = useState(15);
  const [nbArbres, setNbArbres] = useState(30);
  const [prixArbre, setPrixArbre] = useState(400);
  const [surfaceSignalisation, setSurfaceSignalisation] = useState(5000);
  const [mobilierUrbain, setMobilierUrbain] = useState(8000);

  /* ======== Section 6: Études et honoraires ======== */
  const [etudeGeo, setEtudeGeo] = useState(4000);
  const [etudeTopo, setEtudeTopo] = useState(3500);
  const [etudeHydro, setEtudeHydro] = useState(6000);
  const [etudeImpact, setEtudeImpact] = useState(0);
  const [coordSS, setCoordSS] = useState(5000);
  const [honorairesBE, setHonorairesBE] = useState(10);
  const [aleas, setAleas] = useState(5);

  /* ---------------------------------------------------------------- */
  /*  Calculations                                                     */
  /* ---------------------------------------------------------------- */

  const result = useMemo(() => {
    const penteM = PENTE_MULTIPLIER[pente];
    const solM = solRocheux ? SOL_ROCHEUX_MULTIPLIER : 1.0;
    const terrassementM = penteM * solM;

    /* --- LOT 0: Installation de chantier --- */
    const totalLot0 = installationChantier;

    /* --- LOT 1: Terrassement --- */
    const coutDecapage = surfaceDecapage * prixDecapage * terrassementM;
    const coutDeblais = volumeDeblais * prixDeblais * terrassementM;
    const coutRemblais = volumeRemblais * prixRemblais;
    const volEvacuation = evacuationExcedent
      ? Math.max(0, volumeDeblais - volumeRemblais)
      : 0;
    const coutEvacuation = volEvacuation * prixEvacuation;
    const totalLot1 = coutDecapage + coutDeblais + coutRemblais + coutEvacuation;

    /* --- LOT 2: Voirie et chaussée --- */
    const surfaceChaussee = longueurVoirie * largeurChaussee;
    const surfaceTrottoirs = longueurVoirie * largeurTrottoir * nbTrottoirs;

    const prixRevetementM2 = prixEnrobe * epRevetement;
    const coutRevetement = surfaceChaussee * prixRevetementM2;

    const prixLiaisonM2 = epLiaison > 0 ? prixGraveBitume * epLiaison : 0;
    const coutLiaison = surfaceChaussee * prixLiaisonM2;

    const volBase = surfaceChaussee * (epBase / 100);
    const coutBase = volBase * prixFondation;

    const volFondation = surfaceChaussee * (epFondation / 100);
    const coutFondationVoirie = volFondation * prixFondation;

    const volSousFondation = surfaceChaussee * (epSousFondation / 100);
    const coutSousFondation = volSousFondation * prixFondation;

    const coutTrottoirs = surfaceTrottoirs * prixTrottoir;
    const totalLot2 =
      coutRevetement +
      coutLiaison +
      coutBase +
      coutFondationVoirie +
      coutSousFondation +
      coutTrottoirs;

    /* --- LOT 3: Bordures et caniveaux --- */
    const coutBorduresT2 = mlBorduresT2 * prixBordureT2;
    const coutBorduresCS1 = mlBorduresCS1 * prixBordureCS1;
    const coutCaniveaux = mlCaniveaux * prixCaniveau;
    const totalLot3 = coutBorduresT2 + coutBorduresCS1 + coutCaniveaux;

    /* --- LOT 4: Réseaux EU --- */
    const coutEU_DN200 = mlEU_DN200 * prixEU_DN200;
    const coutEU_DN300 = mlEU_DN300 * prixEU_DN300;
    const coutEU_DN400 = mlEU_DN400 * prixEU_DN400;
    const coutRegardsEU = nbRegardsEU * prixRegardEU;
    const coutBranchements = nbBranchements * prixBranchement;
    const totalLot4 =
      coutEU_DN200 + coutEU_DN300 + coutEU_DN400 + coutRegardsEU + coutBranchements;

    /* --- LOT 5: Réseaux EP --- */
    const coutEP_DN300 = mlEP_DN300 * prixEP_DN300;
    const coutEP_DN400 = mlEP_DN400 * prixEP_DN400;
    const coutEP_DN600 = mlEP_DN600 * prixEP_DN600;
    const coutRegardsEP = nbRegardsEP * prixRegardEP;
    const coutAvaloirsTotal = nbAvaloirs * prixAvaloir;
    const coutBassin = bassinRetention ? volumeBassin * prixBassin : 0;
    const totalLot5 =
      coutEP_DN300 +
      coutEP_DN400 +
      coutEP_DN600 +
      coutRegardsEP +
      coutAvaloirsTotal +
      coutBassin;

    /* --- LOT 6: Réseaux secs et éclairage --- */
    const coutTranchees = mlTrancheeCommune * prixTranchee;
    const coutCoffrets = nbCoffrets * prixCoffret;
    const coutCandelabresTotal = nbCandelabres * prixCandelabre;
    const totalLot6 = coutTranchees + coutCoffrets + coutCandelabresTotal;

    /* --- LOT 7: Aménagements paysagers --- */
    const coutEspacesVerts = surfaceEspacesVerts * prixEspaceVert;
    const coutArbres = nbArbres * prixArbre;
    const totalLot7 = coutEspacesVerts + coutArbres;

    /* --- LOT 8: Signalisation et mobilier urbain --- */
    const totalLot8 = surfaceSignalisation + mobilierUrbain;

    /* --- Totaux --- */
    const totalTravaux =
      totalLot0 + totalLot1 + totalLot2 + totalLot3 + totalLot4 +
      totalLot5 + totalLot6 + totalLot7 + totalLot8;

    const totalEtudes =
      etudeGeo + etudeTopo + etudeHydro + etudeImpact + coordSS;

    const montantHonorairesBE = totalTravaux * (honorairesBE / 100);
    const montantAleas = totalTravaux * (aleas / 100);

    const totalGeneral =
      totalTravaux + totalEtudes + montantHonorairesBE + montantAleas;

    const coutM2 = surfaceTotale > 0 ? totalTravaux / surfaceTotale : 0;

    /* --- Lots array for charts and summaries --- */
    const lots = [
      { num: 0, nom: "Installation de chantier", total: totalLot0, color: LOT_COLORS.installation },
      { num: 1, nom: "Terrassements généraux", total: totalLot1, color: LOT_COLORS.terrassement },
      { num: 2, nom: "Voirie et chaussée", total: totalLot2, color: LOT_COLORS.voirie },
      { num: 3, nom: "Bordures et caniveaux", total: totalLot3, color: LOT_COLORS.bordures },
      { num: 4, nom: "Réseaux eaux usées", total: totalLot4, color: LOT_COLORS.eu },
      { num: 5, nom: "Réseaux eaux pluviales", total: totalLot5, color: LOT_COLORS.ep },
      { num: 6, nom: "Réseaux secs et éclairage", total: totalLot6, color: LOT_COLORS.reseauxSecs },
      { num: 7, nom: "Aménagements paysagers", total: totalLot7, color: LOT_COLORS.amenagements },
      { num: 8, nom: "Signalisation et mobilier urbain", total: totalLot8, color: LOT_COLORS.signalisation },
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

    // LOT 0
    bordereau.push({ type: "header", lotNum: 0, lotNom: "Installation de chantier", lotColor: LOT_COLORS.installation });
    bordereau.push({
      type: "line",
      num: "0.1",
      designation: "Installation de chantier (forfait)",
      unite: "ft",
      quantite: 1,
      pu: installationChantier,
      total: installationChantier,
    });
    bordereau.push({ type: "subtotal", lotNum: 0, lotNom: "Installation de chantier", lotColor: LOT_COLORS.installation, total: totalLot0 });

    // LOT 1
    bordereau.push({ type: "header", lotNum: 1, lotNom: "Terrassements généraux", lotColor: LOT_COLORS.terrassement });
    bordereau.push({
      type: "line",
      num: "1.1",
      designation: `Décapage terre végétale ép. ${(profondeurDecapage * 100).toFixed(0)} cm`,
      unite: "m²",
      quantite: surfaceDecapage,
      pu: prixDecapage * terrassementM,
      total: coutDecapage,
    });
    bordereau.push({
      type: "line",
      num: "1.2",
      designation: "Déblais en fouilles",
      unite: "m³",
      quantite: volumeDeblais,
      pu: prixDeblais * terrassementM,
      total: coutDeblais,
    });
    bordereau.push({
      type: "line",
      num: "1.3",
      designation: "Remblais en matériaux d'apport",
      unite: "m³",
      quantite: volumeRemblais,
      pu: prixRemblais,
      total: coutRemblais,
    });
    if (evacuationExcedent && volEvacuation > 0) {
      bordereau.push({
        type: "line",
        num: "1.4",
        designation: `Évacuation excédent en décharge (à ${distanceDecharge} km)`,
        unite: "m³",
        quantite: volEvacuation,
        pu: prixEvacuation,
        total: coutEvacuation,
      });
    }
    bordereau.push({ type: "subtotal", lotNum: 1, lotNom: "Terrassements généraux", lotColor: LOT_COLORS.terrassement, total: totalLot1 });

    // LOT 2
    bordereau.push({ type: "header", lotNum: 2, lotNom: "Voirie et chaussée", lotColor: LOT_COLORS.voirie });
    bordereau.push({
      type: "line",
      num: "2.1",
      designation: `Couche de roulement BB ép. ${epRevetement} cm`,
      unite: "m²",
      quantite: surfaceChaussee,
      pu: prixRevetementM2,
      total: coutRevetement,
    });
    if (epLiaison > 0) {
      bordereau.push({
        type: "line",
        num: "2.2",
        designation: `Couche de liaison GB ép. ${epLiaison} cm`,
        unite: "m²",
        quantite: surfaceChaussee,
        pu: prixLiaisonM2,
        total: coutLiaison,
      });
    }
    bordereau.push({
      type: "line",
      num: epLiaison > 0 ? "2.3" : "2.2",
      designation: `Couche de base (grave conc.) ép. ${epBase} cm`,
      unite: "m³",
      quantite: volBase,
      pu: prixFondation,
      total: coutBase,
    });
    bordereau.push({
      type: "line",
      num: epLiaison > 0 ? "2.4" : "2.3",
      designation: `Fondation (tout-venant 0/60) ép. ${epFondation} cm`,
      unite: "m³",
      quantite: volFondation,
      pu: prixFondation,
      total: coutFondationVoirie,
    });
    if (epSousFondation > 0) {
      bordereau.push({
        type: "line",
        num: epLiaison > 0 ? "2.5" : "2.4",
        designation: `Sous-fondation (géotextile + conc.) ép. ${epSousFondation} cm`,
        unite: "m³",
        quantite: volSousFondation,
        pu: prixFondation,
        total: coutSousFondation,
      });
    }
    if (nbTrottoirs > 0) {
      bordereau.push({
        type: "line",
        num: epLiaison > 0 ? (epSousFondation > 0 ? "2.6" : "2.5") : (epSousFondation > 0 ? "2.5" : "2.4"),
        designation: `Trottoirs (fond. + pavés/dalles) x${nbTrottoirs}`,
        unite: "m²",
        quantite: surfaceTrottoirs,
        pu: prixTrottoir,
        total: coutTrottoirs,
      });
    }
    bordereau.push({ type: "subtotal", lotNum: 2, lotNom: "Voirie et chaussée", lotColor: LOT_COLORS.voirie, total: totalLot2 });

    // LOT 3
    bordereau.push({ type: "header", lotNum: 3, lotNom: "Bordures et caniveaux", lotColor: LOT_COLORS.bordures });
    bordereau.push({
      type: "line",
      num: "3.1",
      designation: "Bordures type T2 (bordure haute)",
      unite: "ml",
      quantite: mlBorduresT2,
      pu: prixBordureT2,
      total: coutBorduresT2,
    });
    bordereau.push({
      type: "line",
      num: "3.2",
      designation: "Bordures CS1 (abaissées / bateaux)",
      unite: "ml",
      quantite: mlBorduresCS1,
      pu: prixBordureCS1,
      total: coutBorduresCS1,
    });
    bordereau.push({
      type: "line",
      num: "3.3",
      designation: "Caniveaux béton",
      unite: "ml",
      quantite: mlCaniveaux,
      pu: prixCaniveau,
      total: coutCaniveaux,
    });
    bordereau.push({ type: "subtotal", lotNum: 3, lotNom: "Bordures et caniveaux", lotColor: LOT_COLORS.bordures, total: totalLot3 });

    // LOT 4
    bordereau.push({ type: "header", lotNum: 4, lotNom: "Réseaux eaux usées (EU)", lotColor: LOT_COLORS.eu });
    if (mlEU_DN200 > 0) {
      bordereau.push({
        type: "line", num: "4.1",
        designation: "Canalisation EU DN200 (PVC)", unite: "ml",
        quantite: mlEU_DN200, pu: prixEU_DN200, total: coutEU_DN200,
      });
    }
    if (mlEU_DN300 > 0) {
      bordereau.push({
        type: "line", num: "4.2",
        designation: "Canalisation EU DN300", unite: "ml",
        quantite: mlEU_DN300, pu: prixEU_DN300, total: coutEU_DN300,
      });
    }
    if (mlEU_DN400 > 0) {
      bordereau.push({
        type: "line", num: "4.3",
        designation: "Canalisation EU DN400", unite: "ml",
        quantite: mlEU_DN400, pu: prixEU_DN400, total: coutEU_DN400,
      });
    }
    bordereau.push({
      type: "line", num: "4.4",
      designation: "Regards de visite", unite: "u",
      quantite: nbRegardsEU, pu: prixRegardEU, total: coutRegardsEU,
    });
    bordereau.push({
      type: "line", num: "4.5",
      designation: "Branchements particuliers", unite: "u",
      quantite: nbBranchements, pu: prixBranchement, total: coutBranchements,
    });
    bordereau.push({ type: "subtotal", lotNum: 4, lotNom: "Réseaux eaux usées", lotColor: LOT_COLORS.eu, total: totalLot4 });

    // LOT 5
    bordereau.push({ type: "header", lotNum: 5, lotNom: "Réseaux eaux pluviales (EP)", lotColor: LOT_COLORS.ep });
    if (mlEP_DN300 > 0) {
      bordereau.push({
        type: "line", num: "5.1",
        designation: "Canalisation EP DN300", unite: "ml",
        quantite: mlEP_DN300, pu: prixEP_DN300, total: coutEP_DN300,
      });
    }
    if (mlEP_DN400 > 0) {
      bordereau.push({
        type: "line", num: "5.2",
        designation: "Canalisation EP DN400", unite: "ml",
        quantite: mlEP_DN400, pu: prixEP_DN400, total: coutEP_DN400,
      });
    }
    if (mlEP_DN600 > 0) {
      bordereau.push({
        type: "line", num: "5.3",
        designation: "Canalisation EP DN600", unite: "ml",
        quantite: mlEP_DN600, pu: prixEP_DN600, total: coutEP_DN600,
      });
    }
    bordereau.push({
      type: "line", num: "5.4",
      designation: "Regards de visite EP", unite: "u",
      quantite: nbRegardsEP, pu: prixRegardEP, total: coutRegardsEP,
    });
    bordereau.push({
      type: "line", num: "5.5",
      designation: "Avaloirs avec grille", unite: "u",
      quantite: nbAvaloirs, pu: prixAvaloir, total: coutAvaloirsTotal,
    });
    if (bassinRetention) {
      bordereau.push({
        type: "line", num: "5.6",
        designation: "Bassin de rétention", unite: "m³",
        quantite: volumeBassin, pu: prixBassin, total: coutBassin,
      });
    }
    bordereau.push({ type: "subtotal", lotNum: 5, lotNom: "Réseaux eaux pluviales", lotColor: LOT_COLORS.ep, total: totalLot5 });

    // LOT 6
    bordereau.push({ type: "header", lotNum: 6, lotNom: "Réseaux secs et éclairage", lotColor: LOT_COLORS.reseauxSecs });
    bordereau.push({
      type: "line", num: "6.1",
      designation: `Tranchée commune (élec + télécom + gaz) ${(profondeurTranchee * 100).toFixed(0)}x${(largeurTranchee * 100).toFixed(0)} cm`,
      unite: "ml", quantite: mlTrancheeCommune, pu: prixTranchee, total: coutTranchees,
    });
    bordereau.push({
      type: "line", num: "6.2",
      designation: "Coffrets / armoires de rue", unite: "u",
      quantite: nbCoffrets, pu: prixCoffret, total: coutCoffrets,
    });
    bordereau.push({
      type: "line", num: "6.3",
      designation: "Candélabres LED + fondation + raccordement", unite: "u",
      quantite: nbCandelabres, pu: prixCandelabre, total: coutCandelabresTotal,
    });
    bordereau.push({ type: "subtotal", lotNum: 6, lotNom: "Réseaux secs et éclairage", lotColor: LOT_COLORS.reseauxSecs, total: totalLot6 });

    // LOT 7
    bordereau.push({ type: "header", lotNum: 7, lotNom: "Aménagements paysagers", lotColor: LOT_COLORS.amenagements });
    bordereau.push({
      type: "line", num: "7.1",
      designation: "Espaces verts (terre vég. + engazonnement + plant.)", unite: "m²",
      quantite: surfaceEspacesVerts, pu: prixEspaceVert, total: coutEspacesVerts,
    });
    bordereau.push({
      type: "line", num: "7.2",
      designation: "Arbres (fourniture + fosse + tuteurage)", unite: "u",
      quantite: nbArbres, pu: prixArbre, total: coutArbres,
    });
    bordereau.push({ type: "subtotal", lotNum: 7, lotNom: "Aménagements paysagers", lotColor: LOT_COLORS.amenagements, total: totalLot7 });

    // LOT 8
    bordereau.push({ type: "header", lotNum: 8, lotNom: "Signalisation et mobilier urbain", lotColor: LOT_COLORS.signalisation });
    bordereau.push({
      type: "line", num: "8.1",
      designation: "Signalisation (forfait)", unite: "ft",
      quantite: 1, pu: surfaceSignalisation, total: surfaceSignalisation,
    });
    bordereau.push({
      type: "line", num: "8.2",
      designation: "Mobilier urbain (bancs, poubelles, potelets)", unite: "ft",
      quantite: 1, pu: mobilierUrbain, total: mobilierUrbain,
    });
    bordereau.push({ type: "subtotal", lotNum: 8, lotNom: "Signalisation et mobilier urbain", lotColor: LOT_COLORS.signalisation, total: totalLot8 });

    // Grand total row
    bordereau.push({ type: "grandtotal", total: totalTravaux });

    return {
      totalLot0,
      totalLot1,
      totalLot2,
      totalLot3,
      totalLot4,
      totalLot5,
      totalLot6,
      totalLot7,
      totalLot8,
      totalTravaux,
      totalEtudes,
      montantHonorairesBE,
      montantAleas,
      totalGeneral,
      coutM2,
      lots,
      bordereau,
      /* intermediate values for display */
      surfaceChaussee,
      surfaceTrottoirs,
      volEvacuation,
      terrassementM,
    };
  }, [
    pente, solRocheux,
    surfaceTotale, installationChantier,
    surfaceDecapage, profondeurDecapage, volumeDeblais, volumeRemblais,
    evacuationExcedent, distanceDecharge,
    prixDecapage, prixDeblais, prixRemblais, prixEvacuation,
    longueurVoirie, largeurChaussee, nbTrottoirs, largeurTrottoir,
    epRevetement, epLiaison, epBase, epFondation, epSousFondation,
    prixEnrobe, prixGraveBitume, prixFondation, prixTrottoir,
    mlBorduresT2, prixBordureT2, mlBorduresCS1, prixBordureCS1,
    mlCaniveaux, prixCaniveau,
    mlEU_DN200, mlEU_DN300, mlEU_DN400, nbRegardsEU, nbBranchements,
    prixEU_DN200, prixEU_DN300, prixEU_DN400, prixRegardEU, prixBranchement,
    mlEP_DN300, mlEP_DN400, mlEP_DN600, nbRegardsEP, nbAvaloirs,
    bassinRetention, volumeBassin,
    prixEP_DN300, prixEP_DN400, prixEP_DN600, prixRegardEP, prixAvaloir, prixBassin,
    mlTrancheeCommune, profondeurTranchee, largeurTranchee,
    prixTranchee, nbCoffrets, prixCoffret, nbCandelabres, prixCandelabre,
    surfaceEspacesVerts, prixEspaceVert, nbArbres, prixArbre,
    surfaceSignalisation, mobilierUrbain,
    etudeGeo, etudeTopo, etudeHydro, etudeImpact, coordSS,
    honorairesBE, aleas,
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
  /*  Step input panels                                                */
  /* ---------------------------------------------------------------- */

  function renderStep0() {
    return (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">
          0 &mdash; Projet
        </h2>
        <MethodologyNote step={0} />
        <div className="space-y-4">
          <InputField
            label="Nom du projet"
            type="text"
            value={nomProjet}
            onChange={setNomProjet}
          />
          <InputField
            label="Type de projet"
            type="select"
            value={typeProjet}
            onChange={(v) => setTypeProjet(v as TypeProjet)}
            options={[
              { value: "lotissement", label: "Lotissement" },
              { value: "voirie_communale", label: "Voirie communale" },
              { value: "voirie_etatique", label: "Voirie étatique" },
              { value: "zone_activites", label: "Zone d'activités" },
              { value: "amenagement_exterieur", label: "Aménagement extérieur" },
              { value: "parking", label: "Parking" },
            ]}
          />
          <InputField
            label="Commune"
            type="text"
            value={commune}
            onChange={setCommune}
          />
          <InputField
            label="Surface totale du projet"
            value={surfaceTotale}
            onChange={(v) => setSurfaceTotale(Number(v))}
            suffix="m²"
            min={100}
            step={100}
          />

          {/* Topographie */}
          <div className="mt-2 rounded-lg border border-card-border/50 bg-background/50 p-4">
            <h3 className="mb-3 text-sm font-medium text-slate">
              Topographie
            </h3>
            <div className="space-y-3">
              <InputField
                label="Pente du terrain"
                type="select"
                value={pente}
                onChange={(v) => setPente(v as Pente)}
                options={[
                  { value: "plat", label: "Plat (x1,00)" },
                  { value: "pente_legere", label: "Pente légère (x1,15)" },
                  { value: "forte_pente", label: "Forte pente (x1,35)" },
                ]}
                hint="Majoration appliquée sur les coûts de terrassement"
              />
              <ToggleField
                label="Sol rocheux"
                checked={solRocheux}
                onChange={setSolRocheux}
                hint="Majoration x1,25 sur les coûts de terrassement"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStep1() {
    return (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">
          1 &mdash; Terrassement
        </h2>
        <MethodologyNote step={1} />
        <div className="space-y-4">
          {/* Lot 0 : Installation de chantier */}
          <div className="rounded-lg border border-card-border/50 bg-background/50 p-4">
            <h3 className="mb-3 text-sm font-medium text-slate">
              Lot 0 &mdash; Installation de chantier
            </h3>
            <SliderField
              label="Installation de chantier (forfait)"
              value={installationChantier}
              onChange={setInstallationChantier}
              min={5000}
              max={50000}
              step={1000}
              suffix="€"
              hint="Aménagement accès, clôtures, base vie, panneaux. Source : marché courant LU"
            />
          </div>

          {/* Lot 1 : Terrassement */}
          <InputField
            label="Surface de décapage terre végétale"
            value={surfaceDecapage}
            onChange={(v) => setSurfaceDecapage(Number(v))}
            suffix="m²"
            min={0}
            step={100}
          />
          <SliderField
            label="Profondeur de décapage"
            value={profondeurDecapage}
            onChange={setProfondeurDecapage}
            min={0.2}
            max={0.5}
            step={0.05}
            suffix="m"
          />
          <InputField
            label="Volume déblais (fouilles, tranchées)"
            value={volumeDeblais}
            onChange={(v) => setVolumeDeblais(Number(v))}
            suffix="m³"
            min={0}
            step={100}
          />
          <InputField
            label="Volume remblais"
            value={volumeRemblais}
            onChange={(v) => setVolumeRemblais(Number(v))}
            suffix="m³"
            min={0}
            step={100}
          />
          <ToggleField
            label="Évacuation en décharge"
            checked={evacuationExcedent}
            onChange={setEvacuationExcedent}
          />
          {evacuationExcedent && (
            <SliderField
              label="Distance à la décharge"
              value={distanceDecharge}
              onChange={setDistanceDecharge}
              min={5}
              max={40}
              step={5}
              suffix="km"
            />
          )}
          <SliderField
            label="Prix décapage"
            value={prixDecapage}
            onChange={setPrixDecapage}
            min={3}
            max={8}
            step={0.5}
            suffix="€/m²"
            hint="3-8 €/m² -- Source : Batiprix 2026 vol. 2 (x1.20 coeff. LU), CTG 002 art. 3"
          />
          <SliderField
            label="Prix déblais"
            value={prixDeblais}
            onChange={setPrixDeblais}
            min={8}
            max={25}
            step={1}
            suffix="€/m³"
            hint="8-25 €/m³ -- Source : Batiprix 2026, STATEC indice terrassement oct. 2025 (-0.6 %)"
          />
          <SliderField
            label="Prix remblais"
            value={prixRemblais}
            onChange={setPrixRemblais}
            min={12}
            max={30}
            step={1}
            suffix="€/m³"
            hint="12-30 €/m³ -- Source : Batiprix 2026 (x1.20 coeff. LU)"
          />
          <SliderField
            label="Prix évacuation"
            value={prixEvacuation}
            onChange={setPrixEvacuation}
            min={15}
            max={40}
            step={1}
            suffix="€/m³"
            hint="15-40 €/m³ -- Source : Batiprix 2026, distance décharge agréée (LIST)"
          />
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-6">
        {/* Voirie et chaussée */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">
            2 &mdash; Voirie et chaussée
          </h2>
          <MethodologyNote step={2} />
          <div className="space-y-4">
            <InputField
              label="Longueur totale de voirie"
              value={longueurVoirie}
              onChange={(v) => setLongueurVoirie(Number(v))}
              suffix="ml"
              min={0}
              step={10}
            />
            <SliderField
              label="Largeur de chaussée"
              value={largeurChaussee}
              onChange={setLargeurChaussee}
              min={3}
              max={12}
              step={0.5}
              suffix="m"
            />
            <InputField
              label="Nombre de trottoirs"
              type="select"
              value={String(nbTrottoirs)}
              onChange={(v) => setNbTrottoirs(Number(v))}
              options={[
                { value: "0", label: "0 -- Aucun trottoir" },
                { value: "1", label: "1 -- Un côté" },
                { value: "2", label: "2 -- Deux côtés" },
              ]}
            />
            {nbTrottoirs > 0 && (
              <SliderField
                label="Largeur trottoir"
                value={largeurTrottoir}
                onChange={setLargeurTrottoir}
                min={1}
                max={3}
                step={0.25}
                suffix="m"
              />
            )}

            {/* Structure de chaussée */}
            <div className="mt-2 rounded-lg border border-card-border/50 bg-background/50 p-4">
              <h3 className="mb-3 text-sm font-medium text-slate">
                Structure de chaussée
              </h3>
              <div className="space-y-3">
                <SliderField
                  label="Couche de roulement (enrobé BB)"
                  value={epRevetement}
                  onChange={setEpRevetement}
                  min={4}
                  max={10}
                  step={1}
                  suffix="cm"
                />
                <SliderField
                  label="Couche de liaison (enrobé GB)"
                  value={epLiaison}
                  onChange={setEpLiaison}
                  min={0}
                  max={8}
                  step={1}
                  suffix="cm"
                />
                <SliderField
                  label="Couche de base (grave bitume / conc.)"
                  value={epBase}
                  onChange={setEpBase}
                  min={15}
                  max={30}
                  step={1}
                  suffix="cm"
                />
                <SliderField
                  label="Fondation (tout-venant 0/60 ou 0/80)"
                  value={epFondation}
                  onChange={setEpFondation}
                  min={20}
                  max={50}
                  step={5}
                  suffix="cm"
                />
                <SliderField
                  label="Sous-fondation (géotextile + conc.)"
                  value={epSousFondation}
                  onChange={setEpSousFondation}
                  min={0}
                  max={40}
                  step={5}
                  suffix="cm"
                />
              </div>
            </div>

            {/* Prix voirie */}
            <SliderField
              label="Enrobé (fourn. + pose) par cm d'épaisseur"
              value={prixEnrobe}
              onChange={setPrixEnrobe}
              min={8}
              max={20}
              step={0.5}
              suffix="€/m²/cm"
              hint="8-20 €/m²/cm -- Source : Batiprix 2026 vol. 2, CSDC-CT §4 (Ponts & Chaussées)"
            />
            <SliderField
              label="Grave bitume / grave conc. par cm"
              value={prixGraveBitume}
              onChange={setPrixGraveBitume}
              min={5}
              max={15}
              step={0.5}
              suffix="€/m²/cm"
              hint="5-15 €/m²/cm -- Source : Batiprix 2026, CSDC-CT §3.3"
            />
            <SliderField
              label="Fondation / sous-fondation"
              value={prixFondation}
              onChange={setPrixFondation}
              min={15}
              max={35}
              step={1}
              suffix="€/m³"
              hint="15-35 €/m³ -- Source : Batiprix 2026, CTG 002 art. 5 (couche de forme)"
            />
            {nbTrottoirs > 0 && (
              <SliderField
                label="Trottoir (fondation + pavés/dalles)"
                value={prixTrottoir}
                onChange={setPrixTrottoir}
                min={40}
                max={90}
                step={5}
                suffix="€/m²"
                hint="40-90 €/m² -- Source : Batiprix 2026 (pavés/dalles béton, fondation incluse)"
              />
            )}
          </div>
        </div>

        {/* Bordures et caniveaux */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">
            Lot 3 &mdash; Bordures et caniveaux
          </h2>
          <div className="space-y-4">
            <InputField
              label="Bordures type T2 (bordure haute)"
              value={mlBorduresT2}
              onChange={(v) => setMlBorduresT2(Number(v))}
              suffix="ml"
              min={0}
              step={10}
            />
            <SliderField
              label="Prix bordure T2"
              value={prixBordureT2}
              onChange={setPrixBordureT2}
              min={15}
              max={35}
              step={1}
              suffix="€/ml"
              hint="15-35 €/ml -- Source : Batiprix 2026, norme NF EN 1340"
            />
            <InputField
              label="Bordures CS1 (abaissées / bateaux)"
              value={mlBorduresCS1}
              onChange={(v) => setMlBorduresCS1(Number(v))}
              suffix="ml"
              min={0}
              step={10}
            />
            <SliderField
              label="Prix bordure CS1"
              value={prixBordureCS1}
              onChange={setPrixBordureCS1}
              min={20}
              max={40}
              step={1}
              suffix="€/ml"
              hint="20-40 €/ml -- Source : Batiprix 2026 (bordures abaissées)"
            />
            <InputField
              label="Caniveaux béton"
              value={mlCaniveaux}
              onChange={(v) => setMlCaniveaux(Number(v))}
              suffix="ml"
              min={0}
              step={10}
            />
            <SliderField
              label="Prix caniveau"
              value={prixCaniveau}
              onChange={setPrixCaniveau}
              min={20}
              max={45}
              step={1}
              suffix="€/ml"
              hint="20-45 €/ml -- Source : Batiprix 2026"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-6">
        {/* Réseaux eaux usées (EU) */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">
            3 &mdash; Assainissement
          </h2>
          <MethodologyNote step={3} />
          <h3 className="mb-3 text-sm font-medium text-slate">
            Lot 4 &mdash; Réseaux eaux usées (EU)
          </h3>
          <div className="space-y-4">
            <InputField
              label="Canalisation EU DN200 (PVC)"
              value={mlEU_DN200}
              onChange={(v) => setMlEU_DN200(Number(v))}
              suffix="ml"
              min={0}
              step={10}
            />
            <InputField
              label="Canalisation EU DN300"
              value={mlEU_DN300}
              onChange={(v) => setMlEU_DN300(Number(v))}
              suffix="ml"
              min={0}
              step={10}
            />
            <InputField
              label="Canalisation EU DN400"
              value={mlEU_DN400}
              onChange={(v) => setMlEU_DN400(Number(v))}
              suffix="ml"
              min={0}
              step={10}
            />
            <InputField
              label="Regards de visite"
              value={nbRegardsEU}
              onChange={(v) => setNbRegardsEU(Number(v))}
              suffix="u"
              min={0}
              step={1}
            />
            <InputField
              label="Branchements particuliers"
              value={nbBranchements}
              onChange={(v) => setNbBranchements(Number(v))}
              suffix="u"
              min={0}
              step={1}
            />
            <SliderField
              label="Prix EU DN200"
              value={prixEU_DN200}
              onChange={setPrixEU_DN200}
              min={80}
              max={160}
              step={5}
              suffix="€/ml"
              hint="80-160 €/ml -- Source : Batiprix 2026 vol. 2, CTG 009 art. 2"
            />
            <SliderField
              label="Prix EU DN300"
              value={prixEU_DN300}
              onChange={setPrixEU_DN300}
              min={120}
              max={220}
              step={5}
              suffix="€/ml"
              hint="120-220 €/ml -- Source : Batiprix 2026, CTG 009"
            />
            <SliderField
              label="Prix EU DN400"
              value={prixEU_DN400}
              onChange={setPrixEU_DN400}
              min={160}
              max={300}
              step={10}
              suffix="€/ml"
              hint="160-300 €/ml -- Source : Batiprix 2026, CTG 009"
            />
            <SliderField
              label="Prix regard EU"
              value={prixRegardEU}
              onChange={setPrixRegardEU}
              min={800}
              max={2000}
              step={100}
              suffix="€/u"
              hint="800-2 000 €/u -- Source : Batiprix 2026, Administration de l'eau TabAVIS-9100"
            />
            <SliderField
              label="Prix branchement"
              value={prixBranchement}
              onChange={setPrixBranchement}
              min={500}
              max={1500}
              step={100}
              suffix="€/u"
              hint="500-1 500 €/u -- Source : Batiprix 2026"
            />
          </div>
        </div>

        {/* Réseaux eaux pluviales (EP) */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">
            Lot 5 &mdash; Réseaux eaux pluviales (EP)
          </h2>
          <div className="space-y-4">
            <InputField
              label="Canalisation EP DN300"
              value={mlEP_DN300}
              onChange={(v) => setMlEP_DN300(Number(v))}
              suffix="ml"
              min={0}
              step={10}
            />
            <InputField
              label="Canalisation EP DN400"
              value={mlEP_DN400}
              onChange={(v) => setMlEP_DN400(Number(v))}
              suffix="ml"
              min={0}
              step={10}
            />
            <InputField
              label="Canalisation EP DN600"
              value={mlEP_DN600}
              onChange={(v) => setMlEP_DN600(Number(v))}
              suffix="ml"
              min={0}
              step={10}
            />
            <InputField
              label="Regards de visite EP"
              value={nbRegardsEP}
              onChange={(v) => setNbRegardsEP(Number(v))}
              suffix="u"
              min={0}
              step={1}
            />
            <InputField
              label="Avaloirs avec grille"
              value={nbAvaloirs}
              onChange={(v) => setNbAvaloirs(Number(v))}
              suffix="u"
              min={0}
              step={1}
            />
            <ToggleField
              label="Bassin de rétention"
              checked={bassinRetention}
              onChange={setBassinRetention}
            />
            {bassinRetention && (
              <SliderField
                label="Volume bassin de rétention"
                value={volumeBassin}
                onChange={setVolumeBassin}
                min={50}
                max={500}
                step={10}
                suffix="m³"
              />
            )}
            <SliderField
              label="Prix EP DN300"
              value={prixEP_DN300}
              onChange={setPrixEP_DN300}
              min={100}
              max={200}
              step={5}
              suffix="€/ml"
              hint="100-200 €/ml -- Source : Batiprix 2026, CTG 009"
            />
            <SliderField
              label="Prix EP DN400"
              value={prixEP_DN400}
              onChange={setPrixEP_DN400}
              min={140}
              max={280}
              step={10}
              suffix="€/ml"
              hint="140-280 €/ml -- Source : Batiprix 2026, CTG 009"
            />
            <SliderField
              label="Prix EP DN600"
              value={prixEP_DN600}
              onChange={setPrixEP_DN600}
              min={200}
              max={400}
              step={10}
              suffix="€/ml"
              hint="200-400 €/ml -- Source : Batiprix 2026, CTG 009"
            />
            <SliderField
              label="Prix regard EP"
              value={prixRegardEP}
              onChange={setPrixRegardEP}
              min={900}
              max={2200}
              step={100}
              suffix="€/u"
              hint="800-2 000 €/u -- Source : Batiprix 2026, Administration de l'eau"
            />
            <SliderField
              label="Prix avaloir"
              value={prixAvaloir}
              onChange={setPrixAvaloir}
              min={400}
              max={1000}
              step={50}
              suffix="€/u"
              hint="400-1 000 €/u -- Source : Batiprix 2026"
            />
            <SliderField
              label="Prix bassin"
              value={prixBassin}
              onChange={setPrixBassin}
              min={150}
              max={400}
              step={10}
              suffix="€/m³"
              hint="150-400 €/m³ -- Source : Batiprix 2026, Administration de l'eau"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">
          4 &mdash; Réseaux secs
        </h2>
        <MethodologyNote step={4} />
        <div className="space-y-4">
          <InputField
            label="Tranchée commune (élec + télécom + gaz)"
            value={mlTrancheeCommune}
            onChange={(v) => setMlTrancheeCommune(Number(v))}
            suffix="ml"
            min={0}
            step={10}
          />
          <SliderField
            label="Profondeur tranchée"
            value={profondeurTranchee}
            onChange={setProfondeurTranchee}
            min={0.6}
            max={1.2}
            step={0.1}
            suffix="m"
          />
          <SliderField
            label="Largeur tranchée"
            value={largeurTranchee}
            onChange={setLargeurTranchee}
            min={0.4}
            max={1}
            step={0.1}
            suffix="m"
          />
          <SliderField
            label="Prix tranchée"
            value={prixTranchee}
            onChange={setPrixTranchee}
            min={30}
            max={80}
            step={5}
            suffix="€/ml"
            hint="30-80 €/ml -- Source : Batiprix 2026, dispositions techniques VdL"
          />
          <InputField
            label="Coffrets / armoires de rue"
            value={nbCoffrets}
            onChange={(v) => setNbCoffrets(Number(v))}
            suffix="u"
            min={0}
            step={1}
          />
          <SliderField
            label="Prix coffret"
            value={prixCoffret}
            onChange={setPrixCoffret}
            min={300}
            max={800}
            step={50}
            suffix="€/u"
            hint="300-800 €/u -- Source : Creos catalogue 2026"
          />
          <InputField
            label="Candélabres éclairage public"
            value={nbCandelabres}
            onChange={(v) => setNbCandelabres(Number(v))}
            suffix="u"
            min={0}
            step={1}
          />
          <SliderField
            label="Prix candélabre"
            value={prixCandelabre}
            onChange={setPrixCandelabre}
            min={2000}
            max={5000}
            step={100}
            suffix="€/u"
            hint="2 000-5 000 €/u -- Source : Batiprix 2026 (LED + fondation + raccordement)"
          />
        </div>
      </div>
    );
  }

  function renderStep5() {
    return (
      <div className="space-y-6">
        {/* Lot 7 : Aménagements paysagers */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">
            5 &mdash; Aménagements
          </h2>
          <MethodologyNote step={5} />
          <h3 className="mb-3 text-sm font-medium text-slate">
            Lot 7 &mdash; Aménagements paysagers
          </h3>
          <div className="space-y-4">
            <InputField
              label="Espaces verts"
              value={surfaceEspacesVerts}
              onChange={(v) => setSurfaceEspacesVerts(Number(v))}
              suffix="m²"
              min={0}
              step={100}
            />
            <SliderField
              label="Prix espace vert"
              value={prixEspaceVert}
              onChange={setPrixEspaceVert}
              min={8}
              max={25}
              step={1}
              suffix="€/m²"
              hint="8-25 €/m² -- Source : Batiprix 2026 vol. 2 (espaces verts)"
            />
            <InputField
              label="Nombre d'arbres"
              value={nbArbres}
              onChange={(v) => setNbArbres(Number(v))}
              suffix="u"
              min={0}
              step={1}
            />
            <SliderField
              label="Prix arbre"
              value={prixArbre}
              onChange={setPrixArbre}
              min={200}
              max={800}
              step={50}
              suffix="€/u"
              hint="200-800 €/u -- Source : Batiprix 2026 (fourniture, fosse, tuteurage)"
            />
          </div>
        </div>

        {/* Lot 8 : Signalisation et mobilier urbain */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">
            Lot 8 &mdash; Signalisation et mobilier urbain
          </h2>
          <div className="space-y-4">
            <InputField
              label="Signalisation (forfait)"
              value={surfaceSignalisation}
              onChange={(v) => setSurfaceSignalisation(Number(v))}
              suffix="€"
              min={0}
              step={500}
            />
            <InputField
              label="Mobilier urbain (forfait)"
              value={mobilierUrbain}
              onChange={(v) => setMobilierUrbain(Number(v))}
              suffix="€"
              min={0}
              step={500}
              hint="Bancs, poubelles, barrières, potelets"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderStep6() {
    return (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">
          6 &mdash; Études et honoraires
        </h2>
        <MethodologyNote step={6} />
        <div className="space-y-4">
          <SliderField
            label="Étude géotechnique"
            value={etudeGeo}
            onChange={setEtudeGeo}
            min={2000}
            max={8000}
            step={500}
            suffix="€"
            hint="Source : marché courant LU (LSC360, Schroeder & Associés)"
          />
          <SliderField
            label="Étude topographique"
            value={etudeTopo}
            onChange={setEtudeTopo}
            min={2000}
            max={6000}
            step={500}
            suffix="€"
            hint="Source : marché courant LU (géomètre-expert agréé)"
          />
          <SliderField
            label="Étude hydraulique / gestion eaux pluviales"
            value={etudeHydro}
            onChange={setEtudeHydro}
            min={3000}
            max={12000}
            step={500}
            suffix="€"
            hint="Source : Administration de l'eau, RGD assainissement"
          />
          <SliderField
            label="Étude d'impact environnemental"
            value={etudeImpact}
            onChange={setEtudeImpact}
            min={0}
            max={25000}
            step={1000}
            suffix="€"
          />
          <SliderField
            label="Coordination sécurité-santé"
            value={coordSS}
            onChange={setCoordSS}
            min={3000}
            max={10000}
            step={500}
            suffix="€"
          />
          <SliderField
            label="Honoraires bureau d'études"
            value={honorairesBE}
            onChange={setHonorairesBE}
            min={6}
            max={14}
            step={0.5}
            suffix="%"
            hint="Source : OAI CTA Privé annexe 3 (indicatif, libre négociation depuis 2024)"
          />
          <SliderField
            label="Aléas"
            value={aleas}
            onChange={setAleas}
            min={3}
            max={10}
            step={0.5}
            suffix="%"
          />
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return null;
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Estimateur VRD &mdash; Bureau d&rsquo;études
          </h1>
          <p className="mt-2 text-muted">
            Métrés, estimation budgétaire et bordereau récapitulatif &mdash; Projets d&rsquo;infrastructure Luxembourg
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
                      {step.id}
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
                Précédent
              </button>
              <span className="text-xs text-muted">
                Étape {currentStep + 1} / {STEPS.length}
              </span>
              <button
                type="button"
                disabled={currentStep === STEPS.length - 1}
                onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>

          {/* ====================================================== */}
          {/*  RIGHT COLUMN -- RESULTS                                */}
          {/* ====================================================== */}
          <div className="space-y-6">
            {/* Hero total */}
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-center text-white shadow-lg">
              <div className="text-sm text-white/60">
                Budget total estimé &mdash; {nomProjet || "Nouveau projet"}
              </div>
              <div className="mt-2 text-5xl font-bold">
                {formatEUR(result.totalGeneral)}
              </div>
              <div className="mt-3 flex items-center justify-center gap-6 text-sm text-white/70">
                <span>{formatEUR(Math.round(result.coutM2))} / m² de surface projet</span>
              </div>
              <div className="mt-1 text-xs text-white/40">
                Hors honoraires BE
              </div>
            </div>

            {/* Recapitulatif par lot */}
            <ResultPanel
              title="Récapitulatif par lot"
              lines={[
                ...result.lots.map((lot) => ({
                  label: `Lot ${lot.num} — ${lot.nom}`,
                  value: `${formatEUR(lot.total)} (${result.totalTravaux > 0 ? ((lot.total / result.totalTravaux) * 100).toFixed(1) : "0"} %)`,
                })),
                {
                  label: "Total travaux",
                  value: formatEUR(result.totalTravaux),
                  highlight: true,
                },
                {
                  label: "Études et divers",
                  value: formatEUR(result.totalEtudes),
                },
                {
                  label: `Honoraires BE (${honorairesBE} %)`,
                  value: formatEUR(result.montantHonorairesBE),
                },
                {
                  label: `Aléas (${aleas} %)`,
                  value: formatEUR(result.montantAleas),
                },
                {
                  label: "TOTAL GÉNÉRAL",
                  value: formatEUR(result.totalGeneral),
                  highlight: true,
                  large: true,
                },
              ]}
            />

            {/* Stacked bar */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">
                Répartition par lot
              </h3>
              {/* Bar */}
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
              {/* Legend */}
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

            {/* Topography warnings */}
            {(pente !== "plat" || solRocheux) && (
              <ResultPanel
                title="Majorations topographiques"
                lines={[
                  ...(pente !== "plat"
                    ? [
                        {
                          label: "Majoration pente",
                          value: `x${PENTE_MULTIPLIER[pente].toFixed(2)}`,
                          warning: true as const,
                        },
                      ]
                    : []),
                  ...(solRocheux
                    ? [
                        {
                          label: "Majoration sol rocheux",
                          value: `x${SOL_ROCHEUX_MULTIPLIER.toFixed(2)}`,
                          warning: true as const,
                        },
                      ]
                    : []),
                  {
                    label: "Coefficient combiné",
                    value: `x${result.terrassementM.toFixed(2)}`,
                    highlight: true,
                  },
                ]}
              />
            )}

            {/* ====================================================== */}
            {/*  BORDEREAU DÉTAILLÉ                                     */}
            {/* ====================================================== */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
              <div className="p-6 pb-3">
                <h3 className="text-base font-semibold text-navy">
                  Bordereau détaillé
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Métré quantitatif estimatif &mdash;{" "}
                  {nomProjet || "Nouveau projet"}
                  {commune ? ` — ${commune}` : ""}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border bg-background/80">
                      <th className="px-3 py-2.5 text-left font-semibold text-slate w-[52px]">
                        No.
                      </th>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate">
                        Désignation
                      </th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate w-[48px]">
                        Unité
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate w-[80px]">
                        Qté
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate w-[90px]">
                        PU (€)
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate w-[110px]">
                        Total (€)
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
                              Sous-total Lot {row.lotNum}
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
                            style={{ backgroundColor: "#1e3a5f" }}
                          >
                            <td className="px-3 py-3" />
                            <td className="px-3 py-3" colSpan={4}>
                              TOTAL GÉNÉRAL TRAVAUX
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

            {/* ====================================================== */}
            {/*  DOCUMENTS DE RÉFÉRENCE                                 */}
            {/* ====================================================== */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">
                Documents de référence
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
                      {doc.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sources */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <p className="text-xs leading-relaxed text-muted">
                <strong>Sources :</strong> Prix unitaires moyens marché
                luxembourgeois 2025-2026. Référentiels : Batiprix 2026 vol. 2
                (VRD, Espaces verts) avec coefficient LU x1.20, CTG 002
                (terrassement), CTG 009 (canalisation), CSDC-CT (Ponts &amp;
                Chaussées), STATEC indices prix construction, Creos catalogue
                raccordement 2026, OAI CTA Privé annexe 3. Les prix incluent
                généralement fourniture, transport et mise en œuvre. Devis
                détaillés à demander aux entreprises spécialisées.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
