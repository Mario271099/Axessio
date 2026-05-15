import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ClientDetail,
  type ActivityEvent,
  type ClientData,
  type ProjectItem,
} from "./client-detail";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

const IN_PROGRESS_STATUSES = [
  "IN_PROGRESS",
  "REMEDIATION",
  "COUNTER_AUDIT",
] as const;

export default async function ClientDetailPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { clientId } = await params;

  if (profile.role !== "auditor") {
    return (
      <div className="container mx-auto max-w-3xl p-6 md:p-8">
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
        >
          Accès réservé aux auditeurs internes.
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select(
      "id, name, website, contact_email, contact_name, is_active, created_at",
    )
    .eq("id", clientId)
    .maybeSingle();

  if (clientError || !clientRow) {
    notFound();
  }

  const { data: projectRows, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, url, audits(id, status, updated_at)")
    .eq("client_id", clientId)
    .order("name");

  if (projectsError) {
    return (
      <div className="container mx-auto max-w-3xl p-6 md:p-8">
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
        >
          Erreur de chargement des projets : {projectsError.message}
        </div>
      </div>
    );
  }

  type ProjectRow = {
    id: string;
    name: string;
    url: string | null;
    audits:
      | { id: string; status: string; updated_at: string }[]
      | null;
  };

  const rawProjects = (projectRows ?? []) as ProjectRow[];

  const projects: ProjectItem[] = rawProjects.map((p) => ({
    id: p.id,
    name: p.name,
    url: p.url,
    auditCount: p.audits?.length ?? 0,
  }));

  // ---- Statistiques agrégées --------------------------------------------
  let totalAudits = 0;
  let activeAudits = 0;
  const recentActivity: ActivityEvent[] = [];
  for (const p of rawProjects) {
    for (const a of p.audits ?? []) {
      totalAudits += 1;
      if (
        (IN_PROGRESS_STATUSES as readonly string[]).includes(a.status)
      ) {
        activeAudits += 1;
      }
      recentActivity.push({
        id: a.id,
        projectName: p.name,
        auditId: a.id,
        status: a.status,
        at: a.updated_at,
      });
    }
  }
  recentActivity.sort((a, b) => (a.at > b.at ? -1 : 1));
  const lastActivity = recentActivity.slice(0, 5);

  const client: ClientData = {
    id: clientRow.id as string,
    name: clientRow.name as string,
    website: (clientRow.website as string | null) ?? null,
    contactEmail: (clientRow.contact_email as string | null) ?? null,
    contactName: (clientRow.contact_name as string | null) ?? null,
    isActive: (clientRow.is_active as boolean | null) ?? true,
    createdAt: clientRow.created_at as string,
  };

  return (
    <ClientDetail
      client={client}
      projects={projects}
      stats={{
        projectCount: projects.length,
        auditCount: totalAudits,
        activeAuditCount: activeAudits,
      }}
      activity={lastActivity}
    />
  );
}
