"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
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
      setError("Email et mot de passe requis.");
      setPending(false);
      return;
    }

    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );

    console.log("[LOGIN] Résultat signIn:", {
      hasUser: !!data.user,
      hasSession: !!data.session,
      error: signInError,
    });

    if (signInError) {
      console.error("[LOGIN] Erreur:", signInError);
      setError(`Erreur : ${signInError.message}`);
      setPending(false);
      return;
    }

    // Vérification : la session est-elle bien posée ?
    const { data: sessionCheck } = await supabase.auth.getSession();
    console.log("[LOGIN] Session après connexion:", {
      hasSession: !!sessionCheck.session,
    });

    if (!sessionCheck.session) {
      setError(
        "La session n'a pas pu être créée. Vérifie tes paramètres Supabase.",
      );
      setPending(false);
      return;
    }

    console.log("[LOGIN] Tout est bon, redirection vers /dashboard");

    // Navigation BRUTE qui force le navigateur à envoyer le cookie
    // dès la première requête. Pas de race possible avec le middleware.
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Adresse email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-required="true"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "form-error" : undefined}
          placeholder="vous@entreprise.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-required="true"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "form-error" : undefined}
        />
      </div>

      {error && (
        <p
          id="form-error"
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Connexion en cours…
          </>
        ) : (
          "Se connecter"
        )}
      </Button>
    </form>
  );
}
