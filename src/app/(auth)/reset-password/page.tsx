import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "./reset-password-form";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.resetPassword");
  const locale = await getLocale();
  const metaTitle =
    locale === "en" ? "Reset password" : "Réinitialiser le mot de passe";
  return {
    title: metaTitle,
    description: t("subtitle"),
    // Page utilitaire d'auth : hors index (comme /login et /register).
    robots: { index: false, follow: false },
    alternates: { canonical: "/reset-password" },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: `${metaTitle} · ${SITE.name}`,
      description: t("subtitle"),
      url: `${SITE.url}/reset-password`,
    },
  };
}

/**
 * Page d'atterrissage du lien envoyé par email à l'utilisateur après
 * `/forgot-password`. Supabase crée automatiquement une session de
 * récupération côté cookie quand le lien est cliqué - on s'appuie dessus
 * pour autoriser l'`updateUser({ password })` côté form.
 *
 * Si pas de session valide (lien expiré, clic depuis un autre navigateur),
 * on affiche un état d'erreur qui invite à redemander un email.
 */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getTranslations("auth.resetPassword");

  if (!user) {
    return (
      <AuthLayout
        title={t("expiredTitle")}
        subtitle={t("expiredSubtitle")}
        footer={t("footer")}
      >
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/forgot-password">{t("requestNew")}</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

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
      <ResetPasswordForm />
    </AuthLayout>
  );
}
