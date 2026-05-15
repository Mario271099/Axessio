import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace Axessio.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bon retour"
      subtitle="Connectez-vous à votre espace Axessio"
      footer={
        <>
          Pas encore de compte ?{" "}
          <span className="font-medium text-foreground">
            Contactez votre administrateur.
          </span>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
