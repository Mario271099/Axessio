"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { orgHasFeature } from "@/lib/billing/server";
import {
  API_SCOPES,
  generateApiToken,
  type ApiScope,
} from "@/lib/api-tokens/server";

export interface ApiTokenActionResult {
  error: string | null;
  success?: boolean;
  plaintext?: string;
  prefix?: string;
}

async function requireOrgAdminAndFeature(
  organizationId: string,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
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

  const enabled = await orgHasFeature("api.access");
  if (!enabled) return { ok: false, error: t("planUpgradeRequired") };

  return { ok: true, userId: user.id };
}

export async function createApiToken(
  organizationId: string,
  formData: FormData,
): Promise<ApiTokenActionResult> {
  const t = await getTranslations("errors");

  const guard = await requireOrgAdminAndFeature(organizationId);
  if (!guard.ok) return { error: guard.error };

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const expiresInDaysRaw =
    (formData.get("expiresInDays") as string | null) ?? "";
  const scopesRaw = formData.getAll("scopes").map(String);

  if (!name) return { error: t("tokenNameRequired") };

  const scopes: ApiScope[] = scopesRaw.filter((s): s is ApiScope =>
    (API_SCOPES as readonly string[]).includes(s),
  );
  if (scopes.length === 0) return { error: t("noScopeSelected") };

  let expiresAt: string | null = null;
  if (expiresInDaysRaw !== "" && expiresInDaysRaw !== "0") {
    const days = parseInt(expiresInDaysRaw, 10);
    if (Number.isNaN(days) || days < 1 || days > 3650) {
      return { error: t("invalidExpiration") };
    }
    expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
  }

  const generated = generateApiToken("live");

  const supabase = await createClient();
  const { error } = await supabase.from("api_tokens").insert({
    organization_id: organizationId,
    created_by: guard.userId,
    name,
    prefix: generated.prefix,
    token_hash: generated.hash,
    scopes,
    expires_at: expiresAt,
  });

  if (error) return { error: error.message };

  revalidatePath(`/organizations/${organizationId}/api-tokens`);
  return {
    error: null,
    success: true,
    plaintext: generated.plaintext,
    prefix: generated.prefix,
  };
}

export async function revokeApiToken(
  organizationId: string,
  tokenId: string,
): Promise<ApiTokenActionResult> {
  const guard = await requireOrgAdminAndFeature(organizationId);
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId)
    .eq("organization_id", organizationId)
    .is("revoked_at", null);

  if (error) return { error: error.message };

  revalidatePath(`/organizations/${organizationId}/api-tokens`);
  return { error: null, success: true };
}
