"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getMandate, type AgencyMandate } from "@/lib/agency-mandates";
import {
  listSignatureRequests, createSignatureRequest, markAsSent,
  cancelSignatureRequest, signingUrl, mailtoLink,
  STATUS_COLORS,
  type SignatureRequest, type SignatureDocumentType, type SignatureStatus,
} from "@/lib/agency-signatures";
import { errMsg } from "@/lib/errors";

const STATUS_KEY: Record<SignatureStatus, string> = {
  draft: "statusDraft",
  sent: "statusSent",
  viewed: "statusViewed",
  signed: "statusSigned",
  declined: "statusDeclined",
  expired: "statusExpired",
  cancelled: "statusCancelled",
};

const DOC_TYPE_KEY: Record<SignatureDocumentType, string> = {
  mandat: "docTypeMandat",
  avenant: "docTypeAvenant",
  compromis: "docTypeCompromis",
  bon_de_visite: "docTypeBonDeVisite",
  rapport_estimation: "docTypeRapportEstimation",
  autre: "docTypeAutre",
};

interface MandateBodyTexts {
  template: string;
  clientPlaceholder: string;
  propertyTypeMissing: string;
  priceTbd: string;
  durationUntil: string;
  durationTbd: string;
  exclusiveClause: string;
  dash: string;
}

