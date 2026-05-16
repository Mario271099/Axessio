import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { AxIcon } from "@/components/brand";
import { initials } from "@/lib/utils";
import { fetchNotifications } from "@/app/(dashboard)/notifications/actions";
import type { Profile } from "@/types/domain";

interface TopbarProps {
  profile: Profile;
}

export async function Topbar({ profile }: TopbarProps) {
  const tSidebar = await getTranslations("sidebar");
  const initialNotifications = await fetchNotifications();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-6">
      <Link
        href="/dashboard"
        aria-label={tSidebar("brandHomeAria")}
        className="flex items-center gap-2 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
      >
        <AxIcon size={28} aria-label="" />
        <span className="text-base font-bold tracking-tight">Axessio</span>
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <NotificationsBell initial={initialNotifications} />

        <LanguageToggle />
        <ThemeToggle />

        <div
          aria-hidden="true"
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          title={`${profile.firstName} ${profile.lastName}`}
        >
          {initials(profile.firstName || "?", profile.lastName || "?")}
        </div>
      </div>
    </header>
  );
}
