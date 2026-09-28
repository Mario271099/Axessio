import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canAny } from "@/lib/permissions";
import { loadMyOrgPermissions } from "@/lib/server-permissions";
import { createClient } from "@/lib/supabase/server";
import { AuditForm } from "./audit-form";
import type { ReferenceType } from "@/types/domain";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("audits.new");
  return { title: t("metaTitle") };
}

export default async function NewAuditPage() {
  const profile = await requireProfile();
  const t = await getTranslations("audits.new");
  const orgPerms = await loadMyOrgPermissions();

  if (!canAny(profile.role, orgPerms, "audit.edit")) {
    redirect("/audits");
  }

  const supabase = await createClient();

  // Scope strict à l'organisation active. La RLS legacy (mig. 23) accorde
  // tous les projets à `is_auditor()`, ce qui montrerait ici les projets
  // de toutes les orgs. On force le filtre par organization_id pour ne
  // proposer que ceux de l'org courante. Le super-admin (platform admin)
  // garde l'override car son `current_org()` retombe sur Axessyo Internal
  // s'il n'a rien sélectionné, et il peut switcher via l'OrgSwitcher.
  const { data: currentOrgIdRaw } = await supabase.rpc("current_org");
  const currentOrgId = currentOrgIdRaw as string | null;

  const projectsQuery = supabase
    .from("projects")
    .select("id, name, client:clients(name)")
    .order("name");

  if (currentOrgId) {
    projectsQuery.eq("organization_id", currentOrgId);
  }

  const [{ data: projectsData }, { data: referencesData }] = await Promise.all([
    projectsQuery,
    supabase
      .from("references")
      .select("id, type, version")
      .eq("is_active", true)
      .order("type"),
  ]);

  const projects = (projectsData ?? []).map((p) => {
    const client = Array.isArray(p.client) ? p.client[0] : p.client;
    return {
      id: p.id,
      name: p.name,
      clientName: client?.name ?? "—",
    };
  });

  const references = (referencesData ?? []).map((r) => ({
    id: r.id,
    type: r.type as ReferenceType,
    version: r.version,
  }));

  return (
    <div className="container mx-auto max-w-7xl space-y-5 p-4 md:p-6 lg:px-9">
      {/* Retour a la liste, puis le titre : meme entree que les maquettes. */}
      <header>
        <Link
          href="/audits"
          className="inline-flex items-center gap-1.5 rounded-lg text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t("breadcrumbBack")}
        </Link>
        <h1 className="mt-1.5 text-2xl font-black leading-[1.1] tracking-[-0.03em] md:text-[2.125rem]">
          {t("title")}
        </h1>
        <p className="mt-1 text-[0.95rem] text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      <AuditForm projects={projects} references={references} />
    </div>
  );
}
