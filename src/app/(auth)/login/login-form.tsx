"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth.login");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

    // Trace la connexion réussie (fire-and-forget ; keepalive pour survivre
    // à la navigation). La route vérifie la session - pas de spoof possible.
    void fetch("/api/auth/login-success", {
      method: "POST",
      keepalive: true,
    }).catch(() => {});

    // Navigation BRUTE qui force le navigateur à envoyer le cookie
    // dès la première requête. Pas de race possible avec le middleware.
    // `next` (chemin interne validé côté serveur) prime sur le dashboard
    // pour ramener l'utilisateur là où il voulait aller (ex. choix d'un plan).
    window.location.href = next ?? "/dashboard";
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
        <Label htmlFor="email">{t("email")}</Label>
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
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="password">{t("password")}</Label>
          <Link
            href="/forgot-password"
            className="rounded text-[0.84rem] font-bold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            {t("forgotPassword")}
          </Link>
        </div>
        <PasswordField
          id="password"
          name="password"
          autoComplete="current-password"
          required
          aria-required="true"
          aria-describedby={error ? "form-error" : undefined}
          placeholder="••••••••"
          disabled={pending}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
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
    </form>
  );
}
