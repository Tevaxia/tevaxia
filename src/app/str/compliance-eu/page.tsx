"use client";

import { useState } from "react";
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
  operatorNightsPerYear: number; // All units of this operator, in the annual reference period.
  businessRegistrationLU: string; // Numéro RCSL si société
}

function EuRegistryPdf({ form, t }: { form: EuRegistryForm; t: (key: string) => string }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{t("title")}</Text>
        <Text style={pdfStyles.subtitle}>{t("subtitle")}</Text>

        <View style={pdfStyles.box}>
          <Text style={{ fontSize: 11, fontWeight: "bold" }}>{t("regNumber.label")}</Text>
          <Text style={{ fontSize: 9, marginTop: 2 }}>{t("regNumber.note")}</Text>
        </View>

        <Text style={pdfStyles.h2}>{t("section1")}</Text>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.hostName")}</Text><Text style={pdfStyles.value}>{form.hostName}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.hostAddress")}</Text><Text style={pdfStyles.value}>{form.hostAddress}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.hostEmail")}</Text><Text style={pdfStyles.value}>{form.hostEmail}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.hostPhone")}</Text><Text style={pdfStyles.value}>{form.hostPhone}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.hostTaxId")}</Text><Text style={pdfStyles.value}>{form.hostTaxId}</Text></View>
        {form.businessRegistrationLU && (
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.rcsl")}</Text><Text style={pdfStyles.value}>{form.businessRegistrationLU}</Text></View>
        )}

        <Text style={pdfStyles.h2}>{t("section2")}</Text>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.propertyAddress")}</Text><Text style={pdfStyles.value}>{form.propertyAddress}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.propertyCommune")}</Text><Text style={pdfStyles.value}>{form.propertyCommune}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.propertyType")}</Text><Text style={pdfStyles.value}>{t(`propertyTypes.${form.propertyType}`)}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.surface")}</Text><Text style={pdfStyles.value}>{form.surface}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.maxCapacity")}</Text><Text style={pdfStyles.value}>{form.maxCapacity}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.primaryResidence")}</Text><Text style={pdfStyles.value}>{t(form.isPrimaryResidence ? "yes" : "no")}</Text></View>

        <Text style={pdfStyles.h2}>{t("section3")}</Text>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.platforms")}</Text><Text style={pdfStyles.value}>{form.platforms.join(", ") || "—"}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>{t("fields.nightsPlanned")}</Text><Text style={pdfStyles.value}>{form.operatorNightsPerYear}</Text></View>
        {form.operatorNightsPerYear >= 90 && (
          <View style={pdfStyles.box}>
            <Text style={{ color: "#B91C1C", fontWeight: "bold" }}>{t("warnLicense")}</Text>
          </View>
        )}

        <Text style={pdfStyles.h2}>{t("reviewTitle")}</Text>
        <Text style={{ fontSize: 9 }}>{t("reviewBody")}</Text>
        <Text style={pdfStyles.h2}>{t("timing.label")}</Text>
        <Text style={{ fontSize: 9 }}>{t("timing.body")}</Text>
        <Text style={pdfStyles.footer}>{t("pdfFooter")}</Text>
      </Page>
    </Document>
  );
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
    operatorNightsPerYear: 60,
    businessRegistrationLU: "",
  });

  const [pdfError, setPdfError] = useState(false);
  const [busy, setBusy] = useState(false);
  const valid = form.hostName.trim() && form.propertyAddress.trim()
    && Number.isFinite(form.surface) && form.surface > 0
    && Number.isInteger(form.maxCapacity) && form.maxCapacity > 0
    && Number.isInteger(form.operatorNightsPerYear) && form.operatorNightsPerYear >= 0;

  const togglePlatform = (p: string) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p],
    }));
  };

  const downloadPdf = async () => {
    if (!valid || busy) return;
    setBusy(true); setPdfError(false);
    try {
      const blob = await pdf(<EuRegistryPdf form={form} t={key => t(key)} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tevaxia-str-dossier-preparatoire.pdf";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setPdfError(true); }
    finally { setBusy(false); }
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
              <input type="number" min="0" value={form.surface} onChange={(e) => setForm({ ...form, surface: Number(e.target.value) })}
                placeholder={t("fields.surface")} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" min="1" step="1" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: Number(e.target.value) })}
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
              <label htmlFor="operator-nights" className="block text-sm font-medium text-slate mb-1">{t("fields.nightsPlanned")}</label>
              <input id="operator-nights" type="number" min="0" step="1" value={form.operatorNightsPerYear}
                onChange={(e) => setForm({ ...form, operatorNightsPerYear: Number(e.target.value) })}
                className="w-full sm:w-48 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              {form.operatorNightsPerYear >= 90 && (
                <p role="status" className="mt-2 text-xs text-rose-700">
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
              disabled={!valid || busy} aria-busy={busy}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-40">
              📄 {t("downloadPdf")}
            </button>
          </div>
          {pdfError && <p role="alert" className="text-sm text-rose-700">{t("pdfFailed")}</p>}
        </div>
      </div>
    </div>
  );
}
