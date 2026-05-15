import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SetupPasswordForm } from "./setup-password-form";

export const metadata: Metadata = {
  title: "Activer mon compte",
  description: "Définissez votre mot de passe pour activer votre compte.",
};

export default async function SetupPasswordPage() {
  // L'utilisateur doit déjà avoir une session (créée via le lien magique
  // d'invitation reçu par email). Sinon on le renvoie au login.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthLayout
      title="Bienvenue !"
      subtitle="Définissez votre mot de passe pour activer votre compte."
      footer={
        <>
          Connecté en tant que{" "}
          <span className="font-medium text-foreground">{user.email}</span>
        </>
      }
    >
      <SetupPasswordForm email={user.email ?? ""} />
    </AuthLayout>
  );
}
