// Garde partagée des exports d'un audit (rapport PDF, matrice CSV/Excel,
// NC CSV). Deux questions, dans cet ordre :
//
// 1. Qui ? staff (admin/auditor), client_admin du client de l'audit, OU
//    contact client invité sur l'audit (Porte 2, migration 70).
// 2. Quel plan ? la feature `export.pdf` (Starter+) doit être couverte par
//    l'org active du visiteur OU par l'org propriétaire de l'audit : un
//    contact client n'a pas d'org active, c'est l'abonnement de l'org
//    auditrice qui couvre ses téléchargements.
//
// Check server-side indispensable : ces exports sont appelables hors UI.

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { orgHasFeature, organizationHasFeature } from "@/lib/billing/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditExportAccess = "ok" | "forbidden" | "plan_required";

export async function checkAuditExportAccess(
  supabase: SupabaseClient,
  args: {
    auditId: string;
    auditOrganizationId: string | null;
    clientId: string | null;
    profile: {
      role: string | null;
      client_id: string | null;
      is_platform_admin: boolean | null;
    };
  },
): Promise<AuditExportAccess> {
  const { auditId, auditOrganizationId, clientId, profile } = args;

  const isLegacyAuthorized =
    profile.is_platform_admin === true ||
    profile.role === "admin" ||
    profile.role === "auditor" ||
    (profile.role === "client_admin" &&
      clientId !== null &&
      profile.client_id === clientId);
  const isAuthorized =
    isLegacyAuthorized ||
    (await supabase.rpc("is_contact_of_audit", { p_audit_id: auditId }))
      .data === true;
  if (!isAuthorized) return "forbidden";

  return (await auditExportFeatureEnabled(auditOrganizationId))
    ? "ok"
    : "plan_required";
}

async function auditExportFeatureEnabled(
  auditOrganizationId: string | null,
): Promise<boolean> {
  return (
    (await orgHasFeature("export.pdf")) ||
    (auditOrganizationId !== null &&
      (await organizationHasFeature(auditOrganizationId, "export.pdf")))
  );
}

export interface AuditExportContext {
  project: { id: string; name: string; url: string | null };
  client: { id: string; name: string; website: string | null };
  reference: { id: string; type: string; version: string };
  /** Noms des auditeurs assignés (audit_assignees.role = 'auditor'). */
  auditorNames: string[];
}

/**
 * En-tête d'un export (projet, client, référentiel, auditeurs assignés).
 *
 * Un contact client lit l'audit mais pas les tables `projects` / `clients` /
 * `profiles` (RLS) : sans ce chargement, son export serait vu comme un audit
 * incomplet. Lecture service-role STRICTEMENT limitée à l'audit demandé, à
 * n'appeler qu'APRÈS `checkAuditExportAccess(...) === "ok"`.
 */
export async function loadAuditExportContext(
  auditId: string,
): Promise<AuditExportContext | null> {
  const admin = createAdminClient();
  const [{ data: audit }, { data: assignees }] = await Promise.all([
    admin
      .from("audits")
      .select(
        `reference:references(id, type, version),
         project:projects(id, name, url, client:clients(id, name, website))`,
      )
      .eq("id", auditId)
      .maybeSingle(),
    admin
      .from("audit_assignees")
      .select("profile:profiles(first_name, last_name)")
      .eq("audit_id", auditId)
      .eq("role", "auditor"),
  ]);
  if (!audit) return null;

  const one = <T>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
  const project = one(audit.project) as
    | (AuditExportContext["project"] & { client: unknown })
    | null;
  const client = one(project?.client) as AuditExportContext["client"] | null;
  const reference = one(audit.reference) as AuditExportContext["reference"] | null;
  if (!project || !client || !reference) return null;

  const auditorNames = (assignees ?? [])
    .map((a) => one(a.profile) as { first_name: string | null; last_name: string | null } | null)
    .map((p) => [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim())
    .filter((name) => name.length > 0);

  return {
    project: { id: project.id, name: project.name, url: project.url ?? null },
    client: { id: client.id, name: client.name, website: client.website ?? null },
    reference,
    auditorNames,
  };
}
