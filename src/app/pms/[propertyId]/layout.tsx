"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import PropertySidebar from "@/components/pms/PropertySidebar";

export default function PmsPropertyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = use(params);
  const { user } = useAuth();
  const [name, setName] = useState<string>("Propriété");

  useEffect(() => {
    if (!user || !propertyId) return;
    getProperty(propertyId).then((p) => { if (p?.name) setName(p.name); }).catch(() => null);
  }, [user, propertyId]);

  return (
    <div className="mx-auto max-w-[1600px] px-2 sm:px-4 py-4 lg:py-6">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <PropertySidebar propertyId={propertyId} propertyName={name} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
