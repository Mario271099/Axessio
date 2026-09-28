"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import {
  PASSWORD_STRENGTH_KEYS,
  PasswordStrength,
  evaluatePassword,
  passwordScore,
} from "@/components/auth/password-strength";
import { createClient } from "@/lib/supabase/client";

interface SetupPasswordFormProps {
  email: string;
}

export function SetupPasswordForm({ email }: SetupPasswordFormProps) {
  void email; // affiché dans le footer parent
  const t = useTranslations("auth.setupPassword");
  const tLogin = useTranslations("auth.login");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const criteria = useMemo(() => evaluatePassword(password), [password]);
  const strength = passwordScore(criteria);
  const strengthKey =
    PASSWORD_STRENGTH_KEYS[strength] ?? PASSWORD_STRENGTH_KEYS[0];
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
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(t("errors.update", { message: updateError.message }));
      setPending(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password">{t("newPassword")}</Label>
        <PasswordField
          id="new-password"
          name="password"
          autoComplete="new-password"
          required
          aria-required="true"
          aria-describedby="password-strength"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={pending}
          autoFocus
          showLabel={tLogin("showPassword")}
          hideLabel={tLogin("hidePassword")}
        />
        <PasswordStrength
          id="password-strength"
          criteria={criteria}
          score={strength}
          strengthLabel={t("strength", { label: strengthLabel })}
          criteriaLabels={[
            t("criteria.minLength"),
            t("criteria.uppercase"),
            t("criteria.digit"),
          ]}
          metLabel={t("criteriaMet")}
          unmetLabel={t("criteriaUnmet")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
        <PasswordField
          id="confirm-password"
          name="confirm"
          autoComplete="new-password"
          required
          aria-required="true"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          disabled={pending}
          showLabel={tLogin("showPassword")}
          hideLabel={tLogin("hidePassword")}
        />
        {confirm.length > 0 && !passwordsMatch && (
          <p className="text-[0.8rem] font-bold text-destructive" aria-live="polite">
            {t("mismatch")}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-1 w-full"
        disabled={pending || !allCriteriaMet || !passwordsMatch}
      >
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
    </form>
  );
}

