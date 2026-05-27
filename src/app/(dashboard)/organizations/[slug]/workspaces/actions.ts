"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export interface WorkspaceActionResult {
  error: string | null;
  success?: boolean;
  slug?: string;
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function requireOrgAdmin(
  organizationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t("notAuthenticated") };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { ok: false, error: t("forbidden") };
  }
  return { ok: true };
}

export async function createWorkspace(
  organizationId: string,
  formData: FormData,
): Promise<WorkspaceActionResult> {
  const t = await getTranslations("errors");
  const tW = await getTranslations("organizations.workspaces");

  const guard = await requireOrgAdmin(organizationId);
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();

  const rawName = (formData.get("name") as string | null)?.trim() ?? "";
  const rawSlug = (formData.get("slug") as string | null)?.trim() ?? "";
  const rawDesc =
    (formData.get("description") as string | null)?.trim() ?? "";

  if (!rawName) return { error: t("workspaceNameRequired") };

  const slug = rawSlug.length > 0 ? rawSlug.toLowerCase() : slugify(rawName);
  if (!SLUG_REGEX.test(slug)) return { error: t("invalidSlug") };
  if (slug === "default")
    return { error: tW("errors.slugReserved") };

  // Unicité du slug par org.
  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return { error: tW("errors.slugTaken") };

  const { error: insertError } = await supabase.from("workspaces").insert({
    organization_id: organizationId,
    slug,
    name: rawName,
    description: rawDesc.length > 0 ? rawDesc : null,
    is_default: false,
  });
  if (insertError) return { error: insertError.message };

  revalidatePath(`/organizations`, "layout");
  return { error: null, success: true, slug };
}

export async function archiveWorkspace(
  organizationId: string,
  workspaceId: string,
): Promise<WorkspaceActionResult> {
  const t = await getTranslations("errors");
  const tW = await getTranslations("organizations.workspaces");

  const guard = await requireOrgAdmin(organizationId);
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();

  const { data: ws } = await supabase
    .from("workspaces")
    .select("is_default")
    .eq("id", workspaceId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!ws) return { error: t("forbidden") };
  if (ws.is_default) return { error: tW("errors.cannotArchiveDefault") };

  const { error } = await supabase
    .from("workspaces")
    .update({ is_archived: true })
    .eq("id", workspaceId)
    .eq("organization_id", organizationId);
  if (error) return { error: error.message };

  revalidatePath(`/organizations`, "layout");
  return { error: null, success: true };
}

export async function restoreWorkspace(
  organizationId: string,
  workspaceId: string,
): Promise<WorkspaceActionResult> {
  const guard = await requireOrgAdmin(organizationId);
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({ is_archived: false })
    .eq("id", workspaceId)
    .eq("organization_id", organizationId);
  if (error) return { error: error.message };

  revalidatePath(`/organizations`, "layout");
  return { error: null, success: true };
}
