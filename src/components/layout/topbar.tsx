import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { TopbarUserMenu } from "@/components/layout/topbar-user-menu";
import { MobileNavSheet } from "@/components/layout/mobile-nav-sheet";
import { CommandPaletteTrigger } from "@/components/layout/command-palette-trigger";
import { Logo } from "@/components/brand";
import { fetchNotifications } from "@/app/(dashboard)/notifications/actions";
import { USER_ROLE_LABELS } from "@/lib/constants";
import type { NavCounts } from "@/components/layout/nav-config";
import type { Permission } from "@/lib/permissions";
import type { OrganizationMembership, Profile } from "@/types/domain";

interface OrgContext {
  current: OrganizationMembership | null;
  available: OrganizationMembership[];
}

interface TopbarProps {
  profile: Profile;
  counts: NavCounts;
  org: OrgContext;
  brandLogoUrl: string | null;
  orgPermissions?: Permission[];
}

/**
 * Barre haute du dashboard : recherche a gauche, actions a droite. Elle est
 * posee sur le fond de l'application (ni bordure ni ombre), comme dans les
 * maquettes : c'est la sidebar qui porte la separation verticale.
 */
export async function Topbar({
  profile,
  counts,
  org,
  brandLogoUrl,
  orgPermissions,
}: TopbarProps) {
  const tSidebar = await getTranslations("sidebar");
  const initialNotifications = await fetchNotifications();

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-3 px-4 md:px-9">
      <div className="flex items-center gap-2 lg:hidden">
        <MobileNavSheet
          profile={profile}
          counts={counts}
          org={org}
          brandLogoUrl={brandLogoUrl}
          orgPermissions={orgPermissions}
        />
        <Link
          href="/dashboard"
          aria-label={tSidebar("brandHomeAria")}
          className="flex items-center gap-2 rounded-lg px-1"
        >
          <Logo size="md" />
        </Link>
      </div>

      <CommandPaletteTrigger className="hidden lg:inline-flex" />

      <div className="ml-auto flex items-center gap-1.5">
        <CommandPaletteTrigger className="lg:hidden" compact />
        <NotificationsBell initial={initialNotifications} />

        <LanguageToggle />
        <ThemeToggle />

        <TopbarUserMenu
          firstName={profile.firstName}
          lastName={profile.lastName}
          email={profile.email}
          roleLabel={USER_ROLE_LABELS[profile.role]}
          avatarUrl={profile.avatarUrl}
        />
      </div>
    </header>
  );
}
