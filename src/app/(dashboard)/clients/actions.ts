"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { requireAnyPermission } from "@/lib/server-permissions";
import type { Permission } from "@/lib/permissions";
import {
  getCurrentOrgPlan,
  getOrgLimit,
  orgWithinLimit,
} from "@/lib/billing/server";
import { countClientsInOrg } from "@/lib/billing/usage";
import { PLANS } from "@/lib/billing/plans";

export interface ClientActionState {
  error: string | null;
  success?: boolean;
  clientId?: string;
  projectId?: string;
}

// Garde combinée legacy + org : un auditeur/admin legacy OU un membre d'org
// disposant de la permission atomique passe. La RLS (mig. 66 pour clients,
// mig. 78 pour projects) reste la 2ᵉ ligne de défense scopée à l'org.
async function requirePerm(permission: Permission): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>;
  error: string | null;
}> {
  const guard = await requireAnyPermission(permission);
  const supabase = await createSupabaseClient();
  if (!guard.ok) return { supabase, error: guard.error };
  return { supabase, error: null };
}

// ============================================================================
// 1. Création d'un client
// ----------------------------------------------------------------------------
// Modèle Phase 1 : `clients.organization_id` est désormais une colonne
// distincte (migration 66). Un client est créé dans l'organisation active
// du user (`current_org()`), pas en tant qu'organisation miroir.
//
// Le trigger DB `trg_clients_set_org` (migration 66) remplit automatiquement
// `organization_id = current_org()` si on ne le précise pas — on le passe
// explicitement quand même, lisible et insensible aux changements d'org
// pendant la requête.
//
// La RLS (migration 66) vérifie `has_org_permission_on('client.manage',
// organization_id)` ; le rôle `auditor` legacy a cette perm via
// `profile.role`, et les owner/admin d'org l'ont via `organization_members`.
// ============================================================================
export async function createClient(
  formData: FormData,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm("client.manage");
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const name = formData.get("name")?.toString().trim();
  const website = formData.get("website")?.toString().trim() || null;
  const contactEmail =
    formData.get("contact_email")?.toString().trim() || null;
  const contactName = formData.get("contact_name")?.toString().trim() || null;

  if (!name) return { error: t("clientNameRequired") };

  const { data: orgIdRaw } = await supabase.rpc("current_org");
  const orgId = orgIdRaw as string | null;
  if (!orgId) return { error: t("noOrganization") };

  // Gate quota `max_clients` du plan (effective : override org + plan).
  // 402 sémantique si la limite est atteinte — pas 403, car c'est une
  // contrainte de plan, pas une absence de permission.
  const currentClients = await countClientsInOrg(orgId);
  const withinLimit = await orgWithinLimit("max_clients", currentClients);
  if (!withinLimit) {
    const limit = await getOrgLimit("max_clients");
    const planCode = await getCurrentOrgPlan();
    return {
      error: t("limitMaxClientsReached", {
        limit: limit ?? 0,
        plan: PLANS[planCode].name,
      }),
    };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      website,
      contact_email: contactEmail,
      contact_name: contactName,
      organization_id: orgId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? t("createClientFailed") };
  }

  revalidatePath("/clients");
  return { error: null, success: true, clientId: data.id as string };
}

// ============================================================================
// 2. Mise à jour d'un client
// ============================================================================
export async function updateClient(
  clientId: string,
  formData: FormData,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm("client.manage");
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const name = formData.get("name")?.toString().trim();
  const website = formData.get("website")?.toString().trim() || null;
  const contactEmail =
    formData.get("contact_email")?.toString().trim() || null;
  const contactName = formData.get("contact_name")?.toString().trim() || null;

  if (!name) return { error: t("clientNameRequired") };

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      website,
      contact_email: contactEmail,
      contact_name: contactName,
    })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { error: null, success: true, clientId };
}

// ============================================================================
// 3. Activation / désactivation d'un client
// ============================================================================
export async function toggleClientActive(
  clientId: string,
  isActive: boolean,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm("client.manage");
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("clients")
    .update({ is_active: isActive })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { error: null, success: true, clientId };
}

// ============================================================================
// 4. Création d'un projet (rattaché à un client)
// ============================================================================
export async function createProject(
  clientId: string,
  formData: FormData,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm("project.manage");
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim() || null;

  if (!name) return { error: t("projectNameRequired") };

  // Modèle Phase 1 : on dérive organization_id et workspace_id du client
  // parent — `clients.organization_id` (mig. 66) est le tenant ; le
  // workspace `default` de cette org est le silo par défaut.
  // Les triggers DB (mig. 65) servent de filet de sécurité si on oublie
  // d'expliciter ; on précise quand même côté code pour la lisibilité.
  const { data: clientRow } = await supabase
    .from("clients")
    .select("organization_id")
    .eq("id", clientId)
    .maybeSingle();

  const organizationId = clientRow?.organization_id as string | undefined;
  if (!organizationId) {
    return { error: t("createProjectFailed") };
  }

  const { data: defaultWs } = await supabase
    .from("workspaces")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_default", true)
    .maybeSingle();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: clientId,
      organization_id: organizationId,
      workspace_id: defaultWs?.id ?? null,
      name,
      url,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? t("createProjectFailed") };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/projects");
  return { error: null, success: true, projectId: data.id };
}

// ============================================================================
// 5. Mise à jour d'un projet
// ============================================================================
export async function updateProject(
  projectId: string,
  clientId: string,
  formData: FormData,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm("project.manage");
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim() || null;

  if (!name) return { error: t("projectNameRequired") };

  const { error } = await supabase
    .from("projects")
    .update({ name, url })
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/projects");
  return { error: null, success: true, projectId };
}

// ============================================================================
// 6. Suppression d'un projet (uniquement si aucun audit lié)
// ============================================================================
export async function deleteProject(
  projectId: string,
  clientId: string,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm("project.manage");
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const { count, error: countError } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (countError) return { error: countError.message };

  if ((count ?? 0) > 0) {
    return { error: t("projectHasAudits") };
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/projects");
  return { error: null, success: true, projectId };
}
