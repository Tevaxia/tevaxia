"use client";

interface InputFieldProps {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  type?: "number" | "text" | "select";
  suffix?: string;
  prefix?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  className?: string;
}

export default function InputField({
  label,
  value,
  onChange,
  type = "number",
  suffix,
  prefix,
  hint,
  min,
  max,
  step,
  options,
  className = "",
}: InputFieldProps) {
  if (type === "select" && options) {
    return (
      <div className={`space-y-1 ${className}`}>
        <label className="block text-sm font-medium text-slate">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-foreground shadow-sm transition-colors focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-slate">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          className={`w-full rounded-lg border border-input-border bg-input-bg py-2.5 text-sm text-foreground shadow-sm transition-colors focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 ${
            prefix ? "pl-8" : "px-3"
          } ${suffix ? "pr-12" : "pr-3"}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
