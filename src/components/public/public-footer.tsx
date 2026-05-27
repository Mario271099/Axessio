import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AxIcon } from "@/components/brand";
import { SITE } from "@/lib/site";

export function PublicFooter() {
  const t = useTranslations("home");
  const locale = useLocale();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <AxIcon size={28} scheme="accent" aria-label="" />
          <div>
            <p className="text-sm font-semibold">{SITE.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>
        </div>

        <nav aria-label={locale === "en" ? "Footer" : "Pied de page"}>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                href="/login"
                className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("footer.links.login")}
              </Link>
            </li>
            <li>
              <Link
                href="/#features"
                className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("footer.links.features")}
              </Link>
            </li>
            <li>
              <Link
                href="/#standards"
                className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("footer.links.standards")}
              </Link>
            </li>
            <li>
              <Link
                href="/pricing"
                className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("footer.links.pricing")}
              </Link>
            </li>
            <li>
              <Link
                href="/legal"
                className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("footer.links.legal")}
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("footer.links.privacy")}
              </Link>
            </li>
            <li>
              <Link
                href="/cookies"
                className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("footer.links.cookies")}
              </Link>
            </li>
          </ul>
        </nav>

        <p className="text-xs text-muted-foreground">
          {t("footer.copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
