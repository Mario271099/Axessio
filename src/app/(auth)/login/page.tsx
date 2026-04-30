import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace Axessio.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-xl font-bold" aria-hidden="true">A</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Axessio</h1>
          <p className="text-sm text-muted-foreground">
            Plateforme de gestion d&apos;audits d&apos;accessibilité
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-muted-foreground">
          Besoin d&apos;un accès ? Contactez l&apos;administrateur de votre organisation.
        </p>
      </div>
    </main>
  );
}
