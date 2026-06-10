import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "./login-form";
import { LoginResetBanner } from "./login-reset-banner";
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

interface LoginPageProps {
  searchParams: Promise<{ reset?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const t = await getTranslations("auth.login");
  const sp = await searchParams;

  // `?reset=1` est posé par `/reset-password` après un changement réussi.
  // Affichage d'une bannière de succès pour confirmer à l'utilisateur que
  // sa demande a abouti.
  const showResetSuccess = sp.reset === "1";

  // `?next=/chemin` permet de revenir là où l'utilisateur voulait aller
  // (ex. depuis la page Tarifs après avoir choisi un plan). On n'accepte
  // que des chemins internes ("/...") pour éviter une redirection ouverte.
  const next =
    typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : undefined;

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          {t("footer")}{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
          >
            {t("footerCta")}
          </Link>
        </>
      }
    >
      {showResetSuccess && <LoginResetBanner />}
      <LoginForm next={next} />
    </AuthLayout>
  );
}
