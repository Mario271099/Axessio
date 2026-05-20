"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/server-permissions";
import {
  clearImpersonationCookie,
  readImpersonationCookie,
  setImpersonationCookie,
} from "@/lib/impersonation";
import { canImpersonateAs } from "@/lib/permissions";
import type { UserRole } from "@/types/domain";

export interface ImpersonationResult {
  error: string | null;
  success?: boolean;
}

// ============================================================================
// enterImpersonation — passer en mode "Voir comme <role>"
// ----------------------------------------------------------------------------
// Sécurité :
//   1. permission `impersonate` (admin + auditor)
//   2. le rôle cible doit appartenir à `canImpersonateAs(realRole)`
//   3. cookie HttpOnly, jamais accessible côté JS — Impossible à élever
//      via tampering car les server actions s'appuient sur le rôle DB.
//   4. trace audit_logs (action='impersonation.enter')
// ============================================================================
export async function enterImpersonation(
  targetRole: UserRole,
): Promise<ImpersonationResult> {
  const guard = await requirePermission("impersonate");
  if (!guard.ok) return { error: guard.error };

  const t = await getTranslations("errors");

  const allowed = canImpersonateAs(guard.role);
  if (!allowed.includes(targetRole)) {
    return { error: t("impersonationTargetDenied") };
  }

  await setImpersonationCookie(targetRole);

  // Audit log (audit_id null = action globale). La policy audit_logs_insert
  // (migration 24) autorise `actor_id = auth.uid()` + `audit_id is null`.
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    audit_id: null,
    actor_id: guard.userId,
    actor_role: guard.role,
    action: "impersonation.enter",
    payload: { target_role: targetRole },
  });

  // Re-validation maximale : la sidebar, la topbar et tous les écrans
  // doivent refléter le nouveau rôle.
  revalidatePath("/", "layout");

  return { error: null, success: true };
}

// ============================================================================
// exitImpersonation — revenir à son vrai rôle
// ============================================================================
export async function exitImpersonation(): Promise<ImpersonationResult> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const previous = await readImpersonationCookie();
  await clearImpersonationCookie();

  // Trace de sortie — on log même si le cookie était absent, c'est rare et
  // utile pour détecter un cookie effacé en parallèle.
  await supabase.from("audit_logs").insert({
    audit_id: null,
    actor_id: user.id,
    actor_role: null,
    action: "impersonation.exit",
    payload: { previous_target: previous },
  });

  revalidatePath("/", "layout");
  return { error: null, success: true };
}

// ============================================================================
// enterImpersonationAndRedirect — variante pour les formulaires <form action>
// (la navigation reset l'arbre React et garantit que la sidebar lit le nouveau
// rôle au prochain rendu serveur)
// ============================================================================
export async function enterImpersonationAndRedirect(
  formData: FormData,
): Promise<void> {
  const target = formData.get("targetRole")?.toString() as UserRole;
  const result = await enterImpersonation(target);
  if (result.error) {
    // Pas de mécanisme de feedback dans un POST sans state — on redirige
    // vers la page d'origine, l'utilisateur verra que rien n'a changé.
    redirect("/admin/permissions");
  }
  redirect("/dashboard");
}

export async function exitImpersonationAndRedirect(): Promise<void> {
  await exitImpersonation();
  redirect("/dashboard");
}
