"use client";

// Drawer de navigation mobile - affiché sous lg (1024px), où la sidebar
// desktop est cachée. Réutilise la config SECTIONS partagée ET le composant
// <NavLink> de la sidebar pour rester strictement aligné avec elle.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { NavLink } from "@/components/layout/nav-link";
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
        className="inline-flex size-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
        aria-label={t("openMenu")}
      >
        <Menu className="size-5" aria-hidden="true" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out",
            "data-[state=open]:animate-in data-[state=open]:fade-in",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card shadow-float",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-left",
          )}
        >
          <Dialog.Title className="sr-only">{t("navAria")}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {t("mobileNavDesc")}
          </Dialog.Description>

          {/* Header : brand + close */}
          <div className="flex h-[72px] items-center justify-between px-4">
            <Link
              href="/dashboard"
              aria-label={t("brandHomeAria")}
              className="inline-flex items-center gap-2 rounded-lg px-1 py-1"
            >
              {brandLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brandLogoUrl}
                  alt=""
                  className="h-7 w-auto max-w-40 object-contain"
                />
              ) : (
                <Logo size="md" />
              )}
            </Link>
            <Dialog.Close
              className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              aria-label={t("closeMenu")}
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {/* OrgSwitcher */}
          <div className="px-4 pb-3">
            <OrgSwitcher current={org.current} available={org.available} />
          </div>

          {/* Nav */}
          <nav
            aria-label={t("navAria")}
            className="flex-1 space-y-5 overflow-y-auto px-4 pb-4"
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
                  {section.sectionKey !== "main" && (
                    <h2 className="px-3 pb-1.5 text-xs font-bold text-muted-foreground">
                      {t(`sections.${section.sectionKey}`)}
                    </h2>
                  )}
                  <ul className="space-y-0.5">
                    {visibleItems.map((item) => (
                      <li key={item.href}>
                        <Dialog.Close asChild>
                          <NavLink
                            href={item.href}
                            label={t(`items.${item.itemKey}`)}
                            icon={ICONS[item.iconKey]}
                            active={
                              pathname === item.href ||
                              pathname.startsWith(`${item.href}/`)
                            }
                            badge={
                              item.badgeKey ? counts[item.badgeKey] : 0
                            }
                          />
                        </Dialog.Close>
                      </li>
                    ))}
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
