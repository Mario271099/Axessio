import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Key, Sparkles } from "lucide-react";
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
import { minPlanForFeature, PLANS } from "@/lib/billing/plans";
import { API_SCOPES } from "@/lib/api-tokens/server";
import { NewTokenForm } from "./new-token-form";
import { TokenRow } from "./token-row";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("organizations.apiTokens");
  const { slug } = await params;
  return { title: t("metaTitle", { slug }) };
}

export default async function ApiTokensPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireProfile();
  const { slug } = await params;
  const t = await getTranslations("organizations.apiTokens");
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

  const featureEnabled = await orgHasFeature("api.access");
  const minPlanCode = minPlanForFeature("api.access");
  const minPlan = minPlanCode ? PLANS[minPlanCode] : null;

  const { data: tokens } = await supabase
    .from("api_tokens")
    .select(
      "id, name, prefix, scopes, last_used_at, expires_at, revoked_at, created_at",
    )
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

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
            <Key className="h-6 w-6 text-primary" aria-hidden="true" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManage && featureEnabled && (
          <NewTokenForm organizationId={org.id} scopes={API_SCOPES} />
        )}
      </header>

      {!featureEnabled ? (
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
      ) : (tokens ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {(tokens ?? []).map((tok) => (
            <li key={tok.id}>
              <TokenRow
                organizationId={org.id}
                token={{
                  id: tok.id,
                  name: tok.name,
                  prefix: tok.prefix,
                  scopes: tok.scopes ?? [],
                  lastUsedAt: tok.last_used_at,
                  expiresAt: tok.expires_at,
                  revokedAt: tok.revoked_at,
                  createdAt: tok.created_at,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
