// Carte d'upsell réutilisable affichée à la place d'une fonctionnalité
// lorsque le plan de l'org actif ne l'inclut pas. À utiliser dans les pages
// gated par feature (simulateur, export PDF, collaboration, etc.).

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { minPlanForFeature, PLANS, type FeatureCode } from "@/lib/billing/plans";
import { resolveCurrentOrg } from "@/lib/current-org";

interface FeatureUpsellProps {
  feature: FeatureCode;
  /** Titre custom - sinon une formulation générique est utilisée. */
  title?: string;
  /** Description custom - sinon mention du plan minimum. */
  description?: string;
}

/**
 * Server component. Calcule lui-même le plan minimum requis et le slug
 * de l'org active pour pointer vers la page billing.
 */
export async function FeatureUpsell({
  feature,
  title,
  description,
}: FeatureUpsellProps) {
  const t = await getTranslations("billing.upsell");
  const minPlanCode = minPlanForFeature(feature);
  const minPlan = minPlanCode ? PLANS[minPlanCode] : null;

  const { current } = await resolveCurrentOrg();
  const billingHref = current
    ? `/organizations/${current.organizationSlug}/billing`
    : "/organizations";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <Sparkles
          className="mt-0.5 h-5 w-5 text-primary"
          aria-hidden="true"
        />
        <div>
          <CardTitle className="text-base">{title ?? t("title")}</CardTitle>
          <CardDescription>
            {description ??
              (minPlan ? t("desc", { plan: minPlan.name }) : t("descGeneric"))}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href={billingHref}>{t("cta")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
