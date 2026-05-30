import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { BrandingStyles } from "@/components/layout/branding-styles";
import { getCurrentOrgBranding } from "@/lib/branding/server";
import { resolveCurrentOrg } from "@/lib/current-org";

// Toutes les pages sous /(dashboard) sont des vues authentifiées : on coupe
// l'indexation pour ne pas exposer de surface privée à Google et pour ne pas
// gaspiller du crawl-budget sur des redirects vers /login.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

const IN_PROGRESS_STATUSES = ["IN_PROGRESS", "REMEDIATION", "COUNTER_AUDIT"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Compteur "audits en cours" — alimente le badge de l'entrée Audits.
  // Et résolution de l'org active pour le selector sidebar (Phase 1 tenancy).
  // Branding éventuel pour le logo de la sidebar (Phase 5).
  const [{ count: inProgressCount }, org, branding] = await Promise.all([
    supabase
      .from("audits")
      .select("id", { count: "exact", head: true })
      .in("status", IN_PROGRESS_STATUSES),
    resolveCurrentOrg(),
    getCurrentOrgBranding(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <BrandingStyles />
      <Sidebar
        profile={profile}
        counts={{ inProgressAudits: inProgressCount ?? 0 }}
        org={org}
        brandLogoUrl={branding?.logoUrl ?? null}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <ImpersonationBanner profile={profile} />
        <Topbar
          profile={profile}
          counts={{ inProgressAudits: inProgressCount ?? 0 }}
          org={org}
          brandLogoUrl={branding?.logoUrl ?? null}
        />

        <main
          id="main"
          className="flex-1 overflow-y-auto"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
