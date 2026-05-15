"use client";

import { useMemo, useState, type FormEvent } from "react";
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

interface SetupPasswordFormProps {
  email: string;
}

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

function passwordStrength(criteria: PasswordCriteria): number {
  return (
    Number(criteria.minLength) +
    Number(criteria.hasUppercase) +
    Number(criteria.hasDigit)
  );
}

const STRENGTH_META = [
  { label: "Trop court", color: "bg-muted-foreground/30" },
  { label: "Faible", color: "bg-destructive" },
  { label: "Moyen", color: "bg-warning" },
  { label: "Fort", color: "bg-success" },
] as const;

export function SetupPasswordForm({ email }: SetupPasswordFormProps) {
  void email; // affiché dans le footer parent

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const criteria = useMemo(() => evaluatePassword(password), [password]);
  const strength = passwordStrength(criteria);
  const meta = STRENGTH_META[strength] ?? STRENGTH_META[0];

  const allCriteriaMet =
    criteria.minLength && criteria.hasUppercase && criteria.hasDigit;
  const passwordsMatch = password.length > 0 && password === confirm;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!allCriteriaMet) {
      setError("Le mot de passe ne respecte pas les critères requis.");
      return;
    }
    if (!passwordsMatch) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(`Erreur : ${updateError.message}`);
      setPending(false);
      return;
    }

    window.location.href = "/dashboard";
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
        <Label htmlFor="new-password">Nouveau mot de passe</Label>
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
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={
              showPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
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

        {/* Indicateur de force */}
        <div id="password-strength" className="space-y-1">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < strength ? meta.color : "bg-muted",
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
            Force du mot de passe : {meta.label}
          </p>
        </div>

        {/* Critères */}
        <ul
          id="password-criteria"
          className="space-y-1 pt-1 text-xs text-muted-foreground"
        >
          <Criterion ok={criteria.minLength}>8 caractères minimum</Criterion>
          <Criterion ok={criteria.hasUppercase}>Une majuscule</Criterion>
          <Criterion ok={criteria.hasDigit}>Un chiffre</Criterion>
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
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
            Les mots de passe ne correspondent pas.
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
            Activation en cours…
          </>
        ) : (
          "Activer mon compte"
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
