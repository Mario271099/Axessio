"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export interface ClientActionState {
  error: string | null;
  success?: boolean;
  clientId?: string;
  projectId?: string;
}

async function requireAuditor(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>;
  error: string | null;
}> {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "auditor") {
    return { supabase, error: "Accès réservé aux auditeurs internes." };
  }

  return { supabase, error: null };
}

// ============================================================================
// 1. Création d'un client
// ============================================================================
export async function createClient(
  formData: FormData,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requireAuditor();
  if (authError) return { error: authError };

  const name = formData.get("name")?.toString().trim();
  const website = formData.get("website")?.toString().trim() || null;
  const contactEmail =
    formData.get("contact_email")?.toString().trim() || null;
  const contactName = formData.get("contact_name")?.toString().trim() || null;

  if (!name) return { error: "Le nom du client est requis." };

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
    return { error: error?.message ?? "Échec de la création du client." };
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
  const { supabase, error: authError } = await requireAuditor();
  if (authError) return { error: authError };

  const name = formData.get("name")?.toString().trim();
  const website = formData.get("website")?.toString().trim() || null;
  const contactEmail =
    formData.get("contact_email")?.toString().trim() || null;
  const contactName = formData.get("contact_name")?.toString().trim() || null;

  if (!name) return { error: "Le nom du client est requis." };

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
  const { supabase, error: authError } = await requireAuditor();
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
  const { supabase, error: authError } = await requireAuditor();
  if (authError) return { error: authError };

  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim() || null;

  if (!name) return { error: "Le nom du projet est requis." };

  const { data, error } = await supabase
    .from("projects")
    .insert({ client_id: clientId, name, url })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Échec de la création du projet." };
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
  const { supabase, error: authError } = await requireAuditor();
  if (authError) return { error: authError };

  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim() || null;

  if (!name) return { error: "Le nom du projet est requis." };

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
  const { supabase, error: authError } = await requireAuditor();
  if (authError) return { error: authError };

  const { count, error: countError } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (countError) return { error: countError.message };

  if ((count ?? 0) > 0) {
    return { error: "Ce projet a des audits associés." };
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
