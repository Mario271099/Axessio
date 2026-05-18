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
import type { UserRole } from "@/types/domain";

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
  "auditor",
  "client_admin",
  "client_member",
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

  if (profile?.role !== "auditor") {
    return {
      supabase,
      inviterId: user.id,
      inviterName: "",
      error: t("auditorOnly"),
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
}) {
  const tErrors = await getTranslations("errors");
  const tEmails = await getTranslations("emails");
  const html = await render(
    InvitationEmail({
      recipientName: params.recipientName,
      inviterName: params.inviterName,
      role: params.role,
      clientName: params.clientName,
      invitationUrl: params.invitationUrl,
    }),
  );

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: tEmails("invitationSubject"),
    html,
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

  const limit = rateLimit(
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

  if (role === "auditor" && clientId !== null) {
    return { error: t("auditorNoClient") };
  }
  if (role !== "auditor") {
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

  let nextClientId: string | null;
  if (newRole === "auditor") {
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

  const limit = rateLimit(
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
  });
  if (sendError) return { error: sendError };

  revalidatePath("/users");
  return { error: null, success: true, userId };
}
