"use client";

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { RentalLot } from "@/lib/gestion-locative";

// ============================================================
// Draft only: entered declarations are not a legal compliance assessment.
// ============================================================

interface LeasePdfProps {
  lot: RentalLot;
  landlord: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    vat?: string;
  };
  tenant: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
  };
  leaseStart: string; // YYYY-MM-DD
  leaseEndOrDuration: string; // ex. "2029-12-31" ou "3 ans"
  deposit: number; // €
  conclusionDate: string;
  cadastralReference: string;
  premisesDescription: string;
  furnitureSupplement: number; // Included in lot.loyerMensuelActuel, not added twice.
  chargesType: "advance" | "fixed";
  rentConfirmed: boolean;
  /** PNG base64 data URL de la signature du bailleur (optionnel) */
  signatureLandlord?: string | null;
  /** PNG base64 data URL de la signature du locataire (optionnel) */
  signatureTenant?: string | null;
  /** Date/heure de signature bailleur (ISO) */
  signedAtLandlord?: string | null;
  /** Date/heure de signature locataire (ISO) */
  signedAtTenant?: string | null;
}

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.5, color: "#0B2447" },
  title: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  legalNote: { fontSize: 8, color: "#6B7280", textAlign: "center", marginBottom: 20 },
  section: { marginTop: 14 },
  h2: { fontSize: 11, fontWeight: "bold", marginBottom: 6, color: "#1B2A4A", textTransform: "uppercase" },
  p: { marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  label: { color: "#334155", width: "40%" },
  value: { fontWeight: "bold", color: "#0B2447", width: "60%" },
  signatureBox: { flexDirection: "row", justifyContent: "space-between", marginTop: 40, gap: 30 },
  sig: { flex: 1, borderTop: "1 solid #0B2447", paddingTop: 8, textAlign: "center", fontSize: 9 },
  warning: { fontSize: 8, color: "#92400E", backgroundColor: "#FEF3C7", padding: 6, marginTop: 20 },
});

