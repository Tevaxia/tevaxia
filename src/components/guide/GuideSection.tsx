import type { ReactNode } from "react";

type Props = {
  id: string;
  number?: number;
  title: string;
  children: ReactNode;
};

export default function GuideSection({ id, number, title, children }: Props) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="flex items-baseline gap-3 text-2xl font-bold text-navy">
        {number != null && (
          <span className="font-mono text-sm text-gold">{String(number).padStart(2, "0")}</span>
        )}
        <span>{title}</span>
      </h2>
      <div className="mt-4 space-y-4 text-base text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}
