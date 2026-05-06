"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Eye,
  FolderKanban,
  Loader2,
  Mail,
  Plus,
  Search,
  ClipboardList,
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

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {clients.length}
            </span>{" "}
            client{clients.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau client
        </Button>
      </header>

      <Card>
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
      </Card>

      {clients.length === 0 ? (
        <EmptyState onCreate={() => setDialogOpen(true)} />
      ) : (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Aucun client ne correspond aux filtres.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((c) => (
                  <ClientRow key={c.id} client={c} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <CreateClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function ClientRow({ client }: { client: ClientListItem }) {
  return (
    <li className="flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{client.name}</p>
          {client.website && (
            <a
              href={normalizeUrl(client.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
              aria-label={`Site web de ${client.name} (nouvelle fenêtre)`}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              {client.website}
            </a>
          )}
        </div>
        {client.contactEmail && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" aria-hidden="true" />
            {client.contactEmail}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <FolderKanban className="h-3 w-3" aria-hidden="true" />
          {client.projectCount} projet{client.projectCount > 1 ? "s" : ""}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <ClipboardList className="h-3 w-3" aria-hidden="true" />
          {client.auditCount} audit{client.auditCount > 1 ? "s" : ""}
        </Badge>
        <Badge variant={client.isActive ? "success" : "destructive"}>
          {client.isActive ? "Actif" : "Désactivé"}
        </Badge>
      </div>

      <Button asChild variant="ghost" size="sm" className="gap-1">
        <Link
          href={`/clients/${client.id}`}
          aria-label={`Voir le client ${client.name}`}
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          Voir
        </Link>
      </Button>
    </li>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun client n&apos;a encore été créé.
        </p>
        <Button onClick={onCreate} className="gap-2">
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
          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

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
            <Button type="submit" disabled={isPending} className="gap-2">
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

function normalizeUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}
