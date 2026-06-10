import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { resolveCurrentOrg } from "@/lib/current-org";
import { getOrgSubscription } from "@/lib/billing/server";
import { isStripeReady } from "@/lib/billing/stripe";
import { PLANS } from "@/lib/billing/plans";
import type { PlanCode } from "@/lib/billing/plans";
import { OnboardingPlanSelector } from "./onboarding-plan-selector";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding");
  return { title: t("metaTitle") };
}

// Étape "soft" post-inscription : on affiche les plans avec Free pré-sélectionné.
// L'utilisateur peut continuer en gratuit (ou passer l'étape) sans friction, ou
// choisir un plan payant → checkout Stripe. Free reste l'état par défaut posé à
// la création de l'org, donc cette étape n'engage rien tant qu'elle est skippée.
export default async function OnboardingPlanPage() {
  await requireProfile();

  const { current } = await resolveCurrentOrg();
  // Cas pathologique : profil non rattaché à une org → on n'a rien à proposer.
  if (!current) redirect("/dashboard");

  const yearlySavingsPercent = computeYearlySavings();
  // On ne pré-coche pas une formule déjà payante (improbable juste après le
  // signup, mais on reste robuste si l'utilisateur revient sur l'URL).
  const subscription = await getOrgSubscription(current.organizationId);
  const currentPlan: PlanCode = subscription?.planCode ?? "free";

  return (
    <OnboardingPlanSelector
      organizationId={current.organizationId}
      currentPlan={currentPlan}
      stripeReady={isStripeReady()}
      yearlySavingsPercent={yearlySavingsPercent}
    />
  );
}

// Économie annuelle (Starter en référence), alignée avec la page /pricing.
function computeYearlySavings(): number | null {
  const starter = PLANS.starter;
  if (!starter.monthlyPriceEur || !starter.yearlyPriceEur) return null;
  return Math.round(
    (1 - starter.yearlyPriceEur / (starter.monthlyPriceEur * 12)) * 100,
  );
}

export const dynamic = "force-dynamic";
