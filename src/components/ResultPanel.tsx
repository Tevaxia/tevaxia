interface ResultLineProps {
  label: string;
  value: string;
  highlight?: boolean;
  large?: boolean;
  sub?: boolean;
  warning?: boolean;
}

function ResultLine({ label, value, highlight, large, sub, warning }: ResultLineProps) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        highlight ? "border-t-2 border-gold pt-3" : sub ? "pl-4" : ""
      } ${large ? "text-lg" : "text-sm"}`}
    >
      <span className={`${sub ? "text-muted" : "text-slate"} ${highlight ? "font-semibold" : ""}`}>
        {label}
      </span>
      <span
        className={`font-mono font-semibold ${
          warning ? "text-warning" : highlight ? "text-navy" : "text-foreground"
        } ${large ? "text-xl" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

interface ResultPanelProps {
  title: string;
  lines: ResultLineProps[];
  className?: string;
}

export default function ResultPanel({ title, lines, className = "" }: ResultPanelProps) {
  return (
    <div className={`rounded-xl border border-card-border bg-card p-6 shadow-sm ${className}`}>
      <h3 className="mb-4 text-base font-semibold text-navy">{title}</h3>
      <div className="divide-y divide-card-border/50">
        {lines.map((line, i) => (
          <ResultLine key={i} {...line} />
        ))}
      </div>
    </div>
  );
}

export { ResultLine };
