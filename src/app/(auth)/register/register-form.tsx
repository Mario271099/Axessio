"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Building2,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasDigit: boolean;
}

function evaluatePassword(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /[0-9]/.test(password),
  };
}

const STRENGTH_KEYS = ["tooShort", "weak", "medium", "strong"] as const;
const STRENGTH_COLORS = [
  "bg-muted-foreground/30",
  "bg-destructive",
  "bg-warning",
  "bg-success",
] as const;

// Codes d'erreur renvoyés par /api/auth/register → clés i18n auth.register.errors.
const ERROR_CODES = new Set([
  "missing",
  "invalidEmail",
  "weakPassword",
  "emailTaken",
  "rateLimited",
  "server",
]);

export function RegisterForm() {
  const t = useTranslations("auth.register");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const criteria = useMemo(() => evaluatePassword(password), [password]);
  const strength =
    Number(criteria.minLength) +
    Number(criteria.hasUppercase) +
    Number(criteria.hasDigit);
  const strengthKey = STRENGTH_KEYS[strength] ?? STRENGTH_KEYS[0];
  const strengthColor = STRENGTH_COLORS[strength] ?? STRENGTH_COLORS[0];
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
    // côté client — convention d'auth du projet).
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
    // avant le dashboard — incitation sans friction (cf. flux en deux temps).
    window.location.href = "/onboarding/plan";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <p
          id="form-error"
          role="alert"
          className="inline-flex w-full items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              aria-required="true"
              placeholder={t("firstNamePlaceholder")}
              className="pl-9"
              disabled={pending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              aria-required="true"
              placeholder={t("lastNamePlaceholder")}
              className="pl-9"
              disabled={pending}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization">{t("organization")}</Label>
        <div className="relative">
          <Building2
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="organization"
            name="organization"
            type="text"
            autoComplete="organization"
            required
            aria-required="true"
            aria-describedby="organization-hint"
            placeholder={t("organizationPlaceholder")}
            className="pl-9"
            disabled={pending}
          />
        </div>
        <p id="organization-hint" className="text-xs text-muted-foreground">
          {t("organizationHint")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            placeholder={t("emailPlaceholder")}
            className="pl-9"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            aria-required="true"
            aria-describedby="password-strength password-criteria"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-9 pr-10"
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            aria-pressed={showPassword}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Indicateur de force */}
        <div id="password-strength" className="space-y-1">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < strength ? strengthColor : "bg-muted",
                )}
              />
            ))}
          </div>
          <p
            className={cn(
              "text-xs tabular-nums",
              strength === 0 && "text-muted-foreground",
              strength === 1 && "text-destructive",
              strength === 2 && "text-warning",
              strength === 3 && "text-success",
            )}
            aria-live="polite"
          >
            {t("strength", { label: t(`strengthLevels.${strengthKey}`) })}
          </p>
        </div>

        {/* Critères */}
        <ul
          id="password-criteria"
          className="space-y-1 pt-1 text-xs text-muted-foreground"
        >
          <Criterion ok={criteria.minLength}>{t("criteria.minLength")}</Criterion>
          <Criterion ok={criteria.hasUppercase}>{t("criteria.uppercase")}</Criterion>
          <Criterion ok={criteria.hasDigit}>{t("criteria.digit")}</Criterion>
        </ul>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || !allCriteriaMet}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">{t("terms")}</p>
    </form>
  );
}

function Criterion({
  ok,
  children,
}: {
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5 transition-colors",
        ok && "text-success",
      )}
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full",
          ok ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
        )}
        aria-hidden="true"
      >
        <Check className="h-2.5 w-2.5" />
      </span>
      <span>{children}</span>
    </li>
  );
}
