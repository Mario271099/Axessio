import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SetupPasswordForm } from "./setup-password-form";

export const metadata: Metadata = {
  title: "Activer mon compte",
  description: "Définissez votre mot de passe pour activer votre compte.",
  // Page utilitaire d'auth : hors index (comme /login et /register).
  robots: { index: false, follow: false },
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

  const t = await getTranslations("auth.setupPassword");

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          {t("footerPrefix")}{" "}
          <span className="font-medium text-foreground">{user.email}</span>
        </>
      }
    >
      <SetupPasswordForm email={user.email ?? ""} />
    </AuthLayout>
  );
}
