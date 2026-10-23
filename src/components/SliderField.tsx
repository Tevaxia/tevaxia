"use client";

import { useState, useRef, useEffect, useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { validateLocalizedNumber } from "@/lib/localized-number";

interface SliderFieldProps {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number;
  suffix?: string; hint?: string; formatValue?: (v: number) => string;
}

export default function SliderField({ label, value, onChange, min, max, step, suffix, hint, formatValue }: SliderFieldProps) {
  const id = useId(), locale = useLocale(), t = useTranslations("numberInput");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState<"format" | "range" | "step" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null), editButton = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);
  const number = (v: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 12 }).format(v);
  const format = (v: number) => formatValue ? formatValue(v) : `${number(v)}${suffix?.trim() ? ` ${suffix.trim()}` : ""}`;
  const display = format(value);

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  function commitEdit() {
    if (finished.current) return;
    const result = validateLocalizedNumber(editText, locale, min, max, step);
    if (result.error) { setError(result.error); return; }
    finished.current = true;
    onChange(result.value);
    setEditing(false);
    setError(null);
  }

  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium text-slate">{label}</label>
        {editing ? (
          <input
            ref={inputRef} type="text" inputMode="decimal" value={editText}
            aria-labelledby={`${id}-label`} aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-format${error ? ` ${id}-error` : ""}`}
            onChange={e => { setEditText(e.target.value); setError(null); }}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
              if (e.key === "Escape") { e.preventDefault(); finished.current = true; setError(null); setEditing(false); requestAnimationFrame(() => editButton.current?.focus()); }
            }}
            className="w-32 rounded-md border border-navy bg-input-bg px-2 py-0.5 text-right text-sm font-semibold text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        ) : (
          <button ref={editButton} type="button" aria-label={t("edit", { label, value: display })}
            onClick={() => { finished.current = false; setEditText(number(value)); setError(null); setEditing(true); }}
            className="cursor-text rounded-md px-2 py-0.5 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
            title={t("editHint")}>{display}</button>
        )}
      </div>
      {editing && <p id={`${id}-format`} className="text-xs text-muted">{t("formatHint", { example: number(1234.5) })}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-rose-700">{t(error, { min: number(min), max: number(max), step: number(step) })}</p>}
      <div className="relative">
        <input id={id} type="range" min={min} max={max} step={step} value={value}
          onChange={e => { finished.current = true; setEditing(false); setError(null); onChange(Number(e.target.value)); }}
          aria-valuetext={display} aria-describedby={hint ? `${id}-hint` : undefined}
          className="slider-field w-full" style={{ "--slider-pct": `${pct}%` } as React.CSSProperties} />
      </div>
      <div className="flex justify-between text-[10px] text-muted leading-none"><span>{format(min)}</span><span>{format(max)}</span></div>
      {hint && <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
