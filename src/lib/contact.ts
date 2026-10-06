/**
 * Formulaire de contact public : validation partagée entre le client (retour
 * immédiat, sans aller-retour serveur) et la server action (source de vérité).
 */

export const CONTACT_SUBJECTS = [
  "demo",
  "enterprise",
  "support",
  "partnership",
  "other",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

/** Nom du champ piège : invisible pour un humain, rempli par les robots. */
export const HONEYPOT_FIELD = "website";

export const CONTACT_LIMITS = {
  nameMax: 120,
  emailMax: 254,
  organizationMax: 160,
  messageMin: 20,
  messageMax: 5000,
} as const;

/** Champs dans l'ordre d'affichage : l'ordre du récapitulatif d'erreurs. */
export const CONTACT_FIELDS = [
  "name",
  "email",
  "organization",
  "subject",
  "message",
] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];

export type ContactErrorCode = "required" | "invalid" | "tooShort" | "tooLong";

export type ContactErrors = Partial<Record<ContactField, ContactErrorCode>>;

export type ContactData = {
  name: string;
  email: string;
  organization: string;
  subject: ContactSubject;
  message: string;
};

export type ContactValidation =
  | { ok: true; data: ContactData }
  | { ok: false; errors: ContactErrors };

// Volontairement simple : une adresse plausible (un @, un point dans le
// domaine, pas d'espace). La vraie vérification est la réponse envoyée.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isSubject(value: string): value is ContactSubject {
  return (CONTACT_SUBJECTS as readonly string[]).includes(value);
}

export function validateContact(
  input: Partial<Record<ContactField, unknown>>,
): ContactValidation {
  const read = (field: ContactField) =>
    typeof input[field] === "string" ? (input[field] as string).trim() : "";

  const name = read("name");
  const email = read("email");
  const organization = read("organization");
  const subject = read("subject");
  const message = read("message");

  const errors: ContactErrors = {};

  if (!name) errors.name = "required";
  else if (name.length > CONTACT_LIMITS.nameMax) errors.name = "tooLong";

  if (!email) errors.email = "required";
  else if (email.length > CONTACT_LIMITS.emailMax) errors.email = "tooLong";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "invalid";

  if (organization.length > CONTACT_LIMITS.organizationMax) {
    errors.organization = "tooLong";
  }

  if (!subject) errors.subject = "required";
  else if (!isSubject(subject)) errors.subject = "invalid";

  if (!message) errors.message = "required";
  else if (message.length < CONTACT_LIMITS.messageMin) errors.message = "tooShort";
  else if (message.length > CONTACT_LIMITS.messageMax) errors.message = "tooLong";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: { name, email, organization, subject: subject as ContactSubject, message },
  };
}
