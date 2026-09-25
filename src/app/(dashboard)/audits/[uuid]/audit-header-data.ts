import { getTranslations } from "next-intl/server";
import type { AuditHeaderData } from "@/components/audit/audit-page-header";
import { createClient } from "@/lib/supabase/server";
import { REFERENCE_TYPE_LABELS } from "@/lib/constants";
import type {
  AuditStatus,
  PlatformType,
  ReferenceType,
  ServiceType,
} from "@/types/domain";

export type { AuditHeaderData };

/**
 * Charge de quoi afficher l'en-tête commun des pages d'un audit
 * (<AuditPageHeader />) : identité du site audité, client, référentiel,
 * statut et compteurs d'onglets. Une seule source pour toutes les
 * sous-pages, qui n'ont sinon pas besoin de l'audit lui-même.
 *
 * Renvoie `null` si l'audit est introuvable (ou masqué par la RLS) : la page
 * appelante reste libre de rendre son contenu sans en-tête.
 */
export async function loadAuditHeader(
  auditId: string,
): Promise<AuditHeaderData | null> {
  const supabase = await createClient();
  const [tDetail, tPlatform, tServiceType] = await Promise.all([
    getTranslations("audits.detail"),
    getTranslations("constants.platform"),
    getTranslations("constants.serviceType"),
  ]);

  const [{ data: audit }, { count: sampleCount }, { count: ncCount }] =
    await Promise.all([
      supabase
        .from("audits")
        .select(
          `status, platform, service_type, site_name, site_url,
           reference:references(type, version),
           project:projects(name, url, client:clients(name))`,
        )
        .eq("id", auditId)
        .single(),
      supabase
        .from("pages")
        .select("id", { count: "exact", head: true })
        .eq("audit_id", auditId),
      supabase
        .from("non_conformities")
        .select("id", { count: "exact", head: true })
        .eq("audit_id", auditId)
        .neq("status", "RESOLVED"),
    ]);

  if (!audit) return null;

  // Supabase peut renvoyer un tableau sur les jointures 1-1 selon le
  // résolveur : on aplatit pour avoir une shape stable.
  const project = Array.isArray(audit.project) ? audit.project[0] : audit.project;
  const client = project?.client
    ? Array.isArray(project.client)
      ? project.client[0]
      : project.client
    : null;
  const reference = Array.isArray(audit.reference)
    ? audit.reference[0]
    : audit.reference;

  const platform = audit.platform as PlatformType;

  return {
    // Identité du site/app audité (mig. 74) avec fallback sur les anciennes
    // données projet pour les audits créés avant la refonte.
    title:
      (audit.site_name as string | null)?.trim() ||
      (project?.name as string | null) ||
      tDetail("noProjectTitle"),
    clientName: (client?.name as string | null) ?? null,
    siteUrl:
      (audit.site_url as string | null)?.trim() ||
      (project?.url as string | null) ||
      null,
    urlIsLink: platform !== "MOBILE",
    referenceLabel: reference
      ? `${REFERENCE_TYPE_LABELS[reference.type as ReferenceType]} ${reference.version}`
      : tDetail("unknownReference"),
    platformLabel: tPlatform(platform),
    serviceTypeLabel: tServiceType(audit.service_type as ServiceType),
    status: audit.status as AuditStatus,
    counts: { sample: sampleCount ?? 0, anomalies: ncCount ?? 0 },
  };
}
