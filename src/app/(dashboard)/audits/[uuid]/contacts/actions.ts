"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/server-permissions";
import { rateLimit, retryAfterSeconds } from "@/lib/rate-limit";

export interface ContactActionResult {
  error: string | null;
  success?: boolean;
}

const INVITE_LIMIT = 20;
const INVITE_WINDOW_MS = 60 * 60 * 1000;

function buildRedirectUrl(auditId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/auth/callback?next=/audits/${auditId}`;
}

// ============================================================================
// Inviter un contact client sur un audit (Porte 2)
// ----------------------------------------------------------------------------
// Le contact n'est PAS membre de l'organisation. Sa seule manifestation est
// une ligne `audit_assignees(audit_id, profile_id, role='contact')`. La RLS
// (migration 70) lui accorde la lecture de l'audit, sa matrice, ses NC, le
// fil client des messages — et exclut strictement le fil review.
//
// Comportement :
//  - si l'email correspond à un profil existant → ajout direct à audit_assignees
//  - sinon → invitation Supabase Auth + insertion en audit_assignees au moment
//    où l'utilisateur active son compte (côté trigger Supabase handle_new_user)
// ============================================================================
export async function inviteContact(
  auditId: string,
  formData: FormData,
): Promise<ContactActionResult> {
  const guard = await requirePermission("audit.assign_auditor");
  if (!guard.ok) return { error: guard.error };

  const t = await getTranslations("errors");
  const supabase = await createClient();

  // Rate-limit anti-spam : 20 invitations/heure par utilisateur.
  const rl = await rateLimit(
    `inviteContact:${guard.userId}`,
    INVITE_LIMIT,
    INVITE_WINDOW_MS,
  );
  if (!rl.ok) {
    return { error: t("rateLimited", { seconds: retryAfterSeconds(rl.resetMs) }) };
  }

  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const firstName = formData.get("first_name")?.toString().trim() ?? "";
  const lastName = formData.get("last_name")?.toString().trim() ?? "";

  if (!email || !email.includes("@")) return { error: t("invalidEmail") };
  if (!firstName) return { error: t("firstNameRequired") };
  if (!lastName) return { error: t("lastNameRequired") };

  // 1) Profil existant ?
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let profileId: string;

  if (existing?.id) {
    profileId = existing.id as string;
  } else {
    // 2) Sinon invitation Supabase Auth — handle_new_user trigger créera
    //    automatiquement la ligne profiles à partir du raw_user_meta_data.
    const admin = createAdminClient();
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: "client",
          },
          redirectTo: buildRedirectUrl(auditId),
        },
      });

    if (linkError || !linkData?.user?.id) {
      return { error: linkError?.message ?? t("invitationLinkFailed") };
    }
    profileId = linkData.user.id;
  }

  // 3) Insertion audit_assignees avec rôle 'contact' (idempotent).
  const { error: insertError } = await supabase
    .from("audit_assignees")
    .insert({
      audit_id: auditId,
      profile_id: profileId,
      role: "contact",
    });

  if (insertError && insertError.code !== "23505") {
    return { error: insertError.message };
  }

  // 4) Trace audit_logs
  await supabase.from("audit_logs").insert({
    audit_id: auditId,
    actor_id: guard.userId,
    actor_role: guard.role,
    action: "contact.invited",
    payload: { email, profile_id: profileId },
  });

  revalidatePath(`/audits/${auditId}`);
  return { error: null, success: true };
}

// ============================================================================
// Retrait d'un contact d'un audit
// ============================================================================
export async function removeContact(
  auditId: string,
  profileId: string,
): Promise<ContactActionResult> {
  const guard = await requirePermission("audit.assign_auditor");
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("audit_assignees")
    .delete()
    .eq("audit_id", auditId)
    .eq("profile_id", profileId)
    .eq("role", "contact");

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    audit_id: auditId,
    actor_id: guard.userId,
    actor_role: guard.role,
    action: "contact.removed",
    payload: { profile_id: profileId },
  });

  revalidatePath(`/audits/${auditId}`);
  return { error: null, success: true };
}
