"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_FIELDS,
  CONTACT_LIMITS,
  CONTACT_SUBJECTS,
  HONEYPOT_FIELD,
  validateContact,
  type ContactErrors,
  type ContactField,
} from "@/lib/contact";
import { SITE } from "@/lib/site";
import { sendContactMessage } from "./actions";

type FormError = "rateLimited" | "sendFailed";

/** Identifiant DOM d'un champ (cible des liens du récapitulatif). */
const fieldId = (field: ContactField) => `contact-${field}`;

/**
 * Formulaire de contact. Validation immédiate côté client, revalidée par la
 * server action. En cas d'erreur, le focus va sur un récapitulatif qui liste
 * les erreurs (liens vers les champs) ; après envoi, sur la confirmation.
 */
export function ContactForm() {
  const t = useTranslations("contactPage");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  // Incrémenté à chaque échec : relance le déplacement du focus même si le
  // récapitulatif est déjà affiché.
  const [attempt, setAttempt] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (attempt > 0) summaryRef.current?.focus();
  }, [attempt]);

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  const errorFields = CONTACT_FIELDS.filter((field) => errors[field]);
  const hasSummary = errorFields.length > 0 || formError !== null;

  function errorMessage(field: ContactField): string | null {
    const code = errors[field];
    return code ? t(`errors.${field}.${code}`) : null;
  }

  function fail(nextErrors: ContactErrors, nextFormError: FormError | null) {
    setErrors(nextErrors);
    setFormError(nextFormError);
    setAttempt((n) => n + 1);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const validation = validateContact(
      Object.fromEntries(CONTACT_FIELDS.map((f) => [f, formData.get(f)])),
    );
    if (!validation.ok) {
      fail(validation.errors, null);
      return;
    }

    startTransition(async () => {
      const result = await sendContactMessage(formData);
      if (result.status === "success") {
        setErrors({});
        setFormError(null);
        form.reset();
        setSent(true);
      } else if (result.status === "invalid") {
        fail(result.errors, null);
      } else {
        fail({}, result.status);
      }
    });
  }

  /** Retire l'erreur d'un champ dès que la personne le corrige. */
  function clearError(field: ContactField) {
    if (!errors[field]) return;
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-hero border border-border bg-card p-6 md:p-8">
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-full bg-success/15 text-success-text"
        >
          <Check className="size-5" strokeWidth={2.6} />
        </span>
        <h2
          ref={successRef}
          tabIndex={-1}
          className="text-2xl font-black tracking-tight"
        >
          {t("success.title")}
        </h2>
        <p role="status" className="text-base leading-relaxed text-secondary-foreground">
          {t("success.body")}
        </p>
        <Button type="button" variant="outline" onClick={() => setSent(false)}>
          {t("success.again")}
        </Button>
      </div>
    );
  }

  /** Attributs ARIA communs : lien vers l'aide et l'erreur du champ. */
  function describedBy(field: ContactField, hint?: string) {
    const ids = [hint, errors[field] ? `${fieldId(field)}-error` : null];
    return ids.filter(Boolean).join(" ") || undefined;
  }

  function fieldError(field: ContactField) {
    const message = errorMessage(field);
    if (!message) return null;
    return (
      <p
        id={`${fieldId(field)}-error`}
        className="flex items-start gap-1.5 text-[0.9375rem] font-bold text-severity-critical"
      >
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {message}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="contact-form-title"
      className="flex flex-col gap-5 rounded-hero border border-border bg-card p-6 md:p-8"
    >
      <div>
        <h2 id="contact-form-title" className="text-2xl font-black tracking-tight">
          {t("formTitle")}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("requiredNote")}</p>
      </div>

      {hasSummary && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          className="rounded-row border-l-4 border-severity-critical bg-severity-critical-bg px-4 py-3.5 text-severity-critical"
        >
          {formError ? (
            <p className="flex items-start gap-2 font-bold">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
              {t(`errors.${formError}`, { email: SITE.supportEmail })}
            </p>
          ) : (
            <>
              <p className="flex items-center gap-2 font-extrabold">
                <AlertCircle aria-hidden="true" className="size-[18px] shrink-0" />
                {t("errors.summary", { count: errorFields.length })}
              </p>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-9">
                {errorFields.map((field) => (
                  <li key={field}>
                    <a
                      href={`#${fieldId(field)}`}
                      className="font-bold underline decoration-1 underline-offset-4 hover:decoration-2"
                    >
                      {errorMessage(field)}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId("name")}>{t("fields.name")}</Label>
          <Input
            id={fieldId("name")}
            name="name"
            autoComplete="name"
            required
            maxLength={CONTACT_LIMITS.nameMax}
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={describedBy("name")}
            onChange={() => clearError("name")}
          />
          {fieldError("name")}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId("email")}>{t("fields.email")}</Label>
          <Input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={CONTACT_LIMITS.emailMax}
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={describedBy("email")}
            onChange={() => clearError("email")}
          />
          {fieldError("email")}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId("organization")}>
            {t("fields.organization")}
          </Label>
          <Input
            id={fieldId("organization")}
            name="organization"
            autoComplete="organization"
            maxLength={CONTACT_LIMITS.organizationMax}
            aria-invalid={errors.organization ? "true" : undefined}
            aria-describedby={describedBy("organization")}
            onChange={() => clearError("organization")}
          />
          {fieldError("organization")}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId("subject")}>{t("fields.subject")}</Label>
          <div className="relative">
            <select
              id={fieldId("subject")}
              name="subject"
              required
              defaultValue=""
              aria-invalid={errors.subject ? "true" : undefined}
              aria-describedby={describedBy("subject")}
              onChange={() => clearError("subject")}
              className="flex h-11 w-full appearance-none rounded-lg border border-input bg-card pl-3.5 pr-10 text-base text-foreground transition-colors duration-150 hover:border-primary focus:border-primary aria-[invalid=true]:border-destructive"
            >
              <option value="" disabled>
                {t("fields.subjectPlaceholder")}
              </option>
              {CONTACT_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {t(`subjects.${subject}`)}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
          </div>
          {fieldError("subject")}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={fieldId("message")}>{t("fields.message")}</Label>
        <p id="contact-message-hint" className="text-sm text-muted-foreground">
          {t("fields.messageHint")}
        </p>
        <Textarea
          id={fieldId("message")}
          name="message"
          required
          rows={7}
          maxLength={CONTACT_LIMITS.messageMax}
          aria-invalid={errors.message ? "true" : undefined}
          aria-describedby={describedBy("message", "contact-message-hint")}
          onChange={() => clearError("message")}
        />
        {fieldError("message")}
      </div>

      {/* Champ piège : hors écran et hors tabulation. Un humain ne le voit
          pas ; un robot qui remplit tout se trahit. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={`contact-${HONEYPOT_FIELD}`}>{t("fields.honeypot")}</label>
        <input
          id={`contact-${HONEYPOT_FIELD}`}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {t.rich("privacy", {
          link: (chunks) => (
            <Link
              href="/privacy"
              className="font-bold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>

      <Button type="submit" size="lg" className="self-start" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}
