import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Palette, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { orgHasFeature } from "@/lib/billing/server";
import { getOrgBrandingById } from "@/lib/branding/server";
import { minPlanForFeature, PLANS } from "@/lib/billing/plans";
import { BrandingForm } from "./branding-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("organizations.branding");
  const { slug } = await params;
  return { title: t("metaTitle", { slug }) };
}

export default async function BrandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireProfile();
  const { slug } = await params;
  const t = await getTranslations("organizations.branding");
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

  const enabled = await orgHasFeature("branding.custom");
  const branding = (await getOrgBrandingById(org.id)) ?? {
    logoUrl: null,
    primaryColor: null,
    accentColor: null,
    supportEmail: null,
    customDomain: null,
  };

  const minPlanCode = minPlanForFeature("branding.custom");
  const minPlan = minPlanCode ? PLANS[minPlanCode] : null;

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
        <Link href={`/organizations/${org.slug}`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t("back")}
        </Link>
      </Button>

      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Palette className="h-6 w-6 text-primary" aria-hidden="true" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {!enabled ? (
        <Card>
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <Sparkles className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle className="text-base">{t("upsellTitle")}</CardTitle>
              <CardDescription>
                {minPlan
                  ? t("upsellDesc", { plan: minPlan.name })
                  : t("upsellDescGeneric")}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/organizations/${org.slug}/billing`}>
                {t("seeBilling")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : !canManage ? (
        <div
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {t("forbidden")}
        </div>
      ) : (
        <BrandingForm organizationId={org.id} initial={branding} />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
