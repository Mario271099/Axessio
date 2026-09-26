import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { PublicLocaleSwitcher } from "@/components/public/public-locale-switcher";
import { PublicMobileNav } from "@/components/public/public-mobile-nav";
import { SITE } from "@/lib/site";

/** Lien de navigation publique : soulignement cobalt qui s'étend au survol. */
const navLink =
  "relative inline-flex items-center py-1.5 text-base font-bold text-secondary-foreground transition-colors duration-150 " +
  "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-bottom after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-200 " +
  "hover:text-foreground hover:after:scale-x-100";

export function PublicHeader() {
  const t = useTranslations("home");
  const locale = useLocale();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="container mx-auto flex h-20 max-w-7xl items-center gap-10 px-6 lg:px-9">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg"
          aria-label={SITE.name}
        >
          <Logo size="md" />
        </Link>

        <nav
          aria-label={locale === "en" ? "Primary" : "Principale"}
          className="hidden sm:block"
        >
          <ul className="flex items-center gap-8">
            <li>
              <Link href="/#features" className={navLink}>
                {t("nav.features")}
              </Link>
            </li>
            <li>
              <Link href="/#standards" className={navLink}>
                {t("nav.standards")}
              </Link>
            </li>
            <li>
              <Link href="/pricing" className={navLink}>
                {t("nav.pricing")}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <PublicLocaleSwitcher />
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/login">{t("nav.login")}</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/register">{t("nav.register")}</Link>
          </Button>
          <PublicMobileNav />
        </div>
      </div>
    </header>
  );
}
