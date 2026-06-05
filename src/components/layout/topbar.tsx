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
}

export async function Topbar({ profile, counts, org, brandLogoUrl }: TopbarProps) {
  const tSidebar = await getTranslations("sidebar");
  const initialNotifications = await fetchNotifications();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <MobileNavSheet
          profile={profile}
          counts={counts}
          org={org}
          brandLogoUrl={brandLogoUrl}
        />
        <Link
          href="/dashboard"
          aria-label={tSidebar("brandHomeAria")}
          className="flex items-center gap-2 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Logo size="md" />
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <CommandPaletteTrigger />
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
