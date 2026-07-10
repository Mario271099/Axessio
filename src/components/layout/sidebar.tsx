"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronUp, Eye, LogOut, Settings, Shield, UserCircle } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Logo } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { USER_ROLE_BADGE_VARIANT, USER_ROLE_LABELS } from "@/lib/constants";
import { can, canAny, canImpersonateAs, type Permission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { exitImpersonationAndRedirect } from "@/app/(dashboard)/admin/impersonation/actions";
import { ImpersonationLauncher } from "@/components/layout/impersonation-launcher";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { ICONS, SECTIONS, type NavCounts } from "@/components/layout/nav-config";
import type { Profile } from "@/types/domain";

export type { NavCounts };

interface SidebarProps {
  profile: Profile;
  counts: NavCounts;
  /** Org active + liste des memberships pour le switcher. */
  org: {
    current: import("@/types/domain").OrganizationMembership | null;
    available: import("@/types/domain").OrganizationMembership[];
  };
  /** Logo personnalisé de l'org active (Enterprise). Null = logo Axessyo. */
  brandLogoUrl?: string | null;
  /** Permissions atomiques effectives sur l'org active (rendu conditionnel). */
  orgPermissions?: Permission[];
}

export function Sidebar({
  profile,
  counts,
  org,
  brandLogoUrl,
  orgPermissions,
}: SidebarProps) {
  const pathname = usePathname();
  // Pour le filtrage sidebar on raisonne sur le rôle EFFECTIF (impersonation).
  // L'entrée "Voir comme" reste au contraire conditionnée par le rôle RÉEL.
  const userRole = profile.role;
  const orgPerms = new Set(orgPermissions ?? []);
  const impersonationOptions = canImpersonateAs(profile.realRole);
  const t = useTranslations("sidebar");

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      {/* Header sidebar - logo + nom de marque */}
      <div className="flex h-16 items-center border-b border-border px-4">
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
      </div>

      {/* Sélecteur d'organisation active */}
      <div className="border-b border-border p-3">
        <OrgSwitcher current={org.current} available={org.available} />
      </div>

      {/* Navigation */}
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
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-all duration-150",
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
                          <Badge
                            variant="secondary"
                            className="ml-auto h-5 px-1.5 text-[10px] tabular-nums"
                          >
                            {badgeValue}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer - user card + dropdown */}
      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                {initials(profile.firstName || "?", profile.lastName || "?")}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {profile.firstName} {profile.lastName}
                </p>
                <Badge
                  variant={USER_ROLE_BADGE_VARIANT[profile.role]}
                  className="h-5 px-1.5 text-[10px] font-medium"
                >
                  <Shield className="mr-1 h-2.5 w-2.5" aria-hidden="true" />
                  {USER_ROLE_LABELS[profile.role]}
                </Badge>
              </div>
              <ChevronUp
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <UserCircle className="h-4 w-4" aria-hidden="true" />
                {t("user.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" aria-hidden="true" />
                {t("user.settings")}
              </Link>
            </DropdownMenuItem>
            {profile.impersonating ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    void exitImpersonationAndRedirect();
                  }}
                  className="text-warning focus:bg-warning/10 focus:text-warning"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  {t("user.exitImpersonation")}
                </DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                void handleSignOut();
              }}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t("user.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!profile.impersonating && impersonationOptions.length > 0 && (
          <div className="mt-2 px-1">
            <ImpersonationLauncher
              availableRoles={impersonationOptions}
              triggerVariant="ghost"
            />
          </div>
        )}

        {/* Liens légaux - toujours accessibles depuis l'app authentifiée. */}
        <nav
          aria-label={t("legal.label")}
          className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-[11px] text-muted-foreground"
        >
          <Link
            href="/legal"
            className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("legal.mentions")}
          </Link>
          <Link
            href="/privacy"
            className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("legal.privacy")}
          </Link>
          <Link
            href="/cookies"
            className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("legal.cookies")}
          </Link>
        </nav>
      </div>
    </aside>
  );
}
