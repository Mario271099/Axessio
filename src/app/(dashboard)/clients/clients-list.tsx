"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  ExternalLink,
  Loader2,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState as SharedEmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogBody,
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
import { monogram, themeColorVar } from "@/lib/utils";
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

const STATUS_FILTERS: Array<{ value: StatusFilter; labelKey: string }> = [
  { value: "ALL", labelKey: "filterAll" },
  { value: "ACTIVE", labelKey: "filterActive" },
  { value: "INACTIVE", labelKey: "filterInactive" },
];

/** Tri de la grille — purement côté client, sur les clients déjà chargés. */
type SortMode = "name" | "recent" | "audits";

const SORT_MODES: SortMode[] = ["name", "recent", "audits"];

interface ClientsListProps {
  clients: ClientListItem[];
}

export function ClientsList({ clients }: ClientsListProps) {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortMode>("name");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = clients.filter((c) => {
      if (statusFilter === "ACTIVE" && !c.isActive) return false;
      if (statusFilter === "INACTIVE" && c.isActive) return false;
      if (!q) return true;
      const haystack = [c.name, c.contactEmail ?? ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });
    return rows.sort((a, b) => {
      if (sort === "recent") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "audits") return b.auditCount - a.auditCount;
      return a.name.localeCompare(b.name);
    });
  }, [clients, search, statusFilter, sort]);

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
    <div className="space-y-5 px-4 pb-8 md:px-9">
      {/* En-tête ------------------------------------------------------- */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[2.125rem] font-black leading-tight tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {t("subtitle", { count: clients.length })}
            <span aria-hidden="true"> · </span>
            {t("auditCount", { count: totals.audits })}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus data-anim="spin" aria-hidden="true" />
          {t("newClient")}
        </Button>
      </header>

      {/* Filtres ------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-row pl-11"
            aria-label={t("searchAria")}
          />
        </div>

        <div
          role="group"
          aria-label={t("filterStatusAria")}
          className="flex flex-wrap items-center gap-2"
        >
          {STATUS_FILTERS.map((option) => (
            <FilterChip
              key={option.value}
              label={t(option.labelKey)}
              pressed={statusFilter === option.value}
              count={
                option.value === "ALL"
                  ? clients.length
                  : option.value === "ACTIVE"
                    ? totals.active
                    : clients.length - totals.active
              }
              onClick={() => setStatusFilter(option.value)}
            />
          ))}
        </div>

        <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
          <SelectTrigger
            className="h-9 w-52 rounded-full text-sm font-bold sm:ml-auto"
            aria-label={t("sort.aria")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {t("sort." + mode)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtersActive && (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw aria-hidden="true" />
            {tCommon("reset")}
          </Button>
        )}
      </div>

      {/* Grille ou empty ----------------------------------------------- */}
      {clients.length === 0 ? (
        <ClientsEmpty onCreate={() => setDialogOpen(true)} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <Building2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">{t("noResults")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {tCommon("reset")}
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

function ClientCard({ client }: { client: ClientListItem }) {
  const t = useTranslations("clients");
  const color = themeColorVar(client.name);
  return (
    <Link
      href={"/clients/" + client.id}
      aria-label={t("viewClient", { name: client.name })}
      className="axs-lift group flex h-full flex-col gap-3.5 rounded-card border border-border bg-card p-4"
      style={{ "--lift-color": color } as React.CSSProperties}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="axs-mono flex size-10 shrink-0 items-center justify-center rounded-row text-sm font-extrabold text-white"
            style={{ background: color }}
          >
            {monogram(client.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-bold">{client.name}</span>
            {client.contactEmail && (
              <span className="block truncate text-sm text-muted-foreground">
                {client.contactEmail}
              </span>
            )}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-transform duration-200 group-hover:-rotate-45"
        >
          <ArrowRight className="size-[15px]" />
        </span>
      </span>

      {client.website && (
        <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-primary">
          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{client.website}</span>
        </span>
      )}

      <span className="mt-auto grid grid-cols-2 gap-3 border-t border-border pt-3">
        <span className="flex flex-col">
          <span className="text-xl font-black tabular">
            {client.projectCount}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("projectCount", { count: client.projectCount })}
          </span>
        </span>
        <span className="flex flex-col">
          <span className="text-xl font-black tabular">
            {client.auditCount}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("auditCount", { count: client.auditCount })}
          </span>
        </span>
      </span>

      <StatusDot
        color={
          client.isActive
            ? "hsl(var(--success))"
            : "hsl(var(--muted-foreground))"
        }
        className="text-muted-foreground"
      >
        {client.isActive ? t("active") : t("inactive")}
      </StatusDot>
    </Link>
  );
}

function ClientsEmpty({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("clients");
  return (
    <SharedEmptyState
      icon={Building2}
      title={t("empty.title")}
      description={t("empty.desc")}
    >
      <Button onClick={onCreate}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("empty.cta")}
      </Button>
    </SharedEmptyState>
  );
}

function CreateClientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("clients");
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
      setError(t("dialog.nameRequired"));
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
      <DialogContent size="md" closeLabel={tCommon("close")}>
        <DialogHeader icon={<Building2 aria-hidden="true" />}>
          <DialogTitle>{t("dialog.createTitle")}</DialogTitle>
          <DialogDescription>{t("dialog.createDesc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody>
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label htmlFor="client-name">{t("dialog.name")} *</Label>
            <Input
              id="client-name"
              name="name"
              required
              autoFocus
              placeholder={t("dialog.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-website">{t("dialog.website")}</Label>
            <Input
              id="client-website"
              name="website"
              type="url"
              placeholder={t("dialog.websitePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-contact-name">
              {t("dialog.contactName")}
            </Label>
            <Input
              id="client-contact-name"
              name="contact_name"
              placeholder={t("dialog.contactNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-contact-email">
              {t("dialog.contactEmail")}
            </Label>
            <Input
              id="client-contact-email"
              name="contact_email"
              type="email"
              placeholder={t("dialog.contactEmailPlaceholder")}
            />
          </div>

          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              {t("dialog.submitCreate")}
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
