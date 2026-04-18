"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  section: "pipeline" | "contacts" | "tools" | "reports";
}

const ITEMS: NavItem[] = [
  // Pipeline
  { href: "/pro-agences/crm", label: "Pipeline Kanban", icon: "📊", section: "pipeline" },
  { href: "/pro-agences/mandats", label: "Mandats", icon: "📁", section: "pipeline" },
  // Contacts
  { href: "/pro-agences/crm/contacts", label: "Contacts", icon: "👥", section: "contacts" },
  { href: "/pro-agences/crm/contacts/import", label: "Import CSV", icon: "↑", section: "contacts" },
  { href: "/pro-agences/crm/tasks", label: "Tâches", icon: "✓", section: "contacts" },
  // Tools
  { href: "/pro-agences/crm/templates", label: "Emails types", icon: "📧", section: "tools" },
  // Reports
  { href: "/pro-agences/commissions", label: "Commissions", icon: "💰", section: "reports" },
  { href: "/pro-agences/performance", label: "Performance agents", icon: "🏆", section: "reports" },
];

const SECTION_LABELS: Record<NavItem["section"], string> = {
  pipeline: "Pipeline",
  contacts: "Contacts",
  tools: "Outils",
  reports: "Reporting",
};

export default function CrmTopNav() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (pathname === href) return true;
    if (href === "/pro-agences/crm") return pathname === href;
    if (href === "/pro-agences/mandats") return pathname === href;
    if (href === "/pro-agences/crm/contacts") {
      return pathname === href || (pathname.startsWith(`${href}/`) && !pathname.includes("/import"));
    }
    return pathname.startsWith(`${href}/`) || pathname === href;
  };

  const bySection: Record<string, NavItem[]> = {};
  for (const item of ITEMS) {
    if (!bySection[item.section]) bySection[item.section] = [];
    bySection[item.section].push(item);
  }

  return (
    <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-card-border">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/pro-agences" className="text-sm font-semibold text-muted hover:text-navy">
              CRM Agence
            </Link>
            <span className="text-muted">›</span>
          </div>
          <Link href="/actions-prioritaires"
            className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200">
            🔔 Actions prioritaires
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
          {(Object.keys(SECTION_LABELS) as (keyof typeof SECTION_LABELS)[]).map((sec, idx) => (
            <div key={sec} className="flex items-center gap-1.5">
              {idx > 0 && <span className="mx-2 text-card-border">·</span>}
              <span className="text-xs uppercase tracking-wider text-muted font-bold mr-1 hidden md:inline">
                {SECTION_LABELS[sec]}
              </span>
              {(bySection[sec] ?? []).map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-navy text-white"
                        : "text-slate hover:bg-background hover:text-navy"
                    }`}>
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
