"use client";

const formatEUR = (n: number) => new Intl.NumberFormat("fr-FR", {style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
import { getProfile } from "@/lib/profile";

interface DocxReportData {
  expertGuidance?: { limits: string; contact: string };
  dateRapport: string;
  adresse?: string;
  commune?: string;
  assetType: string;
  evsType: string;
  surface: number;
  valeurComparaison?: number;
  valeurCapitalisation?: number;
  valeurDCF?: number;
  valeurReconciliee?: number;
  comparables?: import("@/lib/valuation").Comparable[];
  reconciliation?: {nom:string;valeur:number;poidsEffectif:number}[];
  noi?: number;
  tauxCap?: number;
  irr?: number;
  mlv?: number;
  ratioMLV?: number;
  esgScore?: number;
  esgNiveau?: string;
  esgImpact?: number;
  classeEnergie?: string;
  narrative?: string;
}

export async function downloadDocxReport(data: DocxReportData, userId: string | null) {
  const profile = getProfile(userId);
  const { Document, Paragraph, TextRun, HeadingLevel, Packer } = await import("docx");
  const { saveAs } = await import("file-saver");

  const sections: InstanceType<typeof Paragraph>[] = [];

  // Header
  sections.push(
    new Paragraph({ children: [new TextRun({ text: "RAPPORT DE VALORISATION", size: 32, bold: true, color: "1B2A4A" })], spacing: { after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: `tevaxia.lu — ${data.dateRapport}`, size: 20, color: "6B7280" })], spacing: { after: 200 } }),
  );

  // Profil évaluateur
  if (profile.nomComplet) {
    sections.push(
      new Paragraph({ children: [new TextRun({ text: `Évaluateur : ${profile.nomComplet}`, size: 20 })], spacing: { after: 40 } }),
    );
    if (profile.societe) sections.push(new Paragraph({ children: [new TextRun({ text: profile.societe, size: 20, color: "6B7280" })], spacing: { after: 40 } }));
    if (profile.qualifications) sections.push(new Paragraph({ children: [new TextRun({ text: profile.qualifications, size: 20, color: "6B7280" })], spacing: { after: 40 } }));
    if (profile.email) sections.push(new Paragraph({ children: [new TextRun({ text: `${profile.email} — ${profile.telephone}`, size: 20, color: "6B7280" })], spacing: { after: 200 } }));
  }

  // 1. Périmètre
  sections.push(new Paragraph({ text: "1. Périmètre", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
  // Tables in docx library are complex; we render as paragraphs below via makeRow.
  sections.push(new Paragraph({ children: [] })); // spacer

  // 2. Identification
  sections.push(new Paragraph({ text: "2. Identification du bien", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
  if (data.adresse) sections.push(new Paragraph({ children: [new TextRun({ text: `Adresse : `, color: "6B7280", size: 20 }), new TextRun({ text: data.adresse, size: 20, bold: true })] }));
  if (data.commune) sections.push(new Paragraph({ children: [new TextRun({ text: `Commune : `, color: "6B7280", size: 20 }), new TextRun({ text: data.commune, size: 20, bold: true })] }));
  sections.push(new Paragraph({ children: [new TextRun({ text: `Type d'actif : `, color: "6B7280", size: 20 }), new TextRun({ text: data.assetType, size: 20 })] }));
  sections.push(new Paragraph({ children: [new TextRun({ text: `Surface : `, color: "6B7280", size: 20 }), new TextRun({ text: `${data.surface} m²`, size: 20 })] }));

  // 3. Synthèse
  sections.push(new Paragraph({ text: "3. Synthèse des méthodes", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
  if (data.valeurComparaison) sections.push(new Paragraph({ children: [new TextRun({ text: `Comparaison : `, color: "6B7280", size: 20 }), new TextRun({ text: formatEUR(data.valeurComparaison), size: 22, bold: true })] }));
  if (data.valeurCapitalisation) sections.push(new Paragraph({ children: [new TextRun({ text: `Capitalisation : `, color: "6B7280", size: 20 }), new TextRun({ text: formatEUR(data.valeurCapitalisation), size: 22, bold: true })] }));
  if (data.valeurDCF) sections.push(new Paragraph({ children: [new TextRun({ text: `DCF : `, color: "6B7280", size: 20 }), new TextRun({ text: formatEUR(data.valeurDCF), size: 22, bold: true })] }));
  if (data.reconciliation) for (const m of data.reconciliation) sections.push(new Paragraph({children:[new TextRun({text:`Pondération retenue — ${m.nom} : ${m.poidsEffectif.toFixed(2)} %`,size:20})]}));
  if (data.valeurReconciliee) {
    sections.push(new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: `Valeur réconciliée : `, size: 22 }), new TextRun({ text: formatEUR(data.valeurReconciliee), size: 28, bold: true, color: "1B2A4A" })] }));
  }

  if(data.comparables?.length){
    sections.push(new Paragraph({text:"Références de comparaison déclarées",heading:HeadingLevel.HEADING_2,spacing:{before:300,after:100}}));
    for(const c of data.comparables) sections.push(new Paragraph({text:`${c.adresse} — ${c.dateVente} — ${formatEUR(c.prixVente)} / ${c.surface} m² — poids ${c.poids} — ${c.source??''} — ${c.justification??''}`}));
  }

  // 4. Capitalisation
  if (data.noi) {
    sections.push(new Paragraph({ text: "4. Capitalisation directe", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
    sections.push(new Paragraph({ children: [new TextRun({ text: `NOI : ${formatEUR(data.noi)}`, size: 20 })] }));
    if (data.tauxCap) sections.push(new Paragraph({ children: [new TextRun({ text: `Taux de capitalisation : ${data.tauxCap.toFixed(2)}%`, size: 20 })] }));
  }

  // 5. DCF
  if (data.irr) {
    sections.push(new Paragraph({ text: "5. Flux actualisés (DCF)", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
    sections.push(new Paragraph({ children: [new TextRun({ text: `TRI (IRR) : ${(data.irr * 100).toFixed(2)}%`, size: 22, bold: true })] }));
  }

  // 6. MLV
  if (data.mlv) {
    sections.push(new Paragraph({ text: "6. Valeur hypothécaire (MLV)", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
    sections.push(new Paragraph({ children: [new TextRun({ text: `MLV : ${formatEUR(data.mlv)}`, size: 22, bold: true })] }));
    if (data.ratioMLV) sections.push(new Paragraph({ children: [new TextRun({ text: `Ratio MLV/MV : ${(data.ratioMLV * 100).toFixed(1)}%`, size: 20, color: "6B7280" })] }));
  }

  // 7. ESG
  if (data.esgScore !== undefined) {
    sections.push(new Paragraph({ text: "7. Facteurs ESG", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
    sections.push(new Paragraph({ children: [new TextRun({ text: `Score ESG : ${data.esgScore}/100 (Niveau ${data.esgNiveau})`, size: 20 })] }));
    if (data.classeEnergie) sections.push(new Paragraph({ children: [new TextRun({ text: `Classe énergie : ${data.classeEnergie}`, size: 20 })] }));
    if (data.esgImpact !== undefined) sections.push(new Paragraph({ children: [new TextRun({ text: `Impact sur la valeur : ${data.esgImpact > 0 ? "+" : ""}${data.esgImpact}%`, size: 20 })] }));
  }

  // 8. Narrative
  if (data.narrative) {
    sections.push(new Paragraph({ text: "8. Analyse narrative", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
    for (const para of data.narrative.split("\n\n")) {
      sections.push(new Paragraph({ children: [new TextRun({ text: para.replace(/\*\*/g, ""), size: 20, color: "334155" })], spacing: { after: 80 } }));
    }
  }

  // Disclaimer
  const guidance = data.expertGuidance ? `${data.expertGuidance.limits} ${data.expertGuidance.contact} : https://www.lpvi.lu/ — info@lpvi.lu.` : "Dossier de travail à vérifier par un professionnel. Pour une orientation vers un expert au Luxembourg : https://www.lpvi.lu/ — info@lpvi.lu. L’export ne certifie aucune conformité professionnelle.";
  sections.push(new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: guidance, size: 18, color: "334155" })] }));
  sections.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: profile.mentionLegale || "Ce rapport est fourni à titre indicatif.", size: 16, color: "9CA3AF", italics: true })] }));

  // Signature
  if (profile.nomComplet) {
    sections.push(
      new Paragraph({ spacing: { before: 300 }, children: [new TextRun({ text: profile.nomComplet, size: 20, bold: true })] }),
      new Paragraph({ children: [new TextRun({ text: `${profile.qualifications}${profile.societe ? ` — ${profile.societe}` : ""}`, size: 18, color: "6B7280" })] }),
      new Paragraph({ children: [new TextRun({ text: `Date : ${data.dateRapport}`, size: 18, color: "6B7280" })] }),
    );
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } } },
      children: sections,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `tevaxia-rapport-${data.dateRapport}.docx`);
}
