type Props = {
  caption?: string;
  headers: string[];
  rows: (string | number)[][];
  highlightCol?: number;
  footnote?: string;
};

export default function DataTable({ caption, headers, rows, highlightCol, footnote }: Props) {
  return (
    <figure className="my-6 overflow-hidden rounded-xl border border-card-border bg-white">
      {caption && (
        <figcaption className="border-b border-card-border bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-navy">
          {caption}
        </figcaption>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`px-4 py-2.5 text-left text-xs font-semibold text-slate-600 ${
                    i === highlightCol ? "bg-gold/10" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-slate-50/40">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-4 py-2.5 text-slate-700 ${ci === 0 ? "font-medium text-navy" : ""} ${
                      ci === highlightCol ? "bg-gold/5 font-semibold text-navy" : ""
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && (
        <div className="border-t border-card-border bg-slate-50/50 px-4 py-2.5 text-xs text-muted leading-relaxed">{footnote}</div>
      )}
    </figure>
  );
}
