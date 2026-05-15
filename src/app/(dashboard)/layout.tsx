import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const IN_PROGRESS_STATUSES = ["IN_PROGRESS", "REMEDIATION", "COUNTER_AUDIT"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Compteur "audits en cours" — alimente le badge de l'entrée Audits.
  const { count: inProgressCount } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true })
    .in("status", IN_PROGRESS_STATUSES);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        profile={profile}
        counts={{ inProgressAudits: inProgressCount ?? 0 }}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar profile={profile} />

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
