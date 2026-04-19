"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const pdfStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#0B2447" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 10, color: "#475569", marginBottom: 12 },
  h2: { fontSize: 12, fontWeight: "bold", marginTop: 12, marginBottom: 4 },
  row: { flexDirection: "row", paddingVertical: 2 },
  label: { width: "40%", color: "#475569" },
  value: { width: "60%", fontWeight: "bold" },
  box: { backgroundColor: "#EFF6FF", padding: 8, marginVertical: 6 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#6B7280", textAlign: "center" },
});

interface EuRegistryForm {
  hostName: string;
  hostAddress: string;
  hostEmail: string;
  hostPhone: string;
  hostTaxId: string; // numéro fiscal LU
  propertyAddress: string;
  propertyCommune: string;
  propertyType: "apartment" | "house" | "room";
  maxCapacity: number;
  surface: number;
  isPrimaryResidence: boolean;
  platforms: string[]; // Airbnb, Booking, Vrbo, direct
  expectedNightsPerYear: number;
  businessRegistrationLU: string; // Numéro RCSL si société
}

function EuRegistryPdf({ form, registrationNumber }: { form: EuRegistryForm; registrationNumber: string }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Déclaration d&apos;enregistrement — Registre EU Locations Courte Durée</Text>
        <Text style={pdfStyles.subtitle}>
          Règlement (UE) 2024/1028 du Parlement européen et du Conseil concernant la collecte et le partage de données
          relatives aux services de location de logements de courte durée. Entrée en vigueur : mi-2026.
        </Text>

        <View style={pdfStyles.box}>
          <Text style={{ fontSize: 11, fontWeight: "bold" }}>Numéro d&apos;identification pré-rempli : {registrationNumber}</Text>
          <Text style={{ fontSize: 9, marginTop: 2 }}>
            Ce numéro devra être affiché sur toutes vos annonces (Airbnb, Booking, Vrbo). À valider par votre commune lors du dépôt.
          </Text>
        </View>

        <Text style={pdfStyles.h2}>1. Identité du propriétaire/exploitant</Text>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Nom complet</Text><Text style={pdfStyles.value}>{form.hostName}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Adresse</Text><Text style={pdfStyles.value}>{form.hostAddress}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Email</Text><Text style={pdfStyles.value}>{form.hostEmail}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Téléphone</Text><Text style={pdfStyles.value}>{form.hostPhone}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>N° fiscal LU</Text><Text style={pdfStyles.value}>{form.hostTaxId}</Text></View>
        {form.businessRegistrationLU && (
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>RCSL (si société)</Text><Text style={pdfStyles.value}>{form.businessRegistrationLU}</Text></View>
        )}

        <Text style={pdfStyles.h2}>2. Le logement</Text>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Adresse</Text><Text style={pdfStyles.value}>{form.propertyAddress}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Commune</Text><Text style={pdfStyles.value}>{form.propertyCommune}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Type</Text><Text style={pdfStyles.value}>{form.propertyType}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Surface</Text><Text style={pdfStyles.value}>{form.surface} m²</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Capacité max</Text><Text style={pdfStyles.value}>{form.maxCapacity} voyageurs</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Résidence principale</Text><Text style={pdfStyles.value}>{form.isPrimaryResidence ? "Oui" : "Non"}</Text></View>

        <Text style={pdfStyles.h2}>3. Exploitation</Text>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Plateformes de distribution</Text><Text style={pdfStyles.value}>{form.platforms.join(", ") || "—"}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Nuitées prévues/an</Text><Text style={pdfStyles.value}>{form.expectedNightsPerYear}</Text></View>
        {form.expectedNightsPerYear > 90 && (
          <View style={pdfStyles.box}>
            <Text style={{ color: "#B91C1C", fontWeight: "bold" }}>⚠ Dépassement 90 jours — licence d&apos;hébergement LU obligatoire</Text>
            <Text style={{ fontSize: 9 }}>Voir /str/compliance pour la procédure de demande auprès du Ministère du Tourisme.</Text>
          </View>
        )}

        <Text style={pdfStyles.h2}>4. Déclaration et conformité</Text>
        <Text style={{ fontSize: 9 }}>
          Je certifie que les informations fournies sont exactes. Je m&apos;engage à tenir à jour ces données, à afficher
          le numéro d&apos;identification sur toutes mes annonces, et à autoriser la transmission des nuitées aux autorités
          compétentes conformément au Règlement (UE) 2024/1028.
        </Text>

        <View style={{ marginTop: 20, flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ width: "45%", borderTop: "1 solid #334155", paddingTop: 4 }}>
            <Text style={{ fontSize: 9 }}>Date et signature</Text>
          </View>
        </View>

        <Text style={pdfStyles.footer}>
          Document généré par tevaxia.lu — À soumettre à votre commune pour obtention du numéro d&apos;enregistrement officiel
        </Text>
      </Page>
    </Document>
  );
}

