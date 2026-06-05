"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { render } from "@react-email/components";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { InvitationEmail } from "@/emails/invitation-email";
import { isValidEmail, isValidUuid } from "@/lib/validation";
import { rateLimit, retryAfterSeconds } from "@/lib/rate-limit";
import { canManageUsers } from "@/lib/permissions";
import { PLANS, planLimit, type PlanCode } from "@/lib/billing/plans";
import { countMembersInOrg } from "@/lib/billing/usage";
import { resolveOutputBranding } from "@/lib/branding/server";
import { AXESSIO_INTERNAL_ORG_ID, type UserRole } from "@/types/domain";

// Plafonds : 30 invitations / heure et 10 renvois / heure par auditeur.
// Cible : empêcher le mail-bombing involontaire (script bugué) et le spam
// volontaire (compte auditeur compromis).
const INVITE_LIMIT = 30;
const INVITE_WINDOW_MS = 60 * 60 * 1000;
const RESEND_LIMIT = 10;
const RESEND_WINDOW_MS = 60 * 60 * 1000;

export interface UserActionState {
  error: string | null;
  success?: boolean;
  userId?: string;
}

const ALLOWED_ROLES: readonly UserRole[] = [
  "admin",
  "auditor",
  "client_admin",
  "client",
];

interface AuditorContext {
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>;
  inviterId: string;
  inviterName: string;
  error: string | null;
}

async function requireAuditor(): Promise<AuditorContext> {
  const supabase = await createSupabaseClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      supabase,
      inviterId: "",
      inviterName: "",
      error: t("notAuthenticated"),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.role || !canManageUsers(profile.role as UserRole)) {
    return {
      supabase,
      inviterId: user.id,
      inviterName: "",
      error: t("forbidden"),
    };
  }

  const inviterName =
    [profile.first_name, profile.last_name]
      .filter((part) => typeof part === "string" && part.trim().length > 0)
      .join(" ")
      .trim() ||
    profile.email ||
    t("defaultInviterName");

  return { supabase, inviterId: user.id, inviterName, error: null };
}

function buildRedirectUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/auth/callback?next=/dashboard`;
}

async function sendInvitationEmail(params: {
  to: string;
  recipientName: string;
  inviterName: string;
  role: UserRole;
  clientName: string | null;
  invitationUrl: string;
  /** Org cible de l'invitation, pour résoudre le branding white-label. */
  organizationId?: string | null;
}) {
  const tErrors = await getTranslations("errors");
  const tEmails = await getTranslations("emails");
  const branding = await resolveOutputBranding(params.organizationId);
  const html = await render(
    InvitationEmail({
      recipientName: params.recipientName,
      inviterName: params.inviterName,
      role: params.role,
      clientName: params.clientName,
      invitationUrl: params.invitationUrl,
      branding,
    }),
  );

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: tEmails("invitationSubject"),
    html,
    ...(branding.supportEmail ? { replyTo: branding.supportEmail } : {}),
  });

  if (error) {
    return error.message ?? tErrors("emailSendFailed");
  }
  return null;
}

// ============================================================================
// 1. Invitation d'un nouvel utilisateur
// ============================================================================
export async function inviteUser(
  formData: FormData,
): Promise<UserActionState> {
  const ctx = await requireAuditor();
  if (ctx.error) return { error: ctx.error };
  const t = await getTranslations("errors");

  const limit = await rateLimit(
    `inviteUser:${ctx.inviterId}`,
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
  const roleRaw = formData.get("role")?.toString().trim() ?? "";
  const clientIdRaw = formData.get("client_id")?.toString().trim() ?? "";
  const clientId = clientIdRaw === "" ? null : clientIdRaw;

  if (!email || !isValidEmail(email)) {
    return { error: t("emailInvalid") };
  }
  if (!firstName) return { error: t("firstNameRequired") };
  if (!lastName) return { error: t("lastNameRequired") };
  if (!ALLOWED_ROLES.includes(roleRaw as UserRole)) {
    return { error: t("invalidRole") };
  }
  const role = roleRaw as UserRole;

  // Les rôles staff (admin/auditor) appartiennent à Axessyo Internal, jamais à
  // un client. Les rôles client (client_admin/client) doivent toujours avoir
  // un client_id valide.
  const isStaffRole = role === "admin" || role === "auditor";
  if (isStaffRole && clientId !== null) {
    return { error: t("auditorNoClient") };
  }
  if (!isStaffRole) {
    if (!clientId) {
      return { error: t("roleNeedsClient") };
    }
    if (!isValidUuid(clientId)) {
      return { error: t("invalidClientId") };
    }
  }

  const { data: existing } = await ctx.supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return { error: t("emailExists") };
  }

  let clientName: string | null = null;
  if (clientId) {
    const { data: client, error: clientError } = await ctx.supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .maybeSingle();
    if (clientError || !client) {
      return { error: t("clientNotFound") };
    }
    clientName = client.name as string;
  }

  // ============================================================================
  // Limite de plan : `max_members` sur l'organisation cible.
  //   - role staff (admin/auditor) → org "Axessyo Internal" (UUID fixe)
  //   - role client_admin/client   → clientId == organization_id (backfill
  //                                  migration 43 : 1 client legacy = 1 org)
  // Le plan staff est toujours Pro+ historiquement, mais on garde la même
  // logique pour la cohérence (et pour le jour où on basculera Axessyo
  // Internal sur un plan Enterprise-only).
  // ============================================================================
  const targetOrgId = clientId ?? AXESSIO_INTERNAL_ORG_ID;
  const { data: subRow } = await ctx.supabase
    .from("subscriptions")
    .select("plan_code")
    .eq("organization_id", targetOrgId)
    .maybeSingle();
  const planCode: PlanCode =
    subRow?.plan_code && subRow.plan_code in PLANS
      ? (subRow.plan_code as PlanCode)
      : "free";
  const maxMembers = planLimit(planCode, "max_members");
  if (maxMembers !== null) {
    const memberCount = await countMembersInOrg(targetOrgId);
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
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
          client_id: clientId,
        },
        redirectTo: buildRedirectUrl(),
      },
    });

  if (linkError || !linkData?.properties?.action_link || !linkData.user) {
    return {
      error: linkError?.message ?? t("invitationLinkFailed"),
    };
  }

  const invitationUrl = linkData.properties.action_link;
  const newUserId = linkData.user.id;

  const sendError = await sendInvitationEmail({
    to: email,
    recipientName: `${firstName} ${lastName}`.trim(),
    inviterName: ctx.inviterName,
    role,
    clientName,
    invitationUrl,
    organizationId: targetOrgId,
  });
  if (sendError) {
    return {
      error: t("userCreatedEmailFailed", { message: sendError }),
    };
  }

  revalidatePath("/users");
  return { error: null, success: true, userId: newUserId };
}

// ============================================================================
// 2. Mise à jour du rôle d'un utilisateur
// ============================================================================
export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  clientId?: string | null,
): Promise<UserActionState> {
  const ctx = await requireAuditor();
  if (ctx.error) return { error: ctx.error };
  const t = await getTranslations("errors");

  if (!isValidUuid(userId)) return { error: t("invalidUser") };
  if (!ALLOWED_ROLES.includes(newRole)) return { error: t("invalidRole") };

  // Staff (admin/auditor) : pas de client_id. Sinon : client_id obligatoire.
  const isStaffRole = newRole === "admin" || newRole === "auditor";
  let nextClientId: string | null;
  if (isStaffRole) {
    nextClientId = null;
  } else {
    if (!clientId) {
      return { error: t("roleNeedsClient") };
    }
    if (!isValidUuid(clientId)) {
      return { error: t("invalidClientId") };
    }
    nextClientId = clientId;
  }

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ role: newRole, client_id: nextClientId })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/users");
  return { error: null, success: true, userId };
}

// ============================================================================
// 3. Activation / désactivation d'un utilisateur
// ============================================================================
export async function toggleUserActive(
  userId: string,
  isActive: boolean,
): Promise<UserActionState> {
  const ctx = await requireAuditor();
  if (ctx.error) return { error: ctx.error };
  const t = await getTranslations("errors");

  if (!isValidUuid(userId)) return { error: t("invalidUser") };

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/users");
  return { error: null, success: true, userId };
}

// ============================================================================
// 4. Renvoi d'une invitation
// ============================================================================
export async function resendInvitation(
  userId: string,
): Promise<UserActionState> {
  const ctx = await requireAuditor();
  if (ctx.error) return { error: ctx.error };
  const t = await getTranslations("errors");

  if (!isValidUuid(userId)) return { error: t("invalidUser") };

  const limit = await rateLimit(
    `resendInvitation:${ctx.inviterId}`,
    RESEND_LIMIT,
    RESEND_WINDOW_MS,
  );
  if (!limit.ok) {
    return {
      error: t("rateLimited", { seconds: retryAfterSeconds(limit.resetMs) }),
    };
  }

  const { data: target, error: targetError } = await ctx.supabase
    .from("profiles")
    .select("email, first_name, last_name, role, client_id")
    .eq("id", userId)
    .maybeSingle();

  if (targetError || !target) {
    return { error: t("userNotFound") };
  }

  const email = (target.email as string | null)?.toLowerCase().trim();
  if (!email) return { error: t("emailMissing") };

  const role = target.role as UserRole;
  const clientId = (target.client_id as string | null) ?? null;
  const firstName = (target.first_name as string | null) ?? "";
  const lastName = (target.last_name as string | null) ?? "";

  let clientName: string | null = null;
  if (clientId) {
    const { data: client } = await ctx.supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .maybeSingle();
    clientName = (client?.name as string | undefined) ?? null;
  }

  const admin = createAdminClient();
  let { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
          client_id: clientId,
        },
        redirectTo: buildRedirectUrl(),
      },
    });

  // Si l'utilisateur a déjà confirmé son email, "invite" échoue → fallback magiclink.
  if (linkError || !linkData?.properties?.action_link) {
    const fallback = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: buildRedirectUrl() },
    });
    linkData = fallback.data;
    linkError = fallback.error;
  }

  if (linkError || !linkData?.properties?.action_link) {
    return {
      error: linkError?.message ?? t("newInvitationFailed"),
    };
  }

  const sendError = await sendInvitationEmail({
    to: email,
    recipientName: `${firstName} ${lastName}`.trim(),
    inviterName: ctx.inviterName,
    role,
    clientName,
    invitationUrl: linkData.properties.action_link,
    organizationId: clientId ?? AXESSIO_INTERNAL_ORG_ID,
  });
  if (sendError) return { error: sendError };

  revalidatePath("/users");
  return { error: null, success: true, userId };
}
