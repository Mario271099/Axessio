import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { PublicLocaleSwitcher } from "@/components/public/public-locale-switcher";
import { PublicMobileNav } from "@/components/public/public-mobile-nav";
import { PUBLIC_NAV_LINKS } from "@/components/public/public-nav-links";
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
      <div className="container mx-auto flex h-20 max-w-7xl items-center gap-8 px-6 lg:px-9 xl:gap-10">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg"
          aria-label={SITE.name}
        >
          <Logo size="md" />
        </Link>

        <nav
          aria-label={locale === "en" ? "Primary" : "Principale"}
          className="hidden lg:block"
        >
          <ul className="flex items-center gap-6 xl:gap-8">
            {PUBLIC_NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={navLink}>
                  {t(`nav.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <PublicLocaleSwitcher />
          <Button asChild variant="ghost" className="hidden lg:inline-flex">
            <Link href="/login">{t("nav.login")}</Link>
          </Button>
          <Button asChild className="hidden lg:inline-flex">
            <Link href="/register">{t("nav.getStarted")}</Link>
          </Button>
          <PublicMobileNav />
        </div>
      </div>
    </header>
  );
}
