"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface Props {
  propertyId: string;
  propertyName: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Opérations du jour",
    items: [
      { href: "", label: "Dashboard", icon: "📊", description: "KPIs + today's flash" },
      { href: "/frontdesk", label: "Front desk", icon: "🛎️", description: "Arrivées / départs / in-house" },
      { href: "/calendrier", label: "Calendrier / Rooming", icon: "📅", description: "Vue 30 jours" },
    ],
  },
  {
    title: "Réservations",
    items: [
      { href: "/reservations", label: "Toutes réservations", icon: "📋", description: "Liste filtrable" },
      { href: "/reservations/nouveau", label: "Nouvelle réservation", icon: "➕", description: "Wizard booking" },
      { href: "/guests", label: "Clients (guests)", icon: "👥", description: "CRM hôtel" },
    ],
  },
  {
    title: "Tarifs & distribution",
    items: [
      { href: "/tarifs", label: "Tarifs saisonniers", icon: "💰", description: "Rate plans × room types" },
      { href: "/tarifs/bulk", label: "Édition en masse", icon: "⚡", description: "Ajustement % / fixe / stop sell" },
      { href: "/channels", label: "Channels iCal", icon: "🔗", description: "Airbnb / Booking / VRBO sync" },
    ],
  },
  {
    title: "Chambres & Setup",
    items: [
      { href: "/chambres", label: "Chambres & types", icon: "🏠", description: "Inventory + room types" },
      { href: "/setup", label: "Setup propriété", icon: "⚙️", description: "Paramètres" },
    ],
  },
  {
    title: "Facturation",
    items: [
      { href: "/factures", label: "Factures", icon: "🧾", description: "Emises + TVA LU 3/17" },
    ],
  },
  {
    title: "Reporting",
    items: [
      { href: "/rapports", label: "Tableau de bord", icon: "📈", description: "Flash quotidien" },
      { href: "/rapports/usali", label: "USALI mensuel", icon: "📘", description: "Standard AHLA v11" },
      { href: "/rapports/pickup", label: "Pickup (RM)", icon: "📊", description: "Réservations récentes" },
      { href: "/rapports/forecast", label: "Revenue forecast", icon: "🔮", description: "Projection OTB + pickup" },
      { href: "/rapports/heatmap", label: "Heatmap occupancy", icon: "🗓️", description: "Calendrier annuel" },
    ],
  },
];

export default function PropertySidebar({ propertyId, propertyName }: Props) {
  const pathname = usePathname();
  const basePath = `/pms/${propertyId}`;
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string): boolean => {
    const fullPath = `${basePath}${href}`;
    if (href === "") return pathname === fullPath;
    if (href === "/reservations") return pathname === fullPath || (pathname.startsWith(`${fullPath}/`) && !pathname.includes("/nouveau"));
    if (href === "/reservations/nouveau") return pathname === `${fullPath}`;
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 rounded-full bg-navy px-4 py-3 text-sm font-bold text-white shadow-lg">
        {mobileOpen ? "✕ Fermer" : "☰ Outils PMS"}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        ${mobileOpen ? "fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto" : "hidden"}
        lg:block lg:sticky lg:top-4 lg:self-start lg:h-[calc(100vh-2rem)] lg:overflow-y-auto
        bg-card border-r lg:border border-card-border lg:rounded-xl p-3
      `}>
        <div className="mb-4 px-2">
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Propriété PMS</div>
          <Link href={basePath} className="mt-1 block text-sm font-bold text-navy hover:underline truncate"
            onClick={() => setMobileOpen(false)}>
            {propertyName}
          </Link>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-2 mb-1 text-[9px] uppercase tracking-wider text-muted font-semibold">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link href={`${basePath}${item.href}`}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                        active ? "bg-navy text-white" : "hover:bg-background text-slate"
                      }`}>
                      <span className="shrink-0 text-base leading-tight">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold ${active ? "" : "text-navy"}`}>
                          {item.label}
                        </div>
                        {item.description && (
                          <div className={`text-[10px] ${active ? "text-white/70" : "text-muted"} truncate`}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mt-4 border-t border-card-border pt-3 px-2 text-[10px] text-muted">
          <Link href="/pms" className="block hover:text-navy">
            ← Tous mes hôtels
          </Link>
          <Link href="/actions-prioritaires" className="block mt-1 hover:text-navy">
            Actions prioritaires
          </Link>
        </div>
      </aside>
    </>
  );
}
