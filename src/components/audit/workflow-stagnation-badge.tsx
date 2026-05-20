import { getTranslations } from "next-intl/server";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditWorkflowStatus } from "@/types/domain";

// Un audit est considéré "stagnant" dès qu'il reste plus de N jours dans le
// même état non-terminal. Seuils volontairement simples — un produit plus
// mature les rendra configurables par client.
const STAGNATION_DAYS_BY_STATUS: Partial<
  Record<AuditWorkflowStatus, number>
> = {
  draft: 30, // brouillon non soumis depuis 1 mois
  in_review: 5, // relecture en attente depuis > 5 jours
  validated: 7, // validé mais pas livré au-delà d'une semaine
  // delivered : état terminal, pas de stagnation
};

interface WorkflowStagnationBadgeProps {
  workflowStatus: AuditWorkflowStatus;
  /** ISO string — date du dernier changement de workflow_status. */
  workflowChangedAt: string;
  className?: string;
}

/**
 * Affiche un petit badge "en attente depuis N jours" UNIQUEMENT si l'audit
 * dépasse le seuil de stagnation de son état. Sinon renvoie `null` (rien à
 * afficher). À utiliser en complément du `WorkflowBadge`.
 *
 * Server component — `Date.now()` est évalué côté serveur uniquement pour
 * éviter tout désaccord d'hydration avec le client.
 */
export async function WorkflowStagnationBadge({
  workflowStatus,
  workflowChangedAt,
  className,
}: WorkflowStagnationBadgeProps) {
  const t = await getTranslations("audits.workflow.stagnation");

  const threshold = STAGNATION_DAYS_BY_STATUS[workflowStatus];
  if (threshold === undefined) return null;

  const changed = new Date(workflowChangedAt);
  if (Number.isNaN(changed.getTime())) return null;

  const elapsedMs = Date.now() - changed.getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  if (elapsedDays < threshold) return null;

  // Échelle de criticité : 1× seuil = warning, 2× = destructive.
  const severe = elapsedDays >= threshold * 2;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
        severe
          ? "bg-destructive/10 text-destructive"
          : "bg-warning/10 text-warning",
        className,
      )}
      title={t("tooltip", { days: elapsedDays })}
    >
      <Clock className="h-2.5 w-2.5" aria-hidden="true" />
      {t("label", { days: elapsedDays })}
    </span>
  );
}
