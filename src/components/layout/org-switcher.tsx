"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { switchOrganization } from "@/app/(dashboard)/organizations/actions";
import type { OrganizationMembership } from "@/types/domain";

interface OrgSwitcherProps {
  current: OrganizationMembership | null;
  available: OrganizationMembership[];
}

const ROLE_VARIANT = {
  owner: "default",
  admin: "default",
  auditor: "secondary",
  viewer: "muted",
} as const;

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
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
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
        "flex w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left transition-colors",
        !isSingle && "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSingle && "cursor-default",
      )}
    >
      <div
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary"
      >
        <Building2 className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">
          {current.organizationName}
        </p>
        <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
          {t(`role.${current.role}`)}
        </p>
      </div>
      {!isSingle && (
        <ChevronsUpDown
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </button>
  );

  if (isSingle) return trigger;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        className="w-64"
      >
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {t("switchTo")}
        </DropdownMenuLabel>
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
              className="flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{org.organizationName}</p>
                <Badge
                  variant={ROLE_VARIANT[org.role]}
                  className="mt-0.5 h-4 px-1 text-[9px]"
                >
                  {t(`role.${org.role}`)}
                </Badge>
              </div>
              {isCurrent && (
                <Check
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
