import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AxIcon } from "@/components/brand";
import { initials } from "@/lib/utils";
import type { Profile } from "@/types/domain";

interface TopbarProps {
  profile: Profile;
  /** Active la pastille rouge sur la cloche. */
  hasUnread?: boolean;
}

export function Topbar({ profile, hasUnread = false }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-6">
      {/* Brand mobile — la sidebar est cachée sous lg */}
      <Link
        href="/dashboard"
        aria-label="Axessio — retour au tableau de bord"
        className="flex items-center gap-2 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
      >
        <AxIcon size={28} aria-label="" />
        <span className="text-base font-bold tracking-tight">Axessio</span>
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            hasUnread
              ? "Notifications — nouvelles activités"
              : "Notifications"
          }
          title="Notifications"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {hasUnread && (
            <span
              aria-hidden="true"
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background"
            />
          )}
        </Button>

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
