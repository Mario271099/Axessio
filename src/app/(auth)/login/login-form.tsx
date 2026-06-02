"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    if (!email || !password) {
      setError(t("errors.missing"));
      setPending(false);
      return;
    }

    // Garde anti-brute-force serveur AVANT le sign-in. Si l'endpoint est
    // injoignable (réseau, déploiement), on ne bloque pas une connexion
    // légitime : on laisse passer (fail-open côté UX).
    try {
      const guard = await fetch("/api/auth/login-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (guard.status === 429) {
        const data = (await guard.json().catch(() => ({}))) as {
          retryAfter?: number;
        };
        setError(t("errors.rateLimited", { seconds: data.retryAfter ?? 60 }));
        setPending(false);
        return;
      }
    } catch {
      // endpoint indisponible → on continue sans bloquer.
    }

    const supabase = createClient();

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      // Trace l'échec côté serveur (fire-and-forget, sans bloquer l'UI).
      void fetch("/api/auth/login-failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
      setError(t("errors.signIn", { message: signInError.message }));
      setPending(false);
      return;
    }

    const { data: sessionCheck } = await supabase.auth.getSession();
    if (!sessionCheck.session && !data.session) {
      setError(t("errors.sessionFailed"));
      setPending(false);
      return;
    }

    // Navigation BRUTE qui force le navigateur à envoyer le cookie
    // dès la première requête. Pas de race possible avec le middleware.
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
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "form-error" : undefined}
            placeholder={t("emailPlaceholder")}
            className="pl-9"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("password")}</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
          >
            {t("forgotPassword")}
          </Link>
        </div>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-required="true"
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "form-error" : undefined}
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
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending}
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
