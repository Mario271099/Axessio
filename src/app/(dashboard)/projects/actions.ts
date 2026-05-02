"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProjectActionState {
  error: string | null;
  projectId?: string;
}

export async function createProject(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "auditor") {
    return { error: "Seuls les auditeurs peuvent créer des projets." };
  }

  const clientId = formData.get("clientId")?.toString();
  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim() || null;

  if (!clientId) return { error: "Sélectionnez un client." };
  if (!name) return { error: "Le nom du projet est requis." };

  const { data, error } = await supabase
    .from("projects")
    .insert({ client_id: clientId, name, url })
    .select("id")
    .single();

  if (error || !data)
    return { error: error?.message ?? "Échec de la création" };

  revalidatePath("/projects");
  revalidatePath("/audits");
  return { error: null, projectId: data.id };
}
