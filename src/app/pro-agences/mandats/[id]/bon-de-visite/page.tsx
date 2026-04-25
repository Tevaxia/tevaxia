"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import { getMandate, type AgencyMandate } from "@/lib/agency-mandates";
import VisitReceiptPdf from "@/components/VisitReceiptPdf";
import { getProfile } from "@/lib/profile";
import { logInteraction } from "@/lib/crm/interactions";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

export default function BonDeVisitePage() {
  const t = useTranslations("proaVisitSlip");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";

  const params = useParams<{ id: string }>();
  const mandateId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const [mandate, setMandate] = useState<AgencyMandate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const now = new Date();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    id_number: "",
    date: now.toISOString().slice(0, 10),
    time: `${String(now.getHours()).padStart(2, "0")}:${String(Math.floor(now.getMinutes() / 15) * 15).padStart(2, "0")}`,
    duration_minutes: 45,
    notes: "",
  });

  const reload = useCallback(async () => {
    if (!mandateId) return;
    setLoading(true);
    try {
      const m = await getMandate(mandateId);
      setMandate(m);
    } catch (e) {
      setError(errMsg(e));
    }
    setLoading(false);
  }, [mandateId]);

  useEffect(() => { void reload(); }, [reload]);

  const downloadAndLog = async () => {
    if (!mandate || !mandateId) return;
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError(t("errVisitorRequired"));
      return;
    }
    try {
      const profile = getProfile();
      const blob = await pdf(
        <VisitReceiptPdf
          agency={{
            name: profile.societe || profile.nomComplet || t("defaultAgencyName"),
            address: profile.adresse,
            agent_name: profile.nomComplet,
            email: profile.email,
            phone: profile.telephone,
          }}
          buyer={{
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email || undefined,
            phone: form.phone || undefined,
            id_number: form.id_number || undefined,
          }}
          property={{
            address: mandate.property_address,
            commune: mandate.property_commune,
            type: mandate.property_type,
            surface_m2: mandate.property_surface,
            reference: mandate.reference,
            price: mandate.prix_demande,
          }}
          visit={{
            date: form.date,
            time: form.time,
            duration_minutes: form.duration_minutes,
            notes: form.notes || undefined,
          }}
          labels={{
            docTitle: t("pdfDocTitle"),
            title: t("pdfTitle"),
            subtitle: t("pdfSubtitle"),
            refPrefix: t("pdfRefPrefix"),
            sectionVisitor: t("pdfSectionVisitor"),
            labelName: t("pdfLabelName"),
            labelEmail: t("pdfLabelEmail"),
            labelPhone: t("pdfLabelPhone"),
            labelId: t("pdfLabelId"),
            sectionProperty: t("pdfSectionProperty"),
            labelAddress: t("pdfLabelAddress"),
            labelCommune: t("pdfLabelCommune"),
            labelType: t("pdfLabelType"),
            labelSurface: t("pdfLabelSurface"),
            labelPrice: t("pdfLabelPrice"),
            sectionVisit: t("pdfSectionVisit"),
            labelDate: t("pdfLabelDate"),
            labelTime: t("pdfLabelTime"),
            timeFormat: t("pdfTimeFormat"),
            labelAgent: t("pdfLabelAgent"),
            labelObservations: t("pdfLabelObservations"),
            legal: t("pdfLegal"),
            sigVisitor: t("pdfSigVisitor"),
            sigVisitorRead: t("pdfSigVisitorRead"),
            sigAgent: t("pdfSigAgent"),
            sigLabel: t("pdfSigLabel"),
            footer: t("pdfFooter"),
            dateLocale,
          }}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = t("fileName", { name: form.last_name.toLowerCase(), date: form.date });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log in CRM timeline
      await logInteraction({
        mandateId,
        type: "visit",
        direction: "internal",
        subject: t("visitInteractionSubject", { firstName: form.first_name, lastName: form.last_name }),
        body: t("visitInteractionBody", {
          date: form.date,
          time: form.time,
          duration: form.duration_minutes,
          notes: form.notes ? "\n\n" + form.notes : "",
        }),
      });

      setFlash(t("flashSuccess"));
      setTimeout(() => setFlash(null), 4000);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">{t("loginPrompt")}</Link></div>;
  if (!mandate) return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">{t("notFound")}</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/pro-agences/mandats" className="hover:text-navy">{t("crumbMandates")}</Link>
        <span>/</span>
        <Link href={`/pro-agences/mandats/${mandateId}`} className="hover:text-navy">
          {mandate.reference ?? mandate.id.slice(0, 8)}
        </Link>
        <span>/</span>
        <span className="text-navy">{t("crumbVisitSlip")}</span>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-navy">{t("pageTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("pageDesc")}</p>

      {/* Rappel bien */}
      <div className="mt-4 rounded-xl border border-card-border bg-card p-4 text-xs">
        <div className="font-semibold text-navy">{mandate.property_address}</div>
        <div className="mt-1 flex flex-wrap gap-3 text-muted">
          <span>{mandate.property_commune ?? "—"}</span>
          <span>·</span>
          <span>{mandate.property_type ?? "—"}</span>
          {mandate.property_surface && <><span>·</span><span>{mandate.property_surface} m²</span></>}
          {mandate.prix_demande && <><span>·</span><span className="font-mono">{formatEUR(Number(mandate.prix_demande))}</span></>}
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}
      {flash && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{flash}</div>}

      {/* Formulaire visiteur */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{t("sectionVisitor")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("fieldFirstName")} value={form.first_name}
            onChange={(v) => setForm({ ...form, first_name: v })} />
          <Field label={t("fieldLastName")} value={form.last_name}
            onChange={(v) => setForm({ ...form, last_name: v })} />
          <Field label={t("fieldEmail")} type="email" value={form.email}
            onChange={(v) => setForm({ ...form, email: v })} />
          <Field label={t("fieldPhone")} type="tel" value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })} />
          <div className="sm:col-span-2">
            <Field label={t("fieldIdNumber")} value={form.id_number}
              onChange={(v) => setForm({ ...form, id_number: v })} />
          </div>
        </div>

        <h2 className="text-sm font-bold uppercase tracking-wider text-navy pt-3 border-t border-card-border">
          {t("sectionVisit")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t("fieldDate")} type="date" value={form.date}
            onChange={(v) => setForm({ ...form, date: v })} />
          <Field label={t("fieldTime")} type="time" value={form.time}
            onChange={(v) => setForm({ ...form, time: v })} />
          <Field label={t("fieldDuration")} type="number" value={String(form.duration_minutes)}
            onChange={(v) => setForm({ ...form, duration_minutes: Number(v) || 0 })} />
          <div className="sm:col-span-3">
            <label className="block text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fieldNotes")}</div>
              <textarea value={form.notes} rows={3}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t("notesPlaceholder")}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-card-border">
          <Link href={`/pro-agences/mandats/${mandateId}`}
            className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-semibold text-slate hover:bg-background">
            {t("btnCancel")}
          </Link>
          <button onClick={downloadAndLog}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            {t("btnGenerate")}
          </button>
        </div>
      </section>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("bestPracticesTitle")}</strong>
        <ul className="mt-1 ml-4 list-disc space-y-0.5">
          <li>{t("bestPractice1")}</li>
          <li>{t("bestPractice2")}</li>
          <li>{t("bestPractice3")}</li>
          <li>{t("bestPractice4")}</li>
        </ul>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "tel" | "date" | "time" | "number";
}) {
  return (
    <label className="block text-xs">
      <div className="mb-1 font-semibold text-slate">{label}</div>
      <input type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
    </label>
  );
}
