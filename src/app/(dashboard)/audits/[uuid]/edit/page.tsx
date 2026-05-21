import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canEditAudit } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { ReferenceType } from "@/types/domain";
import { EditAuditForm } from "./edit-form";

export default async function EditAuditPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const profile = await requireProfile();
  const t = await getTranslations("audits.edit");
  const { uuid } = await params;
  const supabase = await createClient();

  const [{ data: audit }, { data: referencesData }] = await Promise.all([
    supabase
      .from("audits")
      .select(
        `
        id, reference_id, platform, service_type, status, language,
        expected_start_at, expected_end_at, restitution_at, counter_audit_at,
        accessibility_link, notes,
        project:projects(name, client:clients(name))
      `,
      )
      .eq("id", uuid)
      .single(),
    supabase
      .from("references")
      .select("id, type, version")
      .eq("is_active", true)
      .order("type"),
  ]);

  if (!audit) notFound();

  if (!canEditAudit(profile.role)) {
    redirect(`/audits/${uuid}`);
  }

  const project = Array.isArray(audit.project)
    ? audit.project[0]
    : audit.project;
  const client = project?.client
    ? Array.isArray(project.client)
      ? project.client[0]
      : project.client
    : null;

  const references = (referencesData ?? []).map((r) => ({
    id: r.id,
    type: r.type as ReferenceType,
    version: r.version,
  }));

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
        <Link href={`/audits/${uuid}`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t("back")}
        </Link>
      </Button>

      <header className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {client?.name ?? "—"} · {project?.name ?? "—"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <EditAuditForm
        auditId={uuid}
        initial={{
          referenceId: audit.reference_id,
          platform: audit.platform,
          serviceType: audit.service_type,
          status: audit.status,
          language: audit.language,
          expectedStartAt: audit.expected_start_at,
          expectedEndAt: audit.expected_end_at,
          restitutionAt: audit.restitution_at,
          counterAuditAt: audit.counter_audit_at,
          accessibilityLink: audit.accessibility_link,
          notes: audit.notes,
        }}
        references={references}
      />
    </div>
  );
}
