import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/brand";
import { StatusDot } from "@/components/ui/status-dot";
import { SUPPORTED_STANDARDS } from "@/lib/constants";
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

/**
 * `currentHref` : lien de la page courante, marqué `aria-current="page"`.
 */
export function PublicFooter({ currentHref }: { currentHref?: string } = {}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const year = new Date().getFullYear();
  return (
    // Surface encre : le pied de page ferme la lecture et se distingue du bloc
    // d'appel a l'action, qui est un bloc cobalt pose dans la largeur du texte.
    <footer className="bg-ink pb-10 pt-12 text-ink-foreground">
      <div className="container mx-auto max-w-7xl px-6 lg:px-9">
        {/* Bandeau de reassurance : ce que la plateforme couvre, et ou en est
            sa propre accessibilite. */}
        <div className="flex flex-wrap items-center gap-x-7 gap-y-4 border-b border-ink-raised pb-7">
          <p className="text-base font-extrabold">
            {t("footer.standardsLabel")}
          </p>
          <ul className="flex flex-wrap gap-2">
            {SUPPORTED_STANDARDS.map((standard) => (
              <li
                key={standard}
                className="rounded-full border border-ink-raised px-3.5 py-1 text-sm font-bold tabular-nums text-ink-muted"
              >
                {standard}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:ml-auto">
            <StatusDot color="hsl(var(--highlight))" className="text-ink-muted">
              {t("footer.a11yStatus")}
            </StatusDot>
            <Link
              href="/accessibility"
              className="rounded text-sm font-extrabold underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {t("a11yBlock.link")}
            </Link>
          </div>
        </div>

        {/* Colonnes -------------------------------------------------------- */}
        <div className="mt-9 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
          <div className="min-w-0">
            <Link
              href="/"
              className="inline-flex rounded-lg"
              aria-label={SITE.name}
            >
              {/* Variante prevue pour fond sombre (cf. components/brand). */}
              <Logo variant="light" size="md" />
            </Link>
            <p className="mt-3.5 max-w-[32ch] text-sm text-ink-muted">
              {t("footer.tagline")}
            </p>
            <p className="mt-6 text-sm text-ink-muted">
              {t("footer.copyright", { year })}
            </p>
          </div>

          {GROUPS.map((group) => (
            <nav
              key={group.key}
              aria-labelledby={`footer-${group.key}`}
              className="min-w-0"
            >
              <p id={`footer-${group.key}`} className="text-base font-extrabold">
                {t(`footer.groups.${group.key}`)}
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={
                        link.href === currentHref ? "page" : undefined
                      }
                      className="rounded text-sm text-ink-muted transition-colors hover:text-ink-foreground hover:underline hover:underline-offset-4 aria-[current=page]:font-bold aria-[current=page]:text-ink-foreground"
                    >
                      {t(`footer.links.${link.labelKey}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <p className="sr-only">{locale === "en" ? "Footer" : "Pied de page"}</p>
    </footer>
  );
}
