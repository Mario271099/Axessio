"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission } from "@/lib/server-permissions";

export interface ProjectActionState {
  error: string | null;
  projectId?: string;
}

export async function createProject(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const t = await getTranslations("errors");

  // Legacy (auditor/admin) OU permission d'org `project.manage` (owner/admin/
  // auditor d'org self-serve). La RLS `projects_write` (mig. 78) re-vérifie.
  const guard = await requireAnyPermission("project.manage");
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();

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
