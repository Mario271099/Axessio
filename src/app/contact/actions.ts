"use server";

import { headers } from "next/headers";
import {
  HONEYPOT_FIELD,
  validateContact,
  type ContactData,
  type ContactErrors,
  type ContactField,
} from "@/lib/contact";
import { rateLimit } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";

// Action PUBLIQUE (visiteur non connecté) : pas de requirePermission(). Les
// garde-fous sont le champ piège anti-robots, la limite d'envoi par IP et la
// validation serveur.

/** 5 messages par heure et par adresse IP. */
const CONTACT_LIMIT = 5;
const CONTACT_WINDOW_MS = 60 * 60_000;

export type ContactResult =
  | { status: "success" }
  | { status: "invalid"; errors: ContactErrors }
  | { status: "rateLimited" }
  | { status: "sendFailed" };

const SUBJECT_LABELS: Record<ContactData["subject"], string> = {
  demo: "Démonstration",
  enterprise: "Devis Enterprise",
  support: "Aide sur un compte",
  partnership: "Partenariat",
  other: "Autre question",
};

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unknown";
}

export async function sendContactMessage(
  formData: FormData,
): Promise<ContactResult> {
  // Robot : on fait comme si tout s'était bien passé, sans rien envoyer.
  const honeypot = formData.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { status: "success" };
  }

  const fields: Partial<Record<ContactField, unknown>> = {
    name: formData.get("name"),
    email: formData.get("email"),
    organization: formData.get("organization"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  };
  const validation = validateContact(fields);
  if (!validation.ok) return { status: "invalid", errors: validation.errors };

  const limit = await rateLimit(
    `contact:${await clientIp()}`,
    CONTACT_LIMIT,
    CONTACT_WINDOW_MS,
  );
  if (!limit.ok) return { status: "rateLimited" };

  const { name, email, organization, subject, message } = validation.data;
  const to = process.env.CONTACT_TO_EMAIL ?? SITE.supportEmail;

  try {
    // Import différé : lib/resend lève si RESEND_API_KEY est absente, ce qui
    // ne doit pas casser le rendu de la page de contact.
    const { resend, FROM_EMAIL } = await import("@/lib/resend");
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: email,
      subject: `[Contact] ${SUBJECT_LABELS[subject]} - ${name}`,
      // Texte brut uniquement : aucune saisie du visiteur n'est interprétée
      // comme du HTML.
      text: [
        `Nom : ${name}`,
        `E-mail : ${email}`,
        `Organisation : ${organization || "-"}`,
        `Sujet : ${SUBJECT_LABELS[subject]}`,
        "",
        message,
      ].join("\n"),
    });
    if (error) {
      console.error("[contact] envoi refusé :", error.message);
      return { status: "sendFailed" };
    }
  } catch (err) {
    console.error(
      "[contact] envoi impossible :",
      err instanceof Error ? err.message : err,
    );
    return { status: "sendFailed" };
  }

  return { status: "success" };
}