function formatEUR(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function LeasePdf({
  lot, landlord, tenant, leaseStart, leaseEndOrDuration, deposit, conclusionDate,
  cadastralReference, premisesDescription, furnitureSupplement, chargesType, rentConfirmed,
  signatureLandlord, signatureTenant, signedAtLandlord, signedAtTenant,
}: LeasePdfProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Projet de bail à usage d&apos;habitation</Text>
        <Text style={s.legalNote}>
          Document de travail à vérifier avant conclusion. Nouveau bail de résidence principale au Luxembourg ; date de conclusion prévue : {conclusionDate}. Aucune certification de conformité par Tevaxia.
        </Text>

        {/* 1. Parties */}
        <View style={s.section}>
          <Text style={s.h2}>1. Entre les soussignés</Text>
          <Text style={s.p}>
            Le <Text style={{ fontWeight: "bold" }}>bailleur</Text> : {landlord.name}
            {landlord.address ? `, demeurant à ${landlord.address}` : ""}.
          </Text>
          {landlord.vat ? <Text style={s.p}>N° TVA : {landlord.vat}</Text> : null}
          <Text style={{ ...s.p, marginTop: 6 }}>
            Et le <Text style={{ fontWeight: "bold" }}>locataire</Text> : {tenant.name}
            {tenant.address ? `, demeurant à ${tenant.address}` : ""}
            {tenant.birthDate ? `, né(e) le ${tenant.birthDate}` : ""}.
          </Text>
        </View>

        {/* 2. Objet */}
        <View style={s.section}>
          <Text style={s.h2}>2. Objet du bail</Text>
          <Text style={s.p}>
            Le bailleur loue au locataire, qui accepte, le bien ci-après décrit, à l&apos;usage exclusif d&apos;habitation
            principale du locataire et des membres de son foyer.
          </Text>
          <View style={s.row}><Text style={s.label}>Désignation</Text><Text style={s.value}>{lot.name}</Text></View>
          <View style={s.row}><Text style={s.label}>Référence cadastrale</Text><Text style={s.value}>{cadastralReference}</Text></View>
          <Text style={s.p}>Pièces, parties d’immeuble et annexes louées : {premisesDescription}</Text>
          {lot.address ? <View style={s.row}><Text style={s.label}>Adresse</Text><Text style={s.value}>{lot.address}</Text></View> : null}
          {lot.commune ? <View style={s.row}><Text style={s.label}>Commune</Text><Text style={s.value}>{lot.commune}</Text></View> : null}
          <View style={s.row}><Text style={s.label}>Surface habitable</Text><Text style={s.value}>{lot.surface} m²</Text></View>
          {lot.nbChambres ? <View style={s.row}><Text style={s.label}>Nombre de chambres</Text><Text style={s.value}>{lot.nbChambres}</Text></View> : null}
          <View style={s.row}><Text style={s.label}>Classe énergétique</Text><Text style={s.value}>{lot.classeEnergie}</Text></View>
          <View style={s.row}><Text style={s.label}>Logement meublé</Text><Text style={s.value}>{lot.estMeuble ? "Oui" : "Non"}</Text></View>
        </View>

        {/* 3. Durée */}
        <View style={s.section}>
          <Text style={s.h2}>3. Durée du bail</Text>
          <Text style={s.p}>
            Le présent bail est conclu pour une durée
            {/^\d{4}-\d{2}-\d{2}$/.test(leaseEndOrDuration) ? " déterminée" : ""}
            à compter du {leaseStart}
            {/^\d{4}-\d{2}-\d{2}$/.test(leaseEndOrDuration) ? ` et se terminant le ${leaseEndOrDuration}` : ` pour une durée de ${leaseEndOrDuration}`}.
            Tout renouvellement intervient de plein droit, sauf dénonciation dans les formes et délais légaux.
          </Text>
        </View>

        {/* 4. Loyer */}
        <View style={s.section}>
          <Text style={s.h2}>4. Loyer et charges</Text>
          <View style={s.row}><Text style={s.label}>Loyer principal mensuel</Text><Text style={s.value}>{formatEUR(lot.loyerMensuelActuel - furnitureSupplement)}</Text></View>
          {lot.estMeuble && <View style={s.row}><Text style={s.label}>Supplément mobilier mensuel</Text><Text style={s.value}>{formatEUR(furnitureSupplement)}</Text></View>}
          <View style={s.row}><Text style={s.label}>Total loyer hors charges</Text><Text style={s.value}>{formatEUR(lot.loyerMensuelActuel)}</Text></View>
          <View style={s.row}><Text style={s.label}>{chargesType === "advance" ? "Acomptes mensuels sur charges" : "Forfait mensuel de charges"}</Text><Text style={s.value}>{formatEUR(lot.chargesMensuelles)}</Text></View>
          <View style={s.row}><Text style={s.label}>Total mensuel</Text><Text style={s.value}>{formatEUR(lot.loyerMensuelActuel + lot.chargesMensuelles)}</Text></View>
          <Text style={{ ...s.p, marginTop: 4 }}>
            Le loyer est payable d&apos;avance, au plus tard le 5 de chaque mois, par virement sur le compte du bailleur.
          </Text>
          <Text style={s.p}>
            {rentConfirmed ? "Déclaration saisie par le bailleur : le loyer demandé respecte le plafond légal du loyer annuel ; les justificatifs de cette déclaration doivent être conservés et communiqués selon les règles applicables." : "À compléter avant conclusion : le bailleur doit vérifier et déclarer le respect du plafond légal du loyer annuel, sur la base du capital investi réévalué et décoté applicable au logement."}
            {" "}Tevaxia ne calcule ni ne vérifie ce plafond dans ce générateur et ne joint aucune annexe de calcul.
          </Text>
          {lot.estMeuble && <Text style={s.p}>Le supplément mobilier doit être justifié séparément par l’inventaire et les factures éligibles : au maximum 1,5 % par mois du montant des factures de moins de dix ans des meubles garnissant le logement. Joindre les pièces nécessaires ; elles ne sont pas générées ici.</Text>}
          <Text style={s.p}>{chargesType === "advance" ? "Les acomptes font l’objet d’un décompte annuel sur justificatifs des charges récupérables." : "Le forfait convenu doit correspondre aux consommations et charges normales du locataire ; sa composition doit être précisée entre les parties."}</Text>
        </View>

        {/* 5. Indexation */}
        <View style={s.section}>
          <Text style={s.h2}>5. Adaptation du loyer et contestation</Text>
          <Text style={s.p}>
            Aucune indexation automatique n’est prévue par ce projet. Toute adaptation doit respecter les conditions légales, notamment l’intervalle de deux ans et la limite d’augmentation de 10 %, sous réserve des cas prévus par la loi. Les parties peuvent saisir la commission des loyers en cas de litige sur la fixation du loyer.
          </Text>
        </View>

        {/* 6. Garantie locative */}
        <View style={s.section}>
          <Text style={s.h2}>6. Garantie locative</Text>
          <Text style={s.p}>
            Le locataire verse une garantie locative d&apos;un montant de <Text style={{ fontWeight: "bold" }}>{formatEUR(deposit)}</Text>,
            soit {(deposit / lot.loyerMensuelActuel).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} mois de loyer hors charges (maximum pour ce nouveau bail : 2 mois).
            La forme de la garantie doit être convenue entre les parties et documentée séparément. En présence d’une garantie, l’état des lieux d’entrée doit être signé au plus tard lors de l’entrée dans les lieux. La restitution suit les conditions et délais légaux.
          </Text>
        </View>

        {/* 7. État des lieux */}
        <View style={s.section}>
          <Text style={s.h2}>7. État des lieux</Text>
          <Text style={s.p}>
            Un état des lieux contradictoire est préparé à l’entrée et à la sortie. Prévoir également la remise du certificat de performance énergétique et, pour un logement meublé, l’inventaire du mobilier. Ces pièces ne sont pas jointes automatiquement au projet.
          </Text>
        </View>

        {/* 8. Obligations */}
        <View style={s.section}>
          <Text style={s.h2}>8. Obligations du locataire</Text>
          <Text style={s.p}>• Jouir du bien en bon père de famille, conformément à sa destination d&apos;habitation.</Text>
          <Text style={s.p}>• Souscrire une assurance responsabilité civile et dégâts des eaux (copie à fournir au bailleur).</Text>
          <Text style={s.p}>• Assurer l&apos;entretien locatif courant et les menues réparations.</Text>
          <Text style={s.p}>• Ne pas sous-louer, même partiellement, sans accord écrit du bailleur.</Text>
        </View>

        {/* 9. Résiliation */}
        <View style={s.section}>
          <Text style={s.h2}>9. Résiliation</Text>
          <Text style={s.p}>
            La résiliation et le renouvellement dépendent notamment de la durée convenue et des motifs légaux. Les parties doivent préciser les modalités de préavis adaptées au présent bail avant sa conclusion, sans déroger aux dispositions impératives. Ce projet ne confère pas un droit général de résilier un bail à durée déterminée à tout moment.
          </Text>
        </View>

        {/* Signatures */}
        <View style={s.signatureBox}>
          <View style={s.sig}>
            {signatureLandlord ? (
              <>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={signatureLandlord} style={{ height: 40, marginBottom: 4 }} />
                <Text style={{ fontSize: 8 }}>Le bailleur — {landlord.name}</Text>
                {signedAtLandlord && (
                  <Text style={{ color: "#6B7280", fontSize: 7, marginTop: 2 }}>
                    Tracé saisi le {new Date(signedAtLandlord).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })} (horloge locale non certifiée)
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text>Le bailleur</Text>
                <Text>{landlord.name}</Text>
                <Text style={{ color: "#6B7280", fontSize: 7, marginTop: 4 }}>
                  Date et signature précédées de la mention « Lu et approuvé »
                </Text>
              </>
            )}
          </View>
          <View style={s.sig}>
            {signatureTenant ? (
              <>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={signatureTenant} style={{ height: 40, marginBottom: 4 }} />
                <Text style={{ fontSize: 8 }}>Le locataire — {tenant.name}</Text>
                {signedAtTenant && (
                  <Text style={{ color: "#6B7280", fontSize: 7, marginTop: 2 }}>
                    Tracé saisi le {new Date(signedAtTenant).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })} (horloge locale non certifiée)
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text>Le locataire</Text>
                <Text>{tenant.name}</Text>
                <Text style={{ color: "#6B7280", fontSize: 7, marginTop: 4 }}>
                  Date et signature précédées de la mention « Lu et approuvé »
                </Text>
              </>
            )}
          </View>
        </View>

        {(signatureLandlord || signatureTenant) && (
          <View style={{ marginTop: 20, padding: 8, backgroundColor: "#F8FAFC", borderRadius: 4 }}>
            <Text style={{ fontSize: 7, color: "#334155", fontWeight: "bold", marginBottom: 2 }}>
              Images de tracés de signature
            </Text>
            <Text style={{ fontSize: 6, color: "#6B7280" }}>
              Les images ci-dessus ne certifient ni l’identité des personnes ni leur accord. L’empreinte SHA-256 proposée séparément porte sur les octets du PDF final ; elle permet une comparaison de fichiers, sans authentification ni horodatage certifié.
            </Text>
          </View>
        )}

        <Text style={s.warning}>
          PROJET À VÉRIFIER : identité et capacité des parties, plafond du loyer, mobilier, charges, préavis, annexes et conditions particulières. Modèle limité à un nouveau bail de résidence principale ; il ne couvre pas les baux commerciaux, la colocation ni l’hébergement touristique. Prévoir un exemplaire par partie et faire vérifier les clauses avant signature.
        </Text>
      </Page>
    </Document>
  );
}
