// Helpers d'envoi d'email liés au cycle de vie d'un audit. Centralisé pour
// homogénéiser le rendu HTML et les sujets, et pour faciliter une future
// bascule vers une autre infra (Postmark, etc.).
//
// Tous les helpers sont best-effort : ils renvoient `null` en cas de succès
// et le message d'erreur sinon. Aucun throw — l'appelant est libre de logger.

import { render } from "@react-email/components";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { AuditDeliveredEmail } from "@/emails/audit-delivered-email";
import { resolveOutputBranding } from "@/lib/branding/server";

// URL absolue vers une page audit. Utilisée dans les emails pour que le
// destinataire ouvre l'app dans son navigateur (pas un lien relatif qui ne
// fonctionnerait pas hors plateforme).
function buildAuditUrl(auditId: string): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://axessyo.com"
  ).replace(/\/+$/, "");
  return `${base}/audits/${auditId}`;
}

// ============================================================================
// Email "Rapport d'audit livré" — envoyé aux client_admin du client
// ----------------------------------------------------------------------------
// Déclenché par la transition métier T3 (IN_PROGRESS → DELIVERED) sur
// `audits.status`.
// ============================================================================
export async function sendAuditDeliveredEmail(params: {
  to: string;
  recipientName: string;
  auditId: string;
  projectName: string;
  clientName: string;
  /** Org du client (= clients.id par backfill) pour résoudre le branding. */
  organizationId?: string | null;
}): Promise<string | null> {
  const auditUrl = buildAuditUrl(params.auditId);
  const branding = await resolveOutputBranding(params.organizationId);
  const html = await render(
    AuditDeliveredEmail({
      recipientName: params.recipientName,
      projectName: params.projectName,
      clientName: params.clientName,
      auditUrl,
      branding,
    }),
  );

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Rapport d'audit livré — ${params.projectName}`,
    html,
    ...(branding.supportEmail ? { replyTo: branding.supportEmail } : {}),
  });

  return error?.message ?? null;
}
