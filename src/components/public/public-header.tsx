import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export function PublicHeader() {
  const t = useTranslations("home");
  const locale = useLocale();
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={SITE.name}
        >
          <Logo size="md" />
        </Link>

        <nav aria-label={locale === "en" ? "Primary" : "Principale"}>
          <ul className="flex items-center gap-2 text-sm">
            <li className="hidden sm:block">
              <Link
                href="/#features"
                className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("nav.features")}
              </Link>
            </li>
            <li className="hidden sm:block">
              <Link
                href="/#standards"
                className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("nav.standards")}
              </Link>
            </li>
            <li className="hidden sm:block">
              <Link
                href="/pricing"
                className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("nav.pricing")}
              </Link>
            </li>
            <li>
              <Button asChild size="sm">
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
