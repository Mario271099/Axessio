import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
    <div className="container mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link
          href="/audits"
          className="rounded px-1 py-0.5 hover:bg-accent hover:text-foreground"
        >
          {t("breadcrumbBack")}
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="rounded px-1 py-0.5 font-medium text-foreground">
          {t("breadcrumbCurrent")}
        </span>
      </nav>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <AuditForm projects={projects} references={references} />
    </div>
  );
}
