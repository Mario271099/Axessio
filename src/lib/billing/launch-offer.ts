// Offre de lancement : le plan Pro est offert à toutes les organisations
// tant que la plateforme se fait connaître. Le passage au payant se fera en
// basculant `LAUNCH_OFFER_ACTIVE` à false ET en redéfinissant le trigger SQL
// `handle_new_organization()` (migration 85) pour revenir à 'free'.
//
// Les organisations qui ont bénéficié de l'offre portent
// `subscriptions.launch_offer = true` : c'est ce marqueur qui permettra de
// décider de leur sort (remise, période de grâce...) le moment venu.

import type { PlanCode } from "@/lib/billing/plans";

export const LAUNCH_OFFER_ACTIVE: boolean = true;

/** Plan offert pendant le lancement. Doit rester aligné sur la migration 85. */
export const LAUNCH_OFFER_PLAN: PlanCode = "pro";

/**
 * Plans présentés (page Tarifs, page facturation) pendant le lancement :
 * Free et Starter n'ont plus d'intérêt quand le Pro est offert.
 */
export const LAUNCH_OFFER_VISIBLE_PLANS: ReadonlyArray<PlanCode> = [
  LAUNCH_OFFER_PLAN,
  "enterprise",
];
