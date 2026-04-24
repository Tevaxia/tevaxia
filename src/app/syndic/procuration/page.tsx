"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import { generateProcurationPdfBlob } from "@/components/ProcurationPdf";

export default function ProcurationPage() {
  const t = useTranslations("syndicProc");
  const [coownershipName, setCoownershipName] = useState("");
  const [coownershipAddress, setCoownershipAddress] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const [unitTantiemes, setUnitTantiemes] = useState(0);
  const [ownerName, setOwnerName] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [mandataireName, setMandataireName] = useState("");
  const [mandataireAddress, setMandataireAddress] = useState("");
  const [assemblyDate, setAssemblyDate] = useState(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const [assemblyType, setAssemblyType] = useState<"ordinaire" | "extraordinaire">("ordinaire");
  const [assemblyLocation, setAssemblyLocation] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!coownershipName || !ownerName || !mandataireName || !assemblyLocation) {
      alert(t("alertMissing"));
      return;
    }
    setGenerating(true);
    try {
      const blob = await generateProcurationPdfBlob({
        coownershipName,
        coownershipAddress: coownershipAddress || undefined,
        unitLabel: unitLabel || undefined,
        unitTantiemes: unitTantiemes || undefined,
        ownerName,
        ownerAddress: ownerAddress || undefined,
        mandataireName,
        mandataireAddress: mandataireAddress || undefined,
        assemblyDate,
        assemblyType,
        assemblyLocation,
        issuedDate: new Date().toISOString().slice(0, 10),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `procuration-AG-${coownershipName.replace(/[^a-z0-9]/gi, "_")}-${assemblyDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/syndic" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">{t("pageTitle")}</h1>
      <p className="mt-1 text-sm text-muted">
        {t("pageSubtitle")}
      </p>

      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-base font-semibold text-navy mb-3">{t("mandantTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label={t("inputName")} type="text" value={ownerName} onChange={setOwnerName} />
            <InputField label={t("inputAddress")} type="text" value={ownerAddress} onChange={setOwnerAddress} />
            <InputField label={t("inputLot")} type="text" value={unitLabel} onChange={setUnitLabel} hint={t("inputLotHint")} />
            <InputField label={t("inputTantiemes")} value={unitTantiemes} onChange={(v) => setUnitTantiemes(Number(v))} min={0} max={10000} />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-base font-semibold text-navy mb-3">{t("mandataireTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label={t("inputName")} type="text" value={mandataireName} onChange={setMandataireName} hint={t("inputMandataireNameHint")} />
            <InputField label={t("inputAddress")} type="text" value={mandataireAddress} onChange={setMandataireAddress} />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-base font-semibold text-navy mb-3">{t("copropTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label={t("inputCoprop")} type="text" value={coownershipName} onChange={setCoownershipName} />
            <InputField label={t("inputAddress")} type="text" value={coownershipAddress} onChange={setCoownershipAddress} />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-base font-semibold text-navy mb-3">{t("agTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label={t("inputAgDate")} type="text" value={assemblyDate} onChange={setAssemblyDate} hint={t("dateHint")} />
            <InputField
              label={t("inputType")}
              type="select"
              value={assemblyType}
              onChange={(v) => setAssemblyType(v as "ordinaire" | "extraordinaire")}
              options={[
                { value: "ordinaire", label: t("typeOrdinaire") },
                { value: "extraordinaire", label: t("typeExtra") },
              ]}
            />
            <InputField label={t("inputPlace")} type="text" value={assemblyLocation} onChange={setAssemblyLocation} hint={t("inputPlaceHint")} />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
        >
          {generating ? t("generating") : t("downloadBtn")}
        </button>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>{t("warningStrong")}</strong> {t("warningBody")}
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>{t("legalStrong")}</strong> {t("legalBody")}
        </div>
      </div>
    </div>
  );
}
