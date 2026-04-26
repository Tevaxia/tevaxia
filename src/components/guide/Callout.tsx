import type { ReactNode } from "react";

type Variant = "info" | "warning" | "example" | "tip";

const VARIANTS: Record<Variant, { wrap: string; icon: string; iconPath: ReactNode; title: string }> = {
  info: {
    wrap: "border-blue-200 bg-blue-50",
    icon: "text-blue-600",
    title: "text-blue-900",
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    ),
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50",
    icon: "text-amber-600",
    title: "text-amber-900",
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    ),
  },
  example: {
    wrap: "border-emerald-200 bg-emerald-50",
    icon: "text-emerald-600",
    title: "text-emerald-900",
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
      />
    ),
  },
  tip: {
    wrap: "border-purple-200 bg-purple-50",
    icon: "text-purple-600",
    title: "text-purple-900",
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
      />
    ),
  },
};

type Props = {
  variant?: Variant;
  title?: string;
  children: ReactNode;
};

export default function Callout({ variant = "info", title, children }: Props) {
  const v = VARIANTS[variant];
  return (
    <div className={`my-6 rounded-lg border ${v.wrap} p-4 sm:p-5`}>
      <div className="flex items-start gap-3">
        <svg className={`mt-0.5 h-5 w-5 shrink-0 ${v.icon}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          {v.iconPath}
        </svg>
        <div className="flex-1 min-w-0">
          {title && <div className={`text-sm font-semibold ${v.title}`}>{title}</div>}
          <div className={`${title ? "mt-1.5" : ""} text-sm text-slate-700 leading-relaxed`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
