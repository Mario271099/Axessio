import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { canEditAudit } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlanningCalendar, type PlanningEvent } from "./planning-calendar";
import { PlanningAuditorFilter } from "./planning-auditor-filter";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("planning");
  return { title: t("metaTitle") };
}

interface PageProps {
  searchParams: Promise<{ month?: string; auditor?: string }>;
}

const MONTH_FMT_FR = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

/**
 * Parse `YYYY-MM` en date du 1er du mois. Renvoie aujourd'hui si invalide.
 */
function parseMonthParam(input: string | undefined): Date {
  const now = new Date();
  if (!input) return new Date(now.getFullYear(), now.getMonth(), 1);
  const match = /^(\d{4})-(\d{2})$/.exec(input);
  if (!match) return new Date(now.getFullYear(), now.getMonth(), 1);
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  if (Number.isNaN(year) || Number.isNaN(month) || month < 0 || month > 11) {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(year, month, 1);
}

function formatMonthParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

export default async function PlanningPage({ searchParams }: PageProps) {
  const profile = await requireProfile();

  // Page réservée au staff plateforme (admin + auditor). Les clients ne
  // voient pas le planning interne - ils n'auraient de toute façon pas accès
  // aux dates des autres audits via la RLS.
  if (!canEditAudit(profile.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const t = await getTranslations("planning");

  const monthStart = parseMonthParam(params.month);

  // Fenêtre élargie d'un mois avant/après pour couvrir les dates affichées en
  // bord de grille (les premiers/derniers jours débordent souvent du mois).
  const fetchFrom = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() - 1,
    1,
  );
  const fetchTo = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 2,
    1,
  );

  const supabase = await createClient();

  // ──────────────────────────────────────────────────────────────────────────
  // Construction de la requête
  // - Auditeur : RLS filtre déjà aux audits assignés.
  // - Admin sans filtre auditeur : tous les audits.
  // - Admin avec ?auditor=<id> : on filtre via audit_assignees.profile_id.
  // ──────────────────────────────────────────────────────────────────────────
  const auditorFilter =
    profile.isPlatformAdmin && params.auditor ? params.auditor : null;

  const query = supabase
    .from("audits")
    .select(
      `
      id, expected_start_at, expected_end_at, restitution_at, counter_audit_at,
      project:projects!inner(name, client:clients(name)),
      assignees:audit_assignees(
        profile:profiles(id, first_name, last_name, email)
      )
    `,
    )
    // Au moins une des 4 dates dans la fenêtre étendue
    .or(
      [
        `and(expected_start_at.gte.${fetchFrom.toISOString()},expected_start_at.lt.${fetchTo.toISOString()})`,
        `and(expected_end_at.gte.${fetchFrom.toISOString()},expected_end_at.lt.${fetchTo.toISOString()})`,
        `and(restitution_at.gte.${fetchFrom.toISOString()},restitution_at.lt.${fetchTo.toISOString()})`,
        `and(counter_audit_at.gte.${fetchFrom.toISOString()},counter_audit_at.lt.${fetchTo.toISOString()})`,
      ].join(","),
    );

  const { data: rows } = await query;

  // Filtre admin par auditeur : appliqué côté JS pour ne pas alourdir la
  // requête PostgREST. Le volume reste petit (audits du mois).
  type RawRow = {
    id: string;
    expected_start_at: string | null;
    expected_end_at: string | null;
    restitution_at: string | null;
    counter_audit_at: string | null;
    project:
      | { name: string | null; client: { name: string | null } | null }
      | Array<{ name: string | null; client: { name: string | null } | null }>
      | null;
    assignees:
      | Array<{
          profile: {
            id: string;
            first_name: string | null;
            last_name: string | null;
            email: string | null;
          } | null;
        }>
      | null;
  };

  // Cast via `unknown` : le typage inféré par Supabase a `client` en tableau,
  // alors qu'on le sait single via `!inner`. Le cast strict est refusé en
  // build (mais accepté en incremental check) - passer par `unknown` est
  // la conversion recommandée par TS pour ce cas précis.
  const auditRows = ((rows ?? []) as unknown as RawRow[]).filter((row) => {
    if (!auditorFilter) return true;
    const ids = (row.assignees ?? [])
      .map((a) => a.profile?.id)
      .filter((v): v is string => !!v);
    return ids.includes(auditorFilter);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Construction des events (1 audit = jusqu'à 4 events)
  // ──────────────────────────────────────────────────────────────────────────
  const events: PlanningEvent[] = [];
  for (const row of auditRows) {
    const project = Array.isArray(row.project) ? row.project[0] : row.project;
    const client = project?.client
      ? Array.isArray(project.client)
        ? project.client[0]
        : project.client
      : null;
    const assigneeNames = (row.assignees ?? [])
      .map((a) => {
        if (!a.profile) return null;
        const name = [a.profile.first_name, a.profile.last_name]
          .filter((v) => v && v.trim().length > 0)
          .join(" ")
          .trim();
        return name || a.profile.email || null;
      })
      .filter((v): v is string => !!v);

    const auditInfo = {
      id: row.id,
      projectName: project?.name ?? "—",
      clientName: client?.name ?? null,
      assigneeNames,
    };

    if (row.expected_start_at) {
      events.push({
        date: row.expected_start_at,
        type: "start",
        audit: auditInfo,
      });
    }
    if (row.expected_end_at) {
      events.push({
        date: row.expected_end_at,
        type: "end",
        audit: auditInfo,
      });
    }
    if (row.restitution_at) {
      events.push({
        date: row.restitution_at,
        type: "restitution",
        audit: auditInfo,
      });
    }
    if (row.counter_audit_at) {
      events.push({
        date: row.counter_audit_at,
        type: "counter_audit",
        audit: auditInfo,
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Pour l'admin : liste des auditeurs disponibles dans le select de filtre
  // ──────────────────────────────────────────────────────────────────────────
  let availableAuditors: Array<{
    id: string;
    label: string;
  }> = [];
  if (profile.isPlatformAdmin) {
    const { data: staff } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("role", ["auditor", "admin"])
      .eq("is_active", true)
      .order("first_name", { ascending: true });
    availableAuditors = (staff ?? []).map((p) => {
      const name = [p.first_name, p.last_name]
        .filter((v) => typeof v === "string" && v.trim().length > 0)
        .join(" ")
        .trim();
      return {
        id: p.id as string,
        label: name || (p.email as string | null) || "—",
      };
    });
  }

  const monthLabel = MONTH_FMT_FR.format(monthStart);
  const prevHref = `/planning?month=${formatMonthParam(addMonths(monthStart, -1))}${
    auditorFilter ? `&auditor=${auditorFilter}` : ""
  }`;
  const nextHref = `/planning?month=${formatMonthParam(addMonths(monthStart, 1))}${
    auditorFilter ? `&auditor=${auditorFilter}` : ""
  }`;
  const todayHref = `/planning${auditorFilter ? `?auditor=${auditorFilter}` : ""}`;

  return (
    <div className="space-y-5 px-4 pb-8 md:px-9">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[2.125rem] font-black leading-tight tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-base text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
            {t("subtitle")}
          </p>
        </div>

        {profile.isPlatformAdmin && (
          <PlanningAuditorFilter
            auditors={availableAuditors}
            currentAuditor={auditorFilter}
            month={formatMonthParam(monthStart)}
          />
        )}
      </header>

      <Card className="p-5">
        <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold capitalize">{monthLabel}</h2>
            <p className="text-sm text-muted-foreground">
              {t("calendarHint")}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="outline" size="icon-sm">
              <Link href={prevHref} aria-label={t("prevMonth")}>
                <ChevronLeft aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={todayHref}>{t("today")}</Link>
            </Button>
            <Button asChild variant="outline" size="icon-sm">
              <Link href={nextHref} aria-label={t("nextMonth")}>
                <ChevronRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
        <div>
          <PlanningCalendar
            monthStart={monthStart.toISOString()}
            events={events}
            showAssignees={profile.isPlatformAdmin && !auditorFilter}
          />
        </div>
      </Card>
    </div>
  );
}
