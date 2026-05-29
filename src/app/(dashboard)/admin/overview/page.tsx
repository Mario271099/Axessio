import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Search,
  Users,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { canDebugPermissions } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AUDIT_STATUS_LABELS,
  USER_ROLE_LABELS,
} from "@/lib/constants";
import { PLANS, PLAN_ORDER, type PlanCode } from "@/lib/billing/plans";
import type { AuditStatus, UserRole } from "@/types/domain";

export const dynamic = "force-dynamic";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v === null || v === undefined) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

interface LookupRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  orgs: Array<{ name: string; orgRole: string; plan: PlanCode }>;
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireProfile();
  // Réservé au super-admin plateforme (permission `permissions.debug`).
  if (!canDebugPermissions(profile.role)) {
    redirect("/dashboard");
  }

  const t = await getTranslations("admin.overview");
  const tRoles = await getTranslations("roles");
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  // Service-role : comptes plateforme exacts (la page est déjà gardée admin).
  const admin = createAdminClient();

  const [usersTotal, usersDisabled, orgsTotal, auditsTotal, ncTotal] =
    await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", false),
      admin
        .from("organizations")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      admin.from("audits").select("*", { count: "exact", head: true }),
      admin.from("non_conformities").select("*", { count: "exact", head: true }),
    ]);

  const usersCount = usersTotal.count ?? 0;
  const activeUsers = usersCount - (usersDisabled.count ?? 0);

  // Abonnements par plan (1 ligne par org → volume faible, on agrège en JS).
  const { data: subs } = await admin.from("subscriptions").select("plan_code");
  const planCounts = new Map<string, number>();
  for (const s of subs ?? []) {
    const code = (s.plan_code as string) ?? "free";
    planCounts.set(code, (planCounts.get(code) ?? 0) + 1);
  }

  // Audits par statut.
  const { data: auditRows } = await admin.from("audits").select("status");
  const statusCounts = new Map<string, number>();
  for (const a of auditRows ?? []) {
    const st = a.status as string;
    statusCounts.set(st, (statusCounts.get(st) ?? 0) + 1);
  }
  const statusEntries = [...statusCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Recherche utilisateur (par email).
  let lookup: LookupRow[] = [];
  if (query) {
    const { data: matches } = await admin
      .from("profiles")
      .select("id, email, first_name, last_name, role, is_active")
      .ilike("email", `%${query}%`)
      .order("email")
      .limit(10);

    const rows = matches ?? [];
    const ids = rows.map((r) => r.id as string);

    const membershipsByUser = new Map<
      string,
      Array<{ name: string; orgRole: string; orgId: string }>
    >();
    const orgIds = new Set<string>();
    if (ids.length > 0) {
      const { data: members } = await admin
        .from("organization_members")
        .select("user_id, role, organization:organizations(id, name)")
        .in("user_id", ids);
      for (const m of members ?? []) {
        const org = one(m.organization as never) as
          | { id: string; name: string }
          | null;
        if (!org) continue;
        orgIds.add(org.id);
        const list = membershipsByUser.get(m.user_id as string) ?? [];
        list.push({ name: org.name, orgRole: m.role as string, orgId: org.id });
        membershipsByUser.set(m.user_id as string, list);
      }
    }

    const planByOrg = new Map<string, PlanCode>();
    if (orgIds.size > 0) {
      const { data: subRows } = await admin
        .from("subscriptions")
        .select("organization_id, plan_code")
        .in("organization_id", [...orgIds]);
      for (const s of subRows ?? []) {
        planByOrg.set(s.organization_id as string, (s.plan_code as PlanCode) ?? "free");
      }
    }

    lookup = rows.map((r) => ({
      id: r.id as string,
      email: r.email as string,
      name:
        [r.first_name, r.last_name]
          .filter((v) => typeof v === "string" && (v as string).trim())
          .join(" ")
          .trim() || "—",
      role: r.role as UserRole,
      isActive: r.is_active !== false,
      orgs: (membershipsByUser.get(r.id as string) ?? []).map((o) => ({
        name: o.name,
        orgRole: o.orgRole,
        plan: planByOrg.get(o.orgId) ?? "free",
      })),
    }));
  }

  const kpis = [
    { icon: Users, label: t("kpi.users"), value: usersCount, note: t("kpi.usersNote", { active: activeUsers }), tone: "bg-primary/10 text-primary" },
    { icon: Building2, label: t("kpi.organizations"), value: orgsTotal.count ?? 0, note: null, tone: "bg-violet-500/10 text-violet-500" },
    { icon: ClipboardCheck, label: t("kpi.audits"), value: auditsTotal.count ?? 0, note: null, tone: "bg-success/10 text-success" },
    { icon: AlertTriangle, label: t("kpi.nonConformities"), value: ncTotal.count ?? 0, note: null, tone: "bg-warning/10 text-warning" },
  ];

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6 md:p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-6">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${k.tone}`}
              aria-hidden="true"
            >
              <k.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
              {k.value.toLocaleString("fr-FR")}
            </p>
            {k.note && (
              <p className="mt-1 text-xs text-muted-foreground">{k.note}</p>
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Abonnements par plan */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("subscriptions.title")}
          </h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-medium">{t("subscriptions.plan")}</th>
                <th className="pb-2 text-right font-medium">
                  {t("subscriptions.count")}
                </th>
              </tr>
            </thead>
            <tbody>
              {PLAN_ORDER.map((code) => (
                <tr key={code} className="border-t border-border">
                  <td className="py-2">{PLANS[code].name}</td>
                  <td className="py-2 text-right tabular-nums">
                    {planCounts.get(code) ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Audits par statut */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("auditsByStatus.title")}
          </h2>
          {statusEntries.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">—</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <tbody>
                {statusEntries.map(([status, count]) => (
                  <tr key={status} className="border-t border-border">
                    <td className="py-2">
                      {AUDIT_STATUS_LABELS[status as AuditStatus] ?? status}
                    </td>
                    <td className="py-2 text-right tabular-nums">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Recherche utilisateur */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("lookup.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("lookup.desc")}</p>

        <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 space-y-1.5" style={{ minWidth: "240px" }}>
            <Label htmlFor="q">{t("lookup.label")}</Label>
            <Input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder={t("lookup.placeholder")}
            />
          </div>
          <Button type="submit" className="gap-2">
            <Search className="h-4 w-4" aria-hidden="true" />
            {t("lookup.search")}
          </Button>
        </form>

        {query && lookup.length === 0 && (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            {t("lookup.noResults", { query })}
          </p>
        )}

        {lookup.length > 0 && (
          <div className="mt-6 space-y-4">
            {lookup.map((u) => (
              <div key={u.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{u.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {u.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{tRoles(u.role)}</Badge>
                    <Badge variant={u.isActive ? "outline" : "destructive"}>
                      {u.isActive ? t("lookup.active") : t("lookup.inactive")}
                    </Badge>
                  </div>
                </div>

                {u.orgs.length === 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("lookup.noOrg")}
                  </p>
                ) : (
                  <table className="mt-3 w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="pb-1 font-medium">{t("lookup.colOrg")}</th>
                        <th className="pb-1 font-medium">
                          {t("lookup.colOrgRole")}
                        </th>
                        <th className="pb-1 font-medium">{t("lookup.colPlan")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {u.orgs.map((o, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="py-1.5">{o.name}</td>
                          <td className="py-1.5">{o.orgRole}</td>
                          <td className="py-1.5">{PLANS[o.plan]?.name ?? o.plan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
