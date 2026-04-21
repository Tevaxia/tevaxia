"use client";

import { useEffect, useState } from "react";

type Item = { id: string; label: string };

export default function TableOfContents({ items, label }: { items: Item[]; label: string }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      <aside className="hidden lg:block fixed top-24 right-6 w-56 z-20">
        <nav className="rounded-xl border border-card-border bg-card/95 backdrop-blur p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
            {label}
          </div>
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li key={it.id}>
                <a
                  href={`#${it.id}`}
                  className={`block text-xs leading-snug transition-colors ${
                    active === it.id
                      ? "text-gold font-semibold"
                      : "text-slate hover:text-navy"
                  }`}
                >
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="lg:hidden sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-card-border">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm"
        >
          <span className="font-medium text-navy truncate">
            {items.find((i) => i.id === active)?.label ?? label}
          </span>
          <svg
            className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <ul className="border-t border-card-border bg-card px-4 py-3 space-y-2">
            {items.map((it) => (
              <li key={it.id}>
                <a
                  href={`#${it.id}`}
                  onClick={() => setOpen(false)}
                  className={`block text-sm ${
                    active === it.id ? "text-gold font-semibold" : "text-slate"
                  }`}
                >
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
