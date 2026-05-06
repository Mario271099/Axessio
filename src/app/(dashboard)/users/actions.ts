"use server";

import { revalidatePath } from "next/cache";
import { render } from "@react-email/components";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { InvitationEmail } from "@/emails/invitation-email";
import type { UserRole } from "@/types/domain";

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AuditorContext {
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>;
  inviterId: string;
  inviterName: string;
  error: string | null;
}

async function requireAuditor(): Promise<AuditorContext> {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      supabase,
      inviterId: "",
      inviterName: "",
      error: "Non authentifié.",
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
      error: "Accès réservé aux auditeurs internes.",
    };
  }

  const inviterName =
    [profile.first_name, profile.last_name]
      .filter((part) => typeof part === "string" && part.trim().length > 0)
      .join(" ")
      .trim() ||
    profile.email ||
    "Un auditeur Axessio";

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
    subject: "Vous êtes invité·e à rejoindre Axessio",
    html,
  });

  if (error) {
    return error.message ?? "Échec de l'envoi de l'email.";
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

  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const firstName = formData.get("first_name")?.toString().trim() ?? "";
  const lastName = formData.get("last_name")?.toString().trim() ?? "";
  const roleRaw = formData.get("role")?.toString().trim() ?? "";
  const clientIdRaw = formData.get("client_id")?.toString().trim() ?? "";
  const clientId = clientIdRaw === "" ? null : clientIdRaw;

  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: "Email invalide." };
  }
  if (!firstName) return { error: "Le prénom est requis." };
  if (!lastName) return { error: "Le nom est requis." };
  if (!ALLOWED_ROLES.includes(roleRaw as UserRole)) {
    return { error: "Rôle invalide." };
  }
  const role = roleRaw as UserRole;

  if (role === "auditor" && clientId !== null) {
    return { error: "Un auditeur ne peut pas être rattaché à un client." };
  }
  if (role !== "auditor") {
    if (!clientId) {
      return { error: "Ce rôle nécessite un client de rattachement." };
    }
    if (!UUID_REGEX.test(clientId)) {
      return { error: "Identifiant client invalide." };
    }
  }

  // Étape 1 : aucun profil existant avec cet email
  const { data: existing } = await ctx.supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return { error: "Un utilisateur existe déjà avec cet email." };
  }

  // Étape 2 : récupérer le nom du client (si applicable) pour l'email
  let clientName: string | null = null;
  if (clientId) {
    const { data: client, error: clientError } = await ctx.supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .maybeSingle();
    if (clientError || !client) {
      return { error: "Client introuvable." };
    }
    clientName = client.name as string;
  }

  // Étape 3 : générer un lien d'invitation côté admin
  // (crée auth.users + déclenche le trigger handle_new_user qui peuple profiles)
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
      error:
        linkError?.message ??
        "Échec de la génération du lien d'invitation.",
    };
  }

  const invitationUrl = linkData.properties.action_link;
  const newUserId = linkData.user.id;

  // Étape 4 : envoyer l'email via Resend
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
      error: `Utilisateur créé mais l'email n'a pas pu être envoyé : ${sendError}. Utilisez "Renvoyer l'invitation" pour réessayer.`,
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

  if (!UUID_REGEX.test(userId)) return { error: "Utilisateur invalide." };
  if (!ALLOWED_ROLES.includes(newRole)) return { error: "Rôle invalide." };

  let nextClientId: string | null;
  if (newRole === "auditor") {
    nextClientId = null;
  } else {
    if (!clientId) {
      return { error: "Ce rôle nécessite un client de rattachement." };
    }
    if (!UUID_REGEX.test(clientId)) {
      return { error: "Identifiant client invalide." };
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

  if (!UUID_REGEX.test(userId)) return { error: "Utilisateur invalide." };

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

  if (!UUID_REGEX.test(userId)) return { error: "Utilisateur invalide." };

  const { data: target, error: targetError } = await ctx.supabase
    .from("profiles")
    .select("email, first_name, last_name, role, client_id")
    .eq("id", userId)
    .maybeSingle();

  if (targetError || !target) {
    return { error: "Utilisateur introuvable." };
  }

  const email = (target.email as string | null)?.toLowerCase().trim();
  if (!email) return { error: "Email manquant pour cet utilisateur." };

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
      error:
        linkError?.message ??
        "Impossible de générer un nouveau lien d'invitation.",
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
