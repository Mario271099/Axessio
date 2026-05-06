"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, FileText, Layers, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/audit/severity-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NC_SEVERITY_LABELS, NC_STATUS_LABELS } from "@/lib/constants";
import type { NCSeverity, UserRole } from "@/types/domain";

const STATUS_LABELS: Record<string, string> = {
  ...NC_STATUS_LABELS,
  TO_FIX: "À corriger",
  IN_PROGRESS: "En cours",
  FIXED: "Corrigée",
  FALSE_POSITIVE: "Faux positif",
};

const FILTER_STATUSES = [
  "TO_FIX",
  "IN_PROGRESS",
  "FIXED",
  "FALSE_POSITIVE",
] as const;

const FILTER_SEVERITIES: NCSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const ALL = "ALL";
const TRANSVERSAL = "__TRANSVERSAL__";

export interface AnomalyListItem {
  id: string;
  title: string;
  status: string;
  severity: NCSeverity;
  createdAt: string;
  criterion: { identifier: string; name: string } | null;
  page: { name: string } | null;
}

interface AnomaliesListProps {
  ncs: AnomalyListItem[];
  auditId: string;
  role: UserRole;
}

export function AnomaliesList({ ncs, auditId, role }: AnomaliesListProps) {
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [severityFilter, setSeverityFilter] = useState<string>(ALL);
  const [pageFilter, setPageFilter] = useState<string>(ALL);
  const [search, setSearch] = useState("");

  const pageNames = useMemo(() => {
    const names = new Set<string>();
    for (const nc of ncs) {
      if (nc.page?.name) names.add(nc.page.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "fr"));
  }, [ncs]);

  const counters = useMemo(() => {
    const c = { TO_FIX: 0, IN_PROGRESS: 0, FIXED: 0, FALSE_POSITIVE: 0 };
    for (const nc of ncs) {
      if (nc.status in c) c[nc.status as keyof typeof c]++;
    }
    return c;
  }, [ncs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ncs.filter((nc) => {
      if (statusFilter !== ALL && nc.status !== statusFilter) return false;
      if (severityFilter !== ALL && nc.severity !== severityFilter) return false;
      if (pageFilter !== ALL) {
        if (pageFilter === TRANSVERSAL) {
          if (nc.page) return false;
        } else if (nc.page?.name !== pageFilter) {
          return false;
        }
      }
      if (q && !nc.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [ncs, statusFilter, severityFilter, pageFilter, search]);

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
        <Link href={`/audits/${auditId}`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Retour à l&apos;audit
        </Link>
      </Button>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Non-conformités
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {counters.TO_FIX}
            </span>{" "}
            À corriger
            <span className="mx-2 text-muted-foreground/50" aria-hidden="true">
              ·
            </span>
            <span className="font-medium text-foreground">
              {counters.IN_PROGRESS}
            </span>{" "}
            En cours
            <span className="mx-2 text-muted-foreground/50" aria-hidden="true">
              ·
            </span>
            <span className="font-medium text-foreground">
              {counters.FIXED}
            </span>{" "}
            Corrigées
            <span className="mx-2 text-muted-foreground/50" aria-hidden="true">
              ·
            </span>
            <span className="font-medium text-foreground">
              {counters.FALSE_POSITIVE}
            </span>{" "}
            Faux positifs
          </p>
        </div>
        {role === "auditor" && (
          <Button asChild size="sm">
            <Link href={`/audits/${auditId}/anomalies/new`}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nouvelle NC
            </Link>
          </Button>
        )}
      </header>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Rechercher par titre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Rechercher par titre"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filtrer par statut">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les statuts</SelectItem>
              {FILTER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger aria-label="Filtrer par sévérité">
              <SelectValue placeholder="Sévérité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toutes les sévérités</SelectItem>
              {FILTER_SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {NC_SEVERITY_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={pageFilter} onValueChange={setPageFilter}>
            <SelectTrigger aria-label="Filtrer par page">
              <SelectValue placeholder="Page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toutes les pages</SelectItem>
              <SelectItem value={TRANSVERSAL}>Transversale</SelectItem>
              {pageNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {ncs.length === 0
                ? "Aucune non-conformité enregistrée."
                : "Aucune non-conformité ne correspond aux filtres."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((nc) => (
                <li key={nc.id}>
                  <Link
                    href={`/audits/${auditId}/anomalies/${nc.id}`}
                    className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-accent/30 focus-visible:bg-accent/40 focus-visible:outline-none"
                  >
                    <SeverityBadge severity={nc.severity} />
                    {nc.criterion && (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                        {nc.criterion.identifier}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {nc.page ? (
                        <>
                          <FileText className="h-3 w-3" aria-hidden="true" />
                          {nc.page.name}
                        </>
                      ) : (
                        <>
                          <Layers className="h-3 w-3" aria-hidden="true" />
                          Transversale
                        </>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {nc.title}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {STATUS_LABELS[nc.status] ?? nc.status}
                    </Badge>
                    <time
                      dateTime={nc.createdAt}
                      className="text-xs tabular-nums text-muted-foreground"
                    >
                      {new Date(nc.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
