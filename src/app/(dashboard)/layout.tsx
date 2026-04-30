import { requireProfile } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userRole={profile.role} />

      <div className="flex flex-1 flex-col">
        <Topbar profile={profile} />

        <main id="main" className="flex-1 overflow-auto" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
