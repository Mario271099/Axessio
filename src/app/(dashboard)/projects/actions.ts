"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { canManageProjects } from "@/lib/permissions";
import type { UserRole } from "@/types/domain";

export interface ProjectActionState {
  error: string | null;
  projectId?: string;
}

export async function createProject(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.role || !canManageProjects(profile.role as UserRole)) {
    return { error: t("forbidden") };
  }

  const clientId = formData.get("clientId")?.toString();
  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim() || null;

  if (!clientId) return { error: t("clientRequired") };
  if (!name) return { error: t("projectNameRequired") };

  const { data, error } = await supabase
    .from("projects")
    .insert({ client_id: clientId, name, url })
    .select("id")
    .single();

  if (error || !data)
    return { error: error?.message ?? t("createFailed") };

  revalidatePath("/projects");
  revalidatePath("/audits");
  return { error: null, projectId: data.id };
}
