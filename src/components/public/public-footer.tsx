import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/brand";
import { SITE } from "@/lib/site";

/** Groupes de liens du pied de page, dans l'ordre des maquettes. */
const GROUPS = [
  {
    key: "product",
    links: [
      { href: "/#features", labelKey: "features" },
      { href: "/#standards", labelKey: "standards" },
      { href: "/pricing", labelKey: "pricing" },
    ],
  },
  {
    key: "account",
    links: [
      { href: "/login", labelKey: "login" },
      { href: "/register", labelKey: "register" },
    ],
  },
  {
    key: "info",
    links: [
      { href: "/legal", labelKey: "legal" },
      { href: "/privacy", labelKey: "privacy" },
      { href: "/cookies", labelKey: "cookies" },
      { href: "/accessibility", labelKey: "accessibility" },
    ],
  },
] as const;

export function PublicFooter() {
  const t = useTranslations("home");
  const locale = useLocale();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card pb-10 pt-14">
      <div className="container mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] lg:px-9">
        <div className="min-w-0">
          <Link href="/" className="inline-flex rounded-lg" aria-label={SITE.name}>
            <Logo size="md" />
          </Link>
          <p className="mt-3.5 max-w-[32ch] text-sm text-muted-foreground">
            {t("footer.tagline")}
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            {t("footer.copyright", { year })}
          </p>
        </div>

        {GROUPS.map((group) => (
          <nav
            key={group.key}
            aria-labelledby={`footer-${group.key}`}
            className="min-w-0"
          >
            <h2
              id={`footer-${group.key}`}
              className="text-base font-extrabold"
            >
              {t(`footer.groups.${group.key}`)}
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded text-sm text-secondary-foreground transition-colors hover:text-primary hover:underline hover:underline-offset-4"
                  >
                    {t(`footer.links.${link.labelKey}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <p className="sr-only">{locale === "en" ? "Footer" : "Pied de page"}</p>
    </footer>
  );
}
