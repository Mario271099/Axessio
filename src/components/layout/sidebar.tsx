"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronUp, Eye, LogOut, Settings, UserCircle } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Logo, LogoIcon } from "@/components/brand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { can, canAny, canImpersonateAs, type Permission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { exitImpersonationAndRedirect } from "@/app/(dashboard)/admin/impersonation/actions";
import { ImpersonationLauncher } from "@/components/layout/impersonation-launcher";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { NavLink, RailNavLink } from "@/components/layout/nav-link";
import {
  ICONS,
  SECTIONS,
  type NavCounts,
  type NavItem,
} from "@/components/layout/nav-config";
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

/**
 * Pages d'un audit : /audits/<uuid> et ses sous-pages, mais pas /audits ni
 * /audits/new. Sur ces ecrans la navigation se replie en rail de 76 px pour
 * laisser toute la largeur a la grille de conformite.
 */
const AUDIT_WORKSPACE = /^\/audits\/(?!new(?:\/|$))[^/]+/;

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

  const isVisible = (item: NavItem) =>
    item.permission === null
      ? true
      : item.orgScoped
        ? canAny(userRole, orgPerms, item.permission)
        : can(userRole, item.permission);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const badgeOf = (item: NavItem) =>
    item.badgeKey ? counts[item.badgeKey] : 0;

  // Sections « metier » d'un cote, entrees transverses (organisations,
  // parametres) posees en bas de la coque comme dans les maquettes.
  const mainSections = SECTIONS.filter((s) => s.sectionKey !== "other").map(
    (section) => ({
      ...section,
      items: section.items.filter(isVisible),
    }),
  );
  const footerItems = (
    SECTIONS.find((s) => s.sectionKey === "other")?.items ?? []
  ).filter(isVisible);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const userMenu = (compact: boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button
            type="button"
            aria-label={`${profile.firstName} ${profile.lastName}`}
            className="flex size-[38px] items-center justify-center rounded-full bg-highlight text-xs font-extrabold text-ink transition-transform duration-200 hover:scale-105"
          >
            {initials(profile.firstName || "?", profile.lastName || "?")}
          </button>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-primary-soft"
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-highlight text-xs font-extrabold text-ink"
            >
              {initials(profile.firstName || "?", profile.lastName || "?")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold leading-tight">
                {profile.firstName} {profile.lastName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {USER_ROLE_LABELS[profile.role]}
              </span>
            </span>
            <ChevronUp
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <UserCircle className="size-4" aria-hidden="true" />
            {t("user.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" aria-hidden="true" />
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
              <Eye className="size-4" aria-hidden="true" />
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
          <LogOut className="size-4" aria-hidden="true" />
          {t("user.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ─────────────────────────────────────────────────────────────────────
  // Rail 76 px — pages d'un audit
  // ─────────────────────────────────────────────────────────────────────
  if (AUDIT_WORKSPACE.test(pathname)) {
    return (
      <nav
        aria-label={t("navAria")}
        className="hidden h-screen w-[76px] shrink-0 flex-col items-center gap-2 border-r border-border bg-card py-[18px] lg:flex"
      >
        <Link
          href="/dashboard"
          aria-label={t("brandHomeAria")}
          className="mb-3.5 inline-flex rounded-row"
        >
          <LogoIcon size="md" />
        </Link>

        {mainSections.flatMap((section) =>
          section.items.map((item) => (
            <RailNavLink
              key={item.href}
              href={item.href}
              label={t(`items.${item.itemKey}`)}
              icon={ICONS[item.iconKey]}
              active={isActive(item.href)}
            />
          )),
        )}

        <div className="mt-auto flex flex-col items-center gap-2">
          {footerItems.map((item) => (
            <RailNavLink
              key={item.href}
              href={item.href}
              label={t(`items.${item.itemKey}`)}
              icon={ICONS[item.iconKey]}
              active={isActive(item.href)}
            />
          ))}
          {userMenu(true)}
        </div>
      </nav>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // Sidebar 256 px — tous les autres ecrans
  // ─────────────────────────────────────────────────────────────────────
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      {/* Logo */}
      <div className="px-4 pb-1 pt-[22px]">
        <Link
          href="/dashboard"
          aria-label={t("brandHomeAria")}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1"
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
      </div>

      {/* Sélecteur d'organisation active */}
      <div className="px-4 py-3">
        <OrgSwitcher current={org.current} available={org.available} />
      </div>

      {/* Navigation */}
      <nav
        aria-label={t("navAria")}
        className="flex-1 space-y-5 overflow-y-auto px-4"
      >
        {mainSections.map((section) => {
          if (section.items.length === 0) return null;
          return (
            <div key={section.sectionKey}>
              {section.sectionKey !== "main" && (
                <h2 className="px-3 pb-1.5 text-xs font-bold text-muted-foreground">
                  {t(`sections.${section.sectionKey}`)}
                </h2>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      label={t(`items.${item.itemKey}`)}
                      icon={ICONS[item.iconKey]}
                      active={isActive(item.href)}
                      badge={badgeOf(item)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer — entrees transverses, profil, liens legaux */}
      <div className="mt-auto space-y-1 px-4 pb-4 pt-3">
        <ul className="space-y-0.5">
          {footerItems.map((item) => (
            <li key={item.href}>
              <NavLink
                href={item.href}
                label={t(`items.${item.itemKey}`)}
                icon={ICONS[item.iconKey]}
                active={isActive(item.href)}
              />
            </li>
          ))}
        </ul>

        <div className="border-t border-border pt-2">{userMenu(false)}</div>

        {!profile.impersonating && impersonationOptions.length > 0 && (
          <div className="px-1 pt-1">
            <ImpersonationLauncher
              availableRoles={impersonationOptions}
              triggerVariant="ghost"
            />
          </div>
        )}

        {/* Liens légaux - toujours accessibles depuis l'app authentifiée. */}
        <nav
          aria-label={t("legal.label")}
          className={cn(
            "flex flex-wrap items-center gap-x-3 gap-y-1 px-2 pt-2",
            "text-xs text-muted-foreground",
          )}
        >
          <Link href="/legal" className="rounded hover:text-primary">
            {t("legal.mentions")}
          </Link>
          <Link href="/privacy" className="rounded hover:text-primary">
            {t("legal.privacy")}
          </Link>
          <Link href="/cookies" className="rounded hover:text-primary">
            {t("legal.cookies")}
          </Link>
        </nav>
      </div>
    </aside>
  );
}
