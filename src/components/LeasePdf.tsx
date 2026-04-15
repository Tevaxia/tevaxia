"use client";

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { RentalLot } from "@/lib/gestion-locative";

// ============================================================
// Template de bail LU conforme loi du 21 septembre 2006 modifiée
// par la loi du 1er août 2022 relative au bail à usage d'habitation
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
  indexationReference: string; // ex. "Indice des prix à la consommation (STATEC)"
  /** PNG base64 data URL de la signature du bailleur (optionnel) */
  signatureLandlord?: string | null;
  /** PNG base64 data URL de la signature du locataire (optionnel) */
  signatureTenant?: string | null;
  /** SHA-256 du PDF (calculé après rendu initial, ré-injecté au 2e rendu) */
  pdfHash?: string | null;
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
  return new Intl.NumberFormat("fr-LU", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default function LeasePdf({
  lot, landlord, tenant, leaseStart, leaseEndOrDuration, deposit, indexationReference,
  signatureLandlord, signatureTenant, pdfHash, signedAtLandlord, signedAtTenant,
}: LeasePdfProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Contrat de bail à usage d&apos;habitation</Text>
        <Text style={s.legalNote}>
          Conforme à la loi modifiée du 21 septembre 2006 sur le bail à usage d&apos;habitation (Mémorial A - N° 175)
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
          <View style={s.row}><Text style={s.label}>Loyer mensuel (hors charges)</Text><Text style={s.value}>{formatEUR(lot.loyerMensuelActuel)}</Text></View>
          <View style={s.row}><Text style={s.label}>Charges mensuelles forfaitaires</Text><Text style={s.value}>{formatEUR(lot.chargesMensuelles)}</Text></View>
          <View style={s.row}><Text style={s.label}>Total mensuel</Text><Text style={s.value}>{formatEUR(lot.loyerMensuelActuel + lot.chargesMensuelles)}</Text></View>
          <Text style={{ ...s.p, marginTop: 4 }}>
            Le loyer est payable d&apos;avance, au plus tard le 5 de chaque mois, par virement sur le compte du bailleur.
          </Text>
          <Text style={s.p}>
            <Text style={{ fontWeight: "bold" }}>Règle du 5 % :</Text> le loyer convenu respecte le plafond de 5 % du capital investi
            réévalué (loi précitée, art. 3). Le capital investi est détaillé en annexe.
          </Text>
        </View>

        {/* 5. Indexation */}
        <View style={s.section}>
          <Text style={s.h2}>5. Indexation</Text>
          <Text style={s.p}>
            Le loyer peut être revu au maximum tous les deux ans selon l&apos;évolution de l&apos;
            {indexationReference}. Aucune indexation rétroactive ne peut être appliquée.
          </Text>
        </View>

        {/* 6. Garantie locative */}
        <View style={s.section}>
          <Text style={s.h2}>6. Garantie locative</Text>
          <Text style={s.p}>
            Le locataire verse une garantie locative d&apos;un montant de <Text style={{ fontWeight: "bold" }}>{formatEUR(deposit)}</Text>,
            soit {Math.round(deposit / (lot.loyerMensuelActuel || 1))} mois de loyer (maximum légal : 3 mois).
            Cette garantie est consignée sur un compte bancaire bloqué au nom du locataire,
            conformément à l&apos;article 5-1 de la loi précitée. Les intérêts produits appartiennent au locataire.
          </Text>
        </View>

        {/* 7. État des lieux */}
        <View style={s.section}>
          <Text style={s.h2}>7. État des lieux</Text>
          <Text style={s.p}>
            Un état des lieux contradictoire est dressé à l&apos;entrée et à la sortie du locataire. À défaut,
            le locataire est présumé avoir reçu le bien en bon état.
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
            Le locataire peut résilier le bail à tout moment moyennant un préavis de 3 mois.
            Le bailleur ne peut résilier un bail à durée indéterminée que pour les motifs légaux
            (occupation personnelle, non-paiement, manquement grave) et selon les procédures prévues.
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
                    Signé le {new Date(signedAtLandlord).toLocaleString("fr-LU", { dateStyle: "medium", timeStyle: "short" })}
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
                    Signé le {new Date(signedAtTenant).toLocaleString("fr-LU", { dateStyle: "medium", timeStyle: "short" })}
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

        {pdfHash && (
          <View style={{ marginTop: 20, padding: 8, backgroundColor: "#F8FAFC", borderRadius: 4 }}>
            <Text style={{ fontSize: 7, color: "#334155", fontWeight: "bold", marginBottom: 2 }}>
              Signature électronique simple (eIDAS art. 25 §1)
            </Text>
            <Text style={{ fontSize: 6, color: "#6B7280", fontFamily: "Courier" }}>
              Empreinte SHA-256 : {pdfHash}
            </Text>
            <Text style={{ fontSize: 6, color: "#6B7280" }}>
              Document émis via tevaxia.lu — toute modification ultérieure invalide l&apos;empreinte.
            </Text>
          </View>
        )}

        <Text style={s.warning}>
          ⚠ Ce modèle de bail est fourni à titre indicatif par tevaxia.lu. Il ne se substitue pas au conseil d&apos;un
          avocat ou d&apos;un notaire pour les cas spécifiques (bail commercial, colocation, meublé touristique).
          Vérifiez que le capital investi et le loyer respectent la règle des 5 % à la date de signature.
        </Text>
      </Page>
    </Document>
  );
}
