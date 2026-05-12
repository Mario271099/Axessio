import type { Metadata } from "next";
import { Wordmark } from "@/components/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace Axessio.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Wordmark scale={0.95} />
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
