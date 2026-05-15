"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  FolderKanban,
  Loader2,
  Plus,
  RotateCcw,
  Search,
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
import { cn } from "@/lib/utils";
import { createClient } from "./actions";

export interface ClientListItem {
  id: string;
  name: string;
  website: string | null;
  contactEmail: string | null;
  isActive: boolean;
  createdAt: string;
  projectCount: number;
  auditCount: number;
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

interface ClientsListProps {
  clients: ClientListItem[];
}

export function ClientsList({ clients }: ClientsListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (statusFilter === "ACTIVE" && !c.isActive) return false;
      if (statusFilter === "INACTIVE" && c.isActive) return false;
      if (!q) return true;
      const haystack = [c.name, c.contactEmail ?? ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [clients, search, statusFilter]);

  const totals = useMemo(() => {
    let active = 0;
    let audits = 0;
    for (const c of clients) {
      if (c.isActive) active += 1;
      audits += c.auditCount;
    }
    return { active, audits };
  }, [clients]);

  const filtersActive = statusFilter !== "ALL" || search.trim().length > 0;
  const resetFilters = () => {
    setStatusFilter("ALL");
    setSearch("");
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      {/* Header --------------------------------------------------------- */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} client{clients.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau client
        </Button>
      </header>

      {/* KPIs ----------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={Building2}
          tone="primary"
          label="Total clients"
          value={clients.length}
        />
        <KpiCard
          icon={CheckCircle2}
          tone="success"
          label="Clients actifs"
          value={totals.active}
        />
        <KpiCard
          icon={ClipboardCheck}
          tone="violet"
          label="Total audits"
          value={totals.audits}
        />
      </div>

      {/* Barre de filtres ---------------------------------------------- */}
      <Card className="sticky top-20 z-10 shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_220px]">
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
              aria-label="Rechercher un client"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger aria-label="Filtrer par statut">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous</SelectItem>
              <SelectItem value="ACTIVE">Actifs</SelectItem>
              <SelectItem value="INACTIVE">Désactivés</SelectItem>
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
              Réinitialiser
            </Button>
          </div>
        )}
      </Card>

      {/* Grille ou empty ----------------------------------------------- */}
      {clients.length === 0 ? (
        <EmptyState onCreate={() => setDialogOpen(true)} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <Building2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">Aucun client ne correspond</p>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Réinitialiser
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <li key={c.id}>
              <ClientCard client={c} />
            </li>
          ))}
        </ul>
      )}

      <CreateClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  violet: "bg-violet-500/10 text-violet-500",
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

function clientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function ClientCard({ client }: { client: ClientListItem }) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Voir le client ${client.name}`}
    >
      <Card
        interactive
        className="flex h-full flex-col gap-4 p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary"
          >
            {clientInitials(client.name)}
          </div>
          <Badge variant={client.isActive ? "success" : "muted"}>
            {client.isActive ? "Actif" : "Désactivé"}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="truncate text-lg font-bold tracking-tight">
            {client.name}
          </p>
          {client.contactEmail && (
            <p className="truncate text-sm text-muted-foreground">
              {client.contactEmail}
            </p>
          )}
          {client.website && (
            <span className="inline-flex max-w-full items-center gap-1 truncate text-xs text-primary">
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{client.website}</span>
            </span>
          )}
        </div>

        <div className="mt-auto border-t border-border pt-3">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <FolderKanban className="h-4 w-4" aria-hidden="true" />
              <span className="font-semibold text-foreground tabular-nums">
                {client.projectCount}
              </span>{" "}
              projet{client.projectCount > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              <span className="font-semibold text-foreground tabular-nums">
                {client.auditCount}
              </span>{" "}
              audit{client.auditCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Building2 className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">Aucun client</p>
          <p className="text-sm text-muted-foreground">
            Créez votre premier client pour démarrer.
          </p>
        </div>
        <Button onClick={onCreate} className="mt-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Créer le premier client
        </Button>
      </CardContent>
    </Card>
  );
}

function CreateClientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name")?.toString().trim();
    if (!name) {
      setError("Le nom du client est requis.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createClient(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>
            Créez une nouvelle organisation cliente. Vous pourrez ensuite y
            rattacher des projets et des audits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label htmlFor="client-name">Nom *</Label>
            <Input
              id="client-name"
              name="name"
              required
              autoFocus
              placeholder="Ex : Ministère de la Culture"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-website">Site web</Label>
            <Input
              id="client-website"
              name="website"
              type="url"
              placeholder="https://exemple.fr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-contact-name">Nom du contact</Label>
            <Input
              id="client-contact-name"
              name="contact_name"
              placeholder="Ex : Camille Martin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-contact-email">Email du contact</Label>
            <Input
              id="client-contact-email"
              name="contact_email"
              type="email"
              placeholder="contact@exemple.fr"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Créer le client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
