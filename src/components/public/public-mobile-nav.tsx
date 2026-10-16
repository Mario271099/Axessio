"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PUBLIC_NAV } from "@/components/public/public-nav-links";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  sheetNavLink,
} from "@/components/ui/sheet";

// Menu de navigation compact (< xl : avec ses sous-menus, la navigation
// complete ne tient pas sur une ligne sous 1280 px). Reprend les liens caches
// du header + les CTA connexion/inscription, dans un Sheet accessible.
export function PublicMobileNav({
  currentHref,
}: {
  currentHref?: string;
} = {}) {
  const t = useTranslations("home");
  const tRelated = useTranslations("marketing.related");
  const locale = useLocale();
  const isEn = locale === "en";

  const openLabel = isEn ? "Open menu" : "Ouvrir le menu";
  const navLabel = isEn ? "Menu" : "Menu";


  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="xl:hidden"
          aria-label={openLabel}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        closeLabel={isEn ? "Close menu" : "Fermer le menu"}
      >
        <SheetTitle>{navLabel}</SheetTitle>
        <nav aria-label={navLabel}>
          <ul className="flex flex-col gap-1">
            {PUBLIC_NAV.map((entry) =>
              entry.kind === "group" ? (
                <li key={entry.key} className="mt-2">
                  {/* Intertitre du groupe : la liste imbriquée porte son nom. */}
                  <p
                    id={`mobile-nav-${entry.key}`}
                    className="px-3.5 pb-1 text-sm font-extrabold text-muted-foreground"
                  >
                    {t(`nav.${entry.key}`)}
                  </p>
                  <ul
                    aria-labelledby={`mobile-nav-${entry.key}`}
                    className="flex flex-col gap-1"
                  >
                    {entry.items.map((item) => (
                      <li key={item.href}>
                        <SheetClose asChild>
                          <Link
                            href={item.href}
                            className={sheetNavLink(item.href === currentHref)}
                            aria-current={
                              item.href === currentHref ? "page" : undefined
                            }
                          >
                            {tRelated(`${item.key}.title`)}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={entry.key}>
                  <SheetClose asChild>
                    <Link
                      href={entry.href}
                      className={sheetNavLink(entry.href === currentHref)}
                      aria-current={
                        entry.href === currentHref ? "page" : undefined
                      }
                    >
                      {t(`nav.${entry.key}`)}
                    </Link>
                  </SheetClose>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <SheetClose asChild>
            <Button asChild variant="outline">
              <Link href="/login">{t("nav.login")}</Link>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button asChild>
              <Link href="/register">{t("nav.getStarted")}</Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
