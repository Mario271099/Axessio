"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  loadMyOrganizations,
  setCurrentOrgCookie,
} from "@/lib/current-org";

export interface SwitchOrgResult {
  error: string | null;
  success?: boolean;
}

/**
 * Bascule l'organisation active de l'utilisateur courant.
 *
 * Pipeline en 3 temps :
 *   1. Vérifier que l'utilisateur est bien membre de l'org cible (anti-forge).
 *   2. Persister la préférence côté DB (`profiles.current_org_id`) - c'est
 *      cette valeur que `current_org()` SQL lit pour la RLS.
 *   3. Miroir côté cookie HTTP-only pour minimiser les aller-retours DB
 *      lors du resolve initial.
 *
 * Le trigger SQL `validate_profile_current_org` (migration 46) refuse
 * l'UPDATE si le membership n'existe pas - défense en profondeur.
 */
export async function switchOrganization(
  organizationId: string,
): Promise<SwitchOrgResult> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  // 1. Vérification métier côté code (rapide, lit my_organizations).
  const memberships = await loadMyOrganizations();
  const target = memberships.find(
    (m) => m.organizationId === organizationId,
  );
  if (!target) return { error: t("forbidden") };

  // 2. Persistance DB. Le trigger validera côté Postgres aussi.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ current_org_id: organizationId })
    .eq("id", user.id);
  if (updateError) return { error: updateError.message };

  // 3. Miroir cookie (résolution synchrone côté server components).
  await setCurrentOrgCookie(organizationId);

  // Revalidation globale : la sidebar et toutes les pages dépendent de
  // l'org active.
  revalidatePath("/", "layout");
  return { error: null, success: true };
}