function generateRegistrationNumber(form: EuRegistryForm): string {
  // Format : LU-[CommuneCode]-[YYMM]-[Hash]
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const communeCode = form.propertyCommune.slice(0, 3).toUpperCase();
  const rawKey = `${form.hostName}${form.propertyAddress}`;
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    hash = ((hash << 5) - hash) + rawKey.charCodeAt(i);
    hash |= 0;
  }
  const hashStr = Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
  return `LU-${communeCode}-${year}${month}-${hashStr}`;
}

const PLATFORMS = ["Airbnb", "Booking.com", "Vrbo", "Expedia", "Direct"];

export default function EuRegistryPage() {
  const t = useTranslations("strComplianceEu");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [form, setForm] = useState<EuRegistryForm>({
    hostName: "",
    hostAddress: "",
    hostEmail: "",
    hostPhone: "",
    hostTaxId: "",
    propertyAddress: "",
    propertyCommune: "Luxembourg",
    propertyType: "apartment",
    maxCapacity: 2,
    surface: 50,
    isPrimaryResidence: false,
    platforms: ["Airbnb"],
    expectedNightsPerYear: 60,
    businessRegistrationLU: "",
  });

  const registrationNumber = useMemo(() => generateRegistrationNumber(form), [form]);

  const togglePlatform = (p: string) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p],
    }));
  };

  const downloadPdf = async () => {
    const blob = await pdf(<EuRegistryPdf form={form} registrationNumber={registrationNumber} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registre-eu-str-${registrationNumber}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/str`} className="text-xs text-muted hover:text-navy">&larr; {t("back")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5 mb-6">
          <div className="text-xs uppercase tracking-wider text-blue-700">{t("regNumber.label")}</div>
          <div className="mt-1 text-2xl font-bold font-mono text-blue-900">{registrationNumber}</div>
          <p className="mt-1 text-xs text-blue-800">{t("regNumber.note")}</p>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy mb-4">{t("section1")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })}
                placeholder={t("fields.hostName")} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="email" value={form.hostEmail} onChange={(e) => setForm({ ...form, hostEmail: e.target.value })}
                placeholder={t("fields.hostEmail")} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="text" value={form.hostAddress} onChange={(e) => setForm({ ...form, hostAddress: e.target.value })}
                placeholder={t("fields.hostAddress")} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="tel" value={form.hostPhone} onChange={(e) => setForm({ ...form, hostPhone: e.target.value })}
                placeholder={t("fields.hostPhone")} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="text" value={form.hostTaxId} onChange={(e) => setForm({ ...form, hostTaxId: e.target.value })}
                placeholder={t("fields.hostTaxId")} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="text" value={form.businessRegistrationLU} onChange={(e) => setForm({ ...form, businessRegistrationLU: e.target.value })}
                placeholder={t("fields.rcsl")} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy mb-4">{t("section2")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" value={form.propertyAddress} onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })}
                placeholder={t("fields.propertyAddress")} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm sm:col-span-2" />
              <input type="text" value={form.propertyCommune} onChange={(e) => setForm({ ...form, propertyCommune: e.target.value })}
                placeholder={t("fields.propertyCommune")} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value as EuRegistryForm["propertyType"] })}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                <option value="apartment">{t("propertyTypes.apartment")}</option>
                <option value="house">{t("propertyTypes.house")}</option>
                <option value="room">{t("propertyTypes.room")}</option>
              </select>
              <input type="number" value={form.surface} onChange={(e) => setForm({ ...form, surface: Number(e.target.value) })}
                placeholder={t("fields.surface")} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: Number(e.target.value) })}
                placeholder={t("fields.maxCapacity")} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={form.isPrimaryResidence}
                  onChange={(e) => setForm({ ...form, isPrimaryResidence: e.target.checked })} />
                {t("fields.primaryResidence")}
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy mb-4">{t("section3")}</h2>
            <div>
              <label className="block text-sm font-medium text-slate mb-2">{t("fields.platforms")}</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p} onClick={() => togglePlatform(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${form.platforms.includes(p) ? "bg-navy text-white" : "border border-card-border bg-background text-muted"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate mb-1">{t("fields.nightsPlanned")}</label>
              <input type="number" value={form.expectedNightsPerYear}
                onChange={(e) => setForm({ ...form, expectedNightsPerYear: Number(e.target.value) })}
                className="w-full sm:w-48 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              {form.expectedNightsPerYear > 90 && (
                <p className="mt-2 text-xs text-rose-700">
                  ⚠ {t("warnLicense")}{" "}
                  <Link href={`${lp}/str/compliance`} className="underline">{t("seeCompliance")}</Link>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <strong>{t("timing.label")}</strong> {t("timing.body")}
          </div>

          <div className="flex gap-2">
            <button onClick={downloadPdf}
              disabled={!form.hostName || !form.propertyAddress}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-40">
              📄 {t("downloadPdf")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
