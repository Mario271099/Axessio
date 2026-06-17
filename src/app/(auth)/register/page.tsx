import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "./register-form";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  const locale = await getLocale();
  const metaTitle = locale === "en" ? "Sign up" : "Inscription";
  return {
    title: metaTitle,
    description: t("subtitle"),
    // Page utilitaire : pas d'interet a l'indexer (formulaire de creation).
    robots: { index: false, follow: false },
    alternates: { canonical: "/register" },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: `${metaTitle} · ${SITE.name}`,
      description: t("subtitle"),
      url: `${SITE.url}/register`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${metaTitle} · ${SITE.name}`,
      description: t("subtitle"),
    },
  };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          {t("footer")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
          >
            {t("footerCta")}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
