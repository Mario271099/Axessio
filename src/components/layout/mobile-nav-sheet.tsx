"use client";

// Drawer de navigation mobile — affiché sous lg (1024px), où la sidebar
// desktop est cachée. Réutilise la config SECTIONS partagée pour rester
// strictement aligné avec la sidebar desktop.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { ICONS, SECTIONS, type NavCounts } from "@/components/layout/nav-config";
import { can, canAny, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { OrganizationMembership, Profile } from "@/types/domain";

interface Props {
  profile: Profile;
  counts: NavCounts;
  org: {
    current: OrganizationMembership | null;
    available: OrganizationMembership[];
  };
  brandLogoUrl: string | null;
  orgPermissions?: Permission[];
}

export function MobileNavSheet({
  profile,
  counts,
  org,
  brandLogoUrl,
  orgPermissions,
}: Props) {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const userRole = profile.role;
  const orgPerms = new Set(orgPermissions ?? []);

  return (
    <Dialog.Root>
      <Dialog.Trigger
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={t("openMenu")}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out",
            "data-[state=open]:animate-in data-[state=open]:fade-in",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card shadow-xl",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-left",
          )}
        >
          <Dialog.Title className="sr-only">{t("navAria")}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {t("mobileNavDesc")}
          </Dialog.Description>

          {/* Header : brand + close */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link
              href="/dashboard"
              aria-label={t("brandHomeAria")}
              className="-mx-2 inline-flex items-center gap-2 rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {brandLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brandLogoUrl}
                  alt=""
                  className="h-7 w-auto max-w-[10rem] object-contain"
                />
              ) : (
                <Logo size="md" />
              )}
            </Link>
            <Dialog.Close
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("closeMenu")}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {/* OrgSwitcher */}
          <div className="border-b border-border p-3">
            <OrgSwitcher current={org.current} available={org.available} />
          </div>

          {/* Nav */}
          <nav
            aria-label={t("navAria")}
            className="flex-1 space-y-5 overflow-y-auto p-3"
          >
            {SECTIONS.map((section) => {
              const visibleItems = section.items.filter((item) =>
                item.permission === null
                  ? true
                  : item.orgScoped
                    ? canAny(userRole, orgPerms, item.permission)
                    : can(userRole, item.permission),
              );
              if (visibleItems.length === 0) return null;
              return (
                <div key={section.sectionKey}>
                  <h2 className="px-3 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t(`sections.${section.sectionKey}`)}
                  </h2>
                  <ul className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                      const Icon = ICONS[item.iconKey];
                      const badgeValue = item.badgeKey
                        ? counts[item.badgeKey]
                        : 0;
                      return (
                        <li key={item.href}>
                          <Dialog.Close asChild>
                            <Link
                              href={item.href}
                              aria-current={isActive ? "page" : undefined}
                              className={cn(
                                "relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-all duration-150",
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                              )}
                            >
                              {isActive && (
                                <span
                                  aria-hidden="true"
                                  className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-primary"
                                />
                              )}
                              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                              <span className="flex-1 truncate">
                                {t(`items.${item.itemKey}`)}
                              </span>
                              {badgeValue > 0 && (
                                <Badge variant="secondary" className="ml-auto">
                                  {badgeValue}
                                </Badge>
                              )}
                            </Link>
                          </Dialog.Close>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
