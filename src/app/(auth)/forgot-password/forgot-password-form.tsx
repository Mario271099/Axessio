"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString().trim() ?? "";
    if (!email) {
      setError(t("errors.missing"));
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        // Le lien réel du mail est piloté par le template Supabase
        // (`{{ .SiteURL }}/api/auth/confirm?...&next=/reset-password`), ce
        // qui garantit le bon domaine (Site URL) et le passage par notre
        // route de confirmation SSR. `redirectTo` ne sert ici que de repli.
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );
    setPending(false);

    // Sécurité : ne révèle PAS si l'email existe ou pas. Quel que soit le
    // retour, on affiche le message générique de succès - un attaquant ne
    // peut pas énumérer les comptes via cette page. L'erreur réelle est
    // silencieusement absorbée (sauf rate-limit potentiel à plus long terme).
    if (resetError) {
      // On loggue côté console pour debug local mais on n'affiche rien.
      console.warn("[forgot-password] reset request error:", resetError.message);
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="inline-flex w-full items-start gap-3 rounded-md border border-success/40 bg-success/10 p-4 text-sm text-success"
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-medium">{t("successTitle")}</p>
            <p className="text-success/80">{t("successDesc")}</p>
          </div>
        </div>

        <Button asChild variant="ghost" className="w-full">
          <Link href="/login">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("backToLogin")}
          </Link>
        </Button>
      </div>
    );
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
            autoFocus
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>

      <Button asChild variant="ghost" className="w-full">
        <Link href="/login">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("backToLogin")}
        </Link>
      </Button>
    </form>
  );
}
