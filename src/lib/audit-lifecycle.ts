// ============================================================================
// Parcours de vie de l'audit en 7 étapes - modèle d'affichage du stepper
// ----------------------------------------------------------------------------
// Distinct de `audit-status.ts` (qui décrit la machine à états `audit_status`
// et ses transitions). Ici on projette le statut métier + les dates clés sur
// un parcours produit lisible en 7 jalons, pour le stepper horizontal du
// dashboard d'audit. C'est de l'affichage : aucune écriture, aucune décision
// d'autorisation.
//
// Chaque étape a un état dérivé : done (verte + check) / current (navy + halo)
// / upcoming (creux gris). Le connecteur entre deux jalons est vert si le
// jalon de GAUCHE est terminé.
// ============================================================================

import type { AuditStatus } from "@/types/domain";

export type LifecycleStageKey =
  | "created"
  | "preparation"
  | "audit"
  | "restitution"
  | "counterAudit"
  | "delivery"
  | "online";

export type StageState = "done" | "current" | "upcoming";

export interface LifecycleStage {
  key: LifecycleStageKey;
  state: StageState;
  /** Date ISO à afficher en sous-titre. null = non planifié / sans date. */
  date: string | null;
  /** Borne de fin pour les étapes représentées par une plage (audit). */
  endDate: string | null;
}

export interface AuditLifecycle {
  stages: LifecycleStage[];
  /** Index 0-based de l'étape courante. */
  currentIndex: number;
  /** Numéro humain (1-based) de l'étape courante. */
  currentStep: number;
  /** Nombre total d'étapes du parcours. */
  totalSteps: number;
  /** Clé de l'étape courante (pour le libellé "· Préparation"). */
  currentKey: LifecycleStageKey;
}

/** Ordre fixe du parcours. L'index dans ce tableau = position du jalon. */
export const LIFECYCLE_STAGE_ORDER: ReadonlyArray<LifecycleStageKey> = [
  "created",
  "preparation",
  "audit",
  "restitution",
  "counterAudit",
  "delivery",
  "online",
];

// Projection du statut métier sur l'index d'étape "courante" du parcours.
// Volontairement tolérante : les dates réelles (ci-dessous) peuvent marquer
// des jalons comme terminés au-delà de cet index.
const STATUS_TO_STAGE: Record<AuditStatus, number> = {
  PENDING: 1, // Préparation - composition de l'échantillon
  PLANNED: 2, // Audit - planifié, prêt à démarrer
  IN_PROGRESS: 2, // Audit - saisie de la matrice en cours
  DELIVERED: 3, // Restitution - rapport livré / présenté
  REMEDIATION: 4, // Contre-audit - le client corrige, on s'oriente vers la vérif
  COUNTER_AUDIT: 4, // Contre-audit
  ONLINE: 6, // Mise en ligne
  COMPLETED: 6, // Mise en ligne - clôturé
  ARCHIVED: 6, // Terminal
};

interface AuditLifecycleInput {
  status: AuditStatus;
  createdAt: string | null;
  expectedStartAt: string | null;
  expectedEndAt: string | null;
  restitutionAt: string | null;
  counterAuditAt: string | null;
  deliveredAt: string | null;
  onlineAt: string | null;
}

function isPast(iso: string | null, now: number): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() <= now;
}

/**
 * Calcule l'état des 7 jalons à partir du statut et des dates de l'audit.
 *
 * Règles :
 *   - "Audit créé" est toujours terminé.
 *   - Un jalon est terminé s'il est avant l'étape projetée par le statut, OU
 *     si sa date réelle est dans le passé (livraison/mise en ligne : présence
 *     de la date suffit).
 *   - L'étape courante est le premier jalon non terminé.
 */
export function computeAuditLifecycle(
  input: AuditLifecycleInput,
): AuditLifecycle {
  const now = Date.now();
  const baseIndex = STATUS_TO_STAGE[input.status] ?? 1;

  // Date affichée par jalon (sous-titre).
  const stageDate: Record<LifecycleStageKey, string | null> = {
    created: input.createdAt,
    preparation: null,
    audit: input.expectedStartAt,
    restitution: input.restitutionAt,
    counterAudit: input.counterAuditAt,
    delivery: input.deliveredAt,
    online: input.onlineAt,
  };

  // Jalon terminé par signal de date concret (au-delà de la projection statut).
  const dateDone: Record<LifecycleStageKey, boolean> = {
    created: true,
    preparation: baseIndex > 1,
    audit: isPast(input.expectedEndAt, now),
    restitution: isPast(input.restitutionAt, now),
    counterAudit: isPast(input.counterAuditAt, now),
    delivery: isPast(input.deliveredAt, now),
    online: isPast(input.onlineAt, now),
  };

  const done = LIFECYCLE_STAGE_ORDER.map(
    (key, index) => index < baseIndex || dateDone[key],
  );

  // Étape courante = premier jalon non terminé ; si tout est terminé, on
  // pointe le dernier jalon.
  let currentIndex = done.findIndex((d) => !d);
  if (currentIndex === -1) currentIndex = LIFECYCLE_STAGE_ORDER.length - 1;

  const stages: LifecycleStage[] = LIFECYCLE_STAGE_ORDER.map((key, index) => {
    let state: StageState;
    if (index === currentIndex) state = "current";
    else if (done[index]) state = "done";
    else state = "upcoming";
    return {
      key,
      state,
      date: stageDate[key],
      endDate: key === "audit" ? input.expectedEndAt : null,
    };
  });

  return {
    stages,
    currentIndex,
    currentStep: currentIndex + 1,
    totalSteps: LIFECYCLE_STAGE_ORDER.length,
    currentKey: LIFECYCLE_STAGE_ORDER[currentIndex] ?? "created",
  };
}
