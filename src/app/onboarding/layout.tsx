import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand";

// Onboarding post-inscription : vue authentifiée et transitoire (l'utilisateur
// vient de créer son compte). On coupe l'indexation comme pour le dashboard et
// on garde une chrome minimale (pas de sidebar) pour rester focalisé sur le
// choix du plan.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("sidebar");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 max-w-6xl items-center px-6">
          <Link
            href="/dashboard"
            aria-label={t("brandHomeAria")}
            className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Logo size="md" />
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
    </div>
  );
}
