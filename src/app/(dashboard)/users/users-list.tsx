"use client";

// Page utilisateurs — composant d'orchestration. Les blocs autonomes vivent
// dans leurs propres fichiers :
//   - users-types.ts   (types + getUserStatus)
//   - user-row.tsx     (ligne du tableau + badges)
//   - user-dialogs.tsx (invitation + édition de rôle)
// Ici : KPIs, filtres, tableau, confirmation d'activation/désactivation.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Building2,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/domain";
import { resendInvitation, toggleUserActive } from "./actions";
import { UserRow } from "./user-row";
import { EditRoleDialog, InviteUserDialog } from "./user-dialogs";
import {
  getUserStatus,
  type ClientOption,
  type UserListItem,
  type UserStatus,
} from "./users-types";

// Ré-export pour les consommateurs existants (page.tsx importe les types ici).
export type { ClientOption, UserListItem } from "./users-types";

type RoleFilter = "ALL" | UserRole;
type StatusFilter = "ALL" | UserStatus;

interface UsersListProps {
  users: UserListItem[];
  clients: ClientOption[];
  currentUserId: string;
}

export function UsersList({ users, clients, currentUserId }: UsersListProps) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && getUserStatus(u) !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [u.email, u.firstName, u.lastName]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search, roleFilter, statusFilter]);

  const kpis = useMemo(() => {
    let admins = 0;
    let auditors = 0;
    let clientAdmins = 0;
    let clientMembers = 0;
    for (const u of users) {
      if (u.role === "admin") admins += 1;
      else if (u.role === "auditor") auditors += 1;
      else if (u.role === "client_admin") clientAdmins += 1;
      else if (u.role === "client") clientMembers += 1;
    }
    return { admins, auditors, clientAdmins, clientMembers };
  }, [users]);

  const filtersActive =
    roleFilter !== "ALL" || statusFilter !== "ALL" || search.trim().length > 0;
  const resetFilters = () => {
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setSearch("");
  };

  const handleResend = (user: UserListItem) => {
    setPendingId(user.id);
    startTransition(async () => {
      const result = await resendInvitation(user.id);
      setPendingId(null);
      if (result.error) {
        toast.error(t("errorPrefix", { message: result.error }));
        return;
      }
      toast.success(t("resendSuccess", { email: user.email }));
      router.refresh();
    });
  };

  const [toggleTarget, setToggleTarget] = useState<UserListItem | null>(null);

  const runToggleActive = (user: UserListItem) => {
    const next = !user.isActive;
    setToggleTarget(null);
    setPendingId(user.id);
    startTransition(async () => {
      const result = await toggleUserActive(user.id, next);
      setPendingId(null);
      if (result.error) {
        toast.error(t("errorPrefix", { message: result.error }));
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      {/* Header --------------------------------------------------------- */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle", { count: users.length })}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {t("inviteUser")}
        </Button>
      </header>

      {/* KPIs ----------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          tone="primary"
          label={t("kpi.total")}
          value={users.length}
        />
        <KpiCard
          icon={ShieldCheck}
          tone="success"
          label={t("kpi.auditors")}
          value={kpis.auditors}
        />
        <KpiCard
          icon={Building2}
          tone="violet"
          label={t("kpi.clientAdmins")}
          value={kpis.clientAdmins}
        />
        <KpiCard
          icon={UserCog}
          tone="muted"
          label={t("kpi.clientMembers")}
          value={kpis.clientMembers}
        />
      </div>

      {/* Filtres -------------------------------------------------------- */}
      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label={t("searchAria")}
            />
          </div>

          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as RoleFilter)}
          >
            <SelectTrigger aria-label={t("filterRoleAria")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filterAllRoles")}</SelectItem>
              <SelectItem value="admin">{t("rolesOption.admin")}</SelectItem>
              <SelectItem value="auditor">{t("rolesOption.auditor")}</SelectItem>
              <SelectItem value="client_admin">
                {t("rolesOption.client_admin")}
              </SelectItem>
              <SelectItem value="client">
                {t("rolesOption.client")}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger aria-label={t("filterStatusAria")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filterAllStatuses")}</SelectItem>
              <SelectItem value="PENDING">{t("status.pending")}</SelectItem>
              <SelectItem value="ACTIVE">{t("status.active")}</SelectItem>
              <SelectItem value="INACTIVE">{t("status.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        {filtersActive && (
          <div className="flex justify-end border-t border-border px-4 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {tCommon("reset")}
            </Button>
          </div>
        )}
      </Card>

      {/* Tableau -------------------------------------------------------- */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title={
                  users.length === 0
                    ? t("empty.noUsers")
                    : t("empty.noResults")
                }
                className="border-0"
              >
                {users.length === 0 ? (
                  <Button size="sm" onClick={() => setInviteOpen(true)}>
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    {t("empty.inviteFirst")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    {tCommon("reset")}
                  </Button>
                )}
              </EmptyState>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="px-4 py-3">
                      {t("table.user")}
                    </th>
                    <th
                      scope="col"
                      className="hidden px-4 py-3 md:table-cell"
                    >
                      {t("table.role")}
                    </th>
                    <th
                      scope="col"
                      className="hidden px-4 py-3 lg:table-cell"
                    >
                      {t("table.client")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("table.status")}
                    </th>
                    <th scope="col" className="w-12 px-4 py-3 text-right">
                      <span className="sr-only">{t("table.actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isSelf={user.id === currentUserId}
                      isPending={pendingId === user.id}
                      onEditRole={() => setEditingUser(user)}
                      onResend={() => handleResend(user)}
                      onToggleActive={() => setToggleTarget(user)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        clients={clients}
        onSuccess={() => router.refresh()}
      />

      <EditRoleDialog
        user={editingUser}
        clients={clients}
        open={editingUser !== null}
        onOpenChange={(next) => {
          if (!next) setEditingUser(null);
        }}
        onSuccess={() => router.refresh()}
      />

      {/* Confirmation activation/désactivation utilisateur */}
      <AlertDialog
        open={toggleTarget !== null}
        onOpenChange={(o) => !o && setToggleTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget
                ? toggleTarget.isActive
                  ? t("confirmDeactivate", { email: toggleTarget.email })
                  : t("confirmReactivate", { email: toggleTarget.email })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant={toggleTarget?.isActive ? "destructive" : "default"}
              onClick={() => {
                if (toggleTarget) runToggleActive(toggleTarget);
              }}
            >
              {toggleTarget?.isActive ? tCommon("delete") : tCommon("save")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  violet: "bg-violet-500/10 text-violet-500",
  muted: "bg-muted text-muted-foreground",
} as const;

function KpiCard({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ElementType;
  tone: keyof typeof toneClasses;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          toneClasses[tone],
        )}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
    </Card>
  );
}
