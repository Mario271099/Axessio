import { getTranslations } from "next-intl/server";
import { Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { exitImpersonationAndRedirect } from "@/app/(dashboard)/admin/impersonation/actions";
import type { Profile } from "@/types/domain";

interface ImpersonationBannerProps {
  profile: Profile;
}

export async function ImpersonationBanner({ profile }: ImpersonationBannerProps) {
  if (!profile.impersonating) return null;

  const t = await getTranslations("impersonation.banner");

  return (
    <div
      role="status"
      className="sticky top-0 z-40 border-b border-warning/40 bg-warning/10 text-warning"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm md:px-6">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">{t("title")}</span>
          <span className="text-warning/80">
            {t("description", {
              real: USER_ROLE_LABELS[profile.realRole],
              viewing: USER_ROLE_LABELS[profile.role],
            })}
          </span>
        </div>
        <form action={exitImpersonationAndRedirect}>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="gap-2 border-warning/40 bg-background/60 text-warning hover:bg-warning/10 hover:text-warning"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            {t("exit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
