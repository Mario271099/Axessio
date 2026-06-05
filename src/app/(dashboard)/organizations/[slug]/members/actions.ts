"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { render } from "@react-email/components";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { InvitationEmail } from "@/emails/invitation-email";
import { isValidEmail } from "@/lib/validation";
import { rateLimit, retryAfterSeconds } from "@/lib/rate-limit";
import { resolveOutputBranding } from "@/lib/branding/server";
import { PLANS, planLimit, type PlanCode } from "@/lib/billing/plans";
import { countMembersInOrg } from "@/lib/billing/usage";
import type { OrgRole, UserRole } from "@/types/domain";

export interface InviteMemberResult {
  error: string | null;
  success?: boolean;
  /** Lien d'invitation, renvoyé pour copie manuelle (utile si l'email Resend
   *  n'a pas pu être délivré — sandbox). */
  invitationUrl?: string;
}

// Rôles d'org assignables à un coéquipier invité. `owner` est exclu (unique
// par org, jamais transféré via une invitation).
const INVITABLE_ORG_ROLES: readonly OrgRole[] = ["admin", "auditor", "viewer"];

const INVITE_LIMIT = 30;
const INVITE_WINDOW_MS = 60 * 60 * 1000;

function buildRedirectUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/auth/callback?next=/dashboard`;
}

// Libellé legacy purement cosmétique pour l'email d'invitation (le composant
// InvitationEmail attend un UserRole). N'a AUCUN impact sur les droits réels :
// le profil legacy de l'invité reste 'client' (inerte), sa vraie autorisation
// vient de son rôle d'org.
function orgRoleToDisplayRole(orgRole: OrgRole): UserRole {
  if (orgRole === "admin") return "client_admin";
  if (orgRole === "viewer") return "client";
  return "auditor";
}

/**
 * Invite un coéquipier dans une organisation avec un rôle d'org donné.
 *
 * Sécurité :
 *   - réservé aux owner/admin de l'org cible ;
 *   - le profil legacy de l'invité est 'client' (inerte) — JAMAIS 'auditor'
 *     legacy (qui ouvrirait `is_auditor()` sur tous les tenants). Sa vraie
 *     autorisation vient de `organization_members.role` ;
 *   - gate `max_members` du plan de l'org.
 */
export async function inviteOrgMember(
  orgId: string,
  formData: FormData,
): Promise<InviteMemberResult> {
  const supabase = await createSupabaseClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  // Garde : l'invitant doit être owner/admin de l'org cible.
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role as string)) {
    return { error: t("forbidden") };
  }

  const limit = await rateLimit(
    `inviteOrgMember:${user.id}`,
    INVITE_LIMIT,
    INVITE_WINDOW_MS,
  );
  if (!limit.ok) {
    return {
      error: t("rateLimited", { seconds: retryAfterSeconds(limit.resetMs) }),
    };
  }

  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const firstName = formData.get("first_name")?.toString().trim() ?? "";
  const lastName = formData.get("last_name")?.toString().trim() ?? "";
  const orgRoleRaw = formData.get("org_role")?.toString().trim() ?? "";

  if (!email || !isValidEmail(email)) return { error: t("emailInvalid") };
  if (!firstName) return { error: t("firstNameRequired") };
  if (!lastName) return { error: t("lastNameRequired") };
  if (!INVITABLE_ORG_ROLES.includes(orgRoleRaw as OrgRole)) {
    return { error: t("invalidRole") };
  }
  const orgRole = orgRoleRaw as OrgRole;

  // Email déjà rattaché à un compte ?
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return { error: t("emailExists") };

  // Gate `max_members` du plan de l'org cible.
  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("plan_code")
    .eq("organization_id", orgId)
    .maybeSingle();
  const planCode: PlanCode =
    subRow?.plan_code && subRow.plan_code in PLANS
      ? (subRow.plan_code as PlanCode)
      : "free";
  const maxMembers = planLimit(planCode, "max_members");
  if (maxMembers !== null) {
    const memberCount = await countMembersInOrg(orgId);
    if (memberCount >= maxMembers) {
      return {
        error: t("limitMaxMembersReached", {
          limit: maxMembers,
          plan: PLANS[planCode].name,
        }),
      };
    }
  }

  const admin = createAdminClient();

  // 1. Crée l'utilisateur Auth via lien d'invitation. Le trigger
  //    `handle_new_user` crée le profil (role legacy 'client' inerte).
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
        redirectTo: buildRedirectUrl(),
      },
    });

  if (linkError || !linkData?.properties?.action_link || !linkData.user) {
    return { error: linkError?.message ?? t("invitationLinkFailed") };
  }

  const invitationUrl = linkData.properties.action_link;
  const newUserId = linkData.user.id;

  // 2. Membership d'org + org active pointée sur l'org rejointe.
  const { error: memberError } = await admin
    .from("organization_members")
    .insert({
      organization_id: orgId,
      user_id: newUserId,
      role: orgRole,
      invited_by: user.id,
    });
  if (memberError) {
    // Rollback : on retire l'utilisateur Auth orphelin.
    await admin.auth.admin.deleteUser(newUserId).catch(() => {});
    return { error: memberError.message };
  }

  await admin
    .from("profiles")
    .update({ current_org_id: orgId })
    .eq("id", newUserId);

  // 3. Email d'invitation (best-effort : en sandbox Resend l'envoi peut
  //    échouer pour une adresse non vérifiée — on renvoie quand même le lien
  //    pour copie manuelle).
  try {
    const branding = await resolveOutputBranding(orgId);
    const html = await render(
      InvitationEmail({
        recipientName: `${firstName} ${lastName}`.trim(),
        inviterName: "",
        role: orgRoleToDisplayRole(orgRole),
        clientName: null,
        invitationUrl,
        branding,
      }),
    );
    const tEmails = await getTranslations("emails");
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: tEmails("invitationSubject"),
      html,
      ...(branding.supportEmail ? { replyTo: branding.supportEmail } : {}),
    });
  } catch {
    // best-effort : l'invitation existe, le lien est renvoyé pour copie.
  }

  revalidatePath("/organizations");
  return { error: null, success: true, invitationUrl };
}
