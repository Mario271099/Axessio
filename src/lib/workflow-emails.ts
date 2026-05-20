// Helpers d'envoi d'email liés au workflow d'audit (livraison, relance
// relecteur). Centralisé pour homogénéiser le rendu HTML et les sujets, et
// pour faciliter une future bascule vers une autre infra (Postmark, etc.).
//
// Tous les helpers sont best-effort : ils renvoient `null` en cas de succès
// et le message d'erreur sinon. Aucun throw — l'appelant est libre de logger.

import { render } from "@react-email/components";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { AuditDeliveredEmail } from "@/emails/audit-delivered-email";
import { ReviewReminderEmail } from "@/emails/review-reminder-email";

// URL absolue vers une page audit. Utilisée dans les emails pour que le
// destinataire ouvre l'app dans son navigateur (pas un lien relatif qui ne
// fonctionnerait pas hors plateforme).
function buildAuditUrl(auditId: string): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://axessio.app"
  ).replace(/\/+$/, "");
  return `${base}/audits/${auditId}`;
}

// ============================================================================
// 1) Email "Rapport d'audit livré" — envoyé aux client_admin du client
// ============================================================================
export async function sendAuditDeliveredEmail(params: {
  to: string;
  recipientName: string;
  auditId: string;
  projectName: string;
  clientName: string;
}): Promise<string | null> {
  const auditUrl = buildAuditUrl(params.auditId);
  const html = await render(
    AuditDeliveredEmail({
      recipientName: params.recipientName,
      projectName: params.projectName,
      clientName: params.clientName,
      auditUrl,
    }),
  );

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Rapport d'audit livré — ${params.projectName}`,
    html,
  });

  return error?.message ?? null;
}

// ============================================================================
// 2) Email "Relecture en attente" — envoyé aux relecteurs sur audit stagnant
// ============================================================================
export async function sendReviewReminderEmail(params: {
  to: string;
  recipientName: string;
  auditId: string;
  projectName: string;
  clientName: string;
  daysWaiting: number;
}): Promise<string | null> {
  const auditUrl = buildAuditUrl(params.auditId);
  const html = await render(
    ReviewReminderEmail({
      recipientName: params.recipientName,
      projectName: params.projectName,
      clientName: params.clientName,
      auditUrl,
      daysWaiting: params.daysWaiting,
    }),
  );

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Relecture en attente depuis ${params.daysWaiting} jours — ${params.projectName}`,
    html,
  });

  return error?.message ?? null;
}
