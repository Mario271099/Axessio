"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Archive, ArchiveRestore, Loader2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OrgRole } from "@/types/domain";
import { archiveWorkspace, restoreWorkspace } from "./actions";

interface Props {
  organizationId: string;
  workspace: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    isArchived: boolean;
    effectiveRole: OrgRole;
  };
  canManage: boolean;
}

export function WorkspaceRow({ organizationId, workspace, canManage }: Props) {
  const t = useTranslations("organizations.workspaces");
  const tRole = useTranslations("organizations.role");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleArchive() {
    setError(null);
    startTransition(async () => {
      const result = workspace.isArchived
        ? await restoreWorkspace(organizationId, workspace.id)
        : await archiveWorkspace(organizationId, workspace.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <Card className={cn("transition-all", workspace.isArchived && "opacity-60")}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex min-w-0 items-start gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              {workspace.name}
              {workspace.isDefault && (
                <Badge variant="muted" className="text-[10px]">
                  {t("defaultBadge")}
                </Badge>
              )}
              {workspace.isArchived && (
                <Badge variant="secondary" className="text-[10px]">
                  {t("archivedBadge")}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
              <span className="font-mono text-xs">{workspace.slug}</span>
              <span aria-hidden="true">·</span>
              <Badge variant="default" className="text-[10px]">
                {tRole(workspace.effectiveRole)}
              </Badge>
            </CardDescription>
            {workspace.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {workspace.description}
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="mt-2 text-xs text-destructive"
              >
                {error}
              </p>
            )}
          </div>
        </div>
        {canManage && !workspace.isDefault && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleArchive}
            disabled={pending}
            className="gap-2"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : workspace.isArchived ? (
              <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Archive className="h-4 w-4" aria-hidden="true" />
            )}
            {workspace.isArchived ? t("restoreCta") : t("archiveCta")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="border-t pt-3 text-xs text-muted-foreground">
        {/* Placeholder pour future page de détail / membres / audits. */}
        {t("comingSoonDetail")}
      </CardContent>
    </Card>
  );
}
