import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Layers } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { loadWorkspacesOf } from "@/lib/current-workspace";
import { NewWorkspaceForm } from "./new-workspace-form";
import { WorkspaceRow } from "./workspace-row";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("organizations.workspaces");
  const { slug } = await params;
  return { title: t("metaTitle", { slug }) };
}

export default async function WorkspacesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireProfile();
  const { slug } = await params;
  const t = await getTranslations("organizations.workspaces");
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  if (!membership) notFound();
  const canManage =
    membership.role === "owner" || membership.role === "admin";

  // RPC my_workspaces inclut TOUTES les orgs ; on filtre côté code par
  // simplicité (peu de workspaces par user en pratique).
  const workspaces = await loadWorkspacesOf(org.id);

  // Workspaces archivés rangés en bas, défaut en tête (déjà ordonné côté SQL,
  // mais on stabilise au cas où).
  const visible = [...workspaces].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
        <Link href={`/organizations/${org.slug}`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t("back")}
        </Link>
      </Button>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Layers className="h-6 w-6 text-primary" aria-hidden="true" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManage && <NewWorkspaceForm organizationId={org.id} />}
      </header>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((w) => (
            <li key={w.workspaceId}>
              <WorkspaceRow
                organizationId={org.id}
                workspace={{
                  id: w.workspaceId,
                  slug: w.slug,
                  name: w.name,
                  description: w.description,
                  isDefault: w.isDefault,
                  isArchived: w.isArchived,
                  effectiveRole: w.effectiveRole,
                }}
                canManage={canManage}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
