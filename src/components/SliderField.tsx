"use client";

import { useState, useRef, useEffect, useId } from "react";

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  hint?: string;
  formatValue?: (v: number) => string;
}

function defaultFormat(v: number, suffix?: string): string {
  const s = suffix?.trim();
  if (s === "€") {
    return v >= 1000
      ? `${Math.round(v).toLocaleString("fr-FR")} €`
      : `${v} €`;
  }
  if (s === "%") {
    return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
  }
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}${s ? ` ${s}` : ""}`;
}

export default function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  hint,
  formatValue,
}: SliderFieldProps) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const display = formatValue ? formatValue(value) : defaultFormat(value, suffix);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commitEdit() {
    const parsed = parseFloat(editText.replace(/\s/g, "").replace(",", "."));
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      // Round to step precision
      const precision = step < 1 ? String(step).split(".")[1]?.length ?? 0 : 0;
      const rounded = parseFloat((Math.round(clamped / step) * step).toFixed(precision));
      onChange(rounded);
    }
    setEditing(false);
  }

  // Percentage through the range for the filled track
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate">{label}</label>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-28 rounded-md border border-navy bg-input-bg px-2 py-0.5 text-right text-sm font-semibold text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditText(String(value));
              setEditing(true);
            }}
            className="cursor-text rounded-md px-2 py-0.5 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
            title="Cliquer pour saisir une valeur"
          >
            {display}
          </button>
        )}
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          aria-valuetext={display}
          className="slider-field w-full"
          style={
            {
              "--slider-pct": `${pct}%`,
            } as React.CSSProperties
          }
        />
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between text-[10px] text-muted leading-none">
        <span>{formatValue ? formatValue(min) : defaultFormat(min, suffix)}</span>
        <span>{formatValue ? formatValue(max) : defaultFormat(max, suffix)}</span>
      </div>

      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
