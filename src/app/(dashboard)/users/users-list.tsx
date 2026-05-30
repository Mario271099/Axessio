"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  UserCog,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { USER_ROLE_BADGE_VARIANT } from "@/lib/constants";
import type { UserRole } from "@/types/domain";
import {
  inviteUser,
  resendInvitation,
  toggleUserActive,
  updateUserRole,
} from "./actions";

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  clientId: string | null;
  clientName: string | null;
  isActive: boolean;
  createdAt: string;
  hasLoggedIn: boolean;
  isEmailConfirmed: boolean;
}

export interface ClientOption {
  id: string;
  name: string;
}

type UserStatus = "INACTIVE" | "PENDING" | "ACTIVE";
type RoleFilter = "ALL" | UserRole;
type StatusFilter = "ALL" | UserStatus;

function getUserStatus(user: UserListItem): UserStatus {
  if (!user.isActive) return "INACTIVE";
  if (!user.isEmailConfirmed) return "PENDING";
  return "ACTIVE";
}

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

function UserRow({
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

function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="inline-flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialogs                                                                    */
/* -------------------------------------------------------------------------- */

function InviteUserDialog({
  open,
  onOpenChange,
  clients,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientOption[];
  onSuccess: () => void;
}) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("client");
  const [clientId, setClientId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Les staff plateforme (admin/auditor) ne sont rattachés à aucun client.
  const needsClient = role !== "auditor" && role !== "admin";

  const reset = () => {
    setError(null);
    setRole("client");
    setClientId("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!formData.get("email")?.toString().trim()) {
      setError(t("inviteDialog.emailRequired"));
      return;
    }
    if (!formData.get("first_name")?.toString().trim()) {
      setError(t("inviteDialog.firstNameRequired"));
      return;
    }
    if (!formData.get("last_name")?.toString().trim()) {
      setError(t("inviteDialog.lastNameRequired"));
      return;
    }
    if (needsClient && !clientId) {
      setError(t("inviteDialog.clientRequired"));
      return;
    }

    formData.set("role", role);
    formData.set("client_id", needsClient ? clientId : "");
    setError(null);

    startTransition(async () => {
      const result = await inviteUser(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(t("inviteDialog.successAlert"));
      form.reset();
      reset();
      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("inviteDialog.title")}</DialogTitle>
          <DialogDescription>{t("inviteDialog.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label htmlFor="invite-email">{t("inviteDialog.email")} *</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              autoFocus
              placeholder={t("inviteDialog.emailPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="invite-first-name">
                {t("inviteDialog.firstName")} *
              </Label>
              <Input
                id="invite-first-name"
                name="first_name"
                required
                placeholder={t("inviteDialog.firstNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-last-name">
                {t("inviteDialog.lastName")} *
              </Label>
              <Input
                id="invite-last-name"
                name="last_name"
                required
                placeholder={t("inviteDialog.lastNamePlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">{t("inviteDialog.role")} *</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as UserRole);
                if (v === "auditor" || v === "admin") setClientId("");
              }}
            >
              <SelectTrigger id="invite-role" aria-label={t("inviteDialog.role")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  {t("rolesOption.admin")}
                </SelectItem>
                <SelectItem value="auditor">
                  {t("rolesOption.auditor")}
                </SelectItem>
                <SelectItem value="client_admin">
                  {t("rolesOption.client_admin")}
                </SelectItem>
                <SelectItem value="client">
                  {t("rolesOption.client")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsClient && (
            <div className="space-y-2">
              <Label htmlFor="invite-client">
                {t("inviteDialog.client")} *
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger
                  id="invite-client"
                  aria-label={t("inviteDialog.client")}
                >
                  <SelectValue placeholder={t("inviteDialog.clientPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {t("inviteDialog.noClients")}
                    </div>
                  ) : (
                    clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {t("inviteDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditRoleDialog({
  user,
  clients,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: UserListItem | null;
  clients: ClientOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(user?.role ?? "client");
  const [clientId, setClientId] = useState<string>(user?.clientId ?? "");
  const [isPending, startTransition] = useTransition();

  const userKey = user?.id ?? "";
  const lastKey = useMemoLastKey(userKey, () => {
    setRole(user?.role ?? "client");
    setClientId(user?.clientId ?? "");
    setError(null);
  });
  void lastKey;

  if (!user) return null;
  // Les staff plateforme (admin/auditor) ne sont rattachés à aucun client.
  const needsClient = role !== "auditor" && role !== "admin";

  const handleClose = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (needsClient && !clientId) {
      setError(t("inviteDialog.clientRequired"));
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await updateUserRole(
        user.id,
        role,
        needsClient ? clientId : null,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(t("editRoleDialog.successAlert"));
      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editRoleDialog.title")}</DialogTitle>
          <DialogDescription>{t("editRoleDialog.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label>{t("inviteDialog.email")}</Label>
            <Input value={user.email} readOnly disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role-role">{t("inviteDialog.role")} *</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as UserRole);
                if (v === "auditor" || v === "admin") setClientId("");
              }}
            >
              <SelectTrigger
                id="edit-role-role"
                aria-label={t("inviteDialog.role")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  {t("rolesOption.admin")}
                </SelectItem>
                <SelectItem value="auditor">
                  {t("rolesOption.auditor")}
                </SelectItem>
                <SelectItem value="client_admin">
                  {t("rolesOption.client_admin")}
                </SelectItem>
                <SelectItem value="client">
                  {t("rolesOption.client")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsClient && (
            <div className="space-y-2">
              <Label htmlFor="edit-role-client">
                {t("inviteDialog.client")} *
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger
                  id="edit-role-client"
                  aria-label={t("inviteDialog.client")}
                >
                  <SelectValue placeholder={t("inviteDialog.clientPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {t("inviteDialog.noClients")}
                    </div>
                  ) : (
                    clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function useMemoLastKey(key: string, onChange: () => void) {
  const [last, setLast] = useState(key);
  if (last !== key) {
    setLast(key);
    onChange();
  }
  return last;
}
