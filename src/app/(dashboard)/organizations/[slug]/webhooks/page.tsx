import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Sparkles, Webhook } from "lucide-react";
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
import { WEBHOOK_EVENTS } from "@/lib/webhooks/server";
import { NewEndpointForm } from "./new-endpoint-form";
import { EndpointRow } from "./endpoint-row";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("organizations.webhooks");
  const { slug } = await params;
  return { title: t("metaTitle", { slug }) };
}

export default async function WebhooksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireProfile();
  const { slug } = await params;
  const t = await getTranslations("organizations.webhooks");
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

  const featureEnabled = await orgHasFeature("webhooks.outgoing");
  const minPlanCode = minPlanForFeature("webhooks.outgoing");
  const minPlan = minPlanCode ? PLANS[minPlanCode] : null;

  // Lecture des endpoints. RLS coupe automatiquement pour les non-admins.
  const { data: endpoints } = await supabase
    .from("webhook_endpoints")
    .select(
      "id, url, description, is_active, subscribed_events, consecutive_failures, last_success_at, last_failure_at, created_at",
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
            <Webhook className="h-6 w-6 text-primary" aria-hidden="true" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManage && featureEnabled && (
          <NewEndpointForm organizationId={org.id} events={WEBHOOK_EVENTS} />
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
      ) : (endpoints ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {(endpoints ?? []).map((e) => (
            <li key={e.id}>
              <EndpointRow
                organizationId={org.id}
                endpoint={{
                  id: e.id,
                  url: e.url,
                  description: e.description,
                  isActive: e.is_active,
                  subscribedEvents: e.subscribed_events ?? [],
                  consecutiveFailures: e.consecutive_failures ?? 0,
                  lastSuccessAt: e.last_success_at,
                  lastFailureAt: e.last_failure_at,
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
