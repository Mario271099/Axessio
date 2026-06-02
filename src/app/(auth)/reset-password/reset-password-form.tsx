"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
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

/**
 * Variante de SetupPasswordForm dédiée au flow « mot de passe oublié ».
 * Différences :
 *  - libellés issus de `auth.resetPassword` (au lieu de `auth.setupPassword`)
 *  - redirection vers `/login` après succès (au lieu de `/dashboard`),
 *    pour forcer une re-saisie avec le nouveau mot de passe.
 */
export function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword");
  const tLogin = useTranslations("auth.login");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
  const strengthLabel = t(`strengthLevels.${strengthKey}`);

  const allCriteriaMet =
    criteria.minLength && criteria.hasUppercase && criteria.hasDigit;
  const passwordsMatch = password.length > 0 && password === confirm;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!allCriteriaMet) {
      setError(t("errors.notMet"));
      return;
    }
    if (!passwordsMatch) {
      setError(t("errors.mismatch"));
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(t("errors.update", { message: updateError.message }));
      setPending(false);
      return;
    }

    // Déconnexion explicite : on veut que l'utilisateur se re-connecte avec
    // le nouveau mot de passe (et que tout device tiers soit aussi
    // invalidé par l'effet de bord de Supabase sur les sessions).
    await supabase.auth.signOut();
    window.location.href = "/login?reset=1";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <p
          id="form-error"
          role="alert"
          className="inline-flex w-full items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>{error}</span>
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="new-password">{t("newPassword")}</Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="new-password"
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
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={
              showPassword ? tLogin("hidePassword") : tLogin("showPassword")
            }
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
            {t("strength", { label: strengthLabel })}
          </p>
        </div>

        <ul
          id="password-criteria"
          className="space-y-1 pt-1 text-xs text-muted-foreground"
        >
          <Criterion ok={criteria.minLength}>{t("criteria.minLength")}</Criterion>
          <Criterion ok={criteria.hasUppercase}>{t("criteria.uppercase")}</Criterion>
          <Criterion ok={criteria.hasDigit}>{t("criteria.digit")}</Criterion>
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="confirm-password"
            name="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            aria-required="true"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="pl-9"
            disabled={pending}
          />
        </div>
        {confirm.length > 0 && !passwordsMatch && (
          <p className="text-xs text-destructive" aria-live="polite">
            {t("mismatch")}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || !allCriteriaMet || !passwordsMatch}
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
