import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace Axessio.",
};

export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          {t("footer")}{" "}
          <span className="font-medium text-foreground">{t("footerCta")}</span>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
