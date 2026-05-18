import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "./login-form";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  const locale = await getLocale();
  // Le h1 de la page (« Bon retour ») est un message d'accueil — pas idéal
  // pour le <title>. On reprend un libellé SEO-friendly côté méta.
  const metaTitle = locale === "en" ? "Sign in" : "Connexion";
  return {
    title: metaTitle,
    description: t("subtitle"),
    alternates: { canonical: "/login" },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: `${metaTitle} · ${SITE.name}`,
      description: t("subtitle"),
      url: `${SITE.url}/login`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${metaTitle} · ${SITE.name}`,
      description: t("subtitle"),
    },
  };
}

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
