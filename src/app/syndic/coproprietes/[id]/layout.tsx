"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getCoownership } from "@/lib/coownerships";
import CoproSidebar from "@/components/syndic/CoproSidebar";

export default function CoproLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [name, setName] = useState<string>("Copropriété");

  useEffect(() => {
    if (!user || !id) return;
    getCoownership(id).then((c) => { if (c?.name) setName(c.name); }).catch(() => null);
  }, [user, id]);

  return (
    <div className="mx-auto max-w-[1600px] px-2 sm:px-4 py-4 lg:py-6">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <CoproSidebar coownershipId={id} coownershipName={name} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
