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

interface RegisterPageProps {
  searchParams: Promise<{ plan?: string }>;
}

// Plans actionnables depuis le parcours d'achat (Free/Enterprise n'ouvrent pas
// de checkout). On valide la valeur d'URL pour ne porter qu'une intention réelle.
const ACTIONABLE_PLANS = new Set(["starter", "pro"]);

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const t = await getTranslations("auth.register");
  const sp = await searchParams;

  // `?plan=starter|pro` : intention d'achat venue de la page Tarifs. On la
  // propage à l'inscription (redirige vers l'onboarding avec le plan choisi) et
  // au lien « déjà un compte ? » (qui repasse par /login en conservant le plan).
  const plan =
    typeof sp.plan === "string" && ACTIONABLE_PLANS.has(sp.plan)
      ? sp.plan
      : undefined;

  // Un utilisateur existant qui clique sur un plan doit pouvoir se connecter
  // sans perdre son intention : on cible l'onboarding via `next`.
  const loginHref = plan
    ? `/login?next=${encodeURIComponent(`/onboarding/plan?plan=${plan}`)}`
    : "/login";

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          {t("footer")}{" "}
          <Link
            href={loginHref}
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
          >
            {t("footerCta")}
          </Link>
        </>
      }
    >
      <RegisterForm plan={plan} />
    </AuthLayout>
  );
}
