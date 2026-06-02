import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Building2, ChevronLeft, CreditCard, History, Key, Layers, Mail, Palette, User as UserIcon, Webhook } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrgRole, OrgType } from "@/types/domain";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("organizations.detail");
  const { slug } = await params;
  return { title: t("metaTitle", { slug }) };
}

const TYPE_LABEL: Record<OrgType, string> = {
  individual: "Freelance",
  agency: "Agence",
  company: "Entreprise",
  enterprise: "Enterprise",
};

const ROLE_TONE: Record<
  OrgRole,
  "default" | "secondary" | "muted" | "success"
> = {
  owner: "success",
  admin: "default",
  auditor: "secondary",
  viewer: "muted",
};

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireProfile();
  const { slug } = await params;
  const supabase = await createClient();
  const t = await getTranslations("organizations.detail");
  const tRole = await getTranslations("organizations.role");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, slug, name, type, billing_email, data_residency, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!org) notFound();

  // Membres de l'org (jointure profiles).
  const { data: memberRows } = await supabase
    .from("organization_members")
    .select(
      `role, joined_at,
       profile:profiles!inner(id, first_name, last_name, email, is_active)`,
    )
    .eq("organization_id", org.id)
    .order("joined_at", { ascending: true });

  type Row = {
    role: OrgRole;
    joined_at: string;
    profile:
      | {
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          is_active: boolean | null;
        }
      | Array<{
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          is_active: boolean | null;
        }>
      | null;
  };

  const members = ((memberRows ?? []) as Row[]).map((row) => {
    const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    const name = [p?.first_name, p?.last_name]
      .filter((v) => typeof v === "string" && v.trim().length > 0)
      .join(" ")
      .trim();
    return {
      id: p?.id ?? "",
      name: name || p?.email || "—",
      email: p?.email ?? null,
      role: row.role,
      joinedAt: row.joined_at,
      isActive: p?.is_active !== false,
    };
  });

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
        <Link href="/organizations">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t("back")}
        </Link>
      </Button>

      {/* Header org */}
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Building2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl">{org.name}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
              <span className="font-mono text-xs">{org.slug}</span>
              <span aria-hidden="true">·</span>
              <Badge variant="outline">
                {TYPE_LABEL[org.type as OrgType] ?? org.type}
              </Badge>
              <span aria-hidden="true">·</span>
              <span className="uppercase text-[10px] tracking-wide">
                {org.data_residency}
              </span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" aria-hidden="true" />
            <span>{org.billing_email}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/organizations/${org.slug}/billing`}>
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                {t("billingCta")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/organizations/${org.slug}/branding`}>
                <Palette className="h-4 w-4" aria-hidden="true" />
                {t("brandingCta")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/organizations/${org.slug}/workspaces`}>
                <Layers className="h-4 w-4" aria-hidden="true" />
                {t("workspacesCta")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/organizations/${org.slug}/webhooks`}>
                <Webhook className="h-4 w-4" aria-hidden="true" />
                {t("webhooksCta")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/organizations/${org.slug}/api-tokens`}>
                <Key className="h-4 w-4" aria-hidden="true" />
                {t("apiTokensCta")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/organizations/${org.slug}/audit-logs`}>
                <History className="h-4 w-4" aria-hidden="true" />
                {t("auditLogsCta")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Membres */}
      <section className="space-y-3">
        <header className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("membersTitle")}
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {t("membersCount", { count: members.length })}
          </span>
        </header>

        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {members.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    !m.isActive && "opacity-60",
                  )}
                >
                  <div
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.email ?? "—"}
                    </p>
                  </div>
                  <Badge variant={ROLE_TONE[m.role]} className="shrink-0">
                    {tRole(m.role)}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
