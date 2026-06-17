"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Menu de navigation mobile (< sm). Reprend les liens caches sur petit ecran
// dans le header + les CTA connexion/inscription, dans un Sheet accessible.
export function PublicMobileNav() {
  const t = useTranslations("home");
  const locale = useLocale();
  const isEn = locale === "en";

  const openLabel = isEn ? "Open menu" : "Ouvrir le menu";
  const navLabel = isEn ? "Menu" : "Menu";

  const links = [
    { href: "/#features", label: t("nav.features") },
    { href: "/#standards", label: t("nav.standards") },
    { href: "/pricing", label: t("nav.pricing") },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="sm:hidden"
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
          <ul className="flex flex-col gap-1 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <SheetClose asChild>
                  <Link
                    href={link.href}
                    className="block rounded-md px-3 py-2 text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              </li>
            ))}
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
              <Link href="/register">{t("nav.register")}</Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
