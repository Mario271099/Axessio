"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  FolderKanban,
  Info,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/intl";
import type { AuditStatus } from "@/types/domain";
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

export interface ClientStats {
  projectCount: number;
  auditCount: number;
  activeAuditCount: number;
}

export interface ActivityEvent {
  id: string;
  projectName: string;
  auditId: string;
  status: string;
  at: string;
}

interface ClientDetailProps {
  client: ClientData;
  projects: ProjectItem[];
  stats: ClientStats;
  activity: ActivityEvent[];
}

export function ClientDetail({
  client,
  projects,
  stats,
  activity,
}: ClientDetailProps) {
  const router = useRouter();
  const t = useTranslations("clientDetail");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const intl = intlLocale(locale);
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
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
    setToggleConfirmOpen(false);
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
        message: t("projectHasAudits", { count: project.auditCount }),
      });
      return;
    }
    setProjectToDelete(null);
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
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      {/* Breadcrumb ----------------------------------------------------- */}
      <nav
        aria-label={t("breadcrumb")}
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link
          href="/clients"
          className="rounded px-1 py-0.5 hover:bg-accent hover:text-foreground"
        >
          {t("backToClients")}
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="rounded px-1 py-0.5 font-medium text-foreground">
          {client.name}
        </span>
      </nav>

      {/* Header --------------------------------------------------------- */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary"
          >
            {clientInitials(client.name)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {client.name}
              </h1>
              <Badge variant={client.isActive ? "success" : "muted"}>
                {client.isActive ? t("active") : t("inactive")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("createdOn", { date: formatDate(client.createdAt, intl) })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditClientOpen(true)}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            {t("edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setToggleConfirmOpen(true)}
            disabled={isToggling}
            className={cn(
              client.isActive && "text-destructive hover:text-destructive",
            )}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Power className="h-4 w-4" aria-hidden="true" />
            )}
            {client.isActive ? t("deactivate") : t("reactivate")}
          </Button>
        </div>
      </header>

      {toggleError && <FormError message={toggleError} />}

      {/* 3 cards horizontales ------------------------------------------ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Informations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              {t("infoTitle")}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditClientOpen(true)}
              className="h-7 px-2 text-xs"
            >
              {t("edit")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              icon={<Mail className="h-3.5 w-3.5" aria-hidden="true" />}
              label={t("email")}
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
              icon={<User className="h-3.5 w-3.5" aria-hidden="true" />}
              label={t("contact")}
            >
              <span className="text-sm">
                {client.contactName ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
            </InfoRow>
            <InfoRow
              icon={
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              }
              label={t("website")}
            >
              {client.website ? (
                <a
                  href={normalizeUrl(client.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm text-primary hover:underline"
                >
                  {client.website}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </InfoRow>
            <InfoRow
              icon={
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              }
              label={t("createdLabel")}
            >
              <span className="text-sm tabular-nums">
                {formatDate(client.createdAt, intl)}
              </span>
            </InfoRow>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              {t("statsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow
              icon={FolderKanban}
              tone="primary"
              label={t("stats.projects")}
              value={stats.projectCount}
            />
            <StatRow
              icon={ClipboardList}
              tone="violet"
              label={t("stats.audits")}
              value={stats.auditCount}
            />
            <StatRow
              icon={ClipboardCheck}
              tone="warning"
              label={t("stats.activeAudits")}
              value={stats.activeAuditCount}
            />
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              {t("activityTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">
                {t("activityEmpty")}
              </p>
            ) : (
              <ul className="space-y-3">
                {activity.map((ev) => (
                  <li key={ev.id} className="flex items-start gap-2">
                    <div
                      aria-hidden="true"
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/audits/${ev.auditId}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {ev.projectName}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <AuditStatusBadge
                          status={ev.status as AuditStatus}
                          className="text-[10px]"
                        />
                        <time
                          dateTime={ev.at}
                          className="text-xs text-muted-foreground tabular-nums"
                        >
                          {formatRelative(ev.at, intl)}
                        </time>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Projets ------------------------------------------------ */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">
              {t("projectsTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("projectsCount", { count: projects.length })}
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateProjectOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("newProject")}
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <FolderKanban className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">{t("noProjectsTitle")}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateProjectOpen(true)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("noProjectsCta")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Card className="flex flex-col gap-3 p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <FolderKanban
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <p className="truncate font-semibold">{project.name}</p>
                    </div>
                    {project.url && (
                      <a
                        href={normalizeUrl(project.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
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
                        className="inline-flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive"
                      >
                        <AlertCircle
                          className="mt-0.5 h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        {deleteError.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="muted" className="gap-1">
                      <ClipboardList
                        className="h-3 w-3"
                        aria-hidden="true"
                      />
                      {t("auditCount", { count: project.auditCount })}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingProject(project)}
                      aria-label={t("editProjectAria", { name: project.name })}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        if (project.auditCount > 0) {
                          setDeleteError({
                            projectId: project.id,
                            message: t("projectHasAudits", { count: project.auditCount }),
                          });
                          return;
                        }
                        setProjectToDelete(project);
                      }}
                      disabled={isDeleting && deletingId === project.id}
                      aria-label={t("deleteProjectAria", { name: project.name })}
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
                </Card>
              </li>
            ))}
          </ul>
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

      {/* Confirmation activation/désactivation client */}
      <AlertDialog open={toggleConfirmOpen} onOpenChange={setToggleConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {client.isActive
                ? t("confirmDeactivate", { name: client.name })
                : t("confirmReactivate", { name: client.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant={client.isActive ? "destructive" : "default"}
              onClick={handleToggleActive}
            >
              {client.isActive ? tCommon("delete") : tCommon("save")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation suppression projet */}
      <AlertDialog
        open={projectToDelete !== null}
        onOpenChange={(o) => !o && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {projectToDelete
                ? t("confirmDeleteProject", { name: projectToDelete.name })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (projectToDelete) handleDeleteProject(projectToDelete);
              }}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const statToneClasses = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  violet: "bg-violet-500/10 text-violet-500",
} as const;

function StatRow({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ElementType;
  tone: keyof typeof statToneClasses;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          statToneClasses[tone],
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums">{value}</p>
      </div>
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
    <div className="space-y-0.5">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="pl-5">{children}</div>
    </div>
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

function clientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function formatRelative(iso: string, intl: string): string {
  const rtf = new Intl.RelativeTimeFormat(intl, { numeric: "auto" });
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return rtf.format(-Math.max(1, minutes), "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 30) return rtf.format(-days, "day");
  const months = Math.round(days / 30);
  return rtf.format(-months, "month");
}

/* -------------------------------------------------------------------------- */
/* Dialogs                                                                    */
/* -------------------------------------------------------------------------- */

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
  const t = useTranslations("clientDetail");
  const tClients = useTranslations("clients");
  const tCommon = useTranslations("common");
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
      setError(t("editClient.nameRequired"));
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
          <DialogTitle>{t("editClient.title")}</DialogTitle>
          <DialogDescription>{t("editClient.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label htmlFor="edit-client-name">{tClients("dialog.name")} *</Label>
            <Input
              id="edit-client-name"
              name="name"
              required
              autoFocus
              defaultValue={client.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-website">
              {tClients("dialog.website")}
            </Label>
            <Input
              id="edit-client-website"
              name="website"
              type="url"
              defaultValue={client.website ?? ""}
              placeholder={tClients("dialog.websitePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-contact-name">
              {tClients("dialog.contactName")}
            </Label>
            <Input
              id="edit-client-contact-name"
              name="contact_name"
              defaultValue={client.contactName ?? ""}
              placeholder={tClients("dialog.contactNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-contact-email">
              {tClients("dialog.contactEmail")}
            </Label>
            <Input
              id="edit-client-contact-email"
              name="contact_email"
              type="email"
              defaultValue={client.contactEmail ?? ""}
              placeholder={tClients("dialog.contactEmailPlaceholder")}
            />
          </div>

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
  const t = useTranslations("clientDetail");
  const tCommon = useTranslations("common");
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
      setError(t("createProject.nameRequired"));
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
          <DialogTitle>{t("createProject.title")}</DialogTitle>
          <DialogDescription>{t("createProject.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label htmlFor="create-project-name">
              {t("createProject.name")} *
            </Label>
            <Input
              id="create-project-name"
              name="name"
              required
              autoFocus
              placeholder={t("createProject.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-project-url">{t("createProject.url")}</Label>
            <Input
              id="create-project-url"
              name="url"
              type="url"
              placeholder={t("createProject.urlPlaceholder")}
            />
          </div>

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
              {t("createProject.submit")}
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
  const t = useTranslations("clientDetail");
  const tCommon = useTranslations("common");
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
      setError(t("createProject.nameRequired"));
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
          <DialogTitle>{t("editProject.title")}</DialogTitle>
          <DialogDescription>{t("editProject.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label htmlFor="edit-project-name">
              {t("createProject.name")} *
            </Label>
            <Input
              id="edit-project-name"
              name="name"
              required
              autoFocus
              defaultValue={project.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-url">{t("createProject.url")}</Label>
            <Input
              id="edit-project-url"
              name="url"
              type="url"
              defaultValue={project.url ?? ""}
              placeholder={t("createProject.urlPlaceholder")}
            />
          </div>

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

function normalizeUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function formatDate(iso: string, intl: string): string {
  try {
    return new Date(iso).toLocaleDateString(intl, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