function fillTemplate(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

function buildMandateBody(mandate: AgencyMandate, texts: MandateBodyTexts, dateLocale: string): string {
  const duration = mandate.start_date && mandate.end_date
    ? fillTemplate(texts.durationUntil, { date: new Date(mandate.end_date).toLocaleDateString(dateLocale) })
    : texts.durationTbd;
  const exclusiveClause = mandate.mandate_type === "exclusif" ? texts.exclusiveClause : "";
  const price = mandate.prix_demande
    ? mandate.prix_demande.toLocaleString(dateLocale) + " EUR"
    : texts.priceTbd;

  return fillTemplate(texts.template, {
    type: mandate.mandate_type.toUpperCase(),
    mandateType: mandate.mandate_type,
    client: mandate.client_name ?? texts.clientPlaceholder,
    address: mandate.property_address,
    commune: mandate.property_commune ?? "",
    propertyType: mandate.property_type ?? texts.propertyTypeMissing,
    surface: String(mandate.property_surface ?? texts.dash),
    price,
    commissionPct: String(mandate.commission_pct ?? texts.dash),
    duration,
    exclusiveClause,
    today: new Date().toLocaleDateString(dateLocale),
  });
}

export default function SignaturesPage() {
  const t = useTranslations("proaSignatures");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";

  const params = useParams<{ id: string }>();
  const mandateId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const [mandate, setMandate] = useState<AgencyMandate | null>(null);
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    document_type: SignatureDocumentType;
    document_title: string;
    document_body: string;
    signer_name: string;
    signer_email: string;
    signer_phone: string;
    expires_in_days: number;
  }>({
    document_type: "mandat",
    document_title: "",
    document_body: "",
    signer_name: "",
    signer_email: "",
    signer_phone: "",
    expires_in_days: 30,
  });

  const reload = useCallback(async () => {
    if (!mandateId) return;
    setLoading(true);
    try {
      const [m, r] = await Promise.all([
        getMandate(mandateId),
        listSignatureRequests({ mandateId }),
      ]);
      setMandate(m);
      setRequests(r);
      if (m && !form.document_body) {
        const mandateBodyTexts: MandateBodyTexts = {
          template: t("mandateBody"),
          clientPlaceholder: t("mandateClientPlaceholder"),
          propertyTypeMissing: t("mandatePropertyTypeMissing"),
          priceTbd: t("mandatePriceTbd"),
          durationUntil: t("mandateDurationUntil"),
          durationTbd: t("mandateDurationTbd"),
          exclusiveClause: t("mandateExclusiveClause"),
          dash: t("dash"),
        };
        setForm((f) => ({
          ...f,
          signer_name: m.client_name ?? "",
          signer_email: m.client_email ?? "",
          document_title: t("mandateTitleFmt", { type: m.mandate_type, address: m.property_address }),
          document_body: buildMandateBody(m, mandateBodyTexts, dateLocale),
        }));
      }
    } catch (e) {
      setError(errMsg(e, t("errGeneric")));
    }
    setLoading(false);
  }, [mandateId, form.document_body, t, dateLocale]);

  useEffect(() => { void reload(); }, [reload]);

  const handleCreate = async () => {
    if (!form.signer_name.trim() || !form.signer_email.trim()) {
      setError(t("errSignerRequired")); return;
    }
    if (!form.document_body.trim()) {
      setError(t("errBodyRequired")); return;
    }
    try {
      const req = await createSignatureRequest({
        mandate_id: mandateId ?? undefined,
        document_type: form.document_type,
        document_title: form.document_title,
        document_body: form.document_body,
        signer_name: form.signer_name,
        signer_email: form.signer_email,
        signer_phone: form.signer_phone || undefined,
        expires_in_days: form.expires_in_days,
      });
      await markAsSent(req.id);
      setShowForm(false);
      setFlash(t("flashCreated", { email: req.signer_email }));
      setError(null);
      await reload();
    } catch (e) {
      setError(errMsg(e, t("errGeneric")));
    }
  };

  const copyLink = async (req: SignatureRequest) => {
    const url = signingUrl(req.token);
    try {
      await navigator.clipboard.writeText(url);
      setFlash(t("flashLinkCopied", { url }));
    } catch {
      setFlash(t("flashLink", { url }));
    }
  };

  const cancel = async (req: SignatureRequest) => {
    if (!confirm(t("confirmCancel", { email: req.signer_email }))) return;
    await cancelSignatureRequest(req.id);
    await reload();
  };

  const buildMailto = (req: SignatureRequest): string =>
    mailtoLink(req, undefined, {
      subject: t("mailSubject"),
      body: t("mailBody"),
      dateLocale,
    });

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">{t("loginPrompt")}</Link></div>;
  if (!mandate) return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">{t("notFound")}</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/pro-agences/mandats" className="hover:text-navy">{t("crumbMandates")}</Link>
        <span>/</span>
        <Link href={`/pro-agences/mandats/${mandateId}`} className="hover:text-navy">{mandate.reference ?? mandate.id.slice(0, 8)}</Link>
        <span>/</span>
        <span className="text-navy">{t("crumbSignatures")}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted" dangerouslySetInnerHTML={{ __html: t("pageDesc") }} />
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
          {showForm ? t("btnCancel") : t("btnNewSignature")}
        </button>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}
      {flash && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{flash}</div>}

      {/* Formulaire */}
      {showForm && (
        <div className="mt-5 rounded-xl border border-navy/20 bg-navy/5 p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fieldDocType")}</div>
              <select value={form.document_type}
                onChange={(e) => setForm({ ...form, document_type: e.target.value as SignatureDocumentType })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                {(Object.keys(DOC_TYPE_KEY) as SignatureDocumentType[]).map((v) => (
                  <option key={v} value={v}>{t(DOC_TYPE_KEY[v])}</option>
                ))}
              </select>
            </label>
            <label className="text-xs sm:col-span-2">
              <div className="mb-1 font-semibold text-slate">{t("fieldTitle")}</div>
              <input type="text" value={form.document_title}
                onChange={(e) => setForm({ ...form, document_title: e.target.value })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fieldSignerName")}</div>
              <input type="text" value={form.signer_name}
                onChange={(e) => setForm({ ...form, signer_name: e.target.value })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fieldSignerEmail")}</div>
              <input type="email" value={form.signer_email}
                onChange={(e) => setForm({ ...form, signer_email: e.target.value })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fieldSignerPhone")}</div>
              <input type="tel" value={form.signer_phone}
                onChange={(e) => setForm({ ...form, signer_phone: e.target.value })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs sm:col-span-3">
              <div className="mb-1 font-semibold text-slate">{t("fieldDocBody")}</div>
              <textarea value={form.document_body}
                onChange={(e) => setForm({ ...form, document_body: e.target.value })}
                rows={16}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs font-mono" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fieldExpiresIn")}</div>
              <input type="number" value={form.expires_in_days} min={1} max={365}
                onChange={(e) => setForm({ ...form, expires_in_days: Number(e.target.value) })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
          </div>
          <button onClick={handleCreate}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            {t("btnCreate")}
          </button>
        </div>
      )}

      {/* Liste */}
      {requests.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("emptyRequests")}
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-card-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[r.status]}`}>
                      {t(STATUS_KEY[r.status])}
                    </span>
                    <span className="text-sm font-semibold text-navy">{r.document_title}</span>
                    <span className="text-[10px] text-muted">
                      {t(DOC_TYPE_KEY[r.document_type])}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {r.signer_name} · {r.signer_email}
                    {r.signer_phone && ` · ${r.signer_phone}`}
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-3 text-[10px] text-muted sm:grid-cols-4">
                    <span>{t("rowCreated", { date: new Date(r.created_at).toLocaleDateString(dateLocale) })}</span>
                    {r.sent_at && <span>{t("rowSent", { date: new Date(r.sent_at).toLocaleDateString(dateLocale) })}</span>}
                    {r.first_viewed_at && <span>{t("rowViewed", { date: new Date(r.first_viewed_at).toLocaleDateString(dateLocale) })}</span>}
                    {r.signed_at && <span className="text-emerald-700 font-semibold">{t("rowSigned", { date: new Date(r.signed_at).toLocaleDateString(dateLocale) })}</span>}
                    <span>{t("rowExpires", { date: new Date(r.expires_at).toLocaleDateString(dateLocale) })}</span>
                  </div>
                  {r.signer_ip && (
                    <div className="mt-2 rounded bg-background px-2 py-1 text-[10px] font-mono text-muted">
                      {t("rowProof", { ip: r.signer_ip, ua: r.signer_user_agent?.slice(0, 50) ?? t("dash") })}
                    </div>
                  )}
                  {r.declined_reason && (
                    <div className="mt-2 rounded bg-rose-50 px-2 py-1 text-[11px] text-rose-900">
                      {t("rowDeclineReason", { reason: r.declined_reason })}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {["draft", "sent", "viewed"].includes(r.status) && (
                    <>
                      <button onClick={() => copyLink(r)}
                        className="rounded-lg border border-navy bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5">
                        {t("btnCopyLink")}
                      </button>
                      <a href={buildMailto(r)}
                        className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
                        {t("btnEmail")}
                      </a>
                      <button onClick={() => cancel(r)}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                        {t("btnCancel")}
                      </button>
                    </>
                  )}
                  <a href={signingUrl(r.token)} target="_blank" rel="noopener noreferrer"
                    className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-semibold text-slate hover:bg-background">
                    {t("btnOpen")}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900"
        dangerouslySetInnerHTML={{ __html: t("eidasNotice") }}
      />
    </div>
  );
}
