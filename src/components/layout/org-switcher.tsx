"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, monogram, themeColorVar } from "@/lib/utils";
import { switchOrganization } from "@/app/(dashboard)/organizations/actions";
import type { OrganizationMembership } from "@/types/domain";

interface OrgSwitcherProps {
  current: OrganizationMembership | null;
  available: OrganizationMembership[];
}

/**
 * Sélecteur d'organisation active, affiché en tête de sidebar. Quand un user
 * appartient à plusieurs orgs (cas freelance + agence(s) client(es)), il
 * peut basculer ici. Un seul élément → on n'affiche pas le caret.
 */
export function OrgSwitcher({ current, available }: OrgSwitcherProps) {
  const t = useTranslations("orgSwitcher");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!current) {
    return (
      <div className="rounded-row border border-dashed border-border-strong bg-muted/40 p-3 text-xs text-muted-foreground">
        {t("noMembership")}
      </div>
    );
  }

  const isSingle = available.length <= 1;

  const trigger = (
    <button
      type="button"
      disabled={isSingle || pending}
      className={cn(
        "flex h-[54px] w-full items-center justify-between gap-2 rounded-lg border border-border-strong bg-card px-3 text-left",
        "transition-[border-color,background-color] duration-150",
        isSingle
          ? "cursor-default"
          : "hover:border-primary hover:bg-primary-softer",
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex size-[30px] shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white"
          style={{ background: themeColorVar(current.organizationName) }}
        >
          {monogram(current.organizationName)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold leading-tight">
            {current.organizationName}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {t(`role.${current.role}`)}
          </span>
        </span>
      </span>
      {!isSingle && (
        <ChevronsUpDown
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </button>
  );

  if (isSingle) return trigger;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-64">
        <DropdownMenuLabel>{t("switchTo")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {available.map((org) => {
          const isCurrent = org.organizationId === current.organizationId;
          return (
            <DropdownMenuItem
              key={org.organizationId}
              onSelect={(e) => {
                e.preventDefault();
                if (isCurrent) return;
                startTransition(async () => {
                  const result = await switchOrganization(org.organizationId);
                  if (!result.error) router.refresh();
                });
              }}
              className="gap-2.5"
            >
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-[0.7rem] font-extrabold text-white"
                style={{ background: themeColorVar(org.organizationName) }}
              >
                {monogram(org.organizationName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{org.organizationName}</span>
                <span className="block truncate text-xs font-semibold text-muted-foreground">
                  {t(`role.${org.role}`)}
                </span>
              </span>
              {isCurrent && (
                <Check className="size-4 text-primary" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
