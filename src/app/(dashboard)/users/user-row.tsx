"use client";

// Ligne du tableau des utilisateurs + badges associés (rôle, statut, avatar).
// Extrait de users-list.tsx (découpage des gros composants) - markup et
// comportement inchangés.

import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MoreHorizontal,
  Send,
  ShieldCheck,
  UserCog,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { USER_ROLE_BADGE_VARIANT } from "@/lib/constants";
import type { UserRole } from "@/types/domain";
import { getUserStatus, type UserListItem, type UserStatus } from "./users-types";

export function UserRow({
  user,
  isSelf,
  isPending,
  onEditRole,
  onResend,
  onToggleActive,
}: {
  user: UserListItem;
  isSelf: boolean;
  isPending: boolean;
  onEditRole: () => void;
  onResend: () => void;
  onToggleActive: () => void;
}) {
  const t = useTranslations("users");
  const status = getUserStatus(user);
  const isAwaitingConfirmation = status === "PENDING";
  const fullName = [user.firstName, user.lastName]
    .filter((p) => p.trim().length > 0)
    .join(" ")
    .trim();
  const displayName = fullName || user.email;

  return (
    <tr className="border-b border-border transition-colors last:border-b-0 hover:bg-accent/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar
            firstName={user.firstName}
            lastName={user.lastName}
            email={user.email}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{displayName}</p>
              {isSelf && (
                <Badge variant="outline" className="text-[10px]">
                  {t("table.you")}
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <RoleBadge role={user.role} />
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
        {user.clientName ?? "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {isAwaitingConfirmation && !isSelf && (
            <Button
              variant="outline"
              size="sm"
              className="hidden h-7 gap-1.5 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning xl:inline-flex"
              onClick={onResend}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {t("resendInvite")}
            </Button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        {isSelf ? (
          <span className="text-xs italic text-muted-foreground">—</span>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isPending}
                aria-label={t("actionsAria", { email: user.email })}
              >
                {isPending ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isAwaitingConfirmation && (
                <>
                  <DropdownMenuItem
                    onSelect={onResend}
                    className="gap-2 font-medium text-warning focus:bg-warning/10 focus:text-warning"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {t("resendInvite")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onSelect={onEditRole} className="gap-2">
                <UserCog className="h-4 w-4" aria-hidden="true" />
                {t("editRole")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={onToggleActive}
                className={
                  user.isActive
                    ? "gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                    : "gap-2"
                }
              >
                {user.isActive ? (
                  <>
                    <UserMinus className="h-4 w-4" aria-hidden="true" />
                    {t("deactivate")}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    {t("reactivate")}
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}

function Avatar({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() ||
    (email[0] ?? "?").toUpperCase();
  return (
    <div
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const tRoles = useTranslations("roles");
  const label = tRoles(role);
  return <Badge variant={USER_ROLE_BADGE_VARIANT[role]}>{label}</Badge>;
}

function StatusBadge({ status }: { status: UserStatus }) {
  const t = useTranslations("users.status");
  if (status === "INACTIVE") {
    return (
      <Badge variant="destructive" className="gap-1">
        <UserMinus className="h-3 w-3" aria-hidden="true" />
        {t("inactive")}
      </Badge>
    );
  }
  if (status === "PENDING") {
    return (
      <Badge variant="warning" className="gap-1">
        <Clock className="h-3 w-3" aria-hidden="true" />
        {t("pending")}
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1">
      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
      {t("active")}
    </Badge>
  );
}
