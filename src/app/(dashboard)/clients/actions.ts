"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { canManageClients, canManageProjects } from "@/lib/permissions";
import type { UserRole } from "@/types/domain";

export interface ClientActionState {
  error: string | null;
  success?: boolean;
  clientId?: string;
  projectId?: string;
}

type PermCheck = (role: UserRole) => boolean;

async function requirePerm(check: PermCheck): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>;
  error: string | null;
}> {
  const supabase = await createSupabaseClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: t("notAuthenticated") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role as UserRole | undefined;
  if (!role || !check(role)) {
    return { supabase, error: t("forbidden") };
  }

  return { supabase, error: null };
}

// ============================================================================
// 1. Création d'un client
// ============================================================================
export async function createClient(
  formData: FormData,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm(canManageClients);
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const name = formData.get("name")?.toString().trim();
  const website = formData.get("website")?.toString().trim() || null;
  const contactEmail =
    formData.get("contact_email")?.toString().trim() || null;
  const contactName = formData.get("contact_name")?.toString().trim() || null;

  if (!name) return { error: t("clientNameRequired") };

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      website,
      contact_email: contactEmail,
      contact_name: contactName,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? t("createClientFailed") };
  }

  revalidatePath("/clients");
  return { error: null, success: true, clientId: data.id };
}

// ============================================================================
// 2. Mise à jour d'un client
// ============================================================================
export async function updateClient(
  clientId: string,
  formData: FormData,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm(canManageClients);
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
  const { supabase, error: authError } = await requirePerm(canManageClients);
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
  const { supabase, error: authError } = await requirePerm(canManageProjects);
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim() || null;

  if (!name) return { error: t("projectNameRequired") };

  const { data, error } = await supabase
    .from("projects")
    .insert({ client_id: clientId, name, url })
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
  const { supabase, error: authError } = await requirePerm(canManageProjects);
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
  const { supabase, error: authError } = await requirePerm(canManageProjects);
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
