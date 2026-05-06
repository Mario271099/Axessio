"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FolderKanban,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Power,
  Trash2,
  User,
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
  createProject,
  deleteProject,
  toggleClientActive,
  updateClient,
  updateProject,
} from "../actions";

export interface ClientData {
  id: string;
  name: string;
  website: string | null;
  contactEmail: string | null;
  contactName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  url: string | null;
  auditCount: number;
}

interface ClientDetailProps {
  client: ClientData;
  projects: ProjectItem[];
}

export function ClientDetail({ client, projects }: ClientDetailProps) {
  const router = useRouter();
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    projectId: string;
    message: string;
  } | null>(null);
  const [isToggling, startToggleTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleToggleActive = () => {
    const next = !client.isActive;
    const message = next
      ? `Réactiver le client « ${client.name} » ?`
      : `Désactiver le client « ${client.name} » ?`;
    if (!window.confirm(message)) return;

    setToggleError(null);
    startToggleTransition(async () => {
      const result = await toggleClientActive(client.id, next);
      if (result.error) {
        setToggleError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDeleteProject = (project: ProjectItem) => {
    if (project.auditCount > 0) {
      setDeleteError({
        projectId: project.id,
        message: `Ce projet a ${project.auditCount} audit${
          project.auditCount > 1 ? "s" : ""
        } associé${project.auditCount > 1 ? "s" : ""}.`,
      });
      return;
    }
    if (
      !window.confirm(
        `Supprimer définitivement le projet « ${project.name} » ?`,
      )
    ) {
      return;
    }

    setDeleteError(null);
    setDeletingId(project.id);
    startDeleteTransition(async () => {
      const result = await deleteProject(project.id, client.id);
      if (result.error) {
        setDeleteError({ projectId: project.id, message: result.error });
        setDeletingId(null);
        return;
      }
      setDeletingId(null);
      router.refresh();
    });
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link href="/clients" aria-label="Retour à la liste des clients">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour aux clients
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {client.name}
            </h1>
            <Badge variant={client.isActive ? "success" : "destructive"}>
              {client.isActive ? "Actif" : "Désactivé"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setEditClientOpen(true)}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Modifier
          </Button>
          <Button
            variant={client.isActive ? "destructive" : "default"}
            size="sm"
            className="gap-2"
            onClick={handleToggleActive}
            disabled={isToggling}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Power className="h-4 w-4" aria-hidden="true" />
            )}
            {client.isActive ? "Désactiver" : "Réactiver"}
          </Button>
        </div>
      </header>

      {toggleError && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {toggleError}
        </p>
      )}

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <InfoRow
            icon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
            label="Site web"
          >
            {client.website ? (
              <a
                href={normalizeUrl(client.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {client.website}
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </InfoRow>

          <InfoRow
            icon={<Mail className="h-4 w-4" aria-hidden="true" />}
            label="Email du contact"
          >
            {client.contactEmail ? (
              <a
                href={`mailto:${client.contactEmail}`}
                className="text-sm text-primary hover:underline"
              >
                {client.contactEmail}
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </InfoRow>

          <InfoRow
            icon={<User className="h-4 w-4" aria-hidden="true" />}
            label="Nom du contact"
          >
            <span className="text-sm">
              {client.contactName ?? (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          </InfoRow>

          <InfoRow
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            label="Date de création"
          >
            <span className="text-sm">{formatDate(client.createdAt)}</span>
          </InfoRow>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Projets</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {projects.length}
              </span>{" "}
              projet{projects.length > 1 ? "s" : ""} rattaché
              {projects.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setCreateProjectOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouveau projet
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucun projet n&apos;est encore rattaché à ce client.
              </p>
              <Button
                onClick={() => setCreateProjectOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Créer le premier projet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {projects.map((project) => (
                  <li
                    key={project.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <FolderKanban
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <p className="truncate font-medium">{project.name}</p>
                      </div>
                      {project.url && (
                        <a
                          href={normalizeUrl(project.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                          aria-label={`Ouvrir ${project.name} dans un nouvel onglet`}
                        >
                          <ExternalLink
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                          {project.url}
                        </a>
                      )}
                      {deleteError?.projectId === project.id && (
                        <p
                          role="alert"
                          className="rounded-md bg-destructive/10 p-2 text-xs text-destructive"
                        >
                          {deleteError.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <ClipboardList
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        {project.auditCount} audit
                        {project.auditCount > 1 ? "s" : ""}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingProject(project)}
                        aria-label={`Modifier le projet ${project.name}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteProject(project)}
                        disabled={isDeleting && deletingId === project.id}
                        aria-label={`Supprimer le projet ${project.name}`}
                      >
                        {isDeleting && deletingId === project.id ? (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      <EditClientDialog
        client={client}
        open={editClientOpen}
        onOpenChange={setEditClientOpen}
        onSuccess={() => router.refresh()}
      />

      <CreateProjectDialog
        clientId={client.id}
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onSuccess={() => router.refresh()}
      />

      <EditProjectDialog
        project={editingProject}
        clientId={client.id}
        open={editingProject !== null}
        onOpenChange={(next) => {
          if (!next) setEditingProject(null);
        }}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function EditClientDialog({
  client,
  open,
  onOpenChange,
  onSuccess,
}: {
  client: ClientData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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
      const result = await updateClient(client.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de cette organisation cliente.
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
            <Label htmlFor="edit-client-name">Nom *</Label>
            <Input
              id="edit-client-name"
              name="name"
              required
              autoFocus
              defaultValue={client.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-website">Site web</Label>
            <Input
              id="edit-client-website"
              name="website"
              type="url"
              defaultValue={client.website ?? ""}
              placeholder="https://exemple.fr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-contact-name">Nom du contact</Label>
            <Input
              id="edit-client-contact-name"
              name="contact_name"
              defaultValue={client.contactName ?? ""}
              placeholder="Ex : Camille Martin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-contact-email">Email du contact</Label>
            <Input
              id="edit-client-contact-email"
              name="contact_email"
              type="email"
              defaultValue={client.contactEmail ?? ""}
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
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateProjectDialog({
  clientId,
  open,
  onOpenChange,
  onSuccess,
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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
      setError("Le nom du projet est requis.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createProject(clientId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
          <DialogDescription>
            Rattachez un projet (site, application, intranet…) à ce client.
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
            <Label htmlFor="create-project-name">Nom *</Label>
            <Input
              id="create-project-name"
              name="name"
              required
              autoFocus
              placeholder="Ex : Site institutionnel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-project-url">URL</Label>
            <Input
              id="create-project-url"
              name="url"
              type="url"
              placeholder="https://exemple.fr"
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
              Créer le projet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditProjectDialog({
  project,
  clientId,
  open,
  onOpenChange,
  onSuccess,
}: {
  project: ProjectItem | null;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name")?.toString().trim();
    if (!name) {
      setError("Le nom du projet est requis.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await updateProject(project.id, clientId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      onSuccess();
    });
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de ce projet.
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
            <Label htmlFor="edit-project-name">Nom *</Label>
            <Input
              id="edit-project-name"
              name="name"
              required
              autoFocus
              defaultValue={project.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-url">URL</Label>
            <Input
              id="edit-project-url"
              name="url"
              type="url"
              defaultValue={project.url ?? ""}
              placeholder="https://exemple.fr"
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
              Enregistrer
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
