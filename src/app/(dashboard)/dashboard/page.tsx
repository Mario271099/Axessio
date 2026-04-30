import { ClipboardCheck, AlertTriangle, CheckCircle2, Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import { formatDate, formatScore } from "@/lib/utils";
import Link from "next/link";
import type { AuditStatus } from "@/types/domain";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // RLS s'occupe du filtrage : un client_member ne verra que ses audits
  const { data: audits } = await supabase
    .from("audits")
    .select(
      `
      id, status, initial_score, final_score, updated_at,
      project:projects(name, client:clients(name))
    `,
    )
    .order("updated_at", { ascending: false })
    .limit(10);

  const auditList = audits ?? [];

  // KPIs
  const total = auditList.length;
  const inProgress = auditList.filter((a) =>
    ["IN_PROGRESS", "REMEDIATION", "COUNTER_AUDIT"].includes(a.status as string),
  ).length;
  const completed = auditList.filter((a) =>
    ["COMPLETED", "ONLINE"].includes(a.status as string),
  ).length;
  const avgScore =
    auditList.length > 0
      ? auditList.reduce((sum, a) => sum + (a.final_score ?? a.initial_score ?? 0), 0) /
        auditList.length
      : 0;

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour, {profile.firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Voici un aperçu de votre activité d&apos;audit.
        </p>
      </div>

      {/* KPIs ---------------------------------------------------------------- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ClipboardCheck}
          label="Audits récents"
          value={total.toString()}
        />
        <KpiCard
          icon={AlertTriangle}
          label="En cours"
          value={inProgress.toString()}
          tone="warning"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Terminés"
          value={completed.toString()}
          tone="success"
        />
        <KpiCard
          icon={Building2}
          label="Score moyen"
          value={formatScore(avgScore)}
        />
      </div>

      {/* Liste des audits récents ------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Audits récents</CardTitle>
          <CardDescription>Vos 10 dernières mises à jour.</CardDescription>
        </CardHeader>
        <CardContent>
          {auditList.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Aucun audit pour le moment.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {auditList.map((audit) => {
                const project = Array.isArray(audit.project)
                  ? audit.project[0]
                  : audit.project;
                const client = project?.client
                  ? Array.isArray(project.client)
                    ? project.client[0]
                    : project.client
                  : null;
                const score = audit.final_score ?? audit.initial_score;

                return (
                  <li key={audit.id}>
                    <Link
                      href={`/audits/${audit.id}`}
                      className="flex items-center justify-between gap-4 px-2 py-3 -mx-2 rounded-md hover:bg-accent/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {project?.name ?? "Projet inconnu"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {client?.name ?? "—"} · Mis à jour le {formatDate(audit.updated_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="tabular-nums text-sm">
                          {formatScore(score)}
                        </span>
                        <AuditStatusBadge status={audit.status as AuditStatus} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "text-warning"
      : tone === "success"
        ? "text-success"
        : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className={`h-4 w-4 ${toneClass}`} aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
