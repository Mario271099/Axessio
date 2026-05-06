"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UserCog,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { USER_ROLE_LABELS } from "@/lib/constants";
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

  const handleResend = (user: UserListItem) => {
    setPendingId(user.id);
    startTransition(async () => {
      const result = await resendInvitation(user.id);
      setPendingId(null);
      if (result.error) {
        window.alert(`Erreur : ${result.error}`);
        return;
      }
      window.alert(`Invitation renvoyée à ${user.email}.`);
      router.refresh();
    });
  };

  const handleToggleActive = (user: UserListItem) => {
    const next = !user.isActive;
    const message = next
      ? `Réactiver l'utilisateur ${user.email} ?`
      : `Désactiver l'utilisateur ${user.email} ? Il ne pourra plus se connecter.`;
    if (!window.confirm(message)) return;

    setPendingId(user.id);
    startTransition(async () => {
      const result = await toggleUserActive(user.id, next);
      setPendingId(null);
      if (result.error) {
        window.alert(`Erreur : ${result.error}`);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{users.length}</span>{" "}
            utilisateur{users.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Inviter un utilisateur
        </Button>
      </header>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Rechercher un utilisateur"
            />
          </div>

          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as RoleFilter)}
          >
            <SelectTrigger aria-label="Filtrer par rôle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les rôles</SelectItem>
              <SelectItem value="auditor">Auditeur</SelectItem>
              <SelectItem value="client_admin">Administrateur client</SelectItem>
              <SelectItem value="client_member">Membre client</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger aria-label="Filtrer par statut">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="ACTIVE">Actifs</SelectItem>
              <SelectItem value="INACTIVE">Désactivés</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {users.length === 0
                ? "Aucun utilisateur n'a encore été invité."
                : "Aucun utilisateur ne correspond aux filtres."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === currentUserId}
                  isPending={pendingId === user.id}
                  onEditRole={() => setEditingUser(user)}
                  onResend={() => handleResend(user)}
                  onToggleActive={() => handleToggleActive(user)}
                />
              ))}
            </ul>
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
    </div>
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
  const status = getUserStatus(user);
  const isAwaitingConfirmation = status === "PENDING";
  const fullName = [user.firstName, user.lastName]
    .filter((p) => p.trim().length > 0)
    .join(" ")
    .trim();
  const displayName = fullName || user.email;

  return (
    <li className="flex flex-wrap items-center gap-4 p-4">
      <Avatar firstName={user.firstName} lastName={user.lastName} email={user.email} />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{displayName}</p>
          {isSelf && (
            <Badge variant="outline" className="text-xs">
              Vous
            </Badge>
          )}
        </div>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <Mail className="h-3 w-3" aria-hidden="true" />
          {user.email}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RoleBadge role={user.role} />
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {user.clientName ?? "—"}
        </span>
        <StatusBadge status={status} />
        <span className="hidden text-xs text-muted-foreground md:inline">
          {formatDate(user.createdAt)}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        {isSelf ? (
          <span className="text-xs italic text-muted-foreground">
            Aucune action
          </span>
        ) : (
          <>
            {isAwaitingConfirmation && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
                onClick={onResend}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                Renvoyer l&apos;invitation
              </Button>
            )}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isPending}
                aria-label={`Actions pour ${user.email}`}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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
                    className="gap-2 bg-warning/10 font-medium text-warning focus:bg-warning/15 focus:text-warning"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Renvoyer l&apos;invitation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onSelect={onEditRole} className="gap-2">
                <UserCog className="h-4 w-4" aria-hidden="true" />
                Modifier le rôle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={onToggleActive}
                className={
                  user.isActive
                    ? "gap-2 text-destructive focus:text-destructive"
                    : "gap-2"
                }
              >
                {user.isActive ? (
                  <>
                    <UserMinus className="h-4 w-4" aria-hidden="true" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Réactiver
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </>
        )}
      </div>
    </li>
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
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const label = USER_ROLE_LABELS[role];
  if (role === "auditor") return <Badge variant="success">{label}</Badge>;
  if (role === "client_admin") return <Badge variant="default">{label}</Badge>;
  return <Badge variant="muted">{label}</Badge>;
}

function StatusBadge({ status }: { status: UserStatus }) {
  if (status === "INACTIVE") return <Badge variant="destructive">Désactivé</Badge>;
  if (status === "PENDING") return <Badge variant="warning">En attente</Badge>;
  return <Badge variant="success">Actif</Badge>;
}

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
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("client_member");
  const [clientId, setClientId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const needsClient = role !== "auditor";

  const reset = () => {
    setError(null);
    setRole("client_member");
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
      setError("L'email est requis.");
      return;
    }
    if (!formData.get("first_name")?.toString().trim()) {
      setError("Le prénom est requis.");
      return;
    }
    if (!formData.get("last_name")?.toString().trim()) {
      setError("Le nom est requis.");
      return;
    }
    if (needsClient && !clientId) {
      setError("Sélectionnez un client de rattachement.");
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
      window.alert("Invitation envoyée.");
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
          <DialogTitle>Inviter un utilisateur</DialogTitle>
          <DialogDescription>
            L&apos;utilisateur recevra un email avec un lien pour activer son
            compte.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email *</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              autoFocus
              placeholder="prenom.nom@exemple.fr"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="invite-first-name">Prénom *</Label>
              <Input
                id="invite-first-name"
                name="first_name"
                required
                placeholder="Camille"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-last-name">Nom *</Label>
              <Input
                id="invite-last-name"
                name="last_name"
                required
                placeholder="Martin"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Rôle *</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as UserRole);
                if (v === "auditor") setClientId("");
              }}
            >
              <SelectTrigger id="invite-role" aria-label="Rôle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auditor">Auditeur (interne)</SelectItem>
                <SelectItem value="client_admin">
                  Administrateur client
                </SelectItem>
                <SelectItem value="client_member">Membre client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsClient && (
            <div className="space-y-2">
              <Label htmlFor="invite-client">Client de rattachement *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="invite-client" aria-label="Client">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Aucun client actif disponible.
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
              Annuler
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              Envoyer l&apos;invitation
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
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(user?.role ?? "client_member");
  const [clientId, setClientId] = useState<string>(user?.clientId ?? "");
  const [isPending, startTransition] = useTransition();

  // Re-sync local state when the target user changes
  const userKey = user?.id ?? "";
  const lastKey = useMemoLastKey(userKey, () => {
    setRole(user?.role ?? "client_member");
    setClientId(user?.clientId ?? "");
    setError(null);
  });
  void lastKey;

  if (!user) return null;
  const needsClient = role !== "auditor";

  const handleClose = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (needsClient && !clientId) {
      setError("Sélectionnez un client de rattachement.");
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
      window.alert("Rôle mis à jour.");
      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le rôle</DialogTitle>
          <DialogDescription>
            Mettez à jour le rôle et le client de rattachement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} readOnly disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role-role">Rôle *</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as UserRole);
                if (v === "auditor") setClientId("");
              }}
            >
              <SelectTrigger id="edit-role-role" aria-label="Rôle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auditor">Auditeur (interne)</SelectItem>
                <SelectItem value="client_admin">
                  Administrateur client
                </SelectItem>
                <SelectItem value="client_member">Membre client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsClient && (
            <div className="space-y-2">
              <Label htmlFor="edit-role-client">Client de rattachement *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="edit-role-client" aria-label="Client">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Aucun client actif disponible.
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
              Annuler
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Enregistrer
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
