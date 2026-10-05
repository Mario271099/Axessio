"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/server-permissions";
import { rateLimit, retryAfterSeconds } from "@/lib/rate-limit";
import { render } from "@react-email/components";
import { InvitationEmail } from "@/emails/invitation-email";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { resolveOutputBranding } from "@/lib/branding/server";
import { buildInviteUrl, buildMagicLinkUrl } from "@/lib/invite-link";

export interface ContactActionResult {
  error: string | null;
  success?: boolean;
}

const INVITE_LIMIT = 20;
const INVITE_WINDOW_MS = 60 * 60 * 1000;

// ============================================================================
// Inviter un contact client sur un audit (Porte 2)
// ----------------------------------------------------------------------------
// Le contact n'est PAS membre de l'organisation. Sa seule manifestation est
// une ligne `audit_assignees(audit_id, profile_id, role='contact')`. La RLS
// (migration 70) lui accorde la lecture de l'audit, sa matrice, ses NC, le
// fil client des messages - et exclut strictement le fil review.
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

  // 2) Lien de l'email : invitation (choix du mot de passe) pour un nouveau
  //    compte, connexion directe pour un compte existant. Dans les deux cas
  //    on arrive sur l'audit. Le trigger handle_new_user crée la ligne
  //    profiles d'un nouveau compte à partir du raw_user_meta_data.
  const admin = createAdminClient();
  const auditPath = `/audits/${auditId}`;
  let existingAccount = Boolean(existing?.id);

  let link = existingAccount
    ? null
    : await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: { first_name: firstName, last_name: lastName, role: "client" },
        },
      });
  if (!link || link.error || !link.data?.properties?.hashed_token) {
    // Compte existant (éventuellement invisible via la RLS) → magic link.
    link = await admin.auth.admin.generateLink({ type: "magiclink", email });
    existingAccount = true;
  }
  if (link.error || !link.data?.user?.id || !link.data.properties?.hashed_token) {
    return { error: link.error?.message ?? t("invitationLinkFailed") };
  }
  const profileId = (existing?.id as string | undefined) ?? link.data.user.id;
  const linkUrl = existingAccount
    ? buildMagicLinkUrl(link.data.properties.hashed_token, auditPath)
    : buildInviteUrl(link.data.properties.hashed_token, auditPath);

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

  // 5) Email (Resend). L'accès est déjà accordé : en cas d'échec, l'admin
  //    peut relancer l'invitation (idempotent, renvoie un lien neuf).
  const sendError = await sendContactInvitationEmail({
    auditId,
    to: email,
    recipientName: `${firstName} ${lastName}`.trim(),
    inviterId: guard.userId,
    invitationUrl: linkUrl,
    existingAccount,
  });
  if (sendError) {
    return { error: t("contactEmailFailed", { message: sendError }) };
  }
  return { error: null, success: true };
}

async function sendContactInvitationEmail(params: {
  auditId: string;
  to: string;
  recipientName: string;
  inviterId: string;
  invitationUrl: string;
  existingAccount: boolean;
}): Promise<string | null> {
  const admin = createAdminClient();
  const [{ data: audit }, { data: inviter }] = await Promise.all([
    admin
      .from("audits")
      .select(
        "organization_id, site_name, project:projects(name, client:clients(name))",
      )
      .eq("id", params.auditId)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", params.inviterId)
      .maybeSingle(),
  ]);
  const project = Array.isArray(audit?.project) ? audit.project[0] : audit?.project;
  const client = Array.isArray(project?.client) ? project.client[0] : project?.client;

  try {
    const branding = await resolveOutputBranding(
      (audit?.organization_id as string | null | undefined) ?? null,
    );
    const html = await render(
      InvitationEmail({
        recipientName: params.recipientName,
        inviterName: [inviter?.first_name, inviter?.last_name]
          .filter(Boolean)
          .join(" "),
        role: "client",
        clientName: (client?.name as string | undefined) ?? null,
        auditName:
          (audit?.site_name as string | null | undefined) ??
          (project?.name as string | undefined) ??
          null,
        invitationUrl: params.invitationUrl,
        existingAccount: params.existingAccount,
        branding,
      }),
    );
    const tEmails = await getTranslations("emails");
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: tEmails("invitationSubject"),
      html,
      ...(branding.supportEmail ? { replyTo: branding.supportEmail } : {}),
    });
    return error ? (error.message ?? "erreur inconnue") : null;
  } catch (err) {
    return err instanceof Error ? err.message : "erreur inconnue";
  }
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
