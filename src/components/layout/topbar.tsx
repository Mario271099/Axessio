import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { initials } from "@/lib/utils";
import { USER_ROLE_LABELS } from "@/lib/constants";
import type { Profile } from "@/types/domain";
import { signOut } from "@/app/(auth)/actions";

export function Topbar({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Page title space — chaque page peut le surcharger via children */}
      <div className="md:hidden text-lg font-semibold">Axessio</div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        <div
          className="flex items-center gap-3 rounded-md border border-border px-3 py-1.5"
          aria-label="Profil utilisateur"
        >
          <div
            className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-medium text-primary"
            aria-hidden="true"
          >
            {initials(profile.firstName || "?", profile.lastName || "?")}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium leading-none">
              {profile.firstName} {profile.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {USER_ROLE_LABELS[profile.role]}
            </div>
          </div>
        </div>

        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </header>
  );
}
