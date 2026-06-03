import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateRow } from "./template-row";
import { NewTemplateDialog } from "./new-template-dialog";
import type { ReferenceType, NCTemplate } from "@/types/domain";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("organizations.ncTemplates");
  const { slug } = await params;
  return { title: t("metaTitle", { slug }) };
}

interface ReferenceOption {
  id: string;
  type: ReferenceType;
  version: string;
}

export default async function NCTemplatesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const profile = await requireProfile();
  const { slug } = await params;
  const t = await getTranslations("organizations.ncTemplates");
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

  // Super-admin plateforme : accès même sans membership.
  const canManage =
    profile.isPlatformAdmin ||
    (membership && ["owner", "admin"].includes(membership.role));
  if (!membership && !profile.isPlatformAdmin) notFound();

  const [{ data: templateRows }, { data: referenceRows }] = await Promise.all([
    supabase
      .from("nc_templates")
      .select(
        "id, organization_id, label, reference_id, criterion_id, severity, title_template, description_template, recommendation_template, created_at, updated_at",
      )
      .eq("organization_id", org.id)
      .order("label", { ascending: true }),
    supabase
      .from("references")
      .select("id, type, version")
      .eq("is_active", true)
      .order("type"),
  ]);

  const templates: NCTemplate[] = (templateRows ?? []).map((r) => ({
    id: r.id as string,
    organizationId: r.organization_id as string,
    label: r.label as string,
    referenceId: (r.reference_id as string | null) ?? null,
    criterionId: (r.criterion_id as string | null) ?? null,
    severity: r.severity as NCTemplate["severity"],
    titleTemplate: r.title_template as string,
    descriptionTemplate: (r.description_template as string | null) ?? null,
    recommendationTemplate:
      (r.recommendation_template as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));

  const references: ReferenceOption[] = (referenceRows ?? []).map((r) => ({
    id: r.id as string,
    type: r.type as ReferenceType,
    version: r.version as string,
  }));

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
            <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManage && (
          <NewTemplateDialog
            organizationId={org.id}
            references={references}
          />
        )}
      </header>

      {!canManage ? (
        <div
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {t("forbidden")}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {templates.map((tpl) => (
            <li key={tpl.id}>
              <TemplateRow
                organizationId={org.id}
                template={tpl}
                references={references}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
