"use client";

import { useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { DEMO_LIMITS, type DemoProduct } from "@/lib/demo-request";

export interface DemoFormLabels {
  name: string;
  company: string;
  email: string;
  phone: string;
  size: string;
  message: string;
  optional: string;
  submit: string;
  sending: string;
  successTitle: string;
  successText: string;
  errorInvalid: string;
  errorRateLimited: string;
  errorUnavailable: string;
  fallback: string;
  mailSubject: string;
}

type Status = "idle" | "sending" | "sent" | "invalid" | "rate_limited" | "unavailable";

const CONTACT = "contact@tevaxia.lu";
const field = "mt-1 w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-navy shadow-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy";

/** Formulaire court « Demander une démonstration ». Les libellés viennent du
 * composant serveur parent ; la demande part vers `/api/demo-request`. Si
 * l'enregistrement échoue, le visiteur garde une adresse où écrire. */
export default function DemoRequestForm({ product, locale, labels }: { product: DemoProduct; locale: string; labels: DemoFormLabels }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "");
    setStatus("sending");
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product, locale, page: pathname,
          name: value("name"), company: value("company"), email: value("email"),
          phone: value("phone"), size: value("size"), message: value("message"), website: value("website"),
        }),
      });
      setStatus(res.ok ? "sent" : res.status === 400 ? "invalid" : res.status === 429 ? "rate_limited" : "unavailable");
    } catch {
      setStatus("unavailable");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-lg font-semibold text-emerald-900">{labels.successTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">{labels.successText}</p>
      </div>
    );
  }

  const error = status === "invalid" ? labels.errorInvalid : status === "rate_limited" ? labels.errorRateLimited : status === "unavailable" ? labels.errorUnavailable : null;
  const optional = <span className="font-normal text-muted"> ({labels.optional})</span>;

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-card-border bg-card p-5 sm:p-6" data-demo-form={product}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          {labels.name}
          <input name="name" type="text" required minLength={2} maxLength={DEMO_LIMITS.name} autoComplete="name" className={field} />
        </label>
        <label className="block text-sm font-medium text-navy">
          {labels.email}
          <input name="email" type="email" required maxLength={DEMO_LIMITS.email} autoComplete="email" className={field} />
        </label>
        <label className="block text-sm font-medium text-navy">
          {labels.company}{optional}
          <input name="company" type="text" maxLength={DEMO_LIMITS.company} autoComplete="organization" className={field} />
        </label>
        <label className="block text-sm font-medium text-navy">
          {labels.phone}{optional}
          <input name="phone" type="tel" maxLength={DEMO_LIMITS.phone} autoComplete="tel" className={field} />
        </label>
        <label className="block text-sm font-medium text-navy sm:col-span-2">
          {labels.size}{optional}
          <input name="size" type="text" maxLength={DEMO_LIMITS.size} className={field} />
        </label>
        <label className="block text-sm font-medium text-navy sm:col-span-2">
          {labels.message}{optional}
          <textarea name="message" rows={3} maxLength={DEMO_LIMITS.message} className={field} />
        </label>
      </div>
      {/* Champ piège : masqué aux visiteurs et aux lecteurs d'écran. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === "sending"} className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60">
          {status === "sending" ? labels.sending : labels.submit}
        </button>
        <p role="alert" className="min-h-5 text-sm text-rose-700">
          {error}
          {error && status !== "invalid" && (
            <> {labels.fallback}{" "}
              <a className="font-medium underline" href={`mailto:${CONTACT}?subject=${encodeURIComponent(labels.mailSubject)}`}>{CONTACT}</a>
            </>
          )}
        </p>
      </div>
    </form>
  );
}
