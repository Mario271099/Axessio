import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "./forgot-password-form";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forgotPassword");
  const locale = await getLocale();
  const metaTitle = locale === "en" ? "Forgot password" : "Mot de passe oublié";
  return {
    title: metaTitle,
    description: t("subtitle"),
    alternates: { canonical: "/forgot-password" },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: `${metaTitle} · ${SITE.name}`,
      description: t("subtitle"),
      url: `${SITE.url}/forgot-password`,
    },
  };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword");

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
      footer={t("footer")}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
