"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import {
  PASSWORD_STRENGTH_KEYS,
  PasswordStrength,
  evaluatePassword,
  passwordScore,
} from "@/components/auth/password-strength";
import { createClient } from "@/lib/supabase/client";

// Codes d'erreur renvoyés par /api/auth/register → clés i18n auth.register.errors.
const ERROR_CODES = new Set([
  "missing",
  "invalidEmail",
  "weakPassword",
  "emailTaken",
  "rateLimited",
  "server",
]);

export function RegisterForm({ plan }: { plan?: string }) {
  const t = useTranslations("auth.register");

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const criteria = useMemo(() => evaluatePassword(password), [password]);
  const strength = passwordScore(criteria);
  const strengthKey = PASSWORD_STRENGTH_KEYS[strength] ?? PASSWORD_STRENGTH_KEYS[0];
  const allCriteriaMet =
    criteria.minLength && criteria.hasUppercase && criteria.hasDigit;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const firstName = formData.get("firstName")?.toString().trim() ?? "";
    const lastName = formData.get("lastName")?.toString().trim() ?? "";
    const organization = formData.get("organization")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";

    if (!firstName || !lastName || !organization || !email || !password) {
      setError(t("errors.missing"));
      return;
    }
    if (!allCriteriaMet) {
      setError(t("errors.weakPassword"));
      return;
    }

    setPending(true);

    let res: Response;
    try {
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          organization,
          email,
          password,
        }),
      });
    } catch {
      setError(t("errors.server"));
      setPending(false);
      return;
    }

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        retryAfter?: number;
      };
      if (data.error === "rateLimited") {
        setError(t("errors.rateLimited", { seconds: data.retryAfter ?? 60 }));
      } else if (data.error && ERROR_CODES.has(data.error)) {
        setError(t(`errors.${data.error}`));
      } else {
        setError(t("errors.server"));
      }
      setPending(false);
      return;
    }

    // Compte + org provisionnés côté serveur. On ouvre la session DANS le
    // navigateur (le cookie n'est posé de façon fiable que par signInWithPassword
    // côté client - convention d'auth du projet).
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(t("errors.signInFailed"));
      setPending(false);
      return;
    }

    // Navigation brute : force l'envoi du cookie dès la première requête.
    // On passe par l'étape de choix du plan (Free pré-sélectionné, skippable)
    // avant le dashboard - incitation sans friction (cf. flux en deux temps).
    // Si l'inscription vient d'un clic sur un plan (page Tarifs), on porte ce
    // plan jusqu'à l'onboarding qui le pré-sélectionne pour finaliser l'achat.
    window.location.href = plan
      ? `/onboarding/plan?plan=${plan}`
      : "/onboarding/plan";
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
      {error && (
        <p
          id="form-error"
          role="alert"
          className="flex w-full items-start gap-2.5 rounded-row bg-severity-critical-bg px-3.5 py-3 text-[0.95rem] leading-snug text-severity-critical"
        >
          <AlertCircle className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            aria-required="true"
            placeholder={t("firstNamePlaceholder")}
            disabled={pending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            aria-required="true"
            placeholder={t("lastNamePlaceholder")}
            disabled={pending}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="organization">{t("organization")}</Label>
        <Input
          id="organization"
          name="organization"
          type="text"
          autoComplete="organization"
          required
          aria-required="true"
          aria-describedby="organization-hint"
          placeholder={t("organizationPlaceholder")}
          disabled={pending}
        />
        <p id="organization-hint" className="text-[0.8rem] text-muted-foreground">
          {t("organizationHint")}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-required="true"
          placeholder={t("emailPlaceholder")}
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <PasswordField
          id="password"
          name="password"
          autoComplete="new-password"
          required
          aria-required="true"
          aria-describedby="password-strength"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={pending}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
        />
        <PasswordStrength
          id="password-strength"
          criteria={criteria}
          score={strength}
          strengthLabel={t("strength", {
            label: t(`strengthLevels.${strengthKey}`),
          })}
          criteriaLabels={[
            t("criteria.minLength"),
            t("criteria.uppercase"),
            t("criteria.digit"),
          ]}
          metLabel={t("criteriaMet")}
          unmetLabel={t("criteriaUnmet")}
        />
      </div>

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            {t("submitting")}
          </>
        ) : (
          <>
            {t("submit")}
            <ArrowRight data-anim="go" aria-hidden="true" />
          </>
        )}
      </Button>

      <p className="text-[0.8rem] text-muted-foreground">
        {t.rich("terms", {
          terms: (chunks) => (
            <Link
              href="/legal"
              className="font-medium text-foreground underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded"
            >
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link
              href="/privacy"
              className="font-medium text-foreground underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}

